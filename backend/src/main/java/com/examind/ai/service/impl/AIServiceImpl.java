package com.examind.ai.service.impl;

import com.examind.ai.exception.CustomException;
import com.examind.ai.service.AIService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AIServiceImpl implements AIService {

    private static final Logger logger = LoggerFactory.getLogger(AIServiceImpl.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    public AIServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private boolean useGroq() {
        return groqApiKey != null && !groqApiKey.isBlank();
    }

    private void validateApiKey() {
        if (!useGroq() && (geminiApiKey == null || geminiApiKey.isBlank())) {
            throw new CustomException("No AI API key configured. Add groq.api.key or gemini.api.key in application.properties", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public List<Map<String, Object>> generateQuestions(Map<String, Object> body) {
        logger.info("Received request for AI question generation. Provider: {}", useGroq() ? "Groq" : "Gemini");

        String topic = (String) body.get("topic");
        String subject = (String) body.get("subject");
        String difficulty = body.getOrDefault("difficulty", "medium").toString();
        int count = Integer.parseInt(body.getOrDefault("count", 5).toString());
        String additionalContext = (String) body.getOrDefault("additionalContext", "");
        String defaultType = body.getOrDefault("type", "mcq").toString();
        double marks = Double.parseDouble(body.getOrDefault("marks", 1.0).toString());

        if (topic == null || topic.isBlank()) {
            throw new CustomException("Topic is required", HttpStatus.BAD_REQUEST);
        }
        validateApiKey();

        Map<String, Object> distRaw = (Map<String, Object>) body.get("distribution");
        Map<String, Integer> distribution = new HashMap<>();
        if (distRaw != null) {
            for (Map.Entry<String, Object> entry : distRaw.entrySet()) {
                try {
                    distribution.put(entry.getKey().toUpperCase(), Integer.parseInt(entry.getValue().toString()));
                } catch (Exception e) { }
            }
        }

        int totalCount = distribution.values().stream().mapToInt(Integer::intValue).sum();
        if (totalCount == 0) {
            totalCount = count;
            distribution.put("MCQ", count);
        }

        StringBuilder distBuilder = new StringBuilder();
        distBuilder.append("Generate exactly ").append(totalCount).append(" questions matching this exact type distribution:\n");
        for (Map.Entry<String, Integer> entry : distribution.entrySet()) {
            if (entry.getValue() > 0) {
                String typeKey = entry.getKey();
                String typeName = "";
                String typeCode = "";
                if ("MCQ".equals(typeKey)) { typeName = "Multiple Choice (MCQ)"; typeCode = "mcq"; }
                else if ("MULTI_SELECT".equals(typeKey)) { typeName = "Multi-Select (Multiple response)"; typeCode = "multi_select"; }
                else if ("TRUE_FALSE".equals(typeKey)) { typeName = "True / False"; typeCode = "true_false"; }
                else if ("SHORT_ANSWER".equals(typeKey)) { typeName = "Short Answer"; typeCode = "short_answer"; }
                if (!typeName.isEmpty()) {
                    distBuilder.append("- ").append(entry.getValue()).append(" ").append(typeName)
                            .append(" questions (set \"type\": \"").append(typeCode).append("\")\n");
                }
            }
        }

        String typeRules = "- For 'mcq': Exactly 4 options, exactly ONE correct (isCorrect: true).\n" +
                "- For 'multi_select': Exactly 4 options, one or more options can be correct (isCorrect: true).\n" +
                "- For 'true_false': Exactly 2 options: 'True' and 'False', exactly ONE correct (isCorrect: true).\n" +
                "- For 'short_answer': Exactly 1 option containing the correct text answer phrase, with isCorrect: true.";

        String prompt = distBuilder.toString() +
                "Topic: \"" + topic + "\"\n" +
                "Subject: " + (subject != null ? subject : topic) + "\n" +
                "Difficulty: " + difficulty + "\n" +
                (additionalContext != null && !additionalContext.isBlank() ? "Context: " + additionalContext + "\n" : "") +
                "\nCRITICAL: Respond ONLY with a valid JSON array. No markdown explanation, no markdown tags, no backticks.\n" +
                "Each question in the array must follow this exact structure:\n" +
                "[\n  {\n    \"text\": \"The question text?\",\n    \"type\": \"mcq\",\n" +
                "    \"options\": [\n      {\"text\": \"Option text\", \"isCorrect\": true}\n    ],\n" +
                "    \"explanation\": \"Brief explanation of the correct answer\",\n" +
                "    \"hint\": \"Optional helpful hint for students\",\n" +
                "    \"tags\": [\"Tag1\", \"Tag2\"],\n" +
                "    \"difficulty\": \"" + difficulty + "\",\n" +
                "    \"marks\": " + marks + ",\n    \"negativeMark\": 0\n  }\n]\n" +
                "Rules:\n" + typeRules + "\n" +
                "- Questions must be clear and unambiguous\n" +
                "- Provide a useful hint and relevant tags for each question";

        try {
            String aiResponseText = callAI(prompt);
            String cleanedJson = cleanAIResponseText(aiResponseText);
            List<Map<String, Object>> questions = objectMapper.readValue(cleanedJson, new TypeReference<List<Map<String, Object>>>() {});

            final int limitCount = totalCount;
            return questions.stream().limit(limitCount).map(q -> {
                Map<String, Object> map = new HashMap<>();
                map.put("text", q.get("text").toString().trim());
                map.put("type", q.getOrDefault("type", defaultType).toString().toLowerCase());
                map.put("explanation", q.getOrDefault("explanation", "").toString().trim());
                map.put("hint", q.getOrDefault("hint", "").toString().trim());
                map.put("difficulty", q.getOrDefault("difficulty", difficulty).toString());
                map.put("marks", Double.parseDouble(q.getOrDefault("marks", marks).toString()));
                map.put("negativeMark", Double.parseDouble(q.getOrDefault("negativeMark", 0.0).toString()));
                map.put("isAIGenerated", true);

                List<String> cleanTags = new ArrayList<>();
                if (q.get("tags") instanceof List) {
                    for (Object t : (List<?>) q.get("tags")) cleanTags.add(t.toString().trim());
                }
                map.put("tags", cleanTags);

                List<Map<String, Object>> cleanOpts = new ArrayList<>();
                if (q.get("options") instanceof List) {
                    cleanOpts = ((List<Map<String, Object>>) q.get("options")).stream().map(o -> {
                        Map<String, Object> opt = new HashMap<>();
                        opt.put("text", o.get("text") != null ? o.get("text").toString().trim() : "");
                        opt.put("isCorrect", o.get("isCorrect") != null && Boolean.parseBoolean(o.get("isCorrect").toString()));
                        return opt;
                    }).collect(Collectors.toList());
                }
                map.put("options", cleanOpts);
                return map;
            }).collect(Collectors.toList());
        } catch (Exception ex) {
            logger.error("Failed to generate AI questions", ex);
            throw new CustomException("AI Question Generation Failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Map<String, Object> improveQuestion(Map<String, Object> body) {
        Map<String, Object> question = (Map<String, Object>) body.get("question");
        if (question == null) throw new CustomException("Question is required", HttpStatus.BAD_REQUEST);
        validateApiKey();
        try {
            String questionJson = objectMapper.writeValueAsString(question);
            String prompt = "Improve this MCQ question and its options to be clearer and more professional. Return ONLY JSON in the same format, no markdown backticks:\n" + questionJson;
            String aiResponseText = callAI(prompt);
            return objectMapper.readValue(cleanAIResponseText(aiResponseText), new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            throw new CustomException("AI Question Improvement Failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public String explainQuestion(Map<String, Object> body) {
        String questionText = (String) body.get("questionText");
        if (questionText == null || questionText.isBlank()) throw new CustomException("Question text is required", HttpStatus.BAD_REQUEST);
        validateApiKey();

        String selectedOption = (String) body.get("selectedOption");
        String correctOption = (String) body.get("correctOption");
        List<String> options = (List<String>) body.get("options");

        String prompt = "You are an expert tutor explaining an exam question to a student.\n" +
                "Question: \"" + questionText + "\"\n" +
                "Options:\n" + (options != null ? options.stream().map(o -> "- " + o).collect(Collectors.joining("\n")) : "") + "\n" +
                (correctOption != null ? "Correct Option: \"" + correctOption + "\"\n" : "") +
                (selectedOption != null && !selectedOption.isBlank() ? "Student's Selected Option: \"" + selectedOption + "\"\n" : "") +
                "\n" +
                "Provide a clear, friendly tutorial explanation following these strict constraints:\n" +
                "1. Keep it SHORT (between 80 to 120 words total).\n" +
                "2. NO redundant headers (like \"Introduction\", \"Conclusion\", \"Understanding the options\").\n" +
                "3. Structure strictly in 3 short paragraphs:\n" +
                "   - Paragraph 1 (1-2 lines): State the correct answer and the core reasoning why it is correct.\n" +
                "   - Paragraph 2 (1 line): Explain why the student's selected wrong option is incorrect.\n" +
                "   - Paragraph 3 (1-2 lines, optional): A very short, real-world analogy or code example illustrating the concept.\n" +
                "4. Do not list and explain all options individually—only address the correct answer and the student's incorrect selection.";

        try {
            return callAI(prompt).trim();
        } catch (Exception ex) {
            throw new CustomException("AI Explanation Failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Map<String, Object> autoTagQuestion(Map<String, Object> body) {
        String text = (String) body.get("text");
        if (text == null || text.isBlank()) throw new CustomException("Question text is required", HttpStatus.BAD_REQUEST);
        validateApiKey();

        List<String> options = (List<String>) body.get("options");
        String prompt = "Evaluate this question and provide difficulty ('easy','medium','hard') and 2-4 relevant tags.\n" +
                "Question: \"" + text + "\"\n" +
                (options != null ? "Options:\n" + options.stream().map(o -> "- " + o).collect(Collectors.joining("\n")) : "") +
                "\nReturn ONLY valid JSON, no backticks:\n{\"difficulty\": \"medium\", \"tags\": [\"Tag1\", \"Tag2\"]}";
        try {
            String aiResponseText = callAI(prompt);
            return objectMapper.readValue(cleanAIResponseText(aiResponseText), new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            throw new CustomException("AI Auto-Tag Failed: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public String callAI(String promptText) {
        if (useGroq()) {
            try {
                return callGroq(promptText);
            } catch (Exception e) {
                logger.warn("Groq failed ({}), falling back to Gemini...", e.getMessage());
                if (geminiApiKey != null && !geminiApiKey.isBlank()) {
                    return callGeminiFlash(promptText);
                }
                throw e;
            }
        }
        return callGeminiFlash(promptText);
    }

    private String callGroq(String promptText) {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> message = Map.of("role", "user", "content", promptText);
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 4096);

        int maxRetries = 3;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info("[Groq Attempt {}/{}] Calling Groq API...", attempt, maxRetries);
                ResponseEntity<Map> response = restTemplate.postForEntity(
                        url, new HttpEntity<>(requestBody, headers), Map.class);

                Map body = response.getBody();
                List choices = (List) body.get("choices");
                if (choices == null || choices.isEmpty()) throw new RuntimeException("Groq: no choices in response");

                Map choice = (Map) choices.get(0);
                Map messageResp = (Map) choice.get("message");
                String content = (String) messageResp.get("content");
                logger.info("[Groq] Response received ({} chars)", content != null ? content.length() : 0);
                return content;

            } catch (org.springframework.web.client.HttpStatusCodeException ex) {
                int status = ex.getStatusCode().value();
                logger.warn("[Groq Attempt {}/{}] HTTP {}: {}", attempt, maxRetries, status, ex.getResponseBodyAsString());
                lastException = ex;
                if ((status == 429 || status >= 500) && attempt < maxRetries) {
                    try { Thread.sleep(2000L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                } else {
                    throw new CustomException("Groq API error: " + ex.getResponseBodyAsString(), HttpStatus.valueOf(status));
                }
            } catch (Exception ex) {
                logger.warn("[Groq Attempt {}/{}] Error: {}", attempt, maxRetries, ex.getMessage());
                lastException = ex;
                if (attempt < maxRetries) {
                    try { Thread.sleep(2000L * attempt); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                }
            }
        }
        throw new CustomException("Groq API failed after retries: " + (lastException != null ? lastException.getMessage() : "Unknown"), HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Override
    public String callGeminiFlash(String promptText) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new CustomException("Gemini API key not configured", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiApiKey;
        Map<String, Object> contentsObj = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", promptText)))));

        int maxRetries = 3;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info("[Gemini Attempt {}/{}] Calling Gemini API...", attempt, maxRetries);
                try { Thread.sleep(1000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }

                ResponseEntity<Map> response = restTemplate.postForEntity(url, contentsObj, Map.class);
                Map body = response.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates == null || candidates.isEmpty()) throw new RuntimeException("Gemini: no candidates");
                Map content = (Map) ((Map) candidates.get(0)).get("content");
                List parts = (List) content.get("parts");
                return (String) ((Map) parts.get(0)).get("text");

            } catch (org.springframework.web.client.HttpStatusCodeException ex) {
                int status = ex.getStatusCode().value();
                lastException = ex;
                if ((status == 429 || status >= 500) && attempt < maxRetries) {
                    try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                } else {
                    throw new CustomException("Gemini error: " + ex.getResponseBodyAsString(), HttpStatus.valueOf(status));
                }
            } catch (Exception ex) {
                lastException = ex;
                if (attempt < maxRetries) {
                    try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                }
            }
        }
        throw new CustomException("Gemini failed after retries: " + (lastException != null ? lastException.getMessage() : "Unknown"), HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Override
    public String cleanAIResponseText(String text) {
        String clean = text.trim();
        Pattern pattern = Pattern.compile("(\\[[\\s\\S]*\\]|\\{[\\s\\S]*\\})");
        Matcher matcher = pattern.matcher(clean);
        if (matcher.find()) return matcher.group(0);
        clean = clean.replaceAll("```json", "").replaceAll("```", "");
        return clean.trim();
    }
}
