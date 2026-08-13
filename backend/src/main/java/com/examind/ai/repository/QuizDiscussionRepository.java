package com.examind.ai.repository;

import com.examind.ai.entity.QuizDiscussion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizDiscussionRepository extends JpaRepository<QuizDiscussion, Long> {
    List<QuizDiscussion> findByQuizIdOrderByCreatedAtAsc(Long quizId);
}
