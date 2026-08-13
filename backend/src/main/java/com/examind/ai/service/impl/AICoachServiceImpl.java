package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.AICoachService;
import com.examind.ai.service.AIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AICoachServiceImpl implements AICoachService {

    private static final Logger logger = LoggerFactory.getLogger(AICoachServiceImpl.class);

    private final AttemptRepository attemptRepository;
    private final QuizRepository quizRepository;
    private final AIService aiService;

    public AICoachServiceImpl(AttemptRepository attemptRepository,
                              QuizRepository quizRepository,
                              AIService aiService) {
        this.attemptRepository = attemptRepository;
        this.quizRepository = quizRepository;
        this.aiService = aiService;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAICoachData(User student) {
        if (student.getRole().equals("student") && !student.isPro()) {
            throw new CustomException("AI Study Coach is a Pro Plan feature. Please upgrade your plan.", HttpStatus.PAYMENT_REQUIRED);
        }

        logger.info("Generating AI Coach insights for student: {}", student.getEmail());

        List<Attempt> attempts = attemptRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .filter(a -> List.of("completed", "timed_out").contains(a.getStatus()))
                .collect(Collectors.toList());

        if (attempts.isEmpty()) {
            String defaultTips = "Welcome to your AI Study Coach! 🚀\n\n" +
                "To unlock personalized, topic-specific performance diagnostics, go ahead and attempt some quizzes! In the meantime, here are some core study strategies to maximize your scores:\n\n" +
                "1. Take Practice Tests: Active retrieval practice is the single most effective way to lock concepts into your long-term memory.\n" +
                "2. Review Explanations: Do not just focus on your final score. Read per-question explanations immediately after completing a quiz to correct mistakes.\n" +
                "3. Bookmark Difficult Questions: Flag questions you find challenging so you can review them easily on your Bookmarks page.\n" +
                "4. Maintain a Learning Streak: Consistent daily study of even 15-20 minutes is far more effective than cramming before an exam.";

            return Map.of(
                "success", true,
                "hasData", true,
                "tagStats", new ArrayList<>(),
                "weakTags", new ArrayList<>(),
                "recommendedQuizzes", new ArrayList<>(),
                "studyPlan", defaultTips
            );
        }

        Map<String, Integer> tagTotal = new HashMap<>();
        Map<String, Integer> tagCorrect = new HashMap<>();

        for (Attempt a : attempts) {
            for (AttemptAnswer ans : a.getAnswers()) {
                Question q = ans.getQuestion();
                if (q == null) continue;
                List<String> tags = q.getTags();
                if (tags == null || tags.isEmpty()) {
                    tags = List.of(q.getQuiz().getSubject() != null ? q.getQuiz().getSubject() : "General");
                }
                for (String tag : tags) {
                    String cleanTag = tag.trim();
                    tagTotal.put(cleanTag, tagTotal.getOrDefault(cleanTag, 0) + 1);
                    if (ans.isCorrect()) {
                        tagCorrect.put(cleanTag, tagCorrect.getOrDefault(cleanTag, 0) + 1);
                    }
                }
            }
        }

        List<Map<String, Object>> tagStats = new ArrayList<>();
        List<String> weakTags = new ArrayList<>();

        for (String tag : tagTotal.keySet()) {
            int total = tagTotal.get(tag);
            int correct = tagCorrect.getOrDefault(tag, 0);
            double accuracy = (double) correct / total * 100.0;
            accuracy = Math.round(accuracy * 10.0) / 10.0;

            tagStats.add(Map.of(
                "tag", tag,
                "total", total,
                "correct", correct,
                "accuracy", accuracy
            ));

            if (accuracy < 60.0) {
                weakTags.add(tag);
            }
        }

        StringBuilder feedback = new StringBuilder();
        if (weakTags.isEmpty()) {
            feedback.append("Overall Performance: Excellent!\n");
            feedback.append("You have shown strong performance across all topic tags with an accuracy rate of 60% or higher. Keep up the great consistency!\n\n");
        } else {
            feedback.append("Areas of Improvement:\n");
            feedback.append("Based on your recent quiz attempts, your accuracy is below 60% in the following topics. Focus on reinforcing these areas:\n");
            for (String wt : weakTags) {
                feedback.append(String.format("• %s\n", wt));
            }
            feedback.append("\n");
        }

        feedback.append("Recommended Study Tips & Action Plan:\n");
        feedback.append("1. Focus on Fundamentals: Review basic definitions and textbook examples for your weak topics.\n");
        feedback.append("2. Practice Flagged Questions: Use your Bookmarks and Study Notes to review questions you found difficult.\n");
        feedback.append("3. Review Mistakes: Read through per-question explanations immediately after quiz completion.\n");
        feedback.append("4. Retake Quizzes: Re-attempt quizzes in your weak areas after 2-3 days to build retrieval confidence.");

        return Map.of(
            "success", true,
            "hasData", true,
            "tagStats", tagStats,
            "weakTags", weakTags,
            "recommendedQuizzes", new ArrayList<>(),
            "studyPlan", feedback.toString()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAttemptAIReport(Long attemptId, User user) {
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (!attempt.getStudent().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized access to attempt report", HttpStatus.FORBIDDEN);
        }

        Quiz quiz = attempt.getQuiz();
        int totalQuestions = attempt.getQuestionsOrder().size();
        long correctAnswers = attempt.getAnswers().stream().filter(AttemptAnswer::isCorrect).count();
        long wrongAnswers = attempt.getAnswers().stream().filter(ans -> !ans.isCorrect() && (ans.getSelectedOptionIndex() != null || (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank()))).count();

        StringBuilder wrongDetails = new StringBuilder();
        int countWrong = 0;
        for (AttemptAnswer ans : attempt.getAnswers()) {
            if (!ans.isCorrect()) {
                Question q = ans.getQuestion();
                if (q != null) {
                    countWrong++;
                    wrongDetails.append(countWrong).append(". Question: \"").append(q.getText()).append("\"\n");
                    if (q.getTags() != null && !q.getTags().isEmpty()) {
                        wrongDetails.append("   Topic Tags: ").append(String.join(", ", q.getTags())).append("\n");
                    }
                    if (ans.getSelectedOptionIndex() != null && q.getOptions() != null && ans.getSelectedOptionIndex() < q.getOptions().size()) {
                        wrongDetails.append("   Student Answer: \"").append(q.getOptions().get(ans.getSelectedOptionIndex()).getText()).append("\"\n");
                    } else if (ans.getTextAnswer() != null && !ans.getTextAnswer().isBlank()) {
                        wrongDetails.append("   Student Answer: \"").append(ans.getTextAnswer()).append("\"\n");
                    } else {
                        wrongDetails.append("   Student Answer: [Skipped]\n");
                    }
                    
                    if (q.getType() != null && q.getType().equalsIgnoreCase("short_answer")) {
                        wrongDetails.append("   Correct Answer: \"").append(q.getExplanation() != null ? q.getExplanation() : "").append("\"\n");
                    } else if (q.getOptions() != null) {
                        for (QuestionOption opt : q.getOptions()) {
                            if (opt.isCorrect()) {
                                wrongDetails.append("   Correct Answer: \"").append(opt.getText()).append("\"\n");
                                break;
                            }
                        }
                    }
                }
            }
        }

        String prompt = "Generate a student diagnostic feedback report for this exam attempt:\n" +
                "Quiz: \"" + quiz.getTitle() + "\"\n" +
                "Subject: \"" + quiz.getSubject() + "\"\n" +
                "Score: " + attempt.getObtainedMarks() + "/" + attempt.getTotalMarks() + " (" + attempt.getPercentage() + "%)\n" +
                "Status: " + (attempt.isPassed() ? "Passed" : "Failed") + "\n" +
                "Time Taken: " + attempt.getTimeTaken() + " seconds\n" +
                "Wrong Answers Details:\n" + wrongDetails.toString() + "\n" +
                "Instructions to strictly follow:\n" +
                "1. Write a SHORT, POINT-WISE, SPECIFIC report. Total report MUST be under 100 words.\n" +
                "2. No paragraph should be longer than 2 lines. Direct points only.\n" +
                "3. Avoid generic filler phrases (e.g. \"it is essential to\", \"this suggests that\").\n" +
                "4. Output format must strictly be:\n\n" +
                "### 1. SCORE SUMMARY\n" +
                "- Score: " + attempt.getObtainedMarks() + "/" + attempt.getTotalMarks() + " (" + attempt.getPercentage() + "%), " + (attempt.isPassed() ? "Passed" : "Failed") + ".\n" +
                "- Time: [Time taken comment, max 1 line].\n\n" +
                "### 2. WEAK TOPICS\n" +
                "[For each incorrect answer, identify the exact specific topic, syntax or logic from tags/text. DO NOT use generic category names. Format exactly as:]\n" +
                "- ❌ [Topic Name] — [1 line: what student got wrong based on their answer vs correct answer]\n\n" +
                "### 3. IMPROVEMENT PLAN\n" +
                "[For each weak topic list exactly one specific, concrete, short action item. Format exactly as:]\n" +
                "- 🎯 [Topic Name] → [Specific short action, max 1 line]";

        String reportText = "Unable to generate AI Report at this time.";
        try {
            reportText = aiService.callAI(prompt);
        } catch (Exception ex) {
            logger.error("Failed to generate AI Attempt Report, falling back to local diagnostic generator", ex);
            
            StringBuilder fallback = new StringBuilder();
            fallback.append("### 1. SCORE SUMMARY\n");
            fallback.append(String.format("- Score: %.1f/%.1f (%.1f%%), %s.\n", 
                    attempt.getObtainedMarks(), attempt.getTotalMarks(), attempt.getPercentage(),
                    attempt.isPassed() ? "Passed" : "Failed"));
            fallback.append(String.format("- Time: Spent %d seconds on %d questions.\n\n", 
                    attempt.getTimeTaken(), totalQuestions));
            
            fallback.append("### 2. WEAK TOPICS\n");
            if (wrongAnswers == 0) {
                fallback.append("- No weaknesses detected.\n\n");
            } else {
                fallback.append(String.format("- ❌ %s — Focus on reinforcing key core concepts in this subject.\n\n", 
                        quiz.getSubject() != null ? quiz.getSubject() : "General"));
            }
            
            fallback.append("### 3. IMPROVEMENT PLAN\n");
            fallback.append("- 🎯 Revision Mode → Use the 'Revision Mode' button on the results screen to practice incorrect questions.\n");
            fallback.append("- 🎯 Active Practice → Re-take this quiz in a few days to aim for a perfect score.");
            
            reportText = fallback.toString();
        }

        return Map.of("success", true, "report", reportText);
    }
}
