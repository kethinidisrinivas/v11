package com.example.demo.controller;

import com.example.demo.model.entity.Contact;
import com.example.demo.model.response.ApiResponse;
import com.example.demo.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contacts")
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
public class ContactController {

    @Autowired
    private ContactService contactService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Contact>>> getContacts(@RequestParam(value = "userId", required = false, defaultValue = "me") String userId) {
        List<Contact> contacts = contactService.getUserContacts(userId);
        return ResponseEntity.ok(ApiResponse.success("Contacts retrieved successfully", contacts));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Contact>> addContact(
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId,
            @RequestBody Map<String, String> payload
    ) {
        String name = payload.get("name");
        String phone = payload.get("phone");
        String about = payload.get("about");
        String avatar = payload.get("avatar");
        Contact contact = contactService.addContact(userId, name, phone, about, avatar);
        return ResponseEntity.ok(ApiResponse.success("Contact added successfully", contact));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeContact(
            @PathVariable("id") String id,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId
    ) {
        contactService.removeContact(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Contact deleted successfully"));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<Contact>> toggleFavorite(
            @PathVariable("id") String id,
            @RequestParam(value = "userId", required = false, defaultValue = "me") String userId
    ) {
        Contact contact = contactService.toggleFavorite(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Favorite toggled successfully", contact));
    }
}
