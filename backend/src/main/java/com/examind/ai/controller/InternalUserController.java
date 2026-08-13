package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.service.InternalUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/internal/users")
public class InternalUserController {

    private static final Logger logger = LoggerFactory.getLogger(InternalUserController.class);

    @Value("${app.internal.secret:cdac_examind_secret_2026}")
    private String internalSecret;

    private final InternalUserService internalUserService;

    public InternalUserController(InternalUserService internalUserService) {
        this.internalUserService = internalUserService;
    }

    @PostMapping("/{id}/upgrade")
    public ResponseEntity<Map<String, Object>> upgradeUser(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Internal-Secret", required = false) String incomingSecret) {

        if (incomingSecret == null || !incomingSecret.equals(internalSecret)) {
            logger.warn("Unauthorized internal upgrade attempt for user id: {} with secret: {}", id, incomingSecret);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Unauthorized"));
        }

        User user = internalUserService.upgradeUser(id);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User not found"));
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "User upgraded to Pro status successfully."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserDetails(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Internal-Secret", required = false) String incomingSecret) {

        if (incomingSecret == null || !incomingSecret.equals(internalSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Unauthorized"));
        }

        User user = internalUserService.getUserById(id);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "User not found"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "id", user.getId(),
                "email", user.getEmail(),
                "isPro", user.isPro(),
                "role", user.getRole(),
                "name", user.getName()
        ));
    }
}
