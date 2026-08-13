package com.examind.ai.service;

import java.util.List;
import java.util.Map;

public interface AIService {
    List<Map<String, Object>> generateQuestions(Map<String, Object> body);
    Map<String, Object> improveQuestion(Map<String, Object> body);
    String explainQuestion(Map<String, Object> body);
    Map<String, Object> autoTagQuestion(Map<String, Object> body);
    String callAI(String promptText);
    String callGeminiFlash(String promptText);
    String cleanAIResponseText(String text);
}
