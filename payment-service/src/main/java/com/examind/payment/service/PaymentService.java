package com.examind.payment.service;

import com.examind.payment.entity.Payment;
import java.util.List;
import java.util.Map;

public interface PaymentService {
    List<Map<String, Object>> getSubscriptionPlans();
    Map<String, Object> createOrder(Map<String, Object> body, String bearerToken);
    Map<String, Object> verifyPayment(Map<String, String> body);
    Map<String, Object> handleWebhook(String requestBody, String signatureHeader);
    List<Payment> getMyPayments(String bearerToken);
    Map<String, Object> getAllPayments(String bearerToken);
}
