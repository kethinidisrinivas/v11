package com.example.demo.controller;

import com.example.demo.model.entity.Chat;
import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
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
public class ChatController {

    @Autowired
    private ChatService chatService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Chat>>> getUserChats(@RequestParam(value = "userId", required = false, defaultValue = "me") String userId) {
        List<Chat> chats = chatService.getUserChats(userId);
        return ResponseEntity.ok(ApiResponse.success("User chats retrieved", chats));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Chat>> createOrGetChat(
            @RequestParam("user1Id") String user1Id,
            @RequestParam("user2Id") String user2Id
    ) {
        Chat chat = chatService.getOrCreateChat(user11(user1Id), user2Id);
        return ResponseEntity.ok(ApiResponse.success("Chat retrieved or created", chat));
    }

    private String user11(String val) { return val != null ? val : "me"; }

    @GetMapping("/{chatId}")
    public ResponseEntity<ApiResponse<Chat>> getChatById(@PathVariable("chatId") String chatId) {
        Chat chat = chatService.getChatById(chatId);
        return ResponseEntity.ok(ApiResponse.success("Chat details retrieved", chat));
    }
}
