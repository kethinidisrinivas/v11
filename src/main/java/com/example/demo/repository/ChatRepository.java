package com.example.demo.repository;

import com.example.demo.model.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, String> {
    @Query("SELECT c FROM Chat c WHERE (c.user1Id = :user1 AND c.user2Id = :user2) OR (c.user1Id = :user2 AND c.user2Id = :user1)")
    Optional<Chat> findChatBetweenUsers(@Param("user1") String user1, @Param("user2") String user2);

    @Query("SELECT c FROM Chat c WHERE c.user1Id = :userId OR c.user2Id = :userId ORDER BY c.updatedAt DESC")
    List<Chat> findUserChats(@Param("userId") String userId);
}
