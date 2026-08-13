package com.examind.ai.controller;

import com.examind.ai.dto.request.QuizCreateRequest;
import com.examind.ai.entity.*;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getQuizzes(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "difficulty", required = false) String difficulty,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Page<Quiz> quizzesPage = quizService.getQuizzes(user, subject, difficulty, search, page, limit);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", quizzesPage.getContent(),
                "total", quizzesPage.getTotalElements(),
                "page", page,
                "pages", quizzesPage.getTotalPages()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getQuiz(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        return ResponseEntity.ok(Map.of("success", true, "data", quizService.getQuiz(id, user)));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createQuiz(
            @Valid @RequestBody QuizCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Quiz created = quizService.createQuiz(request, user);
        return new ResponseEntity<>(Map.of("success", true, "message", "Quiz created", "data", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateQuiz(
            @PathVariable("id") Long id,
            @Valid @RequestBody QuizCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        return ResponseEntity.ok(Map.of("success", true, "message", "Quiz updated", "data", quizService.updateQuiz(id, request, user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteQuiz(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        quizService.deleteQuiz(id, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Quiz deleted"));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<Map<String, Object>> togglePublish(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Quiz quiz = quizService.togglePublishQuiz(id, user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Quiz " + (quiz.isPublished() ? "published" : "unpublished"),
                "data", quiz
        ));
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<Map<String, Object>> getResults(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> results = quizService.getQuizResults(id, user);
        return ResponseEntity.ok(Map.of("success", true, "data", results.get("data"), "stats", results.get("stats")));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<Map<String, Object>> cloneQuiz(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        return ResponseEntity.ok(Map.of("success", true, "message", "Quiz cloned successfully", "data", quizService.cloneQuiz(id, user)));
    }

    @GetMapping("/{id}/sections")
    public ResponseEntity<Map<String, Object>> getSections(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<QuizSection> sections = quizService.getSections(id, user);
        return ResponseEntity.ok(Map.of("success", true, "data", sections));
    }

    @PostMapping("/{id}/sections")
    public ResponseEntity<Map<String, Object>> createSection(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        QuizSection saved = quizService.createSection(id, payload, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "data", saved));
    }

    @DeleteMapping("/{id}/sections/{sectionId}")
    public ResponseEntity<Map<String, Object>> deleteSection(
            @PathVariable("id") Long id,
            @PathVariable("sectionId") Long sectionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        quizService.deleteSection(id, sectionId, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Section deleted successfully"));
    }

    @PostMapping("/{id}/email-results")
    public ResponseEntity<Map<String, Object>> emailResults(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> res = quizService.emailQuizResultsSync(id, user);
        return ResponseEntity.ok(res);
    }
}