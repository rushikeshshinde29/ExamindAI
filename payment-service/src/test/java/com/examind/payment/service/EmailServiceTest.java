package com.examind.payment.service;

import com.examind.payment.service.impl.EmailServiceImpl;
import jakarta.mail.Address;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UNIT TEST
 * Verifies that EmailServiceImpl correctly generates the subject and parses the HTML body 
 * with the correct student name, plan name, amount, order ID, and transaction ID.
 * Real emails are mocked out.
 */
public class EmailServiceTest {

    private JavaMailSender mailSender;
    private EmailService emailService;

    @BeforeEach
    public void setUp() {
        mailSender = mock(JavaMailSender.class);
        emailService = new EmailServiceImpl(mailSender, "team.examind.ai@gmail.com");
    }

    @Test
    @DisplayName("Test that email template correctly renders student name, plan name, amount and transaction IDs")
    public void testPaymentConfirmationEmailContent() throws Exception {
        // Arrange
        String toEmail = "student@examind.com";
        String studentName = "John Doe";
        String planName = "pro";
        double amount = 999.0;
        String paymentId = "pay_XYZ12345";
        String orderId = "order_ABC67890";

        // Create a real MimeMessage with null Session so MimeMessageHelper works correctly
        MimeMessage mimeMessage = new MimeMessage((jakarta.mail.Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendPaymentConfirmationEmail(toEmail, studentName, planName, amount, paymentId, orderId);

        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));

        // Check recipients, subject, and content on the mimeMessage object populated by the service
        Address[] recipients = mimeMessage.getRecipients(MimeMessage.RecipientType.TO);
        assertNotNull(recipients);
        assertEquals(1, recipients.length);
        assertEquals(toEmail, recipients[0].toString());

        assertEquals("Payment Received - Welcome to Examind AI Premium!", mimeMessage.getSubject());

        // Parse HTML body via writeTo stream
        java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
        mimeMessage.writeTo(outputStream);
        String rawMessage = outputStream.toString("UTF-8");

        // Verify HTML content contains all template fields in raw message
        assertTrue(rawMessage.contains("Dear " + studentName), "Email body should contain the student's name");
        assertTrue(rawMessage.contains(planName.toUpperCase()), "Email body should contain the capitalized plan name");
        assertTrue(rawMessage.contains("INR 999.00"), "Email body should contain the formatted amount");
        assertTrue(rawMessage.contains(paymentId), "Email body should contain the transaction ID");
        assertTrue(rawMessage.contains(orderId), "Email body should contain the order ID");
    }
}
