package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.StudentFeaturesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student")
public class StudentFeaturesController {

    private final StudentFeaturesService studentFeaturesService;

    public StudentFeaturesController(StudentFeaturesService studentFeaturesService) {
        this.studentFeaturesService = studentFeaturesService;
    }

    @GetMapping("/rank")
    public ResponseEntity<Map<String, Object>> getPercentileRank(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> data = studentFeaturesService.getPercentileRank(user);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/mastery")
    public ResponseEntity<Map<String, Object>> getMasteryScores(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Map<String, Object>> masteryScores = studentFeaturesService.getMasteryScores(user);
        return ResponseEntity.ok(Map.of("success", true, "data", masteryScores));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<Map<String, Object>> getHeatmap(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> data = studentFeaturesService.getHeatmap(user);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/quiz-comparison/{quizId}")
    public ResponseEntity<Map<String, Object>> getQuizComparison(
            @PathVariable("quizId") Long quizId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> data = studentFeaturesService.getQuizComparison(quizId, user);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<Map<String, Object>> getStudentProfile(
            @PathVariable("userId") Long userId) {
        Map<String, Object> data = studentFeaturesService.getStudentProfile(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }

    @GetMapping("/engagement")
    public ResponseEntity<Map<String, Object>> getEngagementScore(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> data = studentFeaturesService.getEngagementScore(user);
        return ResponseEntity.ok(Map.of("success", true, "data", data));
    }
}