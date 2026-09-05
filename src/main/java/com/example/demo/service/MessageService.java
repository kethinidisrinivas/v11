package com.example.demo.service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.dto.MessageRequest;
import com.example.demo.model.entity.Chat;
import com.example.demo.model.entity.Message;
import com.example.demo.model.entity.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.DateTimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatService chatService;

    // Real-time typing status storage: contactId -> Map<userId, name>
    private final Map<String, Map<String, String>> typingStatusMap = new ConcurrentHashMap<>();

    public Message sendMessage(String senderId, MessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found"));

        Chat chat = chatService.getOrCreateChat(senderId, request.getContactId());

        String attachmentJson = null;
        if (request.getMediaUrl() != null && !request.getMediaUrl().isEmpty()) {
            attachmentJson = String.format("{\"url\":\"%s\",\"name\":\"%s\",\"size\":\"%s\",\"type\":\"%s\"}",
                    request.getMediaUrl(),
                    request.getFileName() != null ? request.getFileName() : "Media",
                    request.getFileSize() != null ? request.getFileSize() : "0 B",
                    request.getType() != null ? request.getType().toLowerCase() : "file");
        }

        String msgType = request.getType() != null ? request.getType().toUpperCase() : "TEXT";

        Message message = Message.builder()
                .chatId(chat.getId())
                .senderId(senderId)
                .senderName(sender.getName())
                .receiverId(request.getContactId())
                .text(request.getText() != null ? request.getText() : "")
                .messageType(msgType)
                .attachmentJson(attachmentJson)
                .isRead(false)
                .status("delivered")
                .isStarred(false)
                .isEdited(false)
                .isDeletedForEveryone(false)
                .build();

        Message saved = messageRepository.save(message);

        // Update last message in chat
        chat.setLastMessage(saved.getText() != null && !saved.getText().isEmpty() ? saved.getText() : "[" + msgType + "]");
        chat.setLastMessageTime(LocalDateTime.now());
        chatService.getUserChats(senderId); // trigger save
        return saved;
    }

    public List<Message> getMessagesBetweenUsers(String user1Id, String user2Id) {
        List<Message> msgs = messageRepository.findMessagesBetweenUsers(user1Id, user2Id);

        // Mark incoming messages as seen/read
        boolean updated = false;
        for (Message m : msgs) {
            if (m.getReceiverId() != null && m.getReceiverId().equals(user1Id) && !m.isRead()) {
                m.setRead(true);
                m.setStatus("seen");
                updated = true;
            }
        }
        if (updated) {
            messageRepository.saveAll(msgs);
        }
        return msgs.stream()
                .filter(m -> m.getDeletedForUsersCsv() == null || !m.getDeletedForUsersCsv().contains(user1Id))
                .collect(Collectors.toList());
    }

    public Message editMessage(String userId, String messageId, String newText) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSenderId().equals(userId)) {
            throw new RuntimeException("Only sender can edit message");
        }

        message.setText(newText);
        message.setEdited(true);
        return messageRepository.save(message);
    }

    public void deleteMessageForMe(String userId, String messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        String currentCsv = message.getDeletedForUsersCsv() != null ? message.getDeletedForUsersCsv() : "";
        if (!currentCsv.contains(userId)) {
            message.setDeletedForUsersCsv(currentCsv.isEmpty() ? userId : currentCsv + "," + userId);
            messageRepository.save(message);
        }
    }

    public void deleteMessageForEveryone(String userId, String messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSenderId().equals(userId)) {
            throw new RuntimeException("Only sender can delete message for everyone");
        }

        message.setDeletedForEveryone(true);
        message.setText("");
        message.setAttachmentJson(null);
        message.setReactionsJson(null);
        messageRepository.save(message);
    }

    public Message toggleReaction(String userId, String messageId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        String reactions = message.getReactionsJson();
        if (reactions == null) reactions = "[]";

        if (reactions.contains(emoji)) {
            reactions = "[]";
        } else {
            reactions = String.format("[{\"emoji\":\"%s\",\"count\":1,\"users\":[\"%s\"]}]", emoji, userId);
        }

        message.setReactionsJson(reactions);
        return messageRepository.save(message);
    }

    public void setTypingStatus(String contactId, String userId, boolean isTyping) {
        User user = userRepository.findById(userId).orElse(null);
        String name = user != null ? user.getName() : "Someone";

        typingStatusMap.putIfAbsent(contactId, new ConcurrentHashMap<>());
        if (isTyping) {
            typingStatusMap.get(contactId).put(userId, name);
        } else {
            typingStatusMap.get(contactId).remove(userId);
        }
    }

    public String getTypingStatusText(String contactId, String currentUserId) {
        Map<String, String> typers = typingStatusMap.get(contactId);
        if (typers == null || typers.isEmpty()) return null;

        List<String> names = typers.entrySet().stream()
                .filter(e -> !e.getKey().equals(currentUserId))
                .map(Map.Entry::getValue)
                .collect(Collectors.toList());

        if (names.isEmpty()) return null;

        String firstName = names.get(0);
        return firstName + " is typing something sweet";
    }
}
