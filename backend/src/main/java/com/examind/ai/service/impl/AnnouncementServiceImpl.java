package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.AnnouncementService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public AnnouncementServiceImpl(AnnouncementRepository announcementRepository,
                                   GroupRepository groupRepository,
                                   UserRepository userRepository,
                                   NotificationRepository notificationRepository) {
        this.announcementRepository = announcementRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Announcement> getStudentAnnouncements(User user) {
        return announcementRepository.findVisibleAnnouncementsForStudent(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Announcement> getFacultyAnnouncements(User user) {
        return announcementRepository.findVisibleAnnouncementsForFaculty(user.getId());
    }

    @Override
    @Transactional
    public Announcement createAnnouncement(Map<String, Object> payload, User user) {
        String title = (String) payload.get("title");
        String message = (String) payload.get("message");
        String priority = (String) payload.get("priority");
        String targetAudience = (String) payload.get("targetAudience");
        
        if (priority == null || priority.isBlank()) priority = "Normal";
        if (targetAudience == null || targetAudience.isBlank()) targetAudience = "ALL_USERS";
        
        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            throw new CustomException("Title and message are required", HttpStatus.BAD_REQUEST);
        }

        boolean isGroupTarget = payload.containsKey("targetGroupId") && payload.get("targetGroupId") != null && !payload.get("targetGroupId").toString().isBlank();
        if (isGroupTarget) {
            if (!"ALL_USERS".equals(targetAudience) && !"FACULTY_ONLY".equals(targetAudience) && !"STUDENTS_ONLY".equals(targetAudience) && !"GROUP".equals(targetAudience)) {
                throw new CustomException("Invalid group audience target", HttpStatus.BAD_REQUEST);
            }
        } else {
            if ("faculty".equalsIgnoreCase(user.getRole())) {
                if (!"ALL_STUDENTS".equals(targetAudience) && !"GROUP".equals(targetAudience)) {
                    throw new CustomException("Faculty can only target 'All Students'", HttpStatus.FORBIDDEN);
                }
            } else if ("admin".equalsIgnoreCase(user.getRole())) {
                if (!"ALL_USERS".equals(targetAudience) && !"FACULTY_ONLY".equals(targetAudience) && !"STUDENTS_ONLY".equals(targetAudience)) {
                    throw new CustomException("Admin can only target 'All Users', 'Faculty Only', or 'Students Only'", HttpStatus.FORBIDDEN);
                }
            }
        }

        Announcement a = new Announcement();
        a.setTitle(title);
        a.setMessage(message);
        a.setPriority(priority);
        a.setTargetAudience(targetAudience);
        a.setCreatedBy(user);

        if ("GROUP".equals(targetAudience)) {
            if (payload.containsKey("targetGroupId") && payload.get("targetGroupId") != null && !payload.get("targetGroupId").toString().isBlank()) {
                Long groupId = Long.valueOf(payload.get("targetGroupId").toString());
                Group group = groupRepository.findById(groupId)
                        .orElseThrow(() -> new CustomException("Group not found", HttpStatus.NOT_FOUND));
                a.setTargetGroup(group);
            } else {
                throw new CustomException("Group ID is required when target is GROUP", HttpStatus.BAD_REQUEST);
            }
        }

        Announcement saved = announcementRepository.save(a);

        List<User> targetUsers = new ArrayList<>();
        if (saved.getTargetGroup() != null) {
            String aud = saved.getTargetAudience();
            if ("ALL_USERS".equals(aud) || "STUDENTS_ONLY".equals(aud) || "GROUP".equals(aud) || "ALL_STUDENTS".equals(aud)) {
                saved.getTargetGroup().getStudents().stream()
                        .map(GroupStudent::getStudent)
                        .filter(Objects::nonNull)
                        .filter(User::isActive)
                        .forEach(targetUsers::add);
            }
            if ("ALL_USERS".equals(aud) || "FACULTY_ONLY".equals(aud)) {
                saved.getTargetGroup().getFaculty().stream()
                        .filter(f -> f != null && !f.getId().equals(saved.getCreatedBy().getId()))
                        .filter(User::isActive)
                        .forEach(targetUsers::add);
            }
        } else {
            switch (targetAudience) {
                case "ALL_USERS":
                    targetUsers = userRepository.findAll().stream()
                            .filter(u -> u.isActive() && ("student".equalsIgnoreCase(u.getRole()) || "faculty".equalsIgnoreCase(u.getRole())))
                            .collect(Collectors.toList());
                    break;
                case "FACULTY_ONLY":
                    targetUsers = userRepository.findAll().stream()
                            .filter(u -> u.isActive() && "faculty".equalsIgnoreCase(u.getRole()))
                            .collect(Collectors.toList());
                    break;
                case "STUDENTS_ONLY":
                case "ALL_STUDENTS":
                    targetUsers = userRepository.findAll().stream()
                            .filter(u -> u.isActive() && "student".equalsIgnoreCase(u.getRole()))
                            .collect(Collectors.toList());
                    break;
                default:
                    targetUsers = Collections.emptyList();
            }
        }

        List<Notification> notifications = targetUsers.stream().map(target -> {
            Notification notif = new Notification();
            notif.setUser(target);
            notif.setTitle(saved.getPriority().equalsIgnoreCase("Urgent") ? "🚨 URGENT: " + saved.getTitle() : "📢 " + saved.getTitle());
            notif.setMessage(saved.getMessage());
            notif.setType("ANNOUNCEMENT");
            notif.setLink("student".equalsIgnoreCase(target.getRole()) ? "/student/announcements" : "/faculty/announcements");
            notif.setIcon(saved.getPriority().equalsIgnoreCase("Urgent") ? "🚨" : "📢");
            return notif;
        }).collect(Collectors.toList());

        notificationRepository.saveAll(notifications);

        return saved;
    }

    @Override
    @Transactional
    public Announcement updateAnnouncement(Long id, Map<String, Object> payload, User user) {
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new CustomException("Announcement not found", HttpStatus.NOT_FOUND));

        if (!a.getCreatedBy().getId().equals(user.getId()) && !"admin".equalsIgnoreCase(user.getRole())) {
            throw new CustomException("Unauthorized to modify this announcement", HttpStatus.FORBIDDEN);
        }

        if (payload.containsKey("title")) a.setTitle((String) payload.get("title"));
        if (payload.containsKey("message")) a.setMessage((String) payload.get("message"));
        if (payload.containsKey("priority")) a.setPriority((String) payload.get("priority"));

        if (payload.containsKey("targetAudience")) {
            String targetAudience = (String) payload.get("targetAudience");
            
            boolean isGroupTarget = payload.containsKey("targetGroupId") && payload.get("targetGroupId") != null && !payload.get("targetGroupId").toString().isBlank();
            if (isGroupTarget) {
                if (!"ALL_USERS".equals(targetAudience) && !"FACULTY_ONLY".equals(targetAudience) && !"STUDENTS_ONLY".equals(targetAudience) && !"GROUP".equals(targetAudience)) {
                    throw new CustomException("Invalid group audience target", HttpStatus.BAD_REQUEST);
                }
            } else {
                if ("faculty".equalsIgnoreCase(user.getRole())) {
                    if (!"ALL_STUDENTS".equals(targetAudience) && !"GROUP".equals(targetAudience)) {
                        throw new CustomException("Faculty can only target 'All Students'", HttpStatus.FORBIDDEN);
                    }
                } else if ("admin".equalsIgnoreCase(user.getRole())) {
                    if (!"ALL_USERS".equals(targetAudience) && !"FACULTY_ONLY".equals(targetAudience) && !"STUDENTS_ONLY".equals(targetAudience)) {
                        throw new CustomException("Admin can only target 'All Users', 'Faculty Only', or 'Students Only'", HttpStatus.FORBIDDEN);
                    }
                }
            }
            a.setTargetAudience(targetAudience);

            if ("GROUP".equals(targetAudience)) {
                if (payload.containsKey("targetGroupId") && payload.get("targetGroupId") != null && !payload.get("targetGroupId").toString().isBlank()) {
                    Long groupId = Long.valueOf(payload.get("targetGroupId").toString());
                    Group group = groupRepository.findById(groupId)
                            .orElseThrow(() -> new CustomException("Group not found", HttpStatus.NOT_FOUND));
                    a.setTargetGroup(group);
                }
            } else {
                a.setTargetGroup(null);
            }
        }

        return announcementRepository.save(a);
    }

    @Override
    @Transactional
    public void deleteAnnouncement(Long id, User user) {
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new CustomException("Announcement not found", HttpStatus.NOT_FOUND));

        if (!a.getCreatedBy().getId().equals(user.getId()) && !"admin".equalsIgnoreCase(user.getRole())) {
            throw new CustomException("Unauthorized to delete this announcement", HttpStatus.FORBIDDEN);
        }

        announcementRepository.delete(a);
    }
}
