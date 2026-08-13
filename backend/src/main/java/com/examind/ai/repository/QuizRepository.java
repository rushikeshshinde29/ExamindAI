package com.examind.ai.repository;

import com.examind.ai.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    long countByIsActiveTrue();
    long countByIsPublishedTrue();
    
    List<Quiz> findByIsPublishedTrueAndIsActiveTrue();
    List<Quiz> findByCreatedById(Long userId);
    
    @Query("SELECT q FROM Quiz q WHERE q.createdBy.id = :userId AND (:search IS NULL OR LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.subject) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Quiz> findByCreatedByAndSearch(@Param("userId") Long userId, @Param("search") String search, Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE q.isPublished = true AND q.isActive = true AND (:search IS NULL OR LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.subject) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Quiz> findPublishedAndSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE (:search IS NULL OR LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.subject) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Quiz> findAllAndSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE q.isPublished = :published AND (:search IS NULL OR LOWER(q.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(q.subject) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Quiz> findAllAndSearchAndPublished(@Param("search") String search, @Param("published") boolean published, Pageable pageable);

    List<Quiz> findByIsPublishedTrue();
    
    @Query("SELECT q FROM Quiz q WHERE q.isPublished = false AND q.publishAt IS NOT NULL AND q.publishAt <= :now AND q.isApproved = true")
    List<Quiz> findQuizzesToPublish(@Param("now") java.time.LocalDateTime now);
}
