package com.examind.ai.controller;

import com.examind.ai.entity.AuditLog;
import com.examind.ai.entity.BrandingSettings;
import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.InstitutionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class InstitutionController {

    private final InstitutionService institutionService;

    public InstitutionController(InstitutionService institutionService) {
        this.institutionService = institutionService;
    }

    @GetMapping("/settings/branding")
    public ResponseEntity<Map<String, Object>> getBranding() {
        BrandingSettings branding = institutionService.getBranding();
        return ResponseEntity.ok(Map.of("success", true, "data", branding));
    }

    @PutMapping("/settings/branding")
    public ResponseEntity<Map<String, Object>> updateBranding(
            @RequestBody BrandingSettings settings,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        BrandingSettings saved = institutionService.updateBranding(settings, user);
        return ResponseEntity.ok(Map.of("success", true, "data", saved));
    }

    @GetMapping("/admin/audit-logs")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        List<AuditLog> logs = institutionService.getAuditLogs(user);
        return ResponseEntity.ok(Map.of("success", true, "data", logs));
    }

    @PostMapping("/admin/users/import-csv")
    public ResponseEntity<Map<String, Object>> importStudentsCsv(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = ((CustomUserDetails) userDetails).getUser();
        String csvData = payload.get("csvData");
        
        Map<String, Object> result = institutionService.importStudentsCsv(csvData, user);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", result.get("message"),
            "created", result.get("created"),
            "skipped", result.get("skipped"),
            "skippedEmails", result.get("skippedEmails")
        ));
    }
}
