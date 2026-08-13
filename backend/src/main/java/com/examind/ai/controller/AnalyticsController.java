package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<Map<String, Object>> getQuizAnalytics(
            @PathVariable("quizId") Long quizId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> data = analyticsService.getQuizAnalytics(quizId, user);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/student/me")
    public ResponseEntity<Map<String, Object>> getStudentAnalytics(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> data = analyticsService.getStudentAnalytics(user);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }
}