package com.examind.ai.service;

public interface EmailService {
    void sendOtpEmail(String to, String otp);
    void sendResetTokenEmail(String to, String token);
    void sendQuizInvitation(String to, String quizTitle, String invitedBy, String quizSubject);
    void sendQuizResultShare(String to, String studentName, String quizTitle, double scorePercentage, double obtainedMarks, double totalMarks, boolean isPassed, int timeTakenSeconds, int warningCount);
    void sendEmailWithAttachments(String to, String subject, String bodyHtml, String reportName, byte[] reportBytes, String certName, byte[] certBytes);
    void sendQuizResultConfirmation(String to, String studentName, String quizTitle, double percentage, double obtainedMarks, double totalMarks, boolean isPassed, int rank, int pointsEarned);
}
