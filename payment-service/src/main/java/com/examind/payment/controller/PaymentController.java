package com.examind.payment.controller;

import com.examind.payment.entity.Payment;
import com.examind.payment.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ── Subscription Plans ─────────────────────────────────────────────
    @GetMapping("/plans")
    public ResponseEntity<Map<String, Object>> getPlans() {
        List<Map<String, Object>> plans = paymentService.getSubscriptionPlans();
        return ResponseEntity.ok(Map.of("success", true, "data", plans));
    }

    // ── Create Razorpay Order ──────────────────────────────────────────
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        Map<String, Object> response = paymentService.createOrder(body, token);
        return ResponseEntity.ok(response);
    }

    // ── Verify Payment Signature ───────────────────────────────────────
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        Map<String, Object> response = paymentService.verifyPayment(body);
        return ResponseEntity.ok(response);
    }

    // ── Razorpay Webhook Endpoint ──────────────────────────────────────
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody String requestBody,
            @RequestHeader("X-Razorpay-Signature") String signatureHeader) {
        Map<String, Object> response = paymentService.handleWebhook(requestBody, signatureHeader);
        if (response.containsKey("error")) {
            return ResponseEntity.status(400).body(response);
        }
        return ResponseEntity.ok(response);
    }

    // ── My Payment History ─────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyPayments(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        List<Payment> payments = paymentService.getMyPayments(token);
        return ResponseEntity.ok(Map.of("success", true, "data", payments));
    }

    // ── Admin: All Payments ────────────────────────────────────────────
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllPayments(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        Map<String, Object> response = paymentService.getAllPayments(token);
        return ResponseEntity.ok(response);
    }
}
