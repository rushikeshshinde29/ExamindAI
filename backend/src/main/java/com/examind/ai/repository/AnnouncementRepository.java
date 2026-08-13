package com.examind.ai.repository;

import com.examind.ai.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // Find all announcements created by a specific user (for faculty/admin view)
    List<Announcement> findByCreatedByIdOrderByCreatedAtDesc(Long id);

    @Query("SELECT a FROM Announcement a WHERE (a.targetGroup.id = :groupId OR (a.targetGroup IS NULL AND a.targetAudience = 'ALL_STUDENTS') OR a.targetAudience = 'ALL_USERS') " +
           "ORDER BY CASE WHEN a.priority = 'Urgent' THEN 1 ELSE 2 END, a.createdAt DESC")
    List<Announcement> findRecentAnnouncementsForGroup(@Param("groupId") Long groupId);

    // Find visible announcements for a faculty member:
    // 1. Created by themselves, OR
    // 2. Global target (targetGroup IS NULL) matching ALL_USERS or FACULTY_ONLY, OR
    // 3. Group target (targetGroup IS NOT NULL) matching ALL_USERS, FACULTY_ONLY, STUDENTS_ONLY or GROUP where they are assigned
    @Query("SELECT a FROM Announcement a WHERE a.createdBy.id = :facultyId OR " +
           "(a.targetGroup IS NULL AND (a.targetAudience = 'ALL_USERS' OR a.targetAudience = 'FACULTY_ONLY')) OR " +
           "(a.targetGroup IS NOT NULL AND (a.targetAudience = 'ALL_USERS' OR a.targetAudience = 'FACULTY_ONLY' OR a.targetAudience = 'GROUP' OR a.targetAudience = 'STUDENTS_ONLY') AND EXISTS (SELECT f FROM a.targetGroup.faculty f WHERE f.id = :facultyId)) " +
           "ORDER BY CASE WHEN a.priority = 'Urgent' THEN 1 ELSE 2 END, a.createdAt DESC")
    List<Announcement> findVisibleAnnouncementsForFaculty(@Param("facultyId") Long facultyId);

    // Find visible announcements for a student:
    // 1. Global target (targetGroup IS NULL) matching ALL_USERS, STUDENTS_ONLY, or ALL_STUDENTS, OR
    // 2. Group target (targetGroup IS NOT NULL) matching ALL_USERS, STUDENTS_ONLY, or GROUP where they belong
    @Query("SELECT a FROM Announcement a WHERE " +
           "(a.targetGroup IS NULL AND (a.targetAudience = 'ALL_USERS' OR a.targetAudience = 'STUDENTS_ONLY' OR a.targetAudience = 'ALL_STUDENTS')) OR " +
           "(a.targetGroup IS NOT NULL AND (a.targetAudience = 'ALL_USERS' OR a.targetAudience = 'STUDENTS_ONLY' OR a.targetAudience = 'GROUP') AND a.targetGroup.id IN (SELECT gs.group.id FROM GroupStudent gs WHERE gs.student.id = :studentId)) " +
           "ORDER BY CASE WHEN a.priority = 'Urgent' THEN 1 ELSE 2 END, a.createdAt DESC")
    List<Announcement> findVisibleAnnouncementsForStudent(@Param("studentId") Long studentId);
}
