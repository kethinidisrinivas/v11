package com.example.demo.service;

import com.example.demo.model.entity.Call;
import com.example.demo.repository.CallRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CallService {

    @Autowired
    private CallRepository callRepository;

    public Call logCall(String userId, String contactId, String contactName, String contactAvatar, String type, String mode, int duration) {
        int minutes = duration / 60;
        int seconds = duration % 60;
        String formattedDuration = String.format("%02d:%02d", minutes, seconds);

        Call call = Call.builder()
                .userId(userId)
                .contactId(contactId)
                .contactName(contactName)
                .contactAvatar(contactAvatar)
                .type(type != null ? type : "outgoing")
                .mode(mode != null ? mode : "audio")
                .duration(duration)
                .formattedDuration(formattedDuration)
                .timeStr("Just now")
                .build();

        return callRepository.save(call);
    }

    public List<Call> getUserCallLogs(String userId) {
        return callRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void clearUserCallLogs(String userId) {
        callRepository.deleteByUserId(userId);
    }
}
