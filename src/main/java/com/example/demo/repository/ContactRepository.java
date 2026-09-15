package com.example.demo.repository;

import com.example.demo.model.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, String> {
    List<Contact> findByUserId(String userId);
    Optional<Contact> findByUserIdAndPhone(String userId, String phone);
    Optional<Contact> findByUserIdAndId(String userId, String id);
    void deleteByUserIdAndId(String userId, String id);
}
