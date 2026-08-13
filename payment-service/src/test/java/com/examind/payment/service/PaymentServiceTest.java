package com.examind.payment.service;

import com.examind.payment.entity.Payment;
import com.examind.payment.exception.CustomException;
import com.examind.payment.repository.PaymentRepository;
import com.examind.payment.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.client.RestTemplate;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class PaymentServiceTest {

    private PaymentRepository paymentRepository;
    private EmailService emailService;
    private RestTemplate restTemplate;
    private PaymentServiceImpl paymentService;

    @BeforeEach
    public void setUp() throws Exception {
        paymentRepository = mock(PaymentRepository.class);
        emailService = mock(EmailService.class);
        restTemplate = mock(RestTemplate.class);
        paymentService = new PaymentServiceImpl(paymentRepository, emailService, restTemplate);

        // Inject configuration values using reflection
        setPrivateField(paymentService, "razorpayKeyId", "rzp_live_test_key_123");
        setPrivateField(paymentService, "razorpayKeySecret", "secret_key_789");
        setPrivateField(paymentService, "monolithUrl", "http://localhost:5000/api");
        setPrivateField(paymentService, "internalSecret", "cdac_examind_secret_2026");
    }

    private void setPrivateField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    // Compute real HMAC-SHA256 signature for test validation
    private String calculateSignature(String orderId, String paymentId, String secret) throws Exception {
        String payload = orderId + "|" + paymentId;
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hashBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexHash = new StringBuilder();
        for (byte b : hashBytes) {
            hexHash.append(String.format("%02x", b));
        }
        return hexHash.toString();
    }

    @Test
    public void testVerifyPaymentSignature_Success() throws Exception {
        String orderId = "order_abc123";
        String paymentId = "pay_xyz456";
        String signature = calculateSignature(orderId, paymentId, "secret_key_789");

        Payment mockPayment = new Payment();
        mockPayment.setUserId(42L);
        mockPayment.setRazorpayOrderId(orderId);
        mockPayment.setAmount(999.0);
        mockPayment.setPlan("pro");
        mockPayment.setStatus("created");

        when(paymentRepository.findByRazorpayOrderIdForUpdate(orderId))
                .thenReturn(Optional.of(mockPayment));

        Map<String, String> requestBody = Map.of(
                "razorpay_order_id", orderId,
                "razorpay_payment_id", paymentId,
                "razorpay_signature", signature
        );

        Map<String, Object> result = paymentService.verifyPayment(requestBody);

        assertTrue((Boolean) result.get("success"));
        assertEquals("paid", mockPayment.getStatus());
        assertEquals(paymentId, mockPayment.getRazorpayPaymentId());
        assertEquals(signature, mockPayment.getRazorpaySignature());
        verify(paymentRepository, atLeastOnce()).saveAndFlush(mockPayment);
    }

    @Test
    public void testVerifyPaymentSignature_Mismatch() throws Exception {
        String orderId = "order_abc123";
        String paymentId = "pay_xyz456";
        String signature = "invalid_signature_value";

        Payment mockPayment = new Payment();
        mockPayment.setUserId(42L);
        mockPayment.setRazorpayOrderId(orderId);
        mockPayment.setStatus("created");

        when(paymentRepository.findByRazorpayOrderIdForUpdate(orderId))
                .thenReturn(Optional.of(mockPayment));

        Map<String, String> requestBody = Map.of(
                "razorpay_order_id", orderId,
                "razorpay_payment_id", paymentId,
                "razorpay_signature", signature
        );

        assertThrows(CustomException.class, () -> {
            paymentService.verifyPayment(requestBody);
        });

        assertEquals("failed", mockPayment.getStatus());
        verify(paymentRepository, atLeastOnce()).save(mockPayment);
    }

    @Test
    public void testHandleWebhookIdempotency_AlreadyProcessed() {
        String paymentId = "pay_dup789";
        
        Payment existingPaidPayment = new Payment();
        existingPaidPayment.setRazorpayPaymentId(paymentId);
        existingPaidPayment.setStatus("paid");

        when(paymentRepository.findByRazorpayPaymentId(paymentId))
                .thenReturn(Optional.of(existingPaidPayment));

        String webhookPayload = "{\n" +
                "  \"event\": \"payment.captured\",\n" +
                "  \"payload\": {\n" +
                "    \"payment\": {\n" +
                "      \"entity\": {\n" +
                "        \"id\": \"" + paymentId + "\",\n" +
                "        \"order_id\": \"order_order123\",\n" +
                "        \"amount\": 99900\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        // Temporarily set key to test key to bypass signature verification
        try {
            setPrivateField(paymentService, "razorpayKeyId", "rzp_test_demo");
        } catch (Exception e) {
            fail(e.getMessage());
        }

        Map<String, Object> response = paymentService.handleWebhook(webhookPayload, "sandbox_signature");

        assertTrue((Boolean) response.get("success"));
        assertEquals("Already processed", response.get("message"));

        // Verify that no lock or write was performed
        verify(paymentRepository, never()).findByRazorpayOrderIdForUpdate(anyString());
        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }
}
