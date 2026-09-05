package com.example.demo.service;

import com.example.demo.exception.ValidationException;
import com.example.demo.util.FileUtil;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
public class FirebaseStorageService {

    @Value("${app.upload.dir:uploads}")
    private String localUploadDir;

    public String uploadFile(MultipartFile file, String folder) {
        validateFile(file);

        String originalName = file.getOriginalFilename();
        String extension = FileUtil.getFileExtension(originalName);
        String fileName = (folder != null ? folder + "/" : "") + UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            if (bucket != null) {
                Blob blob = bucket.create(fileName, file.getBytes(), file.getContentType());
                String downloadUrl = String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                        bucket.getName(), URLEncoder.encode(fileName, StandardCharsets.UTF_8));
                return downloadUrl;
            }
        } catch (Exception e) {
            System.err.println("Firebase storage upload notice: " + e.getMessage() + ". Using local storage fallback.");
        }

        // Local Storage Fallback
        return saveFileLocally(file, fileName);
    }

    private String saveFileLocally(MultipartFile file, String fileName) {
        try {
            File targetFile = new File(localUploadDir, fileName);
            targetFile.getParentFile().mkdirs();
            try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                fos.write(file.getBytes());
            }
            return "http://localhost:8080/uploads/" + fileName.replace("\\", "/");
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }
    }

    public boolean deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return false;
        try {
            if (fileUrl.contains("firebasestorage.googleapis.com")) {
                Bucket bucket = StorageClient.getInstance().bucket();
                if (bucket != null) {
                    String path = extractFirebasePath(fileUrl);
                    Blob blob = bucket.get(path);
                    if (blob != null) {
                        return blob.delete();
                    }
                }
            } else if (fileUrl.contains("/uploads/")) {
                String relativePath = fileUrl.substring(fileUrl.indexOf("/uploads/") + 9);
                File file = new File(localUploadDir, relativePath);
                if (file.exists()) {
                    return file.delete();
                }
            }
        } catch (Exception e) {
            System.err.println("Error deleting file: " + e.getMessage());
        }
        return false;
    }

    public String replaceFile(MultipartFile newFile, String oldFileUrl, String folder) {
        if (oldFileUrl != null && !oldFileUrl.isEmpty()) {
            deleteFile(oldFileUrl);
        }
        return uploadFile(newFile, folder);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Cannot upload empty file");
        }
        // 50MB max limit
        if (file.getSize() > 50 * 1024 * 1024) {
            throw new ValidationException("File size exceeds maximum allowed limit of 50MB");
        }
    }

    private String extractFirebasePath(String url) {
        try {
            int startIndex = url.indexOf("/o/") + 3;
            int endIndex = url.indexOf("?alt=media");
            if (endIndex == -1) endIndex = url.length();
            String encodedPath = url.substring(startIndex, endIndex);
            return java.net.URLDecoder.decode(encodedPath, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }
}
