package com.example.filterx.controller;

import com.example.filterx.entity.CommentAttachment;
import com.example.filterx.entity.PostAttachment;
import com.example.filterx.repository.CommentAttachmentRepository;
import com.example.filterx.repository.PostAttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@RestController
@RequestMapping("/api/attachments")
@CrossOrigin(origins = "http://localhost:5173")
public class AttachmentController {

    @Autowired
    private PostAttachmentRepository postAttachmentRepository;

    @Autowired
    private CommentAttachmentRepository commentAttachmentRepository;

    @GetMapping("/posts/{id}")
    public ResponseEntity<byte[]> getPostAttachment(@PathVariable Long id) {
        Optional<PostAttachment> attachmentOpt = postAttachmentRepository.findById(id);
        if (attachmentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PostAttachment attachment = attachmentOpt.get();
        return buildFileResponse(
            attachment.getData(),
            attachment.getFileName(),
            attachment.getContentType(),
            attachment.getAttachmentType().name()
        );
    }

    @GetMapping("/comments/{id}")
    public ResponseEntity<byte[]> getCommentAttachment(@PathVariable Long id) {
        Optional<CommentAttachment> attachmentOpt = commentAttachmentRepository.findById(id);
        if (attachmentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CommentAttachment attachment = attachmentOpt.get();
        return buildFileResponse(
            attachment.getData(),
            attachment.getFileName(),
            attachment.getContentType(),
            attachment.getAttachmentType().name()
        );
    }

    private ResponseEntity<byte[]> buildFileResponse(byte[] data, String fileName, String contentType, String attachmentType) {
        if (data == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream");
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        boolean isInline = "PHOTO".equalsIgnoreCase(attachmentType)
                || mediaType.isCompatibleWith(MediaType.IMAGE_JPEG)
                || mediaType.isCompatibleWith(MediaType.IMAGE_PNG)
                || mediaType.isCompatibleWith(MediaType.parseMediaType("image/webp"))
                || mediaType.isCompatibleWith(MediaType.IMAGE_GIF)
                || mediaType.isCompatibleWith(MediaType.APPLICATION_PDF);

        String dispositionType = isInline ? "inline" : "attachment";
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentLength(data.length);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + fileName + "\"; filename*=UTF-8''" + encodedFileName);
        headers.setCacheControl("public, max-age=86400"); // Cache for 24 hours

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}
