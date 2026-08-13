package com.examind.ai.service.impl;

import com.examind.ai.dto.request.AnnouncementRequest;
import com.examind.ai.dto.request.RegisterRequest;
import com.examind.ai.dto.response.UserDto;
import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.EntityManager;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminServiceImpl.class);

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    public AdminServiceImpl(UserRepository userRepository,
                            QuizRepository quizRepository,
                            AttemptRepository attemptRepository,
                            GroupRepository groupRepository,
                            GroupStudentRepository groupStudentRepository,
                            NotificationRepository notificationRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.groupRepository = groupRepository;
        this.groupStudentRepository = groupStudentRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Map<String, Object> getDashboardStats() {
        logger.info("Compiling admin dashboard statistics");
        long totalStudents = userRepository.countByRoleAndIsActiveTrue("student");
        long totalFaculty = userRepository.countByRoleAndIsActiveTrue("faculty");
        long totalQuizzes = quizRepository.countByIsActiveTrue();
        long totalAttempts = attemptRepository.countByStatusIn(List.of("completed", "timed_out"));
        long publishedQuizzes = quizRepository.countByIsPublishedTrue();
        long passedAttempts = attemptRepository.countByIsPassedTrue();

        int passRate = 0;
        if (totalAttempts > 0) {
            passRate = (int) Math.round(((double) passedAttempts / totalAttempts) * 100);
        }

        List<Attempt> recentAttempts = attemptRepository.findTop10ByStatusOrderByCreatedAtDesc("completed");
        
        // Extract recent attempts details
        List<Map<String, Object>> recentAttemptsList = recentAttempts.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("_id", a.getId());
            map.put("totalMarks", a.getTotalMarks());
            map.put("obtainedMarks", a.getObtainedMarks());
            map.put("percentage", a.getPercentage());
            map.put("isPassed", a.isPassed());
            map.put("createdAt", a.getCreatedAt());
            map.put("status", a.getStatus());
            map.put("timeTaken", a.getTimeTaken());
            
            if (a.getStudent() != null) {
                map.put("student", Map.of(
                    "_id", a.getStudent().getId(),
                    "name", a.getStudent().getName(),
                    "email", a.getStudent().getEmail()
                ));
            }
            if (a.getQuiz() != null) {
                map.put("quiz", Map.of(
                    "_id", a.getQuiz().getId(),
                    "title", a.getQuiz().getTitle(),
                    "subject", a.getQuiz().getSubject()
                ));
            }
            return map;
        }).collect(Collectors.toList());

        // Weekly attempts grouping (past 7 days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<LocalDateTime> attemptDates = attemptRepository.findWeeklyAttemptsGlobally(sevenDaysAgo);
        Map<String, Long> dateCounts = attemptDates.stream()
                .map(dt -> dt.toLocalDate().toString())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        List<Map<String, Object>> weeklyTrend = dateCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("_id", entry.getKey());
                    item.put("count", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalFaculty", totalFaculty);
        stats.put("totalQuizzes", totalQuizzes);
        stats.put("totalAttempts", totalAttempts);
        stats.put("publishedQuizzes", publishedQuizzes);
        stats.put("passRate", passRate);
        stats.put("recentAttempts", recentAttemptsList);
        stats.put("weeklyAttempts", weeklyTrend);

        return stats;
    }

    @Override
    public Page<User> getUsers(String role, String status, String search, int page, int limit) {
        logger.info("Admin fetching filtered users list: role={}, status={}, search={}", role, status, search);
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        String cleanRole = (role != null && !role.isBlank()) ? role : null;
        String cleanStatus = (status != null && !status.isBlank()) ? status : "all";
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        return userRepository.findFilteredUsers(cleanRole, cleanStatus, cleanSearch, pageable);
    }

    @Override
    public Map<String, Object> getUserDetails(Long userId) {
        logger.info("Admin fetching details for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        List<Attempt> attempts = attemptRepository.findByStudentIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> attemptsList = attempts.stream().limit(10).map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("_id", a.getId());
            map.put("totalMarks", a.getTotalMarks());
            map.put("obtainedMarks", a.getObtainedMarks());
            map.put("percentage", a.getPercentage());
            map.put("isPassed", a.isPassed());
            map.put("createdAt", a.getCreatedAt());
            
            if (a.getQuiz() != null) {
                map.put("quiz", Map.of(
                    "title", a.getQuiz().getTitle(),
                    "subject", a.getQuiz().getSubject()
                ));
            }
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> details = new HashMap<>();
        details.put("user", UserDto.fromEntity(user));
        details.put("attempts", attemptsList);

        return details;
    }

    @Override
    public User createUser(RegisterRequest request) {
        logger.info("Admin creating new user with email: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("Email already registered", HttpStatus.BAD_REQUEST);
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        String role = (request.getRole() != null) ? request.getRole().toLowerCase() : "student";
        user.setRole(role);
        
        user.setDepartment(request.getDepartment());
        user.setStudentId(request.getStudentId());
        user.setEmployeeId(request.getEmployeeId());
        user.setPhone(request.getPhone());
        user.setSemester(request.getSemester());
        user.setDivision(request.getDivision());

        User savedUser = userRepository.save(user);

        // Account Creation Notification
        Notification notification = new Notification();
        notification.setUser(savedUser);
        notification.setTitle("Account Created 🎉");
        notification.setMessage("Your " + savedUser.getRole() + " account on Examind AI has been created by an administrator.");
        notification.setType("system");
        notification.setIcon("🎉");
        notificationRepository.save(notification);

        // Check if there are pending group invitations matching this email
        List<GroupStudent> pendingMembers = groupStudentRepository.findByEmailIgnoreCaseAndStatus(savedUser.getEmail(), "pending");
        for (GroupStudent member : pendingMembers) {
            if (savedUser.getRole().equals("student")) {
                member.setStudent(savedUser);
                member.setStatus("active");
                member.setJoinedAt(LocalDateTime.now());
                groupStudentRepository.save(member);
                
                Notification groupNotif = new Notification();
                groupNotif.setUser(savedUser);
                groupNotif.setTitle("Added to Group: " + member.getGroup().getName());
                groupNotif.setMessage("You have been added to the class group \"" + member.getGroup().getName() + "\".");
                groupNotif.setType("system");
                groupNotif.setIcon("👥");
                notificationRepository.save(groupNotif);
            }
        }

        return savedUser;
    }

    @Override
    public User updateUser(Long userId, RegisterRequest request) {
        logger.info("Admin updating details for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(request.getRole().toLowerCase());
        }
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getStudentId() != null) user.setStudentId(request.getStudentId());
        if (request.getEmployeeId() != null) user.setEmployeeId(request.getEmployeeId());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getSemester() != null) user.setSemester(request.getSemester());
        if (request.getDivision() != null) user.setDivision(request.getDivision());

        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long userId) {
        logger.info("Admin deleting user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if ("admin".equalsIgnoreCase(user.getRole())) {
            throw new CustomException("Cannot delete administrator accounts", HttpStatus.BAD_REQUEST);
        }

        // Check if user is associated with quizzes (as creator)
        long quizCount = quizRepository.findByCreatedById(userId).size();
        if (quizCount > 0) {
            throw new CustomException("Cannot delete user: This user has active quizzes associated with them.", HttpStatus.BAD_REQUEST);
        }

        // Check if student has attempts
        long attemptCount = attemptRepository.findByStudentIdOrderByCreatedAtDesc(userId).size();
        if (attemptCount > 0) {
            throw new CustomException("Cannot delete user: This user is associated with quiz attempts.", HttpStatus.BAD_REQUEST);
        }

        // Safe to delete other metadata tables
        
        // 1. Delete Activity Logs
        entityManager.createNativeQuery("DELETE FROM activity_logs WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 2. Delete Bookmarks
        entityManager.createNativeQuery("DELETE FROM bookmarks WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 3. Delete Study Notes
        entityManager.createNativeQuery("DELETE FROM study_notes WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 4. Delete Quiz Discussions
        entityManager.createNativeQuery("DELETE FROM quiz_discussions WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 5. Delete User Preferences
        entityManager.createNativeQuery("DELETE FROM user_preferences WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 6. Delete Group Students
        entityManager.createNativeQuery("DELETE FROM group_students WHERE student_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 7. Delete Group Faculty association
        entityManager.createNativeQuery("DELETE FROM group_faculty WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 8. Delete Notifications
        entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // 9. Finally, delete the user
        entityManager.createNativeQuery("DELETE FROM users WHERE id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();
    }

    @Override
    public User toggleUserBan(Long userId, String reason) {
        logger.info("Admin toggling ban state for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (user.getRole().equals("admin")) {
            throw new CustomException("Cannot ban/unban administrator accounts", HttpStatus.BAD_REQUEST);
        }

        user.setBanned(!user.isBanned());
        user.setBanReason(user.isBanned() ? (reason != null && !reason.isBlank() ? reason : "Banned by admin") : "");
        User savedUser = userRepository.save(user);

        if (savedUser.isBanned()) {
            Notification notification = new Notification();
            notification.setUser(savedUser);
            notification.setTitle("Account Suspended 🚫");
            notification.setMessage("Your account has been suspended by the administration. Reason: " + savedUser.getBanReason());
            notification.setType("system");
            notification.setIcon("🚫");
            notificationRepository.save(notification);
        }

        return savedUser;
    }

    @Override
    public void resetUserPassword(Long userId, String newPassword) {
        logger.info("Admin resetting password for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    public User toggleUserActive(Long userId) {
        logger.info("Admin toggling active status for user ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (user.getRole().equals("admin")) {
            throw new CustomException("Cannot activate/deactivate administrator accounts", HttpStatus.BAD_REQUEST);
        }

        user.setActive(!user.isActive());
        return userRepository.save(user);
    }

    @Override
    public Page<Quiz> getQuizzes(String search, Boolean published, int page, int limit) {
        logger.info("Admin fetching quizzes list: search={}, published={}", search, published);
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        if (published != null) {
            return quizRepository.findAllAndSearchAndPublished(cleanSearch, published, pageable);
        }
        return quizRepository.findAllAndSearch(cleanSearch, pageable);
    }

    @Override
    public List<Group> getAllGroups() {
        logger.info("Admin loading all groups");
        return groupRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Group createGroup(Group group) {
        logger.info("Admin creating new group named: {}", group.getName());
        return groupRepository.save(group);
    }

    @Override
    public Group updateGroup(Long groupId, Group groupDetails) {
        logger.info("Admin updating class group ID: {}", groupId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException("Group not found", HttpStatus.NOT_FOUND));

        group.setName(groupDetails.getName());
        group.setDescription(groupDetails.getDescription());
        group.setBatch(groupDetails.getBatch());
        group.setSubject(groupDetails.getSubject());
        group.setSemester(groupDetails.getSemester());
        group.setDivision(groupDetails.getDivision());
        group.setActive(groupDetails.isActive());

        return groupRepository.save(group);
    }

    @Override
    public void deleteGroup(Long groupId) {
        logger.info("Admin deleting class group ID: {}", groupId);
        if (!groupRepository.existsById(groupId)) {
            throw new CustomException("Group not found", HttpStatus.NOT_FOUND);
        }
        groupRepository.deleteById(groupId);
    }

    @Override
    public Map<String, Object> addStudentsToGroup(Long groupId, List<String> emails) {
        logger.info("Admin adding students list to group ID: {}, count={}", groupId, emails.size());
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException("Group not found", HttpStatus.NOT_FOUND));

        List<String> added = new ArrayList<>();
        List<String> pending = new ArrayList<>();
        List<String> alreadyIn = new ArrayList<>();

        for (String rawEmail : emails) {
            String email = rawEmail.toLowerCase().trim();
            if (email.isBlank()) continue;

            Optional<GroupStudent> existing = groupStudentRepository.findByGroupIdAndEmailIgnoreCase(groupId, email);
            if (existing.isPresent()) {
                alreadyIn.add(email);
                continue;
            }

            GroupStudent member = new GroupStudent();
            member.setGroup(group);
            member.setEmail(email);

            Optional<User> studentOpt = userRepository.findByEmail(email);
            if (studentOpt.isPresent() && studentOpt.get().getRole().equals("student")) {
                User student = studentOpt.get();
                member.setStudent(student);
                member.setStatus("active");
                member.setJoinedAt(LocalDateTime.now());
                groupStudentRepository.save(member);

                Notification notification = new Notification();
                notification.setUser(student);
                notification.setTitle("Added to Group: " + group.getName());
                notification.setMessage("You have been added to the class group \"" + group.getName() + "\".");
                notification.setType("system");
                notification.setIcon("👥");
                notificationRepository.save(notification);

                added.add(email);
            } else {
                member.setStatus("pending");
                groupStudentRepository.save(member);
                pending.add(email);
            }
        }

        return Map.of("added", added, "pending", pending, "alreadyIn", alreadyIn);
    }

    @Override
    public void removeStudentFromGroup(Long groupId, Long userId) {
        logger.info("Admin removing student user ID: {} from group ID: {}", userId, groupId);
        GroupStudent member = groupStudentRepository.findByGroupIdAndStudentId(groupId, userId)
                .orElseThrow(() -> new CustomException("Student not a member of this group", HttpStatus.NOT_FOUND));
        
        groupStudentRepository.delete(member);
    }

    @Override
    public Group assignFacultyToGroup(Long groupId, Long facultyId) {
        logger.info("Admin assigning faculty user ID: {} to group ID: {}", facultyId, groupId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException("Group not found", HttpStatus.NOT_FOUND));

        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new CustomException("Faculty member not found", HttpStatus.NOT_FOUND));

        if (!faculty.getRole().equals("faculty")) {
            throw new CustomException("User is not a faculty member", HttpStatus.BAD_REQUEST);
        }

        if (!group.getFaculty().contains(faculty)) {
            group.getFaculty().add(faculty);
        }
        return groupRepository.save(group);
    }

    @Override
    public Group removeFacultyFromGroup(Long groupId, Long facultyId) {
        logger.info("Admin removing faculty user ID: {} from group ID: {}", facultyId, groupId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException("Group not found", HttpStatus.NOT_FOUND));

        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new CustomException("Faculty member not found", HttpStatus.NOT_FOUND));

        group.getFaculty().remove(faculty);
        return groupRepository.save(group);
    }

    @Override
    public void broadcastAnnouncement(AnnouncementRequest request) {
        logger.info("Admin broadcasting announcement: \"{}\" to targetRole={}", request.getTitle(), request.getTargetRole());
        List<User> targets;
        if (request.getTargetRole() != null && !request.getTargetRole().isBlank()) {
            targets = userRepository.findAll().stream()
                    .filter(u -> u.getRole().equals(request.getTargetRole().toLowerCase()) && u.isActive())
                    .collect(Collectors.toList());
        } else {
            targets = userRepository.findAll().stream()
                    .filter(User::isActive)
                    .collect(Collectors.toList());
        }

        List<Notification> announcements = targets.stream().map(u -> {
            Notification notif = new Notification();
            notif.setUser(u);
            notif.setTitle(request.getTitle());
            notif.setMessage(request.getMessage());
            notif.setType("announcement");
            notif.setIcon(request.getIcon() != null ? request.getIcon() : "📢");
            return notif;
        }).collect(Collectors.toList());

        notificationRepository.saveAll(announcements);
        logger.info("Broadcast complete. Created notifications for {} active users.", announcements.size());
    }
}
