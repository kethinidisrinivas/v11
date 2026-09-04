package com.example.demo.service;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.exception.ValidationException;
import com.example.demo.model.entity.Contact;
import com.example.demo.model.entity.User;
import com.example.demo.repository.ContactRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Contact> getUserContacts(String userId) {
        return contactRepository.findByUserId(userId);
    }

    public Contact addContact(String userId, String name, String phone, String about, String avatar) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Contact name is required.");
        }
        if (phone == null || phone.trim().isEmpty()) {
            throw new ValidationException("Phone number is required.");
        }

        String cleanPhone = ValidationUtil.normalizePhone(phone);

        Optional<Contact> existing = contactRepository.findByUserIdAndPhone(userId, cleanPhone);
        if (existing.isPresent()) {
            throw new ValidationException("Contact with this phone number already exists (" + existing.get().getName() + ").");
        }

        String matchedUserId = null;
        Optional<User> matchedUser = userRepository.findByPhone(cleanPhone);
        if (matchedUser.isPresent()) {
            matchedUserId = matchedUser.get().getId();
            if (avatar == null || avatar.isEmpty()) {
                avatar = matchedUser.get().getAvatar();
            }
        }

        if (avatar == null || avatar.isEmpty()) {
            avatar = "https://ui-avatars.com/api/?name=" + java.net.URLEncoder.encode(name.trim(), java.nio.charset.StandardCharsets.UTF_8) + "&background=e0b0ff&color=051424";
        }

        Contact contact = Contact.builder()
                .userId(userId)
                .contactUserId(matchedUserId)
                .name(name.trim())
                .phone(cleanPhone)
                .avatar(avatar)
                .statusText(about != null ? about : "Connected friend in Messenger")
                .about(about != null ? about : "Connected friend in Messenger")
                .isOnline(matchedUser.map(User::isOnline).orElse(false))
                .isFavorite(false)
                .unreadCount(0)
                .build();

        return contactRepository.save(contact);
    }

    public void removeContact(String userId, String contactId) {
        Contact contact = contactRepository.findByUserIdAndId(userId, contactId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
        contactRepository.delete(contact);
    }

    public Contact toggleFavorite(String userId, String contactId) {
        Contact contact = contactRepository.findByUserIdAndId(userId, contactId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
        contact.setFavorite(!contact.isFavorite());
        return contactRepository.save(contact);
    }
}
