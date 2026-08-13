package com.examind.ai.service.impl;

import com.examind.ai.dto.request.QuestionCreateRequest;
import com.examind.ai.entity.Question;
import com.examind.ai.entity.QuestionOption;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.QuestionRepository;
import com.examind.ai.repository.QuizSectionRepository;
import com.examind.ai.service.QuestionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizSectionRepository quizSectionRepository;

    public QuestionServiceImpl(QuestionRepository questionRepository, QuizSectionRepository quizSectionRepository) {
        this.questionRepository = questionRepository;
        this.quizSectionRepository = quizSectionRepository;
    }

    @Override
    public Question updateQuestion(Long id, QuestionCreateRequest request, User user) {
        Question existing = questionRepository.findById(id)
                .orElseThrow(() -> new CustomException("Question not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !existing.getQuiz().getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized edit access to this question", HttpStatus.FORBIDDEN);
        }

        existing.setText(request.getText());
        existing.setType(request.getType());
        existing.setExplanation(request.getExplanation());
        existing.setHint(request.getHint());
        existing.setMarks(request.getMarks());
        existing.setNegativeMark(request.getNegativeMark());
        existing.setDifficulty(request.getDifficulty());
        existing.setOrder(request.getOrder());
        existing.setImageUrl(request.getImageUrl());
        
        if (request.getSectionId() != null) {
            existing.setSection(quizSectionRepository.findById(request.getSectionId()).orElse(null));
        } else {
            existing.setSection(null);
        }

        if (request.getTags() != null) {
            existing.setTags(request.getTags());
        }

        existing.getOptions().clear();
        List<QuestionOption> options = request.getOptions().stream().map(o -> {
            QuestionOption opt = new QuestionOption();
            opt.setText(o.getText());
            opt.setCorrect(o.isCorrect());
            opt.setQuestion(existing);
            return opt;
        }).collect(Collectors.toList());
        existing.getOptions().addAll(options);

        return questionRepository.save(existing);
    }
}
