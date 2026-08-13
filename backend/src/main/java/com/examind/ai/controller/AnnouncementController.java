package com.examind.ai.controller;

import com.examind.ai.entity.Announcement;
import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.AnnouncementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping("/student")
    public ResponseEntity<Map<String, Object>> getStudentAnnouncements(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Announcement> visible = announcementService.getStudentAnnouncements(user);
        return ResponseEntity.ok(Map.of("success", true, "data", visible));
    }

    @GetMapping("/faculty")
    public ResponseEntity<Map<String, Object>> getFacultyAnnouncements(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Announcement> visible = announcementService.getFacultyAnnouncements(user);
        return ResponseEntity.ok(Map.of("success", true, "data", visible));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAnnouncement(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Announcement saved = announcementService.createAnnouncement(payload, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "data", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateAnnouncement(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Announcement updated = announcementService.updateAnnouncement(id, payload, user);
        return ResponseEntity.ok(Map.of("success", true, "data", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAnnouncement(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        announcementService.deleteAnnouncement(id, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Announcement deleted successfully"));
    }
}
