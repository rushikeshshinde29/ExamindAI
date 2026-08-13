package com.examind.ai.repository;

import com.examind.ai.entity.GroupStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupStudentRepository extends JpaRepository<GroupStudent, Long> {
    Optional<GroupStudent> findByGroupIdAndStudentId(Long groupId, Long studentId);
    Optional<GroupStudent> findByGroupIdAndEmailIgnoreCase(Long groupId, String email);
    List<GroupStudent> findByEmailIgnoreCaseAndStatus(String email, String status);
}
