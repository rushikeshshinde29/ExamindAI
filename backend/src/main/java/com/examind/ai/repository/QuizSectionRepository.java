package com.examind.ai.repository;

import com.examind.ai.entity.QuizSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizSectionRepository extends JpaRepository<QuizSection, Long> {
    List<QuizSection> findByQuizIdOrderByOrderIndexAsc(Long quizId);
}
