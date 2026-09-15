package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
public class MediaService {

    @Autowired
    private FirebaseStorageService firebaseStorageService;

    public Map<String, Object> uploadMedia(MultipartFile file, String folder) {
        String downloadUrl = firebaseStorageService.uploadFile(file, folder != null ? folder : "media");

        Map<String, Object> response = new HashMap<>();
        response.put("url", downloadUrl);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", file.getSize());
        response.put("contentType", file.getContentType());
        return response;
    }
}
