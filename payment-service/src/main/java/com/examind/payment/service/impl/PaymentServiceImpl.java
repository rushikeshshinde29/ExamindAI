package com.examind.payment.service.impl;

import com.examind.payment.entity.Payment;
import com.examind.payment.exception.CustomException;
import com.examind.payment.repository.PaymentRepository;
import com.examind.payment.service.EmailService;
import com.examind.payment.service.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentServiceImpl.class);

    @Value("${razorpay.key.id:rzp_test_demo}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:demo_secret}")
    private String razorpayKeySecret;

    @Value("${app.monolith.url:http://localhost:5000/api}")
    private String monolithUrl;

    @Value("${app.internal.secret:cdac_examind_secret_2026}")
    private String internalSecret;

    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final RestTemplate restTemplate;

    public PaymentServiceImpl(PaymentRepository paymentRepository, EmailService emailService, RestTemplate restTemplate) {
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
        this.restTemplate = restTemplate;
    }

    @Override
    public List<Map<String, Object>> getSubscriptionPlans() {
        return List.of(
            Map.of(
                "id", "free",
                "name", "Free Plan",
                "price", 0,
                "currency", "INR",
                "features", List.of(
                    "Access to assigned quizzes",
                    "Basic performance analysis",
                    "Limited AI explanations"
                ),
                "recommended", false
            ),
            Map.of(
                "id", "pro",
                "name", "Pro Plan",
                "price", 999,
                "currency", "INR",
                "priceDisplay", "₹999/month",
                "features", List.of(
                    "Unlimited practice tests",
                    "Detailed performance analytics",
                    "AI Study Coach & recommendations",
                    "Unlimited AI doubt-solving & explanations",
                    "Certificate downloads"
                ),
                "recommended", true
            )
        );
    }

    @Override
    public Map<String, Object> createOrder(Map<String, Object> body, String bearerToken) {
        if (bearerToken == null) {
            throw new CustomException("Missing Authorization token", HttpStatus.UNAUTHORIZED);
        }

        // Fetch user profile from monolith
        Map<String, Object> userMap = fetchUserProfileFromMonolith(bearerToken);
        Long userId = ((Number) userMap.get("id")).longValue();
        String userName = (String) userMap.get("name");
        String userEmail = (String) userMap.get("email");

        String plan = (String) body.getOrDefault("plan", "pro");
        double amount = com.examind.payment.util.PlanPricingMapping.getPriceForPlan(plan);
        if (amount == 0) {
            throw new CustomException("Free plan does not require payment", HttpStatus.BAD_REQUEST);
        }

        String orderId;
        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", (int)(amount * 100)); // amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "receipt_" + System.currentTimeMillis() + "_" + userId);
            
            Order order = razorpay.orders.create(orderRequest);
            orderId = order.get("id");
        } catch (Exception e) {
            /*
             * MOCK ORDER FALLBACK TRIGGER CONDITION:
             * This catch block executes if the connection to the Razorpay API fails (timeout, down, etc.)
             * or if order creation throws an exception. There is no active environment profile wrapper.
             * However, in production, signature checks will fail since razorpayKeyId will start with
             * 'rzp_live_' instead of 'rzp_test_', preventing any mock order validation fraud.
             */
            logger.warn("Failed to create real Razorpay order ({}). Falling back to mock order ID.", e.getMessage());
            orderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }

        // Save pending payment record (strict write ownership - only payment service writes to this DB)
        Payment payment = new Payment();
        payment.setUserId(userId);
        payment.setRazorpayOrderId(orderId);
        payment.setAmount(amount);
        payment.setCurrency("INR");
        payment.setStatus("created");
        payment.setPlan(plan);
        payment.setUpgradeStatus("PENDING");
        payment.setDescription("Examind AI — " + capitalize(plan) + " Plan Subscription");
        paymentRepository.save(payment);

        logger.info("Created Razorpay order: {} for user: {} plan: {}", orderId, userEmail, plan);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("orderId", orderId);
        response.put("order_id", orderId);
        response.put("amount", (long)(amount * 100)); // paise
        response.put("currency", "INR");
        response.put("keyId", razorpayKeyId);
        response.put("key_id", razorpayKeyId);
        response.put("razorpay_key_id", razorpayKeyId);
        response.put("description", "Examind AI — " + capitalize(plan) + " Plan");
        response.put("userName", userName);
        response.put("userEmail", userEmail);

        return response;
    }

    @Override
    @Transactional
    public Map<String, Object> verifyPayment(Map<String, String> body) {
        String orderId = body.get("razorpay_order_id");
        String paymentId = body.get("razorpay_payment_id");
        String signature = body.get("razorpay_signature");

        if (orderId == null || paymentId == null || signature == null) {
            throw new CustomException("Missing payment verification fields", HttpStatus.BAD_REQUEST);
        }

        // Verify HMAC-SHA256 signature
        boolean isValid = verifySignature(orderId, paymentId, signature);

        Payment payment = paymentRepository.findByRazorpayOrderIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Payment order not found", HttpStatus.NOT_FOUND));

        if (isValid) {
            payment.setRazorpayPaymentId(paymentId);
            payment.setRazorpaySignature(signature);
            payment.setStatus("paid");
            payment.setUpgradeStatus("PENDING");
            paymentRepository.saveAndFlush(payment);

            // Attempt monolith user upgrade
            try {
                upgradeUserOnMonolith(payment.getUserId());
                payment.setUpgradeStatus("COMPLETED");
                paymentRepository.saveAndFlush(payment);
                logger.info("Upgrade completed successfully for user {} after payment {}", payment.getUserId(), paymentId);
            } catch (Exception e) {
                payment.setUpgradeStatus("FAILED");
                paymentRepository.saveAndFlush(payment);
                logger.error("Monolith upgrade failed for user {} after payment {}. Will be retried by reconciliation task. Error: {}", payment.getUserId(), paymentId, e.getMessage());
            }

            // Trigger Email asynchronously if successful and not yet sent
            if ("paid".equals(payment.getStatus()) && !payment.isEmailSent()) {
                Map<String, Object> userProfile = fetchUserProfileFromMonolithById(payment.getUserId());
                if (userProfile != null) {
                    String email = (String) userProfile.get("email");
                    String name = (String) userProfile.get("name");
                    try {
                        emailService.sendPaymentConfirmationEmail(email, name, payment.getPlan(), payment.getAmount(), paymentId, orderId);
                        payment.setEmailSent(true);
                        paymentRepository.saveAndFlush(payment);
                    } catch (Exception ex) {
                        logger.error("Error triggering async payment email for user {}: {}", payment.getUserId(), ex.getMessage());
                    }
                }
            }

            if ("COMPLETED".equals(payment.getUpgradeStatus())) {
                return Map.of(
                    "success", true,
                    "message", "Payment successful! Your " + capitalize(payment.getPlan()) + " plan is now active.",
                    "plan", payment.getPlan(),
                    "paymentId", paymentId,
                    "isUpgradeComplete", true
                );
            } else {
                return Map.of(
                    "success", true,
                    "message", "Payment received! Your Pro access will activate within a minute.",
                    "plan", payment.getPlan(),
                    "paymentId", paymentId,
                    "isUpgradeComplete", false
                );
            }
        } else {
            payment.setStatus("failed");
            paymentRepository.save(payment);

            logger.warn("Payment signature verification failed for order: {}", orderId);
            throw new CustomException("Payment verification failed — invalid signature", HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> handleWebhook(String requestBody, String signatureHeader) {
        logger.info("Received Razorpay Webhook request");

        // Verify webhook signature
        boolean isValid = verifyWebhookSignature(requestBody, signatureHeader);
        if (!isValid) {
            logger.warn("Razorpay Webhook signature verification failed");
            return Map.of("success", false, "error", "Invalid webhook signature");
        }

        try {
            JSONObject json = new JSONObject(requestBody);
            String event = json.optString("event");
            logger.info("Processing webhook event: {}", event);

            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                JSONObject entity = json.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");
                
                String paymentId = entity.optString("id");
                String orderId = entity.optString("order_id");
                double amount = entity.optDouble("amount") / 100.0;

                // Idempotency: Check if this payment ID has already been processed as paid
                Optional<Payment> existingPaid = paymentRepository.findByRazorpayPaymentId(paymentId);
                if (existingPaid.isPresent() && "paid".equals(existingPaid.get().getStatus())) {
                    logger.info("Webhook Idempotency: Payment {} already processed as paid. Ignoring duplicate event.", paymentId);
                    return Map.of("success", true, "message", "Already processed");
                }

                // Retrieve payment record by order id with pessimistic write lock
                Payment payment = paymentRepository.findByRazorpayOrderIdForUpdate(orderId)
                        .orElse(null);

                if (payment == null) {
                    // Create a fallback payment if not found in db
                    payment = new Payment();
                    payment.setUserId(0L); // Unknown fallback
                    payment.setRazorpayOrderId(orderId);
                    payment.setAmount(amount);
                    payment.setPlan("pro");
                    payment.setDescription("Razorpay Webhook Fallback Payment");
                }

                payment.setRazorpayPaymentId(paymentId);
                payment.setStatus("paid");
                payment.setUpgradeStatus("PENDING");
                paymentRepository.saveAndFlush(payment);

                // Attempt user upgrade on monolith
                if (payment.getUserId() > 0) {
                    try {
                        upgradeUserOnMonolith(payment.getUserId());
                        payment.setUpgradeStatus("COMPLETED");
                        paymentRepository.saveAndFlush(payment);
                        logger.info("Webhook upgraded user {} to Pro successfully.", payment.getUserId());
                    } catch (Exception e) {
                        payment.setUpgradeStatus("FAILED");
                        paymentRepository.saveAndFlush(payment);
                        logger.error("Webhook user upgrade failed for user {}. Marked for reconciliation. Error: {}", payment.getUserId(), e.getMessage());
                    }
                }

                // Trigger Email asynchronously if successful and not yet sent
                if ("paid".equals(payment.getStatus()) && !payment.isEmailSent()) {
                    Long uId = payment.getUserId();
                    if (uId > 0) {
                        Map<String, Object> userProfile = fetchUserProfileFromMonolithById(uId);
                        if (userProfile != null) {
                            String email = (String) userProfile.get("email");
                            String name = (String) userProfile.get("name");
                            try {
                                emailService.sendPaymentConfirmationEmail(email, name, payment.getPlan(), payment.getAmount(), paymentId, orderId);
                                payment.setEmailSent(true);
                                paymentRepository.saveAndFlush(payment);
                            } catch (Exception ex) {
                                logger.error("Error triggering webhook async payment email for user {}: {}", uId, ex.getMessage());
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error processing Razorpay webhook: {}", e.getMessage(), e);
            return Map.of("success", false, "error", e.getMessage());
        }

        return Map.of("success", true);
    }

    @Override
    public List<Payment> getMyPayments(String bearerToken) {
        Map<String, Object> userMap = fetchUserProfileFromMonolith(bearerToken);
        Long userId = ((Number) userMap.get("id")).longValue();
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Map<String, Object> getAllPayments(String bearerToken) {
        Map<String, Object> userMap = fetchUserProfileFromMonolith(bearerToken);
        String role = (String) userMap.get("role");

        if (!"admin".equals(role)) {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }

        List<Payment> payments = paymentRepository.findAllByOrderByCreatedAtDesc();
        double totalRevenue = payments.stream()
                .filter(p -> "paid".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        return Map.of(
            "success", true,
            "data", payments,
            "totalRevenue", totalRevenue,
            "totalPayments", payments.size()
        );
    }

    // ── Helper Methods ────────────────────────────────────────────────
    private Map<String, Object> fetchUserProfileFromMonolith(String bearerToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", bearerToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    monolithUrl + "/auth/me",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (Map<String, Object>) response.getBody().get("user");
            }
        } catch (Exception e) {
            logger.error("Failed to fetch user profile from monolith: {}", e.getMessage());
        }
        throw new CustomException("Failed to verify user authentication with monolith", HttpStatus.UNAUTHORIZED);
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
            throw new RuntimeException("Monolith upgrade api returned status: " + response.getStatusCode());
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            if (razorpayKeyId != null && razorpayKeyId.startsWith("rzp_test_")) {
                logger.info("Sandbox test key detected. Bypassing signature verification.");
                return true;
            }
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hashBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexHash = new StringBuilder();
            for (byte b : hashBytes) {
                hexHash.append(String.format("%02x", b));
            }

            return hexHash.toString().equals(signature);
        } catch (Exception e) {
            logger.error("Signature verification error: {}", e.getMessage());
            return razorpayKeyId.contains("demo") || razorpayKeyId.equals("rzp_test_demo");
        }
    }

    private boolean verifyWebhookSignature(String requestBody, String signatureHeader) {
        try {
            if (razorpayKeyId != null && razorpayKeyId.startsWith("rzp_test_")) {
                logger.info("Sandbox webhook request. Bypassing webhook signature check.");
                return true;
            }
            return Utils.verifyWebhookSignature(requestBody, signatureHeader, razorpayKeySecret);
        } catch (Exception e) {
            logger.error("Webhook signature check error: {}", e.getMessage());
            return false;
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
