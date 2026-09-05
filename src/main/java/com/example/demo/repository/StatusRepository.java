package com.example.demo.repository;

import com.example.demo.model.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StatusRepository extends JpaRepository<Status, String> {
    List<Status> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(String userId, LocalDateTime cutoff);
    List<Status> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime cutoff);
    void deleteByCreatedAtBefore(LocalDateTime cutoff);
}
