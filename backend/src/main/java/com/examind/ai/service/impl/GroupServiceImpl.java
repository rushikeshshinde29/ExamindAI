package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.AnnouncementRepository;
import com.examind.ai.repository.GroupRepository;
import com.examind.ai.repository.UserRepository;
import com.examind.ai.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public GroupServiceImpl(GroupRepository groupRepository,
                            AnnouncementRepository announcementRepository,
                            UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Group validateAndGetGroup(Long groupId, User user) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException("Group not found", HttpStatus.NOT_FOUND));
        
        if (!"admin".equalsIgnoreCase(user.getRole())) {
            boolean isAssigned = group.getFaculty().stream().anyMatch(f -> f.getId().equals(user.getId()));
            if (!isAssigned) {
                throw new CustomException("You do not manage this student group", HttpStatus.FORBIDDEN);
            }
        }
        return group;
    }

    @Override
    public List<Group> getFacultyGroups(User user) {
        return groupRepository.findByFacultyId(user.getId());
    }

    @Override
    public List<User> getAllActiveFaculty() {
        return userRepository.findAll().stream()
                .filter(u -> "faculty".equalsIgnoreCase(u.getRole()) && u.isActive())
                .collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getStudentGroups(User user) {
        List<Group> activeGroups = groupRepository.findActiveGroupsForStudent(user.getId(), "active");

        return activeGroups.stream().map(g -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", g.getId());
            map.put("name", g.getName());
            map.put("description", g.getDescription());
            map.put("division", g.getDivision());
            map.put("isActive", g.isActive());

            List<Map<String, Object>> professors = g.getFaculty().stream().map(f -> {
                Map<String, Object> prof = new HashMap<>();
                prof.put("id", f.getId());
                prof.put("name", f.getName());
                prof.put("email", f.getEmail());
                prof.put("avatar", f.getAvatar());
                return prof;
            }).collect(Collectors.toList());
            map.put("professors", professors);

            List<Map<String, Object>> classmates = g.getStudents().stream()
                    .filter(gs -> gs.getStudent() != null && "active".equalsIgnoreCase(gs.getStatus()))
                    .map(GroupStudent::getStudent)
                    .filter(student -> !student.getId().equals(user.getId()))
                    .map(s -> {
                        Map<String, Object> classmate = new HashMap<>();
                        classmate.put("id", s.getId());
                        classmate.put("name", s.getName());
                        classmate.put("email", s.getEmail());
                        classmate.put("avatar", s.getAvatar());
                        return classmate;
                    }).collect(Collectors.toList());
            map.put("classmates", classmates);

            List<Announcement> announcements = announcementRepository.findRecentAnnouncementsForGroup(g.getId());
            List<Map<String, Object>> announcementList = announcements.stream().limit(5).map(a -> {
                Map<String, Object> ann = new HashMap<>();
                ann.put("id", a.getId());
                ann.put("title", a.getTitle());
                ann.put("message", a.getMessage());
                ann.put("priority", a.getPriority());
                ann.put("createdAt", a.getCreatedAt());
                ann.put("authorName", a.getCreatedBy() != null ? a.getCreatedBy().getName() : "System");
                ann.put("authorRole", a.getCreatedBy() != null ? a.getCreatedBy().getRole() : "admin");
                return ann;
            }).collect(Collectors.toList());
            map.put("announcements", announcementList);

            return map;
        }).collect(Collectors.toList());
    }
}
