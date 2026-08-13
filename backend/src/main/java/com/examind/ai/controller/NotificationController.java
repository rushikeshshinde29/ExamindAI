package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> data = notificationService.getNotifications(user);
        return ResponseEntity.ok(data);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> readNotification(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        notificationService.readNotification(id, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> readAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        notificationService.readAllNotifications(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        notificationService.deleteNotification(id, user);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
