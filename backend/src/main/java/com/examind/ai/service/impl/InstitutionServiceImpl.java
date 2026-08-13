package com.examind.ai.service.impl;

import com.examind.ai.entity.*;
import com.examind.ai.exception.CustomException;
import com.examind.ai.repository.*;
import com.examind.ai.service.InstitutionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.StringReader;
import java.util.*;

@Service
public class InstitutionServiceImpl implements InstitutionService {

    private static final Logger logger = LoggerFactory.getLogger(InstitutionServiceImpl.class);

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final BrandingSettingsRepository brandingSettingsRepository;
    private final PasswordEncoder passwordEncoder;

    public InstitutionServiceImpl(UserRepository userRepository,
                                  AuditLogRepository auditLogRepository,
                                  BrandingSettingsRepository brandingSettingsRepository,
                                  PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.brandingSettingsRepository = brandingSettingsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public BrandingSettings getBranding() {
        List<BrandingSettings> list = brandingSettingsRepository.findAll();
        if (list.isEmpty()) {
            BrandingSettings branding = new BrandingSettings();
            return brandingSettingsRepository.save(branding);
        }
        return list.get(0);
    }

    @Override
    public BrandingSettings updateBranding(BrandingSettings settings, User user) {
        if (!"admin".equals(user.getRole())) {
            throw new CustomException("Only admins can change branding", HttpStatus.FORBIDDEN);
        }

        List<BrandingSettings> list = brandingSettingsRepository.findAll();
        BrandingSettings dbSettings = list.isEmpty() ? new BrandingSettings() : list.get(0);

        dbSettings.setInstitutionName(settings.getInstitutionName());
        dbSettings.setLogoUrl(settings.getLogoUrl());
        dbSettings.setPrimaryColor(settings.getPrimaryColor());
        dbSettings.setSecondaryColor(settings.getSecondaryColor());
        dbSettings.setCustomDomain(settings.getCustomDomain());

        BrandingSettings saved = brandingSettingsRepository.save(dbSettings);

        AuditLog audit = new AuditLog();
        audit.setAction("UPDATE_BRANDING");
        audit.setPerformedBy(user.getEmail());
        audit.setDetails("Updated brand colors to " + saved.getPrimaryColor() + " and name to " + saved.getInstitutionName());
        auditLogRepository.save(audit);

        return saved;
    }

    @Override
    public List<AuditLog> getAuditLogs(User user) {
        if (!"admin".equals(user.getRole())) {
            throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
        }
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Map<String, Object> importStudentsCsv(String csvData, User user) {
        if (!"admin".equals(user.getRole())) {
            throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
        }

        if (csvData == null || csvData.isBlank()) {
            throw new CustomException("CSV data is required", HttpStatus.BAD_REQUEST);
        }

        int createdCount = 0;
        int skippedCount = 0;
        List<String> skippedEmails = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new StringReader(csvData))) {
            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                String[] parts = line.split(",");
                if (parts.length < 3) {
                    skippedCount++;
                    continue;
                }

                String name = parts[0].trim();
                String email = parts[1].trim();
                String rawPassword = parts[2].trim();
                String department = parts.length > 3 ? parts[3].trim() : "General";
                String studentIdVal = parts.length > 4 ? parts[4].trim() : "";

                if (userRepository.findByEmail(email).isPresent()) {
                    skippedCount++;
                    skippedEmails.add(email);
                    continue;
                }

                User student = new User();
                student.setName(name);
                student.setEmail(email);
                student.setPassword(passwordEncoder.encode(rawPassword));
                student.setRole("student");
                student.setDepartment(department);
                student.setStudentId(studentIdVal);
                student.setEmailVerified(true);
                userRepository.save(student);

                createdCount++;
            }
        } catch (Exception e) {
            throw new CustomException("Error parsing CSV data: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        AuditLog audit = new AuditLog();
        audit.setAction("BULK_CSV_IMPORT");
        audit.setPerformedBy(user.getEmail());
        audit.setDetails("Imported " + createdCount + " students successfully, skipped " + skippedCount);
        auditLogRepository.save(audit);

        return Map.of(
            "message", "Successfully imported " + createdCount + " students. Skipped " + skippedCount + " duplicates.",
            "created", createdCount,
            "skipped", skippedCount,
            "skippedEmails", skippedEmails
        );
    }
}
