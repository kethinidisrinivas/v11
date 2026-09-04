package com.example.demo.repository;

import com.example.demo.model.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    @Query("SELECT m FROM Message m WHERE (m.senderId = :u1 AND m.receiverId = :u2) OR (m.senderId = :u2 AND m.receiverId = :u1) ORDER BY m.createdAt ASC")
    List<Message> findMessagesBetweenUsers(@Param("u1") String u1, @Param("u2") String u2);

    List<Message> findByChatIdOrderByCreatedAtAsc(String chatId);
}
