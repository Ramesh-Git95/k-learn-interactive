const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;

    if (this.resend) {
      console.log('📧 Email service initialized with Resend HTTP API');
    } else {
      console.warn('⚠️  RESEND_API_KEY not set — emails disabled');
    }
  }

  get from() {
    return process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

  async sendVerificationEmail(userEmail, userName, verificationToken) {
    if (!this.resend) throw new Error('Email service not configured');

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: userEmail,
      subject: '✨ Verify Your K-Learn Account - Start Your Korean Journey!',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
        <style>
          .container{max-width:600px;margin:0 auto;font-family:Arial,sans-serif}
          .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center}
          .content{padding:30px;background:#f8f9fa}
          .button{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:15px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;margin:20px 0}
          .footer{padding:20px;text-align:center;color:#666;font-size:14px}
        </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🇰🇷 K-Learn Korean</h1>
              <p style="font-size:24px;color:#fff;margin:10px 0">한글배움</p>
              <p>Welcome to your Korean learning journey!</p>
            </div>
            <div class="content">
              <h2>안녕하세요 ${userName}! 👋</h2>
              <p>Thank you for joining K-Learn Korean! Please verify your email to unlock all features.</p>
              <div style="text-align:center">
                <a href="${verificationUrl}" class="button">✨ Verify My Email Address</a>
              </div>
              <p><strong>What's waiting for you:</strong></p>
              <ul>
                <li>📚 Interactive Hangul learning</li>
                <li>🎯 AI-powered vocabulary building</li>
                <li>🧠 Spaced repetition system (SRS)</li>
                <li>🗣️ AI conversation practice</li>
                <li>🏆 Progress tracking & achievements</li>
              </ul>
              <p>This link expires in 24 hours.</p>
              <hr style="margin:30px 0;border:none;border-top:1px solid #ddd">
              <p><small>Can't click the button? Copy this link:<br>
              <a href="${verificationUrl}">${verificationUrl}</a></small></p>
            </div>
            <div class="footer">
              <p>Happy learning! 📖✨</p>
              <p>The K-Learn Korean Team</p>
              <p><em>화이팅! (You can do it!)</em></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    return { success: true };
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    if (!this.resend) throw new Error('Email service not configured');

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: userEmail,
      subject: '🔐 Reset Your K-Learn Password',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          .container{max-width:600px;margin:0 auto;font-family:Arial,sans-serif}
          .header{background:linear-gradient(135deg,#EC4899 0%,#8B5CF6 100%);color:white;padding:30px;text-align:center}
          .content{padding:30px;background:#f8f9fa}
          .button{background:linear-gradient(135deg,#EC4899,#8B5CF6);color:white;padding:15px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;margin:20px 0}
          .footer{padding:20px;text-align:center;color:#666;font-size:14px}
        </style></head>
        <body><div class="container">
          <div class="header"><h1>🇰🇷 K-Learn Korean</h1><p>Password Reset Request</p></div>
          <div class="content">
            <h2>안녕하세요 ${userName}! 👋</h2>
            <p>We received a request to reset your K-Learn password. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align:center"><a href="${resetUrl}" class="button">🔐 Reset My Password</a></div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <hr style="margin:30px 0;border:none;border-top:1px solid #ddd">
            <p><small>Copy this link if the button doesn't work:<br><a href="${resetUrl}">${resetUrl}</a></small></p>
          </div>
          <div class="footer"><p>The K-Learn Korean Team 🇰🇷</p></div>
        </div></body></html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    return { success: true };
  }

  async sendClaimCode(purchaseEmail, code) {
    if (!this.resend) throw new Error('Email service not configured');

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: purchaseEmail,
      subject: '🔑 Your K-Learn Purchase Verification Code',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          .container{max-width:600px;margin:0 auto;font-family:Arial,sans-serif}
          .header{background:linear-gradient(135deg,#EC4899 0%,#8B5CF6 100%);color:white;padding:30px;text-align:center}
          .content{padding:30px;background:#f8f9fa}
          .code-box{background:white;border:2px dashed #8B5CF6;border-radius:12px;padding:24px;text-align:center;margin:24px 0}
          .code{font-size:40px;font-weight:900;letter-spacing:12px;color:#8B5CF6;font-family:monospace}
          .footer{padding:20px;text-align:center;color:#666;font-size:14px}
        </style></head>
        <body><div class="container">
          <div class="header">
            <h1>🇰🇷 K-Learn Korean</h1>
            <p>Purchase Verification</p>
          </div>
          <div class="content">
            <h2>Your verification code</h2>
            <p>Someone is linking this Gumroad purchase to their K-Learn account. Enter this code to confirm:</p>
            <div class="code-box">
              <div class="code">${code}</div>
              <p style="color:#888;font-size:13px;margin-top:12px">Expires in 15 minutes</p>
            </div>
            <p>If you didn't request this, you can safely ignore this email — your purchase is still safe.</p>
          </div>
          <div class="footer"><p>The K-Learn Korean Team 🇰🇷</p></div>
        </div></body></html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send claim code: ${error.message}`);
    }

    return { success: true };
  }

  async sendWelcomeEmail(userEmail, userName) {
    if (!this.resend) throw new Error('Email service not configured');

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: userEmail,
      subject: '🎉 Welcome to K-Learn Korean - Your Journey Begins!',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          .container{max-width:600px;margin:0 auto;font-family:Arial,sans-serif}
          .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center}
          .content{padding:30px;background:#f8f9fa}
          .button{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:15px 30px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;margin:20px 0}
          .footer{padding:20px;text-align:center;color:#666;font-size:14px}
          .feature-box{background:white;padding:20px;border-radius:8px;margin:15px 0;border-left:4px solid #667eea}
        </style></head>
        <body><div class="container">
          <div class="header"><h1>🎉 환영합니다! Welcome!</h1><p>Your Korean learning adventure starts now!</p></div>
          <div class="content">
            <h2>Hello ${userName}! 👋</h2>
            <p>Your email has been verified! Your K-Learn Korean account is now fully active.</p>
            <div style="text-align:center">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">🚀 Start Learning Now</a>
            </div>
            <div class="feature-box"><h4>📝 Master Hangul</h4><p>Learn to read and write Korean characters.</p></div>
            <div class="feature-box"><h4>📚 Build Vocabulary</h4><p>1000+ words with AI-powered examples.</p></div>
            <div class="feature-box"><h4>🧠 Spaced Repetition</h4><p>Never forget what you've learned.</p></div>
            <div class="feature-box"><h4>🗣️ AI Conversations</h4><p>Practice real Korean conversations.</p></div>
            <p style="text-align:center"><em>화이팅! (Fighting! - You can do it!)</em></p>
          </div>
          <div class="footer"><p>The K-Learn Korean Team 🇰🇷</p></div>
        </div></body></html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    return { success: true };
  }
}

module.exports = new EmailService();
