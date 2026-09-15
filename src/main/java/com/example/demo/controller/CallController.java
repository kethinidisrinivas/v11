package com.example.demo.controller;

import com.example.demo.model.entity.Call;
import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
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
public class CallController {

    @Autowired
    private CallService callService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Call>>> getCallLogs(@RequestParam(value = "userId", required = false, defaultValue = "me") String userId) {
        List<Call> calls = callService.getUserCallLogs(userId);
        return ResponseEntity.ok(ApiResponse.success("Call logs retrieved", calls));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Call>> logCall(
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId,
            @RequestBody Map<String, Object> payload
    ) {
        String contactId = (String) payload.get("contactId");
        String contactName = (String) payload.get("contactName");
        String contactAvatar = (String) payload.get("contactAvatar");
        String type = (String) payload.get("type");
        String mode = (String) payload.get("mode");
        int duration = payload.get("duration") != null ? Integer.parseInt(payload.get("duration").toString()) : 0;

        Call call = callService.logCall(userId, contactId, contactName, contactAvatar, type, mode, duration);
        return ResponseEntity.ok(ApiResponse.success("Call logged", call));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCallLogs(@RequestParam(value = "userId", required = false, defaultValue = "me") String userId) {
        callService.clearUserCallLogs(userId);
        return ResponseEntity.ok(ApiResponse.success("Call logs cleared"));
    }
}
