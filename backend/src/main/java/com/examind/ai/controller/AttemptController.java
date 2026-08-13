package com.examind.ai.controller;

import com.examind.ai.dto.request.AntiCheatLogRequest;
import com.examind.ai.dto.request.AttemptSubmitRequest;
import com.examind.ai.dto.request.FeedbackRequest;
import com.examind.ai.entity.Attempt;
import com.examind.ai.entity.Question;
import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.exception.CustomException;
import com.examind.ai.service.AttemptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/attempts")
public class AttemptController {

    private final AttemptService attemptService;

    public AttemptController(AttemptService attemptService) {
        this.attemptService = attemptService;
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startAttempt(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest servletRequest) {
        Long quizId = Long.valueOf(body.get("quizId"));
        String accessCode = body.get("accessCode");
        User student = ((CustomUserDetails) userDetails).getUser();
        String userAgent = servletRequest.getHeader("User-Agent");
        String ipAddress = servletRequest.getRemoteAddr();
        Attempt attempt = attemptService.startAttempt(quizId, accessCode, student, userAgent, ipAddress);
        return new ResponseEntity<>(Map.of("success", true, "message", "Quiz started", "data", attempt), HttpStatus.CREATED);
    }

    @PostMapping("/revision")
    public ResponseEntity<Map<String, Object>> startRevisionAttempt(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest servletRequest) {
        Long quizId = Long.valueOf(String.valueOf(body.get("quizId")));
        Long previousAttemptId = Long.valueOf(String.valueOf(body.get("previousAttemptId")));
        User student = ((CustomUserDetails) userDetails).getUser();
        String userAgent = servletRequest.getHeader("User-Agent");
        String ipAddress = servletRequest.getRemoteAddr();
        Attempt attempt = attemptService.startRevisionAttempt(quizId, previousAttemptId, student, userAgent, ipAddress);
        return new ResponseEntity<>(Map.of("success", true, "message", "Revision started", "data", attempt), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/anticheat")
    public ResponseEntity<Map<String, Object>> anticheat(
            @PathVariable("id") Long attemptId,
            @Valid @RequestBody AntiCheatLogRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User student = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> result = attemptService.logAntiCheatEvent(attemptId, request, student);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitAttempt(
            @PathVariable("id") Long attemptId,
            @RequestBody AttemptSubmitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User student = ((CustomUserDetails) userDetails).getUser();
        Attempt attempt = attemptService.submitAttempt(attemptId, request, student);
        return ResponseEntity.ok(Map.of("success", true, "message", "Quiz submitted!", "data", attempt));
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyAttempts(@AuthenticationPrincipal UserDetails userDetails) {
        User student = ((CustomUserDetails) userDetails).getUser();
        List<Attempt> list = attemptService.getMyAttempts(student);
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAttempt(
            @PathVariable("id") Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Attempt attempt = attemptService.getAttempt(attemptId, user);
        return ResponseEntity.ok(Map.of("success", true, "data", attempt));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<Map<String, Object>> getAttemptQuestions(
            @PathVariable("id") Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Attempt attempt = attemptService.getAttempt(attemptId, user);
        List<Long> order = attempt.getQuestionsOrder();
        List<Question> allQuestions = attempt.getQuiz().getQuestions();
        Map<Long, Question> questionMap = allQuestions.stream()
                .collect(Collectors.toMap(Question::getId, q -> q));
        List<Question> orderedQuestions = new ArrayList<>();
        for (Long qId : order) {
            Question q = questionMap.get(qId);
            if (q != null) orderedQuestions.add(q);
        }
        return ResponseEntity.ok(Map.of("success", true, "data", orderedQuestions));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<Map<String, Object>> submitFeedback(
            @PathVariable("id") Long attemptId,
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User student = ((CustomUserDetails) userDetails).getUser();
        Attempt attempt = attemptService.submitFeedback(attemptId, request.getRating(), request.getComment(), student);
        return ResponseEntity.ok(Map.of("success", true, "message", "Feedback submitted", "data", attempt));
    }

    @PostMapping("/{id}/upload-recording")
    public ResponseEntity<Map<String, Object>> uploadRecording(
            @PathVariable("id") Long attemptId,
            @RequestParam("file") MultipartFile file) {
        
        if (file == null || file.isEmpty()) {
            throw new CustomException("Upload file is missing or empty", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new CustomException("Only video uploads are supported", HttpStatus.BAD_REQUEST);
        }

        String videoUrl = attemptService.uploadProctoringVideo(attemptId, file);
        return ResponseEntity.ok(Map.of("success", true, "url", videoUrl));
    }

    @GetMapping("/{id}/video")
    public ResponseEntity<Map<String, Object>> getAttemptVideo(
            @PathVariable("id") Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Attempt attempt = attemptService.getAttempt(attemptId, user);
        return ResponseEntity.ok(Map.of(
            "success", true, 
            "videoUrl", attempt.getProctoringVideoUrl() != null ? attempt.getProctoringVideoUrl() : ""
        ));
    }
}
