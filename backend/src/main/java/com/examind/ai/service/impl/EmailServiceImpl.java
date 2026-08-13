package com.examind.ai.service.impl;

import com.examind.ai.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);
    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailServiceImpl(JavaMailSender mailSender, @Value("${spring.mail.username}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    @Override
    public void sendOtpEmail(String to, String otp) {
        String subject = "Examind AI - Verify Your Email";
        String html = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <style>\n" +
                "    body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }\n" +
                "    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }\n" +
                "    .header { background: linear-gradient(135deg, #6850DB 0%, #8c77f0 100%); padding: 32px; text-align: center; color: #ffffff; }\n" +
                "    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }\n" +
                "    .content { padding: 40px; text-align: center; }\n" +
                "    .welcome { font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a; }\n" +
                "    .desc { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 30px; }\n" +
                "    .otp-card { background-color: #f1f5f9; border-radius: 12px; padding: 24px; display: inline-block; margin-bottom: 30px; border: 1px dashed #6850DB; }\n" +
                "    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #6850DB; margin: 0; padding-left: 8px; }\n" +
                "    .expiry { font-size: 13px; color: #64748b; font-weight: 500; }\n" +
                "    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b; }\n" +
                "    .footer a { color: #6850DB; text-decoration: none; font-weight: 600; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class='container'>\n" +
                "    <div class='header'>\n" +
                "      <h1>Examind AI</h1>\n" +
                "    </div>\n" +
                "    <div class='content'>\n" +
                "      <h2 class='welcome'>Verify Your Email Address</h2>\n" +
                "      <p class='desc'>Thank you for joining Examind AI! Please use the following 6-digit verification code to complete your registration:</p>\n" +
                "      <div class='otp-card'>\n" +
                "        <div class='otp-code'>" + otp + "</div>\n" +
                "      </div>\n" +
                "      <p class='expiry'>This verification code is valid for <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>\n" +
                "    </div>\n" +
                "    <div class='footer'>\n" +
                "      <p>&copy; 2026 Examind AI. All rights reserved.</p>\n" +
                "      <p>Need help? Contact our support team or visit <a href='http://localhost:5173'>Examind AI</a>.</p>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
        
        sendHtmlEmail(to, subject, html);
    }

    @Override
    public void sendResetTokenEmail(String to, String token) {
        String subject = "Examind AI - Password Reset Request";
        String html = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <style>\n" +
                "    body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }\n" +
                "    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }\n" +
                "    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px; text-align: center; color: #ffffff; }\n" +
                "    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }\n" +
                "    .content { padding: 40px; text-align: center; }\n" +
                "    .welcome { font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a; }\n" +
                "    .desc { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 30px; }\n" +
                "    .btn-container { margin: 30px 0; }\n" +
                "    .reset-btn { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); border-radius: 12px; padding: 14px 28px; display: inline-block; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2); }\n" +
                "    .expiry { font-size: 13px; color: #64748b; font-weight: 500; }\n" +
                "    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b; }\n" +
                "    .footer a { color: #7c3aed; text-decoration: none; font-weight: 600; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class='container'>\n" +
                "    <div class='header'>\n" +
                "      <h1>Examind AI</h1>\n" +
                "    </div>\n" +
                "    <div class='content'>\n" +
                "      <h2 class='welcome'>Reset Your Password</h2>\n" +
                "      <p class='desc'>We received a request to reset your account password. Click the button below to choose a new password:</p>\n" +
                "      <div class='btn-container'>\n" +
                "        <a href='http://localhost:5173/reset-password/" + token + "' class='reset-btn'>Reset Password</a>\n" +
                "      </div>\n" +
                "      <p class='expiry'>This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>\n" +
                "    </div>\n" +
                "    <div class='footer'>\n" +
                "      <p>&copy; 2026 Examind AI. All rights reserved.</p>\n" +
                "      <p>Need help? Contact our support team or visit <a href='http://localhost:5173'>Examind AI</a>.</p>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
        
        sendHtmlEmail(to, subject, html);
    }

    @Override
    public void sendQuizInvitation(String to, String quizTitle, String invitedBy, String quizSubject) {
        String subject = "Examind AI - Quiz Invitation: " + quizTitle;
        String html = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>Quiz Invitation</title>\n" +
                "  <style>\n" +
                "    body {\n" +
                "      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;\n" +
                "      background-color: #f8fafc;\n" +
                "      color: #0f172a;\n" +
                "      margin: 0;\n" +
                "      padding: 0;\n" +
                "      -webkit-font-smoothing: antialiased;\n" +
                "    }\n" +
                "    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }\n" +
                "    .header { background: linear-gradient(135deg, #6850DB 0%, #8c77f0 100%); padding: 32px; text-align: center; color: #ffffff; }\n" +
                "    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }\n" +
                "    .content { padding: 40px; }\n" +
                "    .welcome { font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a; }\n" +
                "    .desc { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px; }\n" +
                "    .invitation-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px; }\n" +
                "    .card-title { font-size: 16px; font-weight: 800; color: #6850DB; margin-top: 0; margin-bottom: 8px; }\n" +
                "    .card-meta { font-size: 14px; color: #475569; margin: 4px 0; }\n" +
                "    .btn-container { text-align: center; margin: 30px 0; }\n" +
                "    .portal-btn { background: linear-gradient(135deg, #6850DB 0%, #8c77f0 100%); border-radius: 12px; padding: 14px 28px; display: inline-block; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(104, 80, 219, 0.25); }\n" +
                "    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b; }\n" +
                "    .footer a { color: #6850DB; text-decoration: none; font-weight: 600; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class='container'>\n" +
                "    <div class='header'>\n" +
                "      <h1>Examind AI</h1>\n" +
                "    </div>\n" +
                "    <div class='content'>\n" +
                "      <h2 class='welcome'>You're Invited!</h2>\n" +
                "      <p class='desc'>Hello, you have been invited to participate in a quiz on Examind AI. Here are the details:</p>\n" +
                "      \n" +
                "      <div class='invitation-card'>\n" +
                "        <div class='card-title'>" + quizTitle + "</div>\n" +
                "        <div class='card-meta'><strong>Subject:</strong> " + quizSubject + "</div>\n" +
                "        <div class='card-meta'><strong>Invited By:</strong> " + invitedBy + "</div>\n" +
                "      </div>\n" +
                "      \n" +
                "      <div class='btn-container'>\n" +
                "        <a href='http://localhost:5173/login' class='portal-btn'>Log In & Take Quiz</a>\n" +
                "      </div>\n" +
                "      <p class='desc' style='text-align: center; font-size: 13px; color: #64748b;'>Log in to your student portal to access the invitation and start the assessment.</p>\n" +
                "    </div>\n" +
                "    <div class='footer'>\n" +
                "      <p>&copy; 2026 Examind AI. All rights reserved.</p>\n" +
                "      <p>Need help? Contact our support team or visit <a href='http://localhost:5173'>Examind AI</a>.</p>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
        
        sendHtmlEmail(to, subject, html);
    }

    @Override
    public void sendQuizResultShare(String to, String studentName, String quizTitle, double scorePercentage, double obtainedMarks, double totalMarks, boolean isPassed, int timeTakenSeconds, int warningCount) {
        String subject = "Examind AI - Quiz Result Shared: " + quizTitle;

        int mins = timeTakenSeconds / 60;
        int secs = timeTakenSeconds % 60;
        String timeString = mins > 0 ? mins + "m " + secs + "s" : secs + "s";

        String pctStr = String.format("%.1f", scorePercentage);
        String marksObtainedStr = String.format("%.1f", obtainedMarks);
        String marksTotalStr = String.format("%.1f", totalMarks);

        String pctColor = isPassed ? "#16a34a" : "#dc2626";
        String statusText = isPassed ? "PASSED" : "FAILED";
        String statusBadgeClass = isPassed ? "badge-passed" : "badge-failed";
        String warningColor = warningCount > 0 ? "#dc2626" : "#0f172a";

        String htmlBody = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>Quiz Performance Report</title>\n" +
                "  <style>\n" +
                "    body {\n" +
                "      font-family: 'Segoe UI', Helvetica, Arial, sans-serif;\n" +
                "      background-color: #f8fafc;\n" +
                "      color: #0f172a;\n" +
                "      margin: 0;\n" +
                "      padding: 0;\n" +
                "      -webkit-font-smoothing: antialiased;\n" +
                "    }\n" +
                "    .badge-passed {\n" +
                "      background-color: rgba(22, 163, 74, 0.1);\n" +
                "      color: #16a34a;\n" +
                "      border: 1px solid rgba(22, 163, 74, 0.2);\n" +
                "    }\n" +
                "    .badge-failed {\n" +
                "      background-color: rgba(220, 38, 38, 0.1);\n" +
                "      color: #dc2626;\n" +
                "      border: 1px solid rgba(220, 38, 38, 0.2);\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #f8fafc; padding: 20px 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;\">\n" +
                "    <tr>\n" +
                "      <td align=\"center\">\n" +
                "        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);\">\n" +
                "          \n" +
                "          <!-- Header -->\n" +
                "          <tr>\n" +
                "            <td style=\"padding: 15px 20px; background: linear-gradient(135deg, #6850DB 0%, #8c77f0 100%); border-bottom: 1px solid #e2e8f0;\">\n" +
                "              <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">\n" +
                "                <tr>\n" +
                "                  <td style=\"font-size: 16px; font-weight: 800; color: #ffffff;\">\n" +
                "                    <span style=\"background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 13px; margin-right: 8px; font-weight: bold;\">?</span>\n" +
                "                    Examind AI <span style=\"color: rgba(255, 255, 255, 0.8); font-weight: 400; font-size: 14px;\">| Quiz Report</span>\n" +
                "                  </td>\n" +
                "                  <td align=\"right\" style=\"font-size: 11px; font-weight: bold; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 1px;\">\n" +
                "                    Shared Report\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "  \n" +
                "          <!-- Main Body -->\n" +
                "          <tr>\n" +
                "            <td style=\"padding: 20px 25px;\">\n" +
                "              <p style=\"margin: 0 0 15px 0; font-size: 14px; color: #334155; line-height: 1.4; text-align: left;\">\n" +
                "                Hello! <strong>" + studentName + "</strong> has completed an exam and shared their official quiz performance report with you.\n" +
                "              </p>\n" +
                "              \n" +
                "              <!-- Horizontal Content Table -->\n" +
                "              <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin-top: 15px;\">\n" +
                "                <tr>\n" +
                "                  <!-- Left Column: Score Card (Width 42%) -->\n" +
                "                  <td width=\"42%\" valign=\"top\" style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center;\">\n" +
                "                    <div style=\"font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6850DB; font-weight: bold; margin-bottom: 5px;\">Score Obtained</div>\n" +
                "                    <div style=\"font-size: 32px; font-weight: 900; color: #0f172a; margin: 5px 0;\">" + marksObtainedStr + " / " + marksTotalStr + "</div>\n" +
                "                    <div style=\"font-size: 16px; font-weight: bold; color: " + pctColor + "; margin-bottom: 8px;\">" + pctStr + "%</div>\n" +
                "                    <span class=\"badge " + statusBadgeClass + "\" style=\"display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;\">" + statusText + "</span>\n" +
                "                  </td>\n" +
                "                  \n" +
                "                  <!-- Spacer -->\n" +
                "                  <td width=\"4%\">&nbsp;</td>\n" +
                "                  \n" +
                "                  <!-- Right Column: Details List (Width 54%) -->\n" +
                "                  <td width=\"54%\" valign=\"middle\">\n" +
                "                    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">\n" +
                "                      <tr>\n" +
                "                        <td style=\"padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;\">Quiz Name</td>\n" +
                "                        <td align=\"right\" style=\"padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;\">" + quizTitle + "</td>\n" +
                "                      </tr>\n" +
                "                      <tr>\n" +
                "                        <td style=\"padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;\">Student</td>\n" +
                "                        <td align=\"right\" style=\"padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;\">" + studentName + "</td>\n" +
                "                      </tr>\n" +
                "                      <tr>\n" +
                "                        <td style=\"padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;\">Time Taken</td>\n" +
                "                        <td align=\"right\" style=\"padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;\">" + timeString + "</td>\n" +
                "                      </tr>\n" +
                "                      <tr>\n" +
                "                        <td style=\"padding: 6px 0; font-size: 13px; color: #475569;\">Proctor Warnings</td>\n" +
                "                        <td align=\"right\" style=\"padding: 6px 0; font-size: 13px; font-weight: 700; color: " + warningColor + ";\">" + warningCount + " warnings</td>\n" +
                "                      </tr>\n" +
                "                    </table>\n" +
                "                  </td>\n" +
                "                </tr>\n" +
                "              </table>\n" +
                "  \n" +
                "            </td>\n" +
                "          </tr>\n" +
                "  \n" +
                "          <!-- Footer -->\n" +
                "          <tr>\n" +
                "            <td style=\"background-color: #f8fafc; padding: 15px 25px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;\">\n" +
                "              This email was sent on behalf of <strong>" + studentName + "</strong> via Examind AI.<br>\n" +
                "              &copy; 2026 Examind AI. Smart Exams. Smarter Results.\n" +
                "            </td>\n" +
                "          </tr>\n" +
                "  \n" +
                "        </table>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "</body>\n" +
                "</html>";

        sendHtmlEmail(to, subject, htmlBody);
    }


    @Override
    public void sendEmailWithAttachments(String to, String subject, String bodyHtml, String reportName, byte[] reportBytes, String certName, byte[] certBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(bodyHtml, true); // true sets HTML format
            
            if (reportBytes != null && reportBytes.length > 0) {
                helper.addAttachment(reportName, new ByteArrayResource(reportBytes));
            }
            if (certBytes != null && certBytes.length > 0) {
                helper.addAttachment(certName, new ByteArrayResource(certBytes));
            }
            
            mailSender.send(message);
            logger.info("Multipart email sent successfully to {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email with attachments to {}. Error: {}", to, e.getMessage());
            // Fallback: Simulation mode
            System.out.println("==================================================");
            System.out.println("            EMAIL ATTACHMENT SIMULATION           ");
            System.out.println("To:          " + to);
            System.out.println("Subject:     " + subject);
            System.out.println("Report:      " + (reportBytes != null ? reportName + " (" + reportBytes.length + " bytes)" : "None"));
            System.out.println("Certificate: " + (certBytes != null ? certName + " (" + certBytes.length + " bytes)" : "None"));
            System.out.println("Body HTML:\n" + bodyHtml);
            System.out.println("==================================================");
        }
    }


    private void sendHtmlEmail(String to, String subject, String bodyHtml) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(bodyHtml, true); // true sets HTML format
            
            mailSender.send(message);
            logger.info("HTML Email sent successfully to {}", to);
        } catch (Exception e) {
            logger.error("Failed to send HTML email to {}. Error: {}", to, e.getMessage());
            // Fallback: Simulation mode
            System.out.println("==================================================");
            System.out.println("              HTML EMAIL SIMULATION               ");
            System.out.println("To:          " + to);
            System.out.println("Subject:     " + subject);
            System.out.println("Body HTML:\n" + bodyHtml);
            System.out.println("==================================================");
        }
    }


    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to {}. Error: {}", to, e.getMessage());
            // Fallback: Simulation mode printing to terminal so developers can get the code/link instantly!
            System.out.println("==================================================");
            System.out.println("                 EMAIL SIMULATION                 ");
            System.out.println("To:      " + to);
            System.out.println("Subject: " + subject);
            System.out.println("Body:    " + body);
            System.out.println("==================================================");
        }
    }

    @Override
    public void sendQuizResultConfirmation(String to, String studentName, String quizTitle, double percentage, double obtainedMarks, double totalMarks, boolean isPassed, int rank, int pointsEarned) {
        String subject = "Examind AI - Quiz Result: " + quizTitle;
        
        String statusBg = isPassed ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)";
        String statusColor = isPassed ? "#16a34a" : "#dc2626";
        String statusBorder = isPassed ? "rgba(22, 163, 74, 0.2)" : "rgba(220, 38, 38, 0.2)";
        String statusText = isPassed ? "PASSED" : "FAILED";

        String html = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>Quiz Result Confirmation</title>\n" +
                "  <style>\n" +
                "    body {\n" +
                "      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;\n" +
                "      background-color: #f8fafc;\n" +
                "      color: #0f172a;\n" +
                "      margin: 0;\n" +
                "      padding: 0;\n" +
                "      -webkit-font-smoothing: antialiased;\n" +
                "    }\n" +
                "    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }\n" +
                "    .header { background: linear-gradient(135deg, #6850DB 0%, #8c77f0 100%); padding: 32px; text-align: center; color: #ffffff; }\n" +
                "    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }\n" +
                "    .content { padding: 40px; }\n" +
                "    .welcome { font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a; }\n" +
                "    .desc { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px; }\n" +
                "    .metrics-table { width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 28px; }\n" +
                "    .metrics-table td { padding: 12px 20px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }\n" +
                "    .metrics-table tr:last-child td { border-bottom: none; }\n" +
                "    .grid-label { color: #475569; font-weight: 500; }\n" +
                "    .grid-val { font-weight: 700; color: #0f172a; text-align: right; }\n" +
                "    .btn-container { text-align: center; margin: 30px 0; }\n" +
                "    .portal-btn { background: linear-gradient(135deg, #6850DB 0%, #8c77f0 100%); border-radius: 12px; padding: 14px 28px; display: inline-block; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(104, 80, 219, 0.25); }\n" +
                "    .footer { padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b; }\n" +
                "    .footer a { color: #6850DB; text-decoration: none; font-weight: 600; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class='container'>\n" +
                "    <div class='header'>\n" +
                "      <h1>Examind AI</h1>\n" +
                "    </div>\n" +
                "    <div class='content'>\n" +
                "      <h2 class='welcome'>Dear " + studentName + ",</h2>\n" +
                "      <p class='desc'>Congratulations on completing the quiz <strong>\"" + quizTitle + "\"</strong>. Here is a summary of your performance:</p>\n" +
                "      \n" +
                "      <table class='metrics-table'>\n" +
                "        <tr>\n" +
                "          <td class='grid-label'>Score Obtained</td>\n" +
                "          <td class='grid-val'>" + obtainedMarks + " / " + totalMarks + "</td>\n" +
                "        </tr>\n" +
                "        <tr>\n" +
                "          <td class='grid-label'>Percentage</td>\n" +
                "          <td class='grid-val'>" + String.format("%.2f", percentage) + "%</td>\n" +
                "        </tr>\n" +
                "        <tr>\n" +
                "          <td class='grid-label'>Status</td>\n" +
                "          <td align='right'>\n" +
                "            <span style=\"padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; background-color: " + statusBg + "; color: " + statusColor + "; border: 1px solid " + statusBorder + ";\">" + statusText + "</span>\n" +
                "          </td>\n" +
                "        </tr>\n" +
                "        <tr>\n" +
                "          <td class='grid-label'>Rank Position</td>\n" +
                "          <td class='grid-val'>#" + rank + "</td>\n" +
                "        </tr>\n" +
                "        <tr>\n" +
                "          <td class='grid-label'>Points Earned</td>\n" +
                "          <td class='grid-val' style='color: #fbbf24;'>" + pointsEarned + " XP</td>\n" +
                "        </tr>\n" +
                "      </table>\n" +
                "      \n" +
                "      <div class='btn-container'>\n" +
                "        <a href='http://localhost:5173/login' class='portal-btn'>Go to Student Portal</a>\n" +
                "      </div>\n" +
                "      <p class='desc' style='text-align: center; font-size: 13px; color: #64748b;'>Login to your student portal to review the complete answer sheet and explanations.</p>\n" +
                "    </div>\n" +
                "    <div class='footer'>\n" +
                "      <p>&copy; 2026 Examind AI. All rights reserved.</p>\n" +
                "      <p>Need help? Contact our support team or visit <a href='http://localhost:5173'>Examind AI</a>.</p>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
        
        sendHtmlEmail(to, subject, html);
    }
}
