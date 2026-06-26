const transporter = require('../config/nodemailer');

/**
 * Generic send email utility
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'CloudVault <noreply@cloudvault.io>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

// ── Email Templates ───────────────────────────────────────────────────────────

const getBaseEmailTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CloudVault</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0F172A; margin: 0; padding: 0; color: #F8FAFC; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #1E293B; border-radius: 16px; padding: 40px; border: 1px solid rgba(79,70,229,0.2); }
    .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #4F46E5, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 32px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5, #6366F1); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .footer { text-align: center; color: #64748B; font-size: 13px; margin-top: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #F8FAFC; }
    p { color: #94A3B8; line-height: 1.7; margin: 8px 0; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">☁️ CloudVault</div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CloudVault. All rights reserved.</p>
      <p>You received this email because you have an account with CloudVault.</p>
    </div>
  </div>
</body>
</html>
`;

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your CloudVault email address',
    html: getBaseEmailTemplate(`
      <h1>Welcome to CloudVault! 🎉</h1>
      <p>Hi ${user.name},</p>
      <p>Thanks for signing up! Please verify your email address to activate your account and start using CloudVault.</p>
      <center><a href="${verifyUrl}" class="btn">Verify Email Address</a></center>
      <hr class="divider"/>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break:break-all;color:#6366F1;">${verifyUrl}</p>
      <p>This link will expire in <strong>24 hours</strong>.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `),
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your CloudVault password',
    html: getBaseEmailTemplate(`
      <h1>Password Reset Request 🔐</h1>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset the password for your CloudVault account.</p>
      <center><a href="${resetUrl}" class="btn">Reset Password</a></center>
      <hr class="divider"/>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break:break-all;color:#6366F1;">${resetUrl}</p>
      <p>This link will expire in <strong>1 hour</strong>.</p>
      <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
    `),
  });
};

const sendShareNotificationEmail = async (recipientEmail, senderName, fileName, shareLink) => {
  await sendEmail({
    to: recipientEmail,
    subject: `${senderName} shared a file with you on CloudVault`,
    html: getBaseEmailTemplate(`
      <h1>📁 A file has been shared with you</h1>
      <p><strong>${senderName}</strong> shared <strong>"${fileName}"</strong> with you on CloudVault.</p>
      <center><a href="${shareLink}" class="btn">View File</a></center>
      <p>Click the button above to access the shared file.</p>
    `),
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendShareNotificationEmail };
