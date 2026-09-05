package com.example.demo.service;

import com.example.demo.model.entity.Chat;
import com.example.demo.repository.ChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ChatService {

    @Autowired
    private ChatRepository chatRepository;

    public Chat getOrCreateChat(String user1Id, String user2Id) {
        Optional<Chat> existing = chatRepository.findChatBetweenUsers(user1Id, user2Id);
        if (existing.isPresent()) {
            return existing.get();
        }

        Chat chat = Chat.builder()
                .user1Id(user1Id)
                .user2Id(user2Id)
                .lastMessage("")
                .lastMessageTime(LocalDateTime.now())
                .unreadCountUser1(0)
                .unreadCountUser2(0)
                .build();

        return chatRepository.save(chat);
    }

    public List<Chat> getUserChats(String userId) {
        return chatRepository.findUserChats(userId);
    }

    public Chat getChatById(String chatId) {
        return chatRepository.findById(chatId).orElse(null);
    }
}
