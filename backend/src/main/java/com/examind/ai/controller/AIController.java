package com.examind.ai.controller;

import com.examind.ai.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateQuestions(@RequestBody Map<String, Object> body) {
        List<Map<String, Object>> validatedList = aiService.generateQuestions(body);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", validatedList.size() + " questions generated",
                "data", validatedList
        ));
    }

    @PostMapping("/improve")
    public ResponseEntity<Map<String, Object>> improveQuestion(@RequestBody Map<String, Object> body) {
        Map<String, Object> improved = aiService.improveQuestion(body);
        return ResponseEntity.ok(Map.of("success", true, "data", improved));
    }

    @PostMapping("/explain")
    public ResponseEntity<Map<String, Object>> explainQuestion(@RequestBody Map<String, Object> body) {
        String explanation = aiService.explainQuestion(body);
        return ResponseEntity.ok(Map.of("success", true, "explanation", explanation));
    }

    @PostMapping("/autotag")
    public ResponseEntity<Map<String, Object>> autoTagQuestion(@RequestBody Map<String, Object> body) {
        Map<String, Object> tagsObj = aiService.autoTagQuestion(body);
        return ResponseEntity.ok(Map.of("success", true, "data", tagsObj));
    }

    // Expose calls for internal usage
    public String callGeminiFlash(String promptText) {
        return aiService.callGeminiFlash(promptText);
    }
}