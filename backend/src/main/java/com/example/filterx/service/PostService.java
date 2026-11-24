package com.example.filterx.service;

import com.example.filterx.dto.CommentRequest;
import com.example.filterx.dto.CommentResponse;
import com.example.filterx.entity.Category;
import com.example.filterx.entity.Post;
import com.example.filterx.repository.CategoryRepository;
import com.example.filterx.repository.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class PostService {

    private static final Logger logger = LoggerFactory.getLogger(PostService.class);

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:5000/predict}")
    private String aiServiceUrl;

    // List of toxic words and phrases for local offline fallback
    private static final List<String> TOXIC_WORDS = Arrays.asList(
        "hate", "stupid", "idiot", "retard", "kill", "die",
        "fuck", "bitch", "motherfucker", "asshole", "shit", 
        "cunt", "damn", "bastard", "whore", "slut", "piss", 
        "crap", "dick", "pussy", "cock", "nigga", "nigger", 
        "fag", "faggot"
    );

    // List of toxic phrases (multi-word expressions)
    private static final List<String> TOXIC_PHRASES = Arrays.asList(
        "fuck you", "go to hell", "suck my", "kill yourself",
        "die already", "you suck", "you're stupid", "i will break your leg", "the service is terrible"
    );

    public Post savePost(Post post) {
        if (post.getContent() != null && !post.getContent().trim().isEmpty()) {
            checkToxicContent(post.getContent());
        }

        if (post.getCategory() != null && post.getCategory().getId() != null) {
            Category category = categoryRepository.findById(post.getCategory().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid category ID"));
            post.setCategory(category);
        } else {
            post.setCategory(null);
        }
        return postRepository.save(post);
    }

    public void checkToxicContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return;
        }

        // 1. Attempt context-aware moderation via AI microservice
        try {
            CommentRequest request = new CommentRequest(content);
            ResponseEntity<CommentResponse> response = restTemplate.postForEntity(
                aiServiceUrl,
                request,
                CommentResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                CommentResponse body = response.getBody();
                if (body.getOffensive() == 1 || "Toxic".equalsIgnoreCase(body.getResult())) {
                    String reason = (body.getNote() != null && !body.getNote().isEmpty()) 
                        ? body.getNote() 
                        : "Toxic content detected";
                    throw new IllegalArgumentException("Content contains inappropriate language: " + reason);
                }
                // Content is Clean
                return;
            }
        } catch (IllegalArgumentException e) {
            // Re-throw genuine content rejection
            throw e;
        } catch (RestClientException e) {
            logger.warn("AI moderation service unavailable at {}: {}. Falling back to local rule-based filter.", aiServiceUrl, e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error contacting AI moderation service: {}. Falling back to local filter.", e.getMessage());
        }

        // 2. Safe local fallback if AI microservice is offline or unreachable
        checkToxicContentFallback(content);
    }

    private void checkToxicContentFallback(String content) {
        String contentLower = content.toLowerCase();

        // Check for single toxic words
        for (String word : TOXIC_WORDS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(word) + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(contentLower).find()) {
                throw new IllegalArgumentException("Content contains inappropriate language: '" + word + "'");
            }
        }

        // Check for toxic phrases
        for (String phrase : TOXIC_PHRASES) {
            if (contentLower.contains(phrase)) {
                throw new IllegalArgumentException("Content contains inappropriate language: '" + phrase + "'");
            }
        }

        // Specific profane check
        if (containsFuckYou(contentLower)) {
            throw new IllegalArgumentException("Content contains inappropriate language: 'fuck you'");
        }
    }

    private boolean containsFuckYou(String content) {
        String[] fuckYouVariations = {
            "fuck you", "fuck u", "fuk you", "fuk u", 
            "f*ck you", "f*ck u", "f**k you", "f**k u"
        };
        for (String variation : fuckYouVariations) {
            if (content.contains(variation)) {
                return true;
            }
        }
        return false;
    }
}
