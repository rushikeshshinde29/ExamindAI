package com.examind.ai.controller;

import com.examind.ai.entity.QuizDiscussion;
import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.CommunicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class CommunicationController {

    private final CommunicationService communicationService;

    public CommunicationController(CommunicationService communicationService) {
        this.communicationService = communicationService;
    }

    @GetMapping("/quizzes/{id}/discussions")
    public ResponseEntity<Map<String, Object>> getQuizDiscussions(@PathVariable("id") Long id) {
        List<QuizDiscussion> discussions = communicationService.getQuizDiscussions(id);
        return ResponseEntity.ok(Map.of("success", true, "data", discussions));
    }

    @PostMapping("/quizzes/{id}/discussions")
    public ResponseEntity<Map<String, Object>> addQuizDiscussion(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        QuizDiscussion saved = communicationService.addQuizDiscussion(id, payload, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "data", saved));
    }

    @PostMapping("/attempts/{id}/share")
    public ResponseEntity<Map<String, Object>> shareAttemptResult(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = communicationService.shareAttemptResult(id, payload, user);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/quizzes/{id}/share")
    public ResponseEntity<Map<String, Object>> shareQuizInvitation(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = communicationService.shareQuizInvitation(id, payload, user);
        return ResponseEntity.ok(result);
    }
}