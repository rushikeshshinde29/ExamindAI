package com.examind.payment.scheduler;

import com.examind.payment.entity.Payment;
import com.examind.payment.repository.PaymentRepository;
import com.examind.payment.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@Component
public class PaymentReconciliationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PaymentReconciliationScheduler.class);

    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final RestTemplate restTemplate;

    @Value("${app.monolith.url:http://localhost:5000/api}")
    private String monolithUrl;

    @Value("${app.internal.secret:cdac_examind_secret_2026}")
    private String internalSecret;

    public PaymentReconciliationScheduler(PaymentRepository paymentRepository, EmailService emailService, RestTemplate restTemplate) {
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
        this.restTemplate = restTemplate;
    }

    // Runs every 60 seconds
    @Transactional
    @Scheduled(fixedDelay = 60000)
    public void reconcileFailedUpgrades() {
        List<Payment> pendingPayments = paymentRepository.findByStatusAndUpgradeStatusIn("paid", List.of("PENDING", "FAILED"));
        
        if (pendingPayments.isEmpty()) {
            return;
        }

        logger.info("Found {} paid transactions with pending or failed user upgrades. Retrying upgrades...", pendingPayments.size());

        for (Payment payment : pendingPayments) {
            try {
                upgradeUserOnMonolith(payment.getUserId());
                payment.setUpgradeStatus("COMPLETED");
                paymentRepository.saveAndFlush(payment);
                logger.info("Reconciliation successful: Upgraded user {} to Pro for payment ID: {}", payment.getUserId(), payment.getRazorpayPaymentId());

                // Trigger Email asynchronously if successful and not yet sent
                if ("paid".equals(payment.getStatus()) && !payment.isEmailSent()) {
                    Map<String, Object> userProfile = fetchUserProfileFromMonolithById(payment.getUserId());
                    if (userProfile != null) {
                        String email = (String) userProfile.get("email");
                        String name = (String) userProfile.get("name");
                        try {
                            emailService.sendPaymentConfirmationEmail(email, name, payment.getPlan(), payment.getAmount(), payment.getRazorpayPaymentId(), payment.getRazorpayOrderId());
                            payment.setEmailSent(true);
                            paymentRepository.saveAndFlush(payment);
                        } catch (Exception ex) {
                            logger.error("Error triggering async payment email during reconciliation for user {}: {}", payment.getUserId(), ex.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                int nextRetry = payment.getRetryCount() + 1;
                payment.setRetryCount(nextRetry);
                if (nextRetry >= 5) {
                    payment.setUpgradeStatus("PERMANENTLY_FAILED");
                    logger.error("Reconciliation critical: Payment ID {} reached maximum retry attempts (5) for user ID {}. Setting status to PERMANENTLY_FAILED.", payment.getRazorpayPaymentId(), payment.getUserId());
                } else {
                    payment.setUpgradeStatus("FAILED");
                    logger.error("Reconciliation failed: Could not upgrade user {} for payment ID: {} (Attempt {}/5). Error: {}", 
                            payment.getUserId(), payment.getRazorpayPaymentId(), nextRetry, e.getMessage());
                }
                paymentRepository.saveAndFlush(payment);
            }
        }
    }

    private void upgradeUserOnMonolith(Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Secret", internalSecret);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                monolithUrl + "/internal/users/" + userId + "/upgrade",
                entity,
                Map.class
        );

        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("Monolith upgrade API returned status: " + response.getStatusCode());
        }
    }

    private Map<String, Object> fetchUserProfileFromMonolithById(Long userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Secret", internalSecret);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                monolithUrl + "/internal/users/" + userId,
                HttpMethod.GET,
                entity,
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception e) {
            logger.error("Failed to fetch user profile from monolith for user ID {}: {}", userId, e.getMessage());
        }
        return null;
    }
}
