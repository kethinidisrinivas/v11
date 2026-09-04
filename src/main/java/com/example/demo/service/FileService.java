package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
public class FileService {

    @Autowired
    private FirebaseStorageService firebaseStorageService;

    public Map<String, Object> uploadFile(MultipartFile file) {
        String url = firebaseStorageService.uploadFile(file, "files");
        Map<String, Object> res = new HashMap<>();
        res.put("url", url);
        res.put("name", file.getOriginalFilename());
        res.put("size", file.getSize());
        return res;
    }

    public boolean deleteFile(String fileUrl) {
        return firebaseStorageService.deleteFile(fileUrl);
    }
}
