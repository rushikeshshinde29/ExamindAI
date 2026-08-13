package com.examind.ai.service;

import com.examind.ai.entity.User;
import java.util.Map;

public interface CertificateService {
    Map<String, Object> getCertificate(Long attemptId, User currentUser);
    Map<String, Object> verifyCertificate(String certId);
    byte[] downloadCertificate(Long attemptId, User currentUser);
    byte[] downloadCertificatePublic(String certId);
}
