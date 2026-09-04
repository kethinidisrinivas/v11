package com.example.demo.controller;

import com.example.demo.model.entity.Status;
import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.StatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/status")
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
public class StatusController {

    @Autowired
    private StatusService statusService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Status>>> getRecentStatuses() {
        List<Status> statuses = statusService.getRecentStatuses();
        return ResponseEntity.ok(ApiResponse.success("Statuses retrieved", statuses));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Status>> createStatus(
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId,
            @RequestBody Map<String, String> payload
    ) {
        Status status = statusService.createStatus(
                userId,
                payload.get("type"),
                payload.get("mediaUrl"),
                payload.get("textContent"),
                payload.get("bgColor"),
                payload.get("caption")
        );
        return ResponseEntity.ok(ApiResponse.success("Status posted successfully", status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStatus(
            @PathVariable("id") String id,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId
    ) {
        statusService.deleteStatus(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Status deleted"));
    }

    @PatchMapping("/{id}/seen")
    public ResponseEntity<ApiResponse<Status>> markSeen(@PathVariable("id") String id) {
        Status status = statusService.markStatusSeen(id);
        return ResponseEntity.ok(ApiResponse.success("Status marked as seen", status));
    }
}
