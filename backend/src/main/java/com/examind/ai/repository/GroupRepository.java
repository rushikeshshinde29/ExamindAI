package com.examind.ai.repository;

import com.examind.ai.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findAllByOrderByCreatedAtDesc();

    @Query("SELECT g FROM Group g JOIN g.students gs WHERE gs.student.id = :studentId AND gs.status = :status")
    List<Group> findActiveGroupsForStudent(@Param("studentId") Long studentId, @Param("status") String status);

    @Query("SELECT g FROM Group g JOIN g.faculty f WHERE f.id = :facultyId AND g.isActive = true ORDER BY g.createdAt DESC")
    List<Group> findByFacultyId(@Param("facultyId") Long facultyId);
}
