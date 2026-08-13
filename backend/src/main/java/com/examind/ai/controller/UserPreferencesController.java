package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.entity.UserPreferences;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.UserPreferencesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/preferences")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        UserPreferences prefs = userPreferencesService.getPreferences(user);
        return ResponseEntity.ok(Map.of("success", true, "data", prefs));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updatePreferences(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        UserPreferences prefs = userPreferencesService.updatePreferences(user, body);
        return ResponseEntity.ok(Map.of("success", true, "message", "Preferences saved", "data", prefs));
    }
}
