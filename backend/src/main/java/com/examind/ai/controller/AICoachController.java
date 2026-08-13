package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.AICoachService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping
public class AICoachController {

    private final AICoachService aiCoachService;

    public AICoachController(AICoachService aiCoachService) {
        this.aiCoachService = aiCoachService;
    }

    @GetMapping("/student/ai-coach")
    public ResponseEntity<Map<String, Object>> getAICoachData(
            @AuthenticationPrincipal UserDetails userDetails) {
        User student = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> res = aiCoachService.getAICoachData(student);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/attempts/{id}/report")
    public ResponseEntity<Map<String, Object>> getAttemptAIReport(
            @PathVariable("id") Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> res = aiCoachService.getAttemptAIReport(attemptId, user);
        return ResponseEntity.ok(res);
    }
}
