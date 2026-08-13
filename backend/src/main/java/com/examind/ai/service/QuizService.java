package com.examind.ai.service;

import com.examind.ai.dto.request.QuizCreateRequest;
import com.examind.ai.entity.Attempt;
import com.examind.ai.entity.Question;
import com.examind.ai.entity.Quiz;
import com.examind.ai.entity.QuizSection;
import com.examind.ai.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

public interface QuizService {
    QuizSection getSection(Long id);
    Page<Quiz> getQuizzes(User user, String subject, String difficulty, String search, int page, int limit);
    Quiz getQuiz(Long id, User user);
    Quiz createQuiz(QuizCreateRequest request, User user);
    Quiz updateQuiz(Long id, QuizCreateRequest request, User user);
    void deleteQuiz(Long id, User user);
    Quiz togglePublishQuiz(Long id, User user);
    Map<String, Object> getQuizResults(Long id, User user);
    Quiz cloneQuiz(Long id, User user);

    // Question management in Quiz
    Question addQuestion(Long quizId, Question question, User user);
    void deleteQuestion(Long questionId, User user);
    List<Question> getQuizQuestions(Long quizId, User user);

    // Section management in Quiz
    List<QuizSection> getSections(Long quizId, User user);
    QuizSection createSection(Long quizId, Map<String, Object> payload, User user);
    void deleteSection(Long quizId, Long sectionId, User user);

    // CSV/Excel operations
    ByteArrayOutputStream generateExcelTemplate();
    Map<String, Object> importQuestionsFromExcel(Long quizId, MultipartFile file, User user);
    Map<String, Object> importQuestionsFromWord(Long quizId, MultipartFile file, User user);
    void emailQuizResults(Long quizId, boolean includeReport, boolean includeCertificate, User user);
    Map<String, Object> emailQuizResultsSync(Long quizId, User user);
}
