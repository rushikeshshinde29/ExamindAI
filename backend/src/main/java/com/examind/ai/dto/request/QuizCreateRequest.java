package com.examind.ai.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class QuizCreateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description = "";

    @NotBlank(message = "Subject is required")
    private String subject;

    private String category = "General";

    private String difficulty = "medium"; // easy, medium, hard

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private int duration = 30;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private int totalMarks = 0;

    private int passingMarks = 0;

    private String accessCode = "";

    @Min(value = 1, message = "Max attempts must be at least 1")
    private int maxAttempts = 1;

    private boolean shuffleQuestions = false;

    private boolean shuffleOptions = false;

    private boolean showResults = true;

    private boolean showAnswersAfter = true;

    private String instructions = "";

    private List<String> tags;

    private Long targetGroupId;

    // Anti-cheat Configuration
    private boolean preventTabSwitch = true;

    private boolean preventCopyPaste = true;

    private boolean preventRightClick = true;

    private boolean fullscreenRequired = false;

    private int maxWarnings = 3;

    // Certificate
    private boolean certificateEnabled = false;

    private int certificateMinScore = 80;

    // Gamification & Feedback
    private boolean leaderboardEnabled = true;

    private boolean feedbackEnabled = true;

    private int pointsOnPass = 10;

    public void setAntiCheat(java.util.Map<String, Object> antiCheat) {
        if (antiCheat != null) {
            if (antiCheat.containsKey("preventTabSwitch")) {
                this.preventTabSwitch = (boolean) antiCheat.get("preventTabSwitch");
            }
            if (antiCheat.containsKey("preventCopyPaste")) {
                this.preventCopyPaste = (boolean) antiCheat.get("preventCopyPaste");
            }
            if (antiCheat.containsKey("preventRightClick")) {
                this.preventRightClick = (boolean) antiCheat.get("preventRightClick");
            }
            if (antiCheat.containsKey("fullscreenRequired")) {
                this.fullscreenRequired = (boolean) antiCheat.get("fullscreenRequired");
            }
            if (antiCheat.containsKey("maxWarnings")) {
                Object mw = antiCheat.get("maxWarnings");
                if (mw instanceof Number) {
                    this.maxWarnings = ((Number) mw).intValue();
                }
            }
        }
    }
}
