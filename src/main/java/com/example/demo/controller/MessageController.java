package com.example.demo.controller;

import com.example.demo.model.dto.MessageRequest;
import com.example.demo.model.entity.Message;
import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
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
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<ApiResponse<Message>> sendMessage(
            @RequestParam(value = "senderId", required = false, defaultValue = "me") String senderId,
            @RequestBody MessageRequest request
    ) {
        Message message = messageService.sendMessage(senderId, request);
        return ResponseEntity.ok(ApiResponse.success("Message sent successfully", message));
    }

    @GetMapping("/contact/{contactId}")
    public ResponseEntity<ApiResponse<List<Message>>> getMessagesForContact(
            @PathVariable("contactId") String contactId,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId
    ) {
        List<Message> msgs = messageService.getMessagesBetweenUsers(userId, contactId);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved", msgs));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Message>> editMessage(
            @PathVariable("id") String id,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId,
            @RequestBody Map<String, String> payload
    ) {
        Message edited = messageService.editMessage(userId, id, payload.get("text"));
        return ResponseEntity.ok(ApiResponse.success("Message edited successfully", edited));
    }

    @DeleteMapping("/{id}/for-me")
    public ResponseEntity<ApiResponse<Void>> deleteMessageForMe(
            @PathVariable("id") String id,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId
    ) {
        messageService.deleteMessageForMe(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted for me"));
    }

    @DeleteMapping("/{id}/for-everyone")
    public ResponseEntity<ApiResponse<Void>> deleteMessageForEveryone(
            @PathVariable("id") String id,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId
    ) {
        messageService.deleteMessageForEveryone(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Message deleted for everyone"));
    }

    @PostMapping("/{id}/reaction")
    public ResponseEntity<ApiResponse<Message>> toggleReaction(
            @PathVariable("id") String id,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId,
            @RequestBody Map<String, String> payload
    ) {
        Message updated = messageService.toggleReaction(userId, id, payload.get("emoji"));
        return ResponseEntity.ok(ApiResponse.success("Reaction updated", updated));
    }

    @PostMapping("/typing")
    public ResponseEntity<ApiResponse<Void>> setTypingStatus(
            @RequestParam("contactId") String contactId,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId,
            @RequestParam("isTyping") boolean isTyping
    ) {
        messageService.setTypingStatus(contactId, userId, isTyping);
        return ResponseEntity.ok(ApiResponse.success("Typing status updated"));
    }

    @GetMapping("/typing/{contactId}")
    public ResponseEntity<ApiResponse<String>> getTypingStatus(
            @PathVariable("contactId") String contactId,
            @RequestParam(value = "currentUserId", required = false, defaultValue = "me") String currentUserId
    ) {
        String statusText = messageService.getTypingStatusText(contactId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Typing status retrieved", statusText));
    }
}
