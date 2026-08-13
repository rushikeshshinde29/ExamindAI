package com.examind.ai.service.impl;

import com.examind.ai.entity.Attempt;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.AttemptRepository;
import com.examind.ai.service.CertificateService;
import com.examind.ai.util.PdfGeneratorUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CertificateServiceImpl implements CertificateService {

    private static final Logger logger = LoggerFactory.getLogger(CertificateServiceImpl.class);

    private final AttemptRepository attemptRepository;

    public CertificateServiceImpl(AttemptRepository attemptRepository) {
        this.attemptRepository = attemptRepository;
    }

    @Override
    public Map<String, Object> getCertificate(Long attemptId, User currentUser) {
        logger.info("Request to get certificate for attempt ID: {}", attemptId);

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (!currentUser.getRole().equals("admin") && !currentUser.getRole().equals("faculty")
                && !attempt.getStudent().getId().equals(currentUser.getId())) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        if (attempt.getQuiz() == null) {
            throw new CustomException("Quiz not found for this attempt", HttpStatus.BAD_REQUEST);
        }

        if (!attempt.getQuiz().isCertificateEnabled()) {
            throw new CustomException("Certificates not enabled for this quiz", HttpStatus.BAD_REQUEST);
        }

        if (attempt.getPercentage() < attempt.getQuiz().getCertificateMinScore()) {
            throw new CustomException("Minimum " + attempt.getQuiz().getCertificateMinScore() + "% required for certificate", HttpStatus.BAD_REQUEST);
        }

        List<Attempt> allAttempts = attemptRepository.findByStudentIdAndQuizIdAndStatus(attempt.getStudent().getId(), attempt.getQuiz().getId(), "completed");
        double maxPercentage = allAttempts.stream()
                .mapToDouble(Attempt::getPercentage)
                .max()
                .orElse(0.0);
        if (attempt.getPercentage() < maxPercentage) {
            throw new CustomException("This is not your highest scoring attempt. You can only claim a certificate for your best attempt (Score: " + maxPercentage + "%).", HttpStatus.BAD_REQUEST);
        }

        if (attempt.getCertificateId() == null || attempt.getCertificateId().isBlank()) {
            attempt.setCertificateId(UUID.randomUUID().toString());
            attempt.setCertificateIssued(true);
            attempt = attemptRepository.save(attempt);
        }

        return Map.of(
                "certificateId", attempt.getCertificateId(),
                "studentName", attempt.getStudent().getName(),
                "quizTitle", attempt.getQuiz().getTitle(),
                "subject", attempt.getQuiz().getSubject(),
                "score", attempt.getPercentage(),
                "obtainedMarks", attempt.getObtainedMarks(),
                "totalMarks", attempt.getQuiz().getTotalMarks(),
                "issuedAt", attempt.getEndTime() != null ? attempt.getEndTime() : attempt.getUpdatedAt(),
                "department", attempt.getStudent().getDepartment() != null ? attempt.getStudent().getDepartment() : ""
        );
    }

    @Override
    public Map<String, Object> verifyCertificate(String certId) {
        logger.info("Verifying certificate ID: {}", certId);
        Attempt attempt = attemptRepository.findByCertificateId(certId)
                .filter(Attempt::isCertificateIssued)
                .orElseThrow(() -> new CustomException("Invalid certificate", HttpStatus.NOT_FOUND));

        return Map.of(
                "studentName", attempt.getStudent().getName(),
                "quizTitle", attempt.getQuiz().getTitle(),
                "subject", attempt.getQuiz().getSubject(),
                "score", attempt.getPercentage(),
                "obtainedMarks", attempt.getObtainedMarks(),
                "totalMarks", attempt.getQuiz().getTotalMarks(),
                "issuedAt", attempt.getEndTime() != null ? attempt.getEndTime() : attempt.getUpdatedAt()
        );
    }

    @Override
    public byte[] downloadCertificate(Long attemptId, User currentUser) {
        logger.info("Request to download certificate PDF for attempt ID: {}", attemptId);

        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomException("Attempt not found", HttpStatus.NOT_FOUND));

        if (!currentUser.getRole().equals("admin") && !currentUser.getRole().equals("faculty")
                && !attempt.getStudent().getId().equals(currentUser.getId())) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        if (attempt.getQuiz() == null) {
            throw new CustomException("Quiz not found for this attempt", HttpStatus.BAD_REQUEST);
        }

        if (!attempt.getQuiz().isCertificateEnabled()) {
            throw new CustomException("Certificates not enabled for this quiz", HttpStatus.BAD_REQUEST);
        }

        if (attempt.getPercentage() < attempt.getQuiz().getCertificateMinScore()) {
            throw new CustomException("Minimum " + attempt.getQuiz().getCertificateMinScore() + "% required for certificate", HttpStatus.BAD_REQUEST);
        }

        return PdfGeneratorUtil.generateCertificate(attempt);
    }

    @Override
    public byte[] downloadCertificatePublic(String certId) {
        logger.info("Public request to download certificate PDF for ID: {}", certId);
        Attempt attempt = attemptRepository.findByCertificateId(certId)
                .filter(Attempt::isCertificateIssued)
                .orElseThrow(() -> new CustomException("Invalid certificate", HttpStatus.NOT_FOUND));

        return PdfGeneratorUtil.generateCertificate(attempt);
    }
}
