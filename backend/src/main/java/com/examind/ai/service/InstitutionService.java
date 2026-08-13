package com.examind.ai.service;

import com.examind.ai.entity.AuditLog;
import com.examind.ai.entity.BrandingSettings;
import com.examind.ai.entity.User;
import java.util.List;
import java.util.Map;

public interface InstitutionService {
    BrandingSettings getBranding();
    BrandingSettings updateBranding(BrandingSettings settings, User user);
    List<AuditLog> getAuditLogs(User user);
    Map<String, Object> importStudentsCsv(String csvData, User user);
}
