package com.example.demo.service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.entity.Status;
import com.example.demo.model.entity.User;
import com.example.demo.repository.StatusRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StatusService {

    @Autowired
    private StatusRepository statusRepository;

    @Autowired
    private UserRepository userRepository;

    public Status createStatus(String userId, String type, String mediaUrl, String textContent, String bgColor, String caption) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Status status = Status.builder()
                .userId(userId)
                .userName(user.getName())
                .userAvatar(user.getAvatar())
                .type(type != null ? type.toLowerCase() : "text")
                .mediaUrl(mediaUrl)
                .textContent(textContent)
                .bgColor(bgColor != null ? bgColor : "linear-gradient(135deg, #10b981, #059669)")
                .caption(caption)
                .viewsCount(0)
                .seen(true)
                .build();

        return statusRepository.save(status);
    }

    public List<Status> getRecentStatuses() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        return statusRepository.findByCreatedAtAfterOrderByCreatedAtDesc(cutoff);
    }

    public List<Status> getUserStatuses(String userId) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        return statusRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, cutoff);
    }

    public void deleteStatus(String userId, String statusId) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status not found"));

        if (!status.getUserId().equals(userId)) {
            throw new RuntimeException("Only owner can delete status");
        }

        statusRepository.delete(status);
    }

    public Status markStatusSeen(String statusId) {
        Status status = statusRepository.findById(statusId).orElse(null);
        if (status != null) {
            status.setSeen(true);
            status.setViewsCount(status.getViewsCount() + 1);
            return statusRepository.save(status);
        }
        return null;
    }
}
