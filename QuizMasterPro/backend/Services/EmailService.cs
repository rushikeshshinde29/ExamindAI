using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace QuizMasterPro.API.Services;

// ─── EMAIL SERVICE (Gmail SMTP via MailKit) ───────────────────────────────────
public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken, string resetUrl)
    {
        var host = _config["Email:SmtpHost"];
        var portStr = _config["Email:SmtpPort"];
        var user = _config["Email:SenderEmail"];
        var pass = _config["Email:AppPassword"];
        var fromName = _config["Email:SenderName"] ?? "QuizMaster Pro";

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass))
        {
            // Not configured — fail loudly in logs instead of silently swallowing the error,
            // so "email not going in real time" is visible and debuggable.
            _logger.LogError("Email settings are missing in configuration (Email:SmtpHost / Email:SenderEmail / Email:AppPassword). Password reset email was NOT sent to {Email}.", toEmail);
            return false;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, user));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "Reset your QuizMaster Pro password";

        var builder = new BodyBuilder
        {
            HtmlBody = $@"
                <div style=""font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #F0DFC7;border-radius:12px;background:#FFF8EF;"">
                    <h2 style=""color:#E8730A;margin-top:0;"">QuizMaster Pro</h2>
                    <p>Hi {toName},</p>
                    <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
                    <p style=""text-align:center;margin:28px 0;"">
                        <a href=""{resetUrl}"" style=""background:#E8730A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;"">Reset Password</a>
                    </p>
                    <p style=""font-size:.85rem;color:#8A7A66;"">If the button doesn't work, copy this link into your browser:<br/>{resetUrl}</p>
                    <p style=""font-size:.85rem;color:#8A7A66;"">If you didn't request this, you can safely ignore this email.</p>
                </div>",
            TextBody = $"Hi {toName},\n\nWe received a request to reset your password. Open this link within 1 hour to set a new password:\n{resetUrl}\n\nIf you didn't request this, you can ignore this email."
        };
        message.Body = builder.ToMessageBody();

        try
        {
            var port = int.TryParse(portStr, out var p) ? p : 587;
            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(user, pass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Password reset email sent to {Email}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            // Log the real exception instead of swallowing it, so SMTP failures are visible.
            _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
            return false;
        }
    }
}
