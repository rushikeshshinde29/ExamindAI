package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.GradeBookService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/gradebook")
public class GradeBookController {

    private final GradeBookService gradeBookService;

    public GradeBookController(GradeBookService gradeBookService) {
        this.gradeBookService = gradeBookService;
    }

    @GetMapping("/faculty")
    public ResponseEntity<Map<String, Object>> getFacultyGradeBook(@AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = gradeBookService.getFacultyGradeBook(user);
        return ResponseEntity.ok(Map.of("success", true, "data", result.get("data"), "totalEntries", result.get("totalEntries")));
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncGrades(
            @RequestBody(required = false) Map<String, Long> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = gradeBookService.syncGrades(user);
        return ResponseEntity.ok(Map.of("success", true, "message", result.get("message")));
    }
}
