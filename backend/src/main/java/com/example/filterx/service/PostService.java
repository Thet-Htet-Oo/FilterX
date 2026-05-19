// package com.example.filterx.service;

// import com.example.filterx.entity.Post;
// import com.example.filterx.repository.PostRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;

// @Service
// public class PostService {
    
//     @Autowired
//     private PostRepository postRepository;
    
//     public Post savePost(Post post) {
//         checkToxicContent(post.getContent());
//         return postRepository.save(post);
//     }
    
//     public void checkToxicContent(String content) {
//         if (content == null || content.trim().isEmpty()) {
//             throw new IllegalArgumentException("Content cannot be empty");
//         }
        
//         // Add your actual toxic word detection logic here
//         String[] toxicWords = {"hate", "stupid", "idiot", "retard", "kill", "die"}; // Example toxic words
//         for (String word : toxicWords) {
//             if (content.toLowerCase().contains(word.toLowerCase())) {
//                 throw new IllegalArgumentException("Content contains inappropriate language: '" + word + "'");
//             }
//         }
//     }
// }
package com.example.filterx.service;

import com.example.filterx.entity.Post;
import com.example.filterx.repository.PostRepository;
import com.example.filterx.repository.CategoryRepository;
import com.example.filterx.entity.Category;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class PostService {
    
    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    //@Autowired  
    //private RestTemplate restTemplate;
    
    // List of toxic words and phrases
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
        checkToxicContent(post.getContent());

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
            throw new IllegalArgumentException("Content cannot be empty");
        }
        
        String contentLower = content.toLowerCase();
        
        // Check for single toxic words
        for (String word : TOXIC_WORDS) {
            // Use word boundaries to avoid partial matches
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
        
        // Additional specific checks
        if (containsFuckYou(contentLower)) {
            throw new IllegalArgumentException("Content contains inappropriate language: 'fuck you'");
        }
    }
    
    // Special method to detect variations of "fuck you"
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