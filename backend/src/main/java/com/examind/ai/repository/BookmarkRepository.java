package com.examind.ai.repository;

import com.examind.ai.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    @Query("SELECT b FROM Bookmark b JOIN FETCH b.question q LEFT JOIN FETCH q.options WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Bookmark> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    Optional<Bookmark> findByUserIdAndQuestionId(Long userId, Long questionId);
    boolean existsByUserIdAndQuestionId(Long userId, Long questionId);
    void deleteByUserIdAndQuestionId(Long userId, Long questionId);
}
