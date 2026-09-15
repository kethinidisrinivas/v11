package com.example.demo.controller;

import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(
        origins = "http://localhost:4200",
        allowedHeaders = "*",
        methods = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.PATCH,
                RequestMethod.DELETE,
                RequestMethod.OPTIONS
        }
)
public class FileController {

    @Autowired
    private FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(@RequestParam("file") MultipartFile file) {
        Map<String, Object> res = fileService.uploadFile(file);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", res));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteFile(@RequestParam("url") String url) {
        fileService.deleteFile(url);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully"));
    }
}
