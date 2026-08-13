package com.examind.ai.controller;

import com.examind.ai.entity.User;
import com.examind.ai.exception.CustomException;
import com.examind.ai.security.CustomUserDetails;
import com.examind.ai.service.CertificateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/{attemptId}")
    public ResponseEntity<Map<String, Object>> getCertificate(
            @PathVariable("attemptId") Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            throw new CustomException("Not authenticated", HttpStatus.UNAUTHORIZED);
        }
        User currentUser = ((CustomUserDetails) userDetails).getUser();
        Map<String, Object> certData = certificateService.getCertificate(attemptId, currentUser);
        return ResponseEntity.ok(Map.of("success", true, "data", certData));
    }

    @GetMapping("/verify/{certId}")
    public ResponseEntity<Map<String, Object>> verifyCertificate(@PathVariable("certId") String certId) {
        Map<String, Object> certData = certificateService.verifyCertificate(certId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "valid", true,
                "data", certData
        ));
    }

    @GetMapping("/{attemptId}/download")
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable("attemptId") Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            throw new CustomException("Not authenticated", HttpStatus.UNAUTHORIZED);
        }
        User currentUser = ((CustomUserDetails) userDetails).getUser();
        byte[] pdfBytes = certificateService.downloadCertificate(attemptId, currentUser);
        String filename = "Certificate.pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/verify/{certId}/download")
    public ResponseEntity<byte[]> downloadCertificatePublic(@PathVariable("certId") String certId) {
        byte[] pdfBytes = certificateService.downloadCertificatePublic(certId);
        String filename = "Certificate.pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
