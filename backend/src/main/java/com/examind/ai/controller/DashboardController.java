package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/faculty")
    public ResponseEntity<Map<String, Object>> getFacultyDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        return ResponseEntity.ok(Map.of("success", true, "data", dashboardService.getFacultyDashboard(user)));
    }

    @GetMapping("/faculty/recent-attempts")
    public ResponseEntity<Map<String, Object>> getRecentAttempts(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = dashboardService.getRecentAttempts(user);
        return ResponseEntity.ok(Map.of("success", true, "data", result.get("data")));
    }

    @GetMapping("/student")
    public ResponseEntity<Map<String, Object>> getStudentDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        return ResponseEntity.ok(Map.of("success", true, "data", dashboardService.getStudentDashboard(user)));
    }
}
