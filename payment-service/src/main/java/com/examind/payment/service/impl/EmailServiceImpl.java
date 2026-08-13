package com.examind.payment.service.impl;

import com.examind.payment.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);
    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailServiceImpl(JavaMailSender mailSender, @Value("${spring.mail.username}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    @Async
    @Override
    public void sendPaymentConfirmationEmail(String to, String studentName, String plan, double amount, String paymentId, String orderId) {
        String subject = "Payment Received - Welcome to Examind AI Premium!";
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
        
        String html = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <style>\n" +
                "    body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }\n    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }\n    .header { background: linear-gradient(135deg, #6850DB 0%, #8c77f0 100%); padding: 32px; text-align: center; color: #ffffff; }\n    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }\n    .content { padding: 40px; }\n    .welcome { font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a; text-align: center; }\n    .desc { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 30px; text-align: center; }\n    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }\n    .receipt-row { border-bottom: 1px solid #e2e8f0; }\n    .receipt-row:last-child { border-bottom: none; }\n    .receipt-label { padding: 14px 20px; font-size: 14px; color: #64748b; font-weight: 600; width: 40%; }\n    .receipt-value { padding: 14px 20px; font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; }\n    .features-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }\n    .feature-list { list-style: none; padding: 0; margin: 0 0 30px 0; }\n    .feature-item { display: flex; align-items: center; font-size: 14px; color: #475569; margin-bottom: 12px; }\n    .feature-icon { color: #16a34a; margin-right: 10px; font-weight: bold; }\n    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b; }\n    .footer a { color: #6850DB; text-decoration: none; font-weight: 600; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class='container'>\n" +
                "    <div class='header'>\n" +
                "      <h1>Examind AI</h1>\n" +
                "    </div>\n" +
                "    <div class='content'>\n" +
                "      <h2 class='welcome'>Payment Received - Welcome to Examind AI Premium!</h2>\n" +
                "      <p class='desc'>Dear " + studentName + ",</p>\n" +
                "      <p class='desc'>Your payment has been received successfully. Welcome to the Examind AI Premium family!</p>\n" +
                "      \n" +
                "      <table class='receipt-table'>\n" +
                "        <tr class='receipt-row'>\n" +
                "          <td class='receipt-label'>Plan Name</td>\n" +
                "          <td class='receipt-value'>" + plan.toUpperCase() + "</td>\n" +
                "        </tr>\n" +
                "        <tr class='receipt-row'>\n" +
                "          <td class='receipt-label'>Amount Paid</td>\n" +
                "          <td class='receipt-value'>INR " + String.format("%.2f", amount) + "</td>\n" +
                "        </tr>\n" +
                "        <tr class='receipt-row'>\n" +
                "          <td class='receipt-label'>Transaction ID</td>\n" +
                "          <td class='receipt-value'>" + paymentId + "</td>\n" +
                "        </tr>\n" +
                "        <tr class='receipt-row'>\n" +
                "          <td class='receipt-label'>Order ID</td>\n" +
                "          <td class='receipt-value'>" + orderId + "</td>\n" +
                "        </tr>\n" +
                "        <tr class='receipt-row'>\n" +
                "          <td class='receipt-label'>Date</td>\n" +
                "          <td class='receipt-value'>" + dateStr + "</td>\n" +
                "        </tr>\n" +
                "      </table>\n" +
                "      \n" +
                "      <h3 class='features-title'>Unlocked Premium Features</h3>\n" +
                "      <ul class='feature-list'>\n" +
                "        <li class='feature-item'><span class='feature-icon'>✓</span> Study Notes</li>\n" +
                "        <li class='feature-item'><span class='feature-icon'>✓</span> Bookmarks</li>\n" +
                "        <li class='feature-item'><span class='feature-icon'>✓</span> AI Study Coach</li>\n" +
                "        <li class='feature-item'><span class='feature-icon'>✓</span> AI Diagnostic Report</li>\n" +
                "        <li class='feature-item'><span class='feature-icon'>✓</span> Dynamic AI Explanation</li>\n" +
                "      </ul>\n" +
                "    </div>\n" +
                "    <div class='footer'>\n" +
                "      <p>&copy; 2026 Examind AI. All rights reserved.</p>\n" +
                "      <p>Need help? Contact our support team or visit <a href='http://localhost:5173'>Examind AI</a>.</p>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            
            mailSender.send(message);
            logger.info("HTML Payment Confirmation Email sent successfully to {}", to);
        } catch (Exception e) {
            logger.error("Failed to send payment confirmation HTML email to {}. Error: {}", to, e.getMessage());
            
            // Fallback: Simulation logging in logs
            System.out.println("==================================================");
            System.out.println("        PAYMENT HTML EMAIL SIMULATION             ");
            System.out.println("To:          " + to);
            System.out.println("Subject:     " + subject);
            System.out.println("Plan:        " + plan);
            System.out.println("Amount:      INR " + amount);
            System.out.println("Payment ID:  " + paymentId);
            System.out.println("Order ID:    " + orderId);
            System.out.println("==================================================");
        }
    }
}
