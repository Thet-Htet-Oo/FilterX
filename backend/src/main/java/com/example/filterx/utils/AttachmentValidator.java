package com.example.filterx.utils;

import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class AttachmentValidator {

    public static final long MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

    private static final Set<String> ALLOWED_PHOTO_MIMES = new HashSet<>(Arrays.asList(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    ));

    private static final Set<String> ALLOWED_PHOTO_EXTENSIONS = new HashSet<>(Arrays.asList(
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    ));

    private static final Set<String> BLOCKED_EXECUTABLE_EXTENSIONS = new HashSet<>(Arrays.asList(
        ".exe", ".bat", ".cmd", ".msi", ".scr", ".vbs", ".ps1", ".com", ".pif", ".reg"
    ));

    public static void validatePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Photo file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Photo '" + file.getOriginalFilename() + "' exceeds 2 MB limit");
        }

        String fileName = file.getOriginalFilename();
        String ext = getFileExtension(fileName);
        if (!ALLOWED_PHOTO_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Photo format not allowed for '" + fileName + "'. Supported: JPG, PNG, WEBP, GIF");
        }

        String mime = file.getContentType();
        if (mime != null && !mime.isEmpty() && !ALLOWED_PHOTO_MIMES.contains(mime.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Invalid photo image MIME type: " + mime);
        }
    }

    public static void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File '" + file.getOriginalFilename() + "' exceeds 2 MB limit");
        }

        String fileName = file.getOriginalFilename();
        String ext = getFileExtension(fileName);

        if (BLOCKED_EXECUTABLE_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Executable files like '" + ext + "' are blocked for security reasons.");
        }
    }

    public static String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".")).toLowerCase(Locale.ROOT);
    }

    public static String resolveContentType(String originalContentType, String fileName) {
        if (originalContentType != null && !originalContentType.isEmpty() && !"application/octet-stream".equals(originalContentType)) {
            return originalContentType;
        }

        String ext = getFileExtension(fileName);
        switch (ext) {
            case ".jpg":
            case ".jpeg": return "image/jpeg";
            case ".png": return "image/png";
            case ".webp": return "image/webp";
            case ".gif": return "image/gif";
            case ".pdf": return "application/pdf";
            case ".json": return "application/json";
            case ".xml": return "application/xml";
            case ".zip": return "application/zip";
            case ".java": return "text/x-java-source";
            case ".py": return "text/x-python";
            case ".js":
            case ".jsx": return "text/javascript";
            case ".ts":
            case ".tsx": return "text/typescript";
            case ".c":
            case ".cpp":
            case ".h": return "text/x-c";
            case ".html": return "text/html";
            case ".css": return "text/css";
            case ".sql": return "text/x-sql";
            case ".md":
            case ".txt": return "text/plain";
            default: return "application/octet-stream";
        }
    }
}
