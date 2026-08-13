package com.examind.payment.service;

public interface EmailService {
    void sendPaymentConfirmationEmail(String to, String studentName, String plan, double amount, String paymentId, String orderId);
}
