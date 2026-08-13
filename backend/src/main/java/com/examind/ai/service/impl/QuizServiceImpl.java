package com.examind.ai.service.impl;

import com.examind.ai.dto.request.QuizCreateRequest;
import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.QuizService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.examind.ai.service.EmailService;
import com.examind.ai.util.PdfGeneratorUtil;
import org.springframework.scheduling.annotation.Async;
import java.time.format.DateTimeFormatter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuizServiceImpl implements QuizService {

    private static final Logger logger = LoggerFactory.getLogger(QuizServiceImpl.class);

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final AttemptRepository attemptRepository;
    private final NotificationRepository notificationRepository;
    private final QuizSectionRepository quizSectionRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final EmailService emailService;

    public QuizServiceImpl(QuizRepository quizRepository,
                           QuestionRepository questionRepository,
                           UserRepository userRepository,
                           GroupRepository groupRepository,
                           GroupStudentRepository groupStudentRepository,
                           AttemptRepository attemptRepository,
                           NotificationRepository notificationRepository,
                           QuizSectionRepository quizSectionRepository,
                           UserPreferencesRepository userPreferencesRepository,
                           EmailService emailService) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupStudentRepository = groupStudentRepository;
        this.attemptRepository = attemptRepository;
        this.notificationRepository = notificationRepository;
        this.quizSectionRepository = quizSectionRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.emailService = emailService;
    }

    @Override
    public com.examind.ai.entity.QuizSection getSection(Long id) {
        return quizSectionRepository.findById(id).orElse(null);
    }

    @Override
    public Page<Quiz> getQuizzes(User user, String subject, String difficulty, String search, int page, int limit) {
        logger.info("Loading quizzes for user: {}, role: {}", user.getEmail(), user.getRole());
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());

        if (user.getRole().equals("student")) {
            // Find active groups for student
            List<Group> activeGroups = groupRepository.findActiveGroupsForStudent(user.getId(), "active");
            List<Long> activeGroupIds = activeGroups.stream().map(Group::getId).collect(Collectors.toList());

            // Student query: published + active + targetGroup null OR in student active groups
            Page<Quiz> quizzes = quizRepository.findPublishedAndSearch(search, pageable);
            
            // Filter list in-memory or by custom query
            List<Quiz> filteredList = quizzes.getContent().stream().filter(q -> {
                if (q.getTargetGroup() == null) return true;
                return activeGroupIds.contains(q.getTargetGroup().getId());
            }).filter(q -> {
                if (subject != null && !subject.isBlank()) {
                    return q.getSubject().equalsIgnoreCase(subject);
                }
                return true;
            }).filter(q -> {
                if (difficulty != null && !difficulty.isBlank()) {
                    return q.getDifficulty().equalsIgnoreCase(difficulty);
                }
                return true;
            }).collect(Collectors.toList());

            return new PageImpl<>(filteredList, pageable, quizzes.getTotalElements());
        } else {
            // Faculty or Admin
            Page<Quiz> quizzes;
            if (user.getRole().equals("faculty")) {
                quizzes = quizRepository.findByCreatedByAndSearch(user.getId(), search, pageable);
            } else {
                quizzes = quizRepository.findAllAndSearch(search, pageable);
            }

            List<Quiz> filteredList = quizzes.getContent().stream().filter(q -> {
                if (subject != null && !subject.isBlank()) {
                    return q.getSubject().equalsIgnoreCase(subject);
                }
                return true;
            }).filter(q -> {
                if (difficulty != null && !difficulty.isBlank()) {
                    return q.getDifficulty().equalsIgnoreCase(difficulty);
                }
                return true;
            }).collect(Collectors.toList());

            return new PageImpl<>(filteredList, pageable, quizzes.getTotalElements());
        }
    }

    @Override
    public Quiz getQuiz(Long id, User user) {
        logger.info("Loading quiz ID: {} for user: {}", id, user.getEmail());
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (user.getRole().equals("student")) {
            if (!quiz.isPublished()) {
                throw new CustomException("Quiz not available", HttpStatus.FORBIDDEN);
            }
            if (quiz.getTargetGroup() != null) {
                Long groupId = quiz.getTargetGroup().getId();
                GroupStudent member = groupStudentRepository.findByGroupIdAndStudentId(groupId, user.getId())
                        .orElseThrow(() -> new CustomException("This quiz is restricted to a specific group", HttpStatus.FORBIDDEN));
                if (!member.getStatus().equals("active")) {
                    throw new CustomException("This quiz is restricted to a specific group", HttpStatus.FORBIDDEN);
                }
            }
        }
        return quiz;
    }

    @Override
    public Quiz createQuiz(QuizCreateRequest request, User user) {
        logger.info("User: {} creating new quiz", user.getEmail());
        Quiz quiz = new Quiz();
        mapRequestToQuiz(request, quiz);
        quiz.setCreatedBy(user);
        return quizRepository.save(quiz);
    }

    @Override
    public Quiz updateQuiz(Long id, QuizCreateRequest request, User user) {
        logger.info("User: {} updating quiz ID: {}", user.getEmail(), id);
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized edit access to this quiz", HttpStatus.FORBIDDEN);
        }

        mapRequestToQuiz(request, quiz);
        return quizRepository.save(quiz);
    }

    @Override
    public void deleteQuiz(Long id, User user) {
        logger.info("User: {} deleting quiz ID: {}", user.getEmail(), id);
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized delete access to this quiz", HttpStatus.FORBIDDEN);
        }

        quizRepository.delete(quiz);
    }

    @Override
    public Quiz togglePublishQuiz(Long id, User user) {
        logger.info("User: {} toggling publish state for quiz ID: {}", user.getEmail(), id);
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized publish access to this quiz", HttpStatus.FORBIDDEN);
        }

        if (!quiz.isPublished() && quiz.getQuestions().isEmpty()) {
            throw new CustomException("Add at least one question before publishing", HttpStatus.BAD_REQUEST);
        }

        quiz.setPublished(!quiz.isPublished());
        Quiz savedQuiz = quizRepository.save(quiz);

        if (savedQuiz.isPublished()) {
            logger.info("Quiz published. Broadcasting notifications to students.");
            List<User> students = new ArrayList<>();
            if (savedQuiz.getTargetGroup() != null) {
                Group group = savedQuiz.getTargetGroup();
                students = group.getStudents().stream()
                        .filter(s -> s.getStatus().equals("active") && s.getStudent() != null)
                        .map(GroupStudent::getStudent)
                        .collect(Collectors.toList());
            } else {
                students = userRepository.findAll().stream()
                        .filter(u -> u.getRole().equals("student") && u.isActive())
                        .limit(500)
                        .collect(Collectors.toList());
            }

            List<Notification> notifications = students.stream().map(s -> {
                Notification notif = new Notification();
                notif.setUser(s);
                notif.setTitle("New Quiz Available! 📝");
                notif.setMessage("\"" + savedQuiz.getTitle() + "\" (" + savedQuiz.getSubject() + ") has been published. Go take it now!");
                notif.setType("quiz_published");
                notif.setIcon("📝");
                return notif;
            }).collect(Collectors.toList());

            notificationRepository.saveAll(notifications);
        }

        return savedQuiz;
    }

    @Override
    public Map<String, Object> getQuizResults(Long id, User user) {
        logger.info("Fetching results details for quiz ID: {}", id);
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized results access", HttpStatus.FORBIDDEN);
        }

        List<Attempt> attempts = attemptRepository.findQuizLeaderboard(id, List.of("completed", "timed_out", "disqualified"));
        
        List<Map<String, Object>> attemptsList = attempts.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("_id", a.getId());
            map.put("obtainedMarks", a.getObtainedMarks());
            map.put("percentage", a.getPercentage());
            map.put("isPassed", a.isPassed());
            map.put("timeTaken", a.getTimeTaken());
            map.put("createdAt", a.getCreatedAt());
            map.put("status", a.getStatus());
            map.put("warningCount", a.getWarningCount());
            map.put("isDisqualified", a.isDisqualified());
            map.put("disqualificationReason", a.getDisqualificationReason());
            map.put("rating", a.getRating());
            map.put("feedbackComment", a.getFeedbackComment());
            map.put("proctoringVideoUrl", a.getProctoringVideoUrl());
            map.put("totalMarks", a.getTotalMarks());
            map.put("rank", a.getRankPosition());
            
            if (a.getStudent() != null) {
                map.put("student", Map.of(
                    "_id", a.getStudent().getId(),
                    "name", a.getStudent().getName(),
                    "email", a.getStudent().getEmail(),
                    "studentId", a.getStudent().getStudentId(),
                    "department", a.getStudent().getDepartment()
                ));
            }
            return map;
        }).collect(Collectors.toList());

        int total = attempts.size();
        long passed = attempts.stream().filter(Attempt::isPassed).count();
        double avgScore = 0.0;
        double highest = 0.0;
        double lowest = 0.0;

        if (total > 0) {
            avgScore = attempts.stream().mapToDouble(Attempt::getPercentage).average().orElse(0.0);
            highest = attempts.stream().mapToDouble(Attempt::getPercentage).max().orElse(0.0);
            lowest = attempts.stream().mapToDouble(Attempt::getPercentage).min().orElse(0.0);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAttempts", total);
        stats.put("passCount", passed);
        stats.put("failCount", total - passed);
        stats.put("averageScore", String.format("%.2f", avgScore));
        stats.put("highestScore", String.format("%.1f", highest));
        stats.put("lowestScore", String.format("%.1f", lowest));

        return Map.of("data", attemptsList, "stats", stats);
    }

    @Override
    public List<QuizSection> getSections(Long quizId, User user) {
        getQuiz(quizId, user);
        return quizSectionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
    }

    @Override
    public QuizSection createSection(Long quizId, Map<String, Object> payload, User user) {
        Quiz quiz = getQuiz(quizId, user);
        String title = (String) payload.get("title");
        if (title == null || title.isBlank()) {
            throw new CustomException("Section title is required", HttpStatus.BAD_REQUEST);
        }
        QuizSection section = new QuizSection();
        section.setQuiz(quiz);
        section.setTitle(title);
        if (payload.containsKey("duration")) {
            section.setDuration(((Number) payload.get("duration")).intValue());
        }
        if (payload.containsKey("orderIndex")) {
            section.setOrderIndex(((Number) payload.get("orderIndex")).intValue());
        } else {
            section.setOrderIndex(quizSectionRepository.findByQuizIdOrderByOrderIndexAsc(quizId).size());
        }
        return quizSectionRepository.save(section);
    }

    @Override
    public void deleteSection(Long quizId, Long sectionId, User user) {
        getQuiz(quizId, user);
        QuizSection section = quizSectionRepository.findById(sectionId)
                .orElseThrow(() -> new CustomException("Section not found", HttpStatus.NOT_FOUND));
        if (!section.getQuiz().getId().equals(quizId)) {
            throw new CustomException("Section does not belong to this quiz", HttpStatus.BAD_REQUEST);
        }
        quizSectionRepository.delete(section);
    }

    @Override
    public Question addQuestion(Long quizId, Question question, User user) {
        logger.info("Adding question to quiz ID: {}", quizId);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized edit access to this quiz", HttpStatus.FORBIDDEN);
        }

        question.setQuiz(quiz);
        question.setCreatedBy(user);
        for (QuestionOption opt : question.getOptions()) {
            opt.setQuestion(question);
        }

        Question saved = questionRepository.save(question);
        
        // Update quiz total marks
        recalculateQuizMarks(quiz);
        
        return saved;
    }

    @Override
    public void deleteQuestion(Long questionId, User user) {
        logger.info("Deleting question ID: {}", questionId);
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new CustomException("Question not found", HttpStatus.NOT_FOUND));

        Quiz quiz = question.getQuiz();
        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized edit access to this quiz", HttpStatus.FORBIDDEN);
        }

        if (quiz.getQuestions() != null) {
            quiz.getQuestions().remove(question);
        }
        questionRepository.delete(question);
        
        // Recalculate marks
        recalculateQuizMarks(quiz);
    }

    @Override
    public List<Question> getQuizQuestions(Long quizId, User user) {
        logger.info("Loading questions for quiz ID: {}", quizId);
        // Security checks
        getQuiz(quizId, user);
        return questionRepository.findByQuizIdOrderByOrderAsc(quizId);
    }

    @Override
    public ByteArrayOutputStream generateExcelTemplate() {
        logger.info("Generating Excel template file stream");
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Questions");

            // Define style for headers
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Add Header Row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                    "Question", "Option A", "Option B", "Option C", "Option D",
                    "Correct Answer", "Explanation", "Marks", "Difficulty"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Add sample data
            Object[][] samples = {
                    {"What is 2 + 2?", "3", "4", "5", "6", "B", "Basic arithmetic: 2+2=4", 1, "easy"},
                    {"Capital of France?", "London", "Berlin", "Paris", "Rome", "C", "Paris is the capital of France", 1, "easy"},
                    {"Which is a prime number?", "4", "6", "7", "9", "C", "7 is divisible only by 1 and itself", 2, "medium"},
                    {"O(log n) is the complexity of?", "Linear Search", "Bubble Sort", "Binary Search", "Merge Sort", "C", "Binary search halves the search space each step", 2, "medium"},
                    {"What does CPU stand for?", "Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit", "A", "CPU stands for Central Processing Unit", 1, "easy"}
            };

            for (int r = 0; r < samples.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < samples[r].length; c++) {
                    Cell cell = row.createCell(c);
                    Object val = samples[r][c];
                    if (val instanceof Number) {
                        cell.setCellValue(((Number) val).doubleValue());
                    } else {
                        cell.setCellValue((String) val);
                    }
                }
            }

            // Resize columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream;
        } catch (IOException ex) {
            throw new CustomException("Failed to generate Excel template: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Map<String, Object> importQuestionsFromExcel(Long quizId, MultipartFile file, User user) {
        logger.info("Importing questions from Excel file to quiz ID: {}", quizId);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized edit access to this quiz", HttpStatus.FORBIDDEN);
        }

        List<Question> parsedQuestions = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 2) {
                throw new CustomException("File has no data rows", HttpStatus.BAD_REQUEST);
            }

            Row headerRow = sheet.getRow(0);
            Map<String, Integer> colMap = new HashMap<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell != null) {
                    colMap.put(cell.getStringCellValue().toLowerCase().trim(), c);
                }
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) continue;

                try {
                    String qText = getCellValue(row, colMap, "question");
                    if (qText.isBlank()) qText = getCellValue(row, colMap, "text");
                    if (qText.isBlank()) {
                        errors.add("Row " + (r + 1) + ": Question text is missing");
                        continue;
                    }

                    String optA = getCellValue(row, colMap, "option a");
                    String optB = getCellValue(row, colMap, "option b");
                    String optC = getCellValue(row, colMap, "option c");
                    String optD = getCellValue(row, colMap, "option d");

                    if (optA.isBlank() || optB.isBlank()) {
                        errors.add("Row " + (r + 1) + ": Options A and B are required");
                        continue;
                    }

                    String correctStr = getCellValue(row, colMap, "correct answer");
                    if (correctStr.isBlank()) correctStr = getCellValue(row, colMap, "correct");
                    String cleanCorrect = correctStr.toLowerCase().trim();

                    int correctIdx = -1;
                    if (cleanCorrect.equals("a") || cleanCorrect.equals("option a") || cleanCorrect.equals("1")) correctIdx = 0;
                    else if (cleanCorrect.equals("b") || cleanCorrect.equals("option b") || cleanCorrect.equals("2")) correctIdx = 1;
                    else if (cleanCorrect.equals("c") || cleanCorrect.equals("option c") || cleanCorrect.equals("3")) correctIdx = 2;
                    else if (cleanCorrect.equals("d") || cleanCorrect.equals("option d") || cleanCorrect.equals("4")) correctIdx = 3;

                    if (correctIdx == -1) {
                        if (cleanCorrect.equalsIgnoreCase(optA.trim())) correctIdx = 0;
                        else if (cleanCorrect.equalsIgnoreCase(optB.trim())) correctIdx = 1;
                        else if (cleanCorrect.equalsIgnoreCase(optC.trim())) correctIdx = 2;
                        else if (cleanCorrect.equalsIgnoreCase(optD.trim())) correctIdx = 3;
                    }

                    List<QuestionOption> options = new ArrayList<>();
                    Question q = new Question();
                    q.setQuiz(quiz);
                    q.setText(qText);
                    q.setType("mcq");
                    q.setCreatedBy(user);
                    q.setExplanation(getCellValue(row, colMap, "explanation"));

                    double marksVal = 1.0;
                    String marksStr = getCellValue(row, colMap, "marks");
                    if (!marksStr.isBlank()) {
                        try {
                            marksVal = Double.parseDouble(marksStr);
                        } catch (NumberFormatException ignored) {}
                    }
                    q.setMarks(marksVal);

                    String diff = getCellValue(row, colMap, "difficulty").toLowerCase();
                    q.setDifficulty(List.of("easy", "medium", "hard").contains(diff) ? diff : "medium");

                    options.add(new QuestionOption(null, q, optA, correctIdx == 0));
                    options.add(new QuestionOption(null, q, optB, correctIdx == 1));
                    if (!optC.isBlank()) options.add(new QuestionOption(null, q, optC, correctIdx == 2));
                    if (!optD.isBlank()) options.add(new QuestionOption(null, q, optD, correctIdx == 3));

                    if (correctIdx == -1 || correctIdx >= options.size()) {
                        options.get(0).setCorrect(true);
                        errors.add("Row " + (r + 1) + ": Could not parse correct answer \"" + correctStr + "\", defaulting to Option A");
                    }

                    q.setOptions(options);
                    parsedQuestions.add(q);
                } catch (Exception ex) {
                    errors.add("Row " + (r + 1) + ": " + ex.getMessage());
                }
            }

            if (!parsedQuestions.isEmpty()) {
                questionRepository.saveAll(parsedQuestions);
                recalculateQuizMarks(quiz);
            }

        } catch (IOException ex) {
            throw new CustomException("Failed to read Excel file: " + ex.getMessage(), HttpStatus.BAD_REQUEST);
        }

        return Map.of("importedCount", parsedQuestions.size(), "errors", errors);
    }

    private void mapRequestToQuiz(QuizCreateRequest request, Quiz quiz) {
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setSubject(request.getSubject());
        quiz.setCategory(request.getCategory());
        quiz.setDifficulty(request.getDifficulty());
        quiz.setDuration(request.getDuration());
        quiz.setStartDate(request.getStartDate());
        quiz.setEndDate(request.getEndDate());
        quiz.setAccessCode(request.getAccessCode());
        quiz.setMaxAttempts(request.getMaxAttempts());
        quiz.setShuffleQuestions(request.isShuffleQuestions());
        quiz.setShuffleOptions(request.isShuffleOptions());
        quiz.setShowResults(request.isShowResults());
        quiz.setShowAnswersAfter(request.isShowAnswersAfter());
        quiz.setInstructions(request.getInstructions());
        quiz.setPreventTabSwitch(request.isPreventTabSwitch());
        quiz.setPreventCopyPaste(request.isPreventCopyPaste());
        quiz.setPreventRightClick(request.isPreventRightClick());
        quiz.setFullscreenRequired(request.isFullscreenRequired());
        quiz.setMaxWarnings(request.getMaxWarnings());
        quiz.setCertificateEnabled(request.isCertificateEnabled());
        quiz.setCertificateMinScore(request.getCertificateMinScore());
        quiz.setLeaderboardEnabled(request.isLeaderboardEnabled());
        quiz.setFeedbackEnabled(request.isFeedbackEnabled());
        quiz.setPointsOnPass(request.getPointsOnPass());

        if (request.getTags() != null) {
            quiz.setTags(request.getTags());
        }

        if (request.getTargetGroupId() != null) {
            Group group = groupRepository.findById(request.getTargetGroupId())
                    .orElseThrow(() -> new CustomException("Target Group not found", HttpStatus.BAD_REQUEST));
            quiz.setTargetGroup(group);
        } else {
            quiz.setTargetGroup(null);
        }
    }

    private void recalculateQuizMarks(Quiz quiz) {
        List<Question> questions = questionRepository.findByQuizIdOrderByOrderAsc(quiz.getId());
        double total = questions.stream().mapToDouble(Question::getMarks).sum();
        quiz.setTotalMarks((int) Math.round(total));
        
        // Pass score is 40% of total marks by default if not set
        if (quiz.getPassingMarks() == 0 || quiz.getPassingMarks() > quiz.getTotalMarks()) {
            quiz.setPassingMarks((int) Math.round(total * 0.4));
        }
        quizRepository.save(quiz);
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    private String getCellValue(Row row, Map<String, Integer> colMap, String columnName) {
        Integer colIdx = null;
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().contains(columnName)) {
                colIdx = entry.getValue();
                break;
            }
        }
        if (colIdx == null) return "";

        Cell cell = row.getCell(colIdx);
        if (cell == null) return "";

        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((int) cell.getNumericCellValue());
        } else if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        } else {
            return cell.getStringCellValue().trim();
        }
    }

    @Override
    public Quiz cloneQuiz(Long id, User user) {
        logger.info("Cloning quiz ID: {}", id);
        Quiz original = quizRepository.findById(id)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !original.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized access to clone this quiz", HttpStatus.FORBIDDEN);
        }

        Quiz clone = new Quiz();
        clone.setTitle(original.getTitle() + " (Copy)");
        clone.setDescription(original.getDescription());
        clone.setSubject(original.getSubject());
        clone.setCategory(original.getCategory());
        clone.setDifficulty(original.getDifficulty());
        clone.setCreatedBy(user);
        clone.setDuration(original.getDuration());
        clone.setStartDate(original.getStartDate());
        clone.setEndDate(original.getEndDate());
        clone.setTotalMarks(original.getTotalMarks());
        clone.setPassingMarks(original.getPassingMarks());
        clone.setPublished(false); // Clone defaults to unpublished draft
        clone.setActive(true);
        clone.setAccessCode(original.getAccessCode());
        clone.setMaxAttempts(original.getMaxAttempts());
        clone.setShuffleQuestions(original.isShuffleQuestions());
        clone.setShuffleOptions(original.isShuffleOptions());
        clone.setShowResults(original.isShowResults());
        clone.setShowAnswersAfter(original.isShowAnswersAfter());
        clone.setInstructions(original.getInstructions());
        clone.setPreventTabSwitch(original.isPreventTabSwitch());
        clone.setPreventCopyPaste(original.isPreventCopyPaste());
        clone.setPreventRightClick(original.isPreventRightClick());
        clone.setFullscreenRequired(original.isFullscreenRequired());
        clone.setMaxWarnings(original.getMaxWarnings());
        clone.setCertificateEnabled(original.isCertificateEnabled());
        clone.setCertificateMinScore(original.getCertificateMinScore());
        clone.setLeaderboardEnabled(original.isLeaderboardEnabled());
        clone.setFeedbackEnabled(original.isFeedbackEnabled());
        clone.setPointsOnPass(original.getPointsOnPass());
        clone.setTags(new ArrayList<>(original.getTags()));
        clone.setTargetGroup(original.getTargetGroup());
        clone.setPublishAt(original.getPublishAt());
        clone.setRandomizeCount(original.getRandomizeCount());
        clone.setExamMode(original.isExamMode());

        Quiz savedClone = quizRepository.save(clone);

        // Copy sections first
        Map<Long, QuizSection> sectionMap = new HashMap<>();
        for (QuizSection sec : original.getSections()) {
            QuizSection secClone = new QuizSection();
            secClone.setQuiz(savedClone);
            secClone.setTitle(sec.getTitle());
            secClone.setDuration(sec.getDuration());
            secClone.setOrderIndex(sec.getOrderIndex());
            QuizSection savedSecClone = quizSectionRepository.save(secClone);
            sectionMap.put(sec.getId(), savedSecClone);
        }

        // Copy questions
        List<Question> origQuestions = questionRepository.findByQuizIdOrderByOrderAsc(id);
        for (Question q : origQuestions) {
            Question qClone = new Question();
            qClone.setQuiz(savedClone);
            qClone.setText(q.getText());
            qClone.setType(q.getType());
            qClone.setExplanation(q.getExplanation());
            qClone.setHint(q.getHint());
            qClone.setMarks(q.getMarks());
            qClone.setNegativeMark(q.getNegativeMark());
            qClone.setDifficulty(q.getDifficulty());
            qClone.setTags(new ArrayList<>(q.getTags()));
            qClone.setCreatedBy(user);
            qClone.setAIGenerated(q.isAIGenerated());
            qClone.setOrder(q.getOrder());
            qClone.setImageUrl(q.getImageUrl());
            
            if (q.getSection() != null) {
                qClone.setSection(sectionMap.get(q.getSection().getId()));
            }

            List<QuestionOption> optionsClone = new ArrayList<>();
            for (QuestionOption opt : q.getOptions()) {
                QuestionOption optClone = new QuestionOption();
                optClone.setQuestion(qClone);
                optClone.setText(opt.getText());
                optClone.setCorrect(opt.isCorrect());
                optionsClone.add(optClone);
            }
            qClone.setOptions(optionsClone);

            Question savedQ = questionRepository.save(qClone);
            savedClone.getQuestions().add(savedQ);
        }

        logger.info("Successfully cloned quiz: '{}' (ID: {})", savedClone.getTitle(), savedClone.getId());
        return savedClone;
    }

    @Override
    public Map<String, Object> importQuestionsFromWord(Long quizId, MultipartFile file, User user) {
        logger.info("Importing questions from Word (.docx) file for quiz ID: {}", quizId);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized edit access to this quiz", HttpStatus.FORBIDDEN);
        }

        List<Question> parsedQuestions = new ArrayList<>();
        int importedCount = 0;
        int errorCount = 0;
        List<String> errors = new ArrayList<>();

        try (java.io.InputStream is = file.getInputStream();
             org.apache.poi.xwpf.usermodel.XWPFDocument doc = new org.apache.poi.xwpf.usermodel.XWPFDocument(is)) {
            
            List<org.apache.poi.xwpf.usermodel.XWPFTable> tables = doc.getTables();
            if (tables.isEmpty()) {
                throw new CustomException("No tables found in the Word document. Please use the standardized template table.", HttpStatus.BAD_REQUEST);
            }

            org.apache.poi.xwpf.usermodel.XWPFTable table = tables.get(0);
            List<org.apache.poi.xwpf.usermodel.XWPFTableRow> rows = table.getRows();
            
            if (rows.size() < 2) {
                throw new CustomException("Document table must contain at least a header and one question row.", HttpStatus.BAD_REQUEST);
            }

            // Header mapping
            org.apache.poi.xwpf.usermodel.XWPFTableRow headerRow = rows.get(0);
            Map<String, Integer> colMap = new HashMap<>();
            List<org.apache.poi.xwpf.usermodel.XWPFTableCell> headerCells = headerRow.getTableCells();
            for (int i = 0; i < headerCells.size(); i++) {
                colMap.put(headerCells.get(i).getText().trim().toLowerCase(), i);
            }

            if (!colMap.containsKey("question") || !colMap.containsKey("correct option")) {
                throw new CustomException("Invalid document template. Required columns: 'Question', 'Correct Option'.", HttpStatus.BAD_REQUEST);
            }

            for (int rIdx = 1; rIdx < rows.size(); rIdx++) {
                org.apache.poi.xwpf.usermodel.XWPFTableRow row = rows.get(rIdx);
                List<org.apache.poi.xwpf.usermodel.XWPFTableCell> cells = row.getTableCells();
                
                try {
                    String qText = getCellVal(cells, colMap, "question");
                    if (qText.isEmpty()) continue;

                    String correctOptText = getCellVal(cells, colMap, "correct option").toUpperCase();
                    if (correctOptText.isEmpty()) {
                        errors.add("Row " + (rIdx + 1) + ": Correct Option cell is empty");
                        errorCount++;
                        continue;
                    }

                    Question question = new Question();
                    question.setQuiz(quiz);
                    question.setText(qText);
                    question.setCreatedBy(user);
                    question.setType("mcq"); // Default type

                    String exp = getCellVal(cells, colMap, "explanation");
                    question.setExplanation(exp);

                    String hint = getCellVal(cells, colMap, "hint");
                    question.setHint(hint);

                    String marksStr = getCellVal(cells, colMap, "marks");
                    double marks = 1.0;
                    if (!marksStr.isEmpty()) {
                        try { marks = Double.parseDouble(marksStr); } catch (NumberFormatException ignored) {}
                    }
                    question.setMarks(marks);

                    String negMarksStr = getCellVal(cells, colMap, "negative");
                    double negMarks = 0.0;
                    if (!negMarksStr.isEmpty()) {
                        try { negMarks = Double.parseDouble(negMarksStr); } catch (NumberFormatException ignored) {}
                    }
                    question.setNegativeMark(negMarks);

                    String diff = getCellVal(cells, colMap, "difficulty").toLowerCase();
                    if (List.of("easy", "medium", "hard").contains(diff)) {
                        question.setDifficulty(diff);
                    }

                    List<QuestionOption> options = new ArrayList<>();
                    char optChar = 'A';
                    for (int o = 0; o < 6; o++) {
                        String optColName = "option " + optChar;
                        String optText = getCellVal(cells, colMap, optColName);
                        if (!optText.isEmpty()) {
                            QuestionOption option = new QuestionOption();
                            option.setQuestion(question);
                            option.setText(optText);
                            boolean isCorrect = correctOptText.contains(String.valueOf(optChar));
                            option.setCorrect(isCorrect);
                            options.add(option);
                        }
                        optChar++;
                    }

                    if (options.isEmpty()) {
                        errors.add("Row " + (rIdx + 1) + ": No options defined");
                        errorCount++;
                        continue;
                    }

                    question.setOptions(options);
                    Question saved = questionRepository.save(question);
                    parsedQuestions.add(saved);
                    importedCount++;

                } catch (Exception e) {
                    errors.add("Row " + (rIdx + 1) + ": " + e.getMessage());
                    errorCount++;
                }
            }

            if (importedCount > 0) {
                recalculateQuizMarks(quiz);
            }

        } catch (Exception e) {
            logger.error("Word import failed: {}", e.getMessage());
            throw new CustomException("Word document parsing failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        return Map.of(
            "success", true,
            "importedCount", importedCount,
            "errorCount", errorCount,
            "errors", errors
        );
    }

    private String getCellVal(List<org.apache.poi.xwpf.usermodel.XWPFTableCell> cells, Map<String, Integer> colMap, String columnName) {
        Integer colIdx = null;
        for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
            if (entry.getKey().contains(columnName)) {
                colIdx = entry.getValue();
                break;
            }
        }
        if (colIdx == null || colIdx >= cells.size()) return "";
        return cells.get(colIdx).getText().trim();
    }

    @Override
    @Async
    @Transactional
    public void emailQuizResults(Long quizId, boolean includeReport, boolean includeCertificate, User user) {
        logger.info("Asynchronously emailing results for quiz ID: {} requested by user: {}", quizId, user.getEmail());
        
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized results access", HttpStatus.FORBIDDEN);
        }

        List<Attempt> rawAttempts = attemptRepository.findQuizLeaderboard(quizId, List.of("completed", "timed_out"));
        
        // Filter attempts to only include the best attempt (highest percentage score) per student
        List<Attempt> attempts = new ArrayList<>(rawAttempts.stream()
                .filter(a -> a.getStudent() != null)
                .collect(Collectors.toMap(
                        a -> a.getStudent().getId(),
                        a -> a,
                        (existing, replacement) -> existing.getPercentage() >= replacement.getPercentage() ? existing : replacement
                ))
                .values());
        
        // Eagerly load the lazy collections in transactional context
        for (Attempt attempt : attempts) {
            if (attempt.getAnswers() != null) {
                attempt.getAnswers().size();
                for (AttemptAnswer ans : attempt.getAnswers()) {
                    if (ans.getQuestion() != null) {
                        ans.getQuestion().getOptions().size();
                    }
                }
            }
        }
        
        for (Attempt attempt : attempts) {
            User student = attempt.getStudent();
            if (student == null || student.getEmail() == null || student.getEmail().isBlank()) {
                continue;
            }

            boolean emailEnabled = userPreferencesRepository.findByUserId(student.getId())
                    .map(UserPreferences::isEmailNotifications)
                    .orElse(true);
            if (!emailEnabled) {
                logger.info("Skipping email results for student {} because email notifications are disabled.", student.getEmail());
                continue;
            }

            try {
                byte[] reportBytes = null;
                String reportName = null;
                if (includeReport) {
                    reportBytes = PdfGeneratorUtil.generatePerformanceReport(attempt);
                    reportName = "Quiz_Report_" + student.getName().replace(" ", "_") + ".pdf";
                }

                byte[] certBytes = null;
                String certName = null;
                if (includeCertificate && attempt.isPassed()) {
                    if (attempt.getCertificateId() == null || attempt.getCertificateId().isBlank()) {
                        attempt.setCertificateId(UUID.randomUUID().toString());
                        attempt.setCertificateIssued(true);
                        attempt = attemptRepository.save(attempt);
                    }
                    certBytes = PdfGeneratorUtil.generateCertificate(attempt);
                    certName = "Certificate.pdf";
                }

                String subject = "ExamindAI Result & Certificate: " + quiz.getTitle() + " - " + student.getName();
                
                String dateStr = attempt.getEndTime() != null ? 
                    attempt.getEndTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : 
                    "N/A";
                
                String pctStr = String.format("%.1f", attempt.getPercentage());
                String statusText = attempt.isPassed() ? "PASSED" : "FAILED";
                String statusColor = attempt.isPassed() ? "#10b981" : "#ef4444";
                String statusBadgeBg = attempt.isPassed() ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)";

                String bodyHtml = "<!DOCTYPE html>\n" +
                        "<html>\n" +
                        "<head>\n" +
                        "  <style>\n" +
                        "    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }\n" +
                        "    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }\n" +
                        "    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 28px; text-align: center; color: #ffffff; }\n" +
                        "    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }\n" +
                        "    .content { padding: 32px; }\n" +
                        "    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }\n" +
                        "    .desc { font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px; }\n" +
                        "    .summary-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }\n" +
                        "    .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #7c3aed; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 12px; }\n" +
                        "    .score-value { font-size: 28px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }\n" +
                        "    .pct-value { font-size: 15px; font-weight: 700; color: " + statusColor + "; margin-bottom: 8px; }\n" +
                        "    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background-color: " + statusBadgeBg + "; color: " + statusColor + "; border: 1px solid " + statusColor + "1a; }\n" +
                        "    .grid-table { width: 100%; border-collapse: collapse; margin-top: 15px; }\n" +
                        "    .grid-table td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }\n" +
                        "    .grid-label { color: #475569; }\n" +
                        "    .grid-val { font-weight: 700; color: #0f172a; text-align: right; }\n" +
                        "    .attachments-section { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }\n" +
                        "    .attachments-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }\n" +
                        "    .attachments-list { margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6; }\n" +
                        "    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }\n" +
                        "  </style>\n" +
                        "</head>\n" +
                        "<body>\n" +
                        "  <div class='container'>\n" +
                        "    <div class='header'>\n" +
                        "      <h1>Examind AI &mdash; Quiz Performance Summary</h1>\n" +
                        "    </div>\n" +
                        "    <div class='content'>\n" +
                        "      <h2 class='greeting'>Dear " + student.getName() + ",</h2>\n" +
                        "      <p class='desc'>Congratulations on completing your quiz! Your official results and performance reports have been released by your instructor. Below is a summary of your performance:</p>\n" +
                        "      \n" +
                        "      <div class='summary-card'>\n" +
                        "        <div class='card-title'>Quiz Summary</div>\n" +
                        "        <div align='center'>\n" +
                        "          <div class='score-value'>" + attempt.getObtainedMarks() + " / " + attempt.getTotalMarks() + "</div>\n" +
                        "          <div class='pct-value'>" + pctStr + "%</div>\n" +
                        "          <div class='status-badge'>" + statusText + "</div>\n" +
                        "        </div>\n" +
                        "        \n" +
                        "        <table class='grid-table'>\n" +
                        "          <tr>\n" +
                        "            <td class='grid-label'>Quiz Name</td>\n" +
                        "            <td class='grid-val'>" + quiz.getTitle() + "</td>\n" +
                        "          </tr>\n" +
                        "          <tr>\n" +
                        "            <td class='grid-label'>Completion Date</td>\n" +
                        "            <td class='grid-val'>" + dateStr + "</td>\n" +
                        "          </tr>\n" +
                        "        </table>\n" +
                        "      </div>\n";

                if (includeReport || (includeCertificate && attempt.isPassed())) {
                    bodyHtml += "      <div class='attachments-section'>\n" +
                            "        <h3 class='attachments-title'>Attachments Included:</h3>\n" +
                            "        <ol class='attachments-list'>\n";
                    if (includeReport) {
                        bodyHtml += "          <li><strong>Detailed Performance Report (.pdf)</strong> &mdash; Complete question-wise breakdown and analytics.</li>\n";
                    }
                    if (includeCertificate && attempt.isPassed()) {
                        bodyHtml += "          <li><strong>Certificate of Achievement (.pdf)</strong> &mdash; Official completion certificate.</li>\n";
                    }
                    bodyHtml += "        </ol>\n" +
                            "      </div>\n";
                }

                bodyHtml += "      <p class='desc' style='margin-top: 24px; margin-bottom: 0;'>Keep up the good work!</p>\n" +
                        "      <p class='desc' style='margin-top: 8px; margin-bottom: 0;'>Best regards,<br/><strong>" + user.getName() + "</strong> / ExamindAI Team</p>\n" +
                        "    </div>\n" +
                        "    <div class='footer'>\n" +
                        "      <p>&copy; 2026 Examind AI. Smart Exams. Smarter Results.</p>\n" +
                        "    </div>\n" +
                        "  </div>\n" +
                        "</body>\n" +
                        "</html>";

                emailService.sendEmailWithAttachments(
                    student.getEmail(),
                    subject,
                    bodyHtml,
                    reportName,
                    reportBytes,
                    certName,
                    certBytes
                );

            } catch (Exception e) {
                logger.error("Failed to compile or email results for student: {}, error: {}", student.getEmail(), e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public Map<String, Object> emailQuizResultsSync(Long quizId, User user) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new CustomException("Quiz not found", HttpStatus.NOT_FOUND));

        if (!user.getRole().equals("admin") && !quiz.getCreatedBy().getId().equals(user.getId())) {
            throw new CustomException("Unauthorized results access", HttpStatus.FORBIDDEN);
        }

        List<Attempt> attempts = attemptRepository.findCompletedByQuizId(quizId);

        if (attempts.isEmpty()) {
            return Map.of("success", true, "message", "No completed attempts found for this quiz.", "sentCount", 0, "failCount", 0);
        }

        Map<Long, Attempt> bestByStudent = new LinkedHashMap<>();
        for (Attempt a : attempts) {
            Long studentId = a.getStudent().getId();
            if (!bestByStudent.containsKey(studentId) ||
                    a.getPercentage() > bestByStudent.get(studentId).getPercentage()) {
                bestByStudent.put(studentId, a);
            }
        }

        // Eagerly load the lazy collections in transactional context
        for (Attempt attempt : bestByStudent.values()) {
            if (attempt.getAnswers() != null) {
                attempt.getAnswers().size();
                for (AttemptAnswer ans : attempt.getAnswers()) {
                    if (ans.getQuestion() != null) {
                        ans.getQuestion().getOptions().size();
                    }
                }
            }
        }

        int sentCount = 0;
        int failCount = 0;
        for (Attempt attempt : bestByStudent.values()) {
            User student = attempt.getStudent();
            if (student == null || student.getEmail() == null || student.getEmail().isBlank()) {
                continue;
            }

            boolean emailEnabled = userPreferencesRepository.findByUserId(student.getId())
                    .map(UserPreferences::isEmailNotifications)
                    .orElse(true);
            if (!emailEnabled) {
                logger.info("Skipping email results for student {} because email notifications are disabled.", student.getEmail());
                continue;
            }

            try {
                byte[] reportBytes = PdfGeneratorUtil.generatePerformanceReport(attempt);
                String reportName = "Quiz_Report_" + student.getName().replace(" ", "_") + ".pdf";

                byte[] certBytes = null;
                String certName = null;
                if (attempt.isPassed()) {
                    if (attempt.getCertificateId() == null || attempt.getCertificateId().isBlank()) {
                        attempt.setCertificateId(UUID.randomUUID().toString());
                        attempt.setCertificateIssued(true);
                        attempt = attemptRepository.save(attempt);
                    }
                    certBytes = PdfGeneratorUtil.generateCertificate(attempt);
                    certName = "Certificate.pdf";
                }

                String subject = "ExamindAI Result & Certificate: " + quiz.getTitle() + " - " + student.getName();
                
                String dateStr = attempt.getEndTime() != null ? 
                    attempt.getEndTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : 
                    "N/A";
                
                String pctStr = String.format("%.1f", attempt.getPercentage());
                String statusText = attempt.isPassed() ? "PASSED" : "FAILED";
                String statusColor = attempt.isPassed() ? "#10b981" : "#ef4444";
                String statusBadgeBg = attempt.isPassed() ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)";

                String bodyHtml = "<!DOCTYPE html>\n" +
                        "<html>\n" +
                        "<head>\n" +
                        "  <style>\n" +
                        "    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }\n" +
                        "    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }\n" +
                        "    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 28px; text-align: center; color: #ffffff; }\n" +
                        "    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }\n" +
                        "    .content { padding: 32px; }\n" +
                        "    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }\n" +
                        "    .desc { font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px; }\n" +
                        "    .summary-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }\n" +
                        "    .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #7c3aed; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 12px; }\n" +
                        "    .score-value { font-size: 28px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }\n" +
                        "    .pct-value { font-size: 15px; font-weight: 700; color: " + statusColor + "; margin-bottom: 8px; }\n" +
                        "    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background-color: " + statusBadgeBg + "; color: " + statusColor + "; border: 1px solid " + statusColor + "1a; }\n" +
                        "    .grid-table { width: 100%; border-collapse: collapse; margin-top: 15px; }\n" +
                        "    .grid-table td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }\n" +
                        "    .grid-label { color: #475569; }\n" +
                        "    .grid-val { font-weight: 700; color: #0f172a; text-align: right; }\n" +
                        "    .attachments-section { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }\n" +
                        "    .attachments-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }\n" +
                        "    .attachments-list { margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6; }\n" +
                        "    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }\n" +
                        "  </style>\n" +
                        "</head>\n" +
                        "<body>\n" +
                        "  <div class='container'>\n" +
                        "    <div class='header'>\n" +
                        "      <h1>Examind AI &mdash; Quiz Performance Summary</h1>\n" +
                        "    </div>\n" +
                        "    <div class='content'>\n" +
                        "      <h2 class='greeting'>Dear " + student.getName() + ",</h2>\n" +
                        "      <p class='desc'>Congratulations on completing your quiz! Your official results and performance reports have been released by your instructor. Below is a summary of your performance:</p>\n" +
                        "      \n" +
                        "      <div class='summary-card'>\n" +
                        "        <div class='card-title'>Quiz Summary</div>\n" +
                        "        <div align='center'>\n" +
                        "          <div class='score-value'>" + attempt.getObtainedMarks() + " / " + attempt.getTotalMarks() + "</div>\n" +
                        "          <div class='pct-value'>" + pctStr + "%</div>\n" +
                        "          <div class='status-badge'>" + statusText + "</div>\n" +
                        "        </div>\n" +
                        "        \n" +
                        "        <table class='grid-table'>\n" +
                        "          <tr>\n" +
                        "            <td class='grid-label'>Quiz Name</td>\n" +
                        "            <td class='grid-val'>" + quiz.getTitle() + "</td>\n" +
                        "          </tr>\n" +
                        "          <tr>\n" +
                        "            <td class='grid-label'>Completion Date</td>\n" +
                        "            <td class='grid-val'>" + dateStr + "</td>\n" +
                        "          </tr>\n" +
                        "        </table>\n" +
                        "      </div>\n" +
                        "      <div class='attachments-section'>\n" +
                        "        <h3 class='attachments-title'>Attachments Included:</h3>\n" +
                        "        <ol class='attachments-list'>\n" +
                        "          <li><strong>Detailed Performance Report (.pdf)</strong> &mdash; Complete question-wise breakdown and analytics.</li>\n";
                if (attempt.isPassed()) {
                    bodyHtml += "          <li><strong>Certificate of Achievement (.pdf)</strong> &mdash; Official completion certificate.</li>\n";
                }
                bodyHtml += "        </ol>\n" +
                        "      </div>\n" +
                        "      <p class='desc' style='margin-top: 24px; margin-bottom: 0;'>Keep up the good work!</p>\n" +
                        "      <p class='desc' style='margin-top: 8px; margin-bottom: 0;'>Best regards,<br/><strong>" + user.getName() + "</strong> / ExamindAI Team</p>\n" +
                        "    </div>\n" +
                        "    <div class='footer'>\n" +
                        "      <p>&copy; 2026 Examind AI. Smart Exams. Smarter Results.</p>\n" +
                        "      <p>Need help? Contact our support team or visit <a href='http://localhost:5173'>Examind AI</a>.</p>\n" +
                        "    </div>\n" +
                        "  </div>\n" +
                        "</body>\n" +
                        "</html>";

                emailService.sendEmailWithAttachments(
                        student.getEmail(),
                        subject,
                        bodyHtml,
                        reportName,
                        reportBytes,
                        certName,
                        certBytes
                );
                sentCount++;
                logger.info("Result email sent with attachments to: {}", student.getEmail());
            } catch (Exception e) {
                failCount++;
                logger.error("Failed to send result email with attachments to {}: {}", student.getEmail(), e.getMessage());
            }
        }

        String message = sentCount > 0
                ? "Results emailed to " + sentCount + " student(s) successfully!" +
                  (failCount > 0 ? " (" + failCount + " failed)" : "")
                : "Failed to send emails. Please check mail configuration.";

        return Map.of(
                "success", sentCount > 0,
                "message", message,
                "sentCount", sentCount,
                "failCount", failCount
        );
    }
}
