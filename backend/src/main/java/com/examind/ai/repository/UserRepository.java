package com.examind.ai.repository;

import com.examind.ai.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRoleAndIsActiveTrue(String role);

    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:status = 'all' OR " +
           " (:status = 'active' AND u.isActive = true AND u.isBanned = false) OR " +
           " (:status = 'banned' AND u.isBanned = true) OR " +
           " (:status = 'inactive' AND u.isActive = false)) AND " +
           "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.studentId) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.department) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findFilteredUsers(@Param("role") String role, 
                                 @Param("status") String status, 
                                 @Param("search") String search, 
                                 Pageable pageable);
    long countByRole(String role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.totalPoints < :points")
    long countByRoleAndTotalPointsLessThan(@Param("role") String role, @Param("points") long points);
    
    java.util.List<User> findByRole(String role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'student'")
    long countStudents();
    Optional<User> findByPasswordResetToken(String token);
}
