package com.examind.ai.controller;

import com.examind.ai.dto.request.QuestionBulkRequest;
import com.examind.ai.dto.request.QuestionCreateRequest;
import com.examind.ai.entity.Question;
import com.examind.ai.entity.QuestionOption;
import com.examind.ai.entity.User;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.QuizService;
import com.examind.ai.service.QuestionService;
import com.examind.ai.exception.CustomException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/questions")
public class QuestionController {

    private final QuizService quizService;
    private final QuestionService questionService;

    public QuestionController(QuizService quizService, QuestionService questionService) {
        this.quizService = quizService;
        this.questionService = questionService;
    }

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<Map<String, Object>> getQuestions(
            @PathVariable("quizId") Long quizId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Question> list = quizService.getQuizQuestions(quizId, user);
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addQuestion(
            @Valid @RequestBody QuestionCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long quizId = request.getQuizId();

        if (quizId == null) {
            throw new CustomException("Quiz ID is required", HttpStatus.BAD_REQUEST);
        }

        User user = ((CustomUserDetails) userDetails).getUser();
        Question question = convertDtoToEntity(request);
        Question saved = quizService.addQuestion(quizId, question, user);
        return new ResponseEntity<>(Map.of("success", true, "message", "Question added", "data", saved), HttpStatus.CREATED);
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> addQuestionsBulk(
            @Valid @RequestBody QuestionBulkRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = ((CustomUserDetails) userDetails).getUser();
        List<Question> savedList = new ArrayList<>();
        
        for (QuestionCreateRequest req : request.getQuestions()) {
            Question question = convertDtoToEntity(req);
            Question saved = quizService.addQuestion(request.getQuizId(), question, user);
            savedList.add(saved);
        }

        return new ResponseEntity<>(Map.of(
                "success", true,
                "message", savedList.size() + " questions added",
                "data", savedList
        ), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateQuestion(
            @PathVariable("id") Long id,
            @Valid @RequestBody QuestionCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = ((CustomUserDetails) userDetails).getUser();
        Question updated = questionService.updateQuestion(id, request, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Question updated", "data", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteQuestion(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        quizService.deleteQuestion(id, user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Question deleted"));
    }

    private Question convertDtoToEntity(QuestionCreateRequest request) {
        Question q = new Question();
        q.setText(request.getText());
        q.setType(request.getType());
        q.setExplanation(request.getExplanation());
        q.setHint(request.getHint());
        q.setMarks(request.getMarks());
        q.setNegativeMark(request.getNegativeMark());
        q.setDifficulty(request.getDifficulty());
        q.setOrder(request.getOrder());
        q.setImageUrl(request.getImageUrl());
        
        if (request.getSectionId() != null) {
            q.setSection(quizService.getSection(request.getSectionId()));
        }

        if (request.getTags() != null) {
            q.setTags(request.getTags());
        }

        List<QuestionOption> options = request.getOptions().stream().map(o -> {
            QuestionOption opt = new QuestionOption();
            opt.setText(o.getText());
            opt.setCorrect(o.isCorrect());
            opt.setQuestion(q);
            return opt;
        }).collect(Collectors.toList());
        q.setOptions(options);

        return q;
    }
}
