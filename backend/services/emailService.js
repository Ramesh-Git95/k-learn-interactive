const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // For development, use Ethereal Email (fake SMTP service)
    // For production, use real email service like SendGrid, AWS SES, etc.
    
    if (process.env.NODE_ENV === 'production') {
      // Production email service (configure based on your provider)
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Development - use Gmail SMTP for real emails during testing
      // You can also use Ethereal but it's often unreliable
      
      // Option 1: Use Gmail SMTP (requires app password)
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
          },
        });
        console.log('📧 Email service initialized with Gmail SMTP');
      } else {
        // Option 2: Fallback to Ethereal with better error handling
        this.initializeEtherealWithRetry();
      }
    }
  }

  async initializeEtherealWithRetry(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const account = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: account.user,
            pass: account.pass,
          },
          connectionTimeout: 10000, // 10 seconds
          greetingTimeout: 5000,    // 5 seconds
          socketTimeout: 10000,     // 10 seconds
        });

        console.log('📧 Email service initialized with Ethereal test account:');
        console.log('   User:', account.user);
        console.log('   Pass:', account.pass);
        return;
      } catch (error) {
        console.warn(`Failed to create Ethereal account (attempt ${i + 1}/${retries}):`, error.message);
        if (i === retries - 1) {
          console.error('❌ All Ethereal attempts failed. Email service disabled.');
          this.transporter = null;
        }
      }
    }
  }

  async sendVerificationEmail(userEmail, userName, verificationToken) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"K-Learn Korean" <noreply@k-learn.com>',
      to: userEmail,
      subject: '✨ Verify Your K-Learn Account - Start Your Korean Journey!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your K-Learn Account</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .button { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .korean-text { font-size: 24px; color: #667eea; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🇰🇷 K-Learn Korean</h1>
              <p class="korean-text">한글배움</p>
              <p>Welcome to your Korean learning journey!</p>
            </div>
            
            <div class="content">
              <h2>안녕하세요 ${userName}! 👋</h2>
              
              <p>Thank you for joining K-Learn Korean! We're excited to help you master the beautiful Korean language.</p>
              
              <p>To get started and access all features, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">
                  ✨ Verify My Email Address
                </a>
              </div>
              
              <p><strong>What's waiting for you:</strong></p>
              <ul>
                <li>📚 Interactive Hangul learning with pronunciation</li>
                <li>🎯 Vocabulary building with AI-powered examples</li>
                <li>📖 Grammar lessons with cultural context</li>
                <li>🗣️ Common phrases for real conversations</li>
                <li>🎨 Korean culture and customs exploration</li>
                <li>🧠 Smart spaced repetition system (SRS)</li>
                <li>🏆 Progress tracking and achievements</li>
              </ul>
              
              <p>This verification link will expire in 24 hours for security reasons.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p><small>
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}">${verificationUrl}</a>
              </small></p>
              
              <p><small>
                If you didn't create this account, you can safely ignore this email.
              </small></p>
            </div>
            
            <div class="footer">
              <p>Happy learning! 📖✨</p>
              <p>The K-Learn Korean Team</p>
              <p style="margin-top: 20px;">
                <em>화이팅! (Fighting! - You can do it!)</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to K-Learn Korean!
        
        Hello ${userName},
        
        Thank you for joining K-Learn Korean! To complete your registration and start learning, please verify your email address.
        
        Click here to verify: ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, you can safely ignore this email.
        
        Happy learning!
        The K-Learn Korean Team
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // In development, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Verification email sent!');
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    if (!this.transporter) throw new Error('Email transporter not initialized');

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"K-Learn Korean" <noreply@k-learn.com>',
      to: userEmail,
      subject: '🔐 Reset Your K-Learn Password',
      html: `
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          .container { max-width:600px; margin:0 auto; font-family:Arial,sans-serif; }
          .header { background:linear-gradient(135deg,#EC4899 0%,#8B5CF6 100%); color:white; padding:30px; text-align:center; }
          .content { padding:30px; background:#f8f9fa; }
          .button { background:linear-gradient(135deg,#EC4899,#8B5CF6); color:white; padding:15px 30px; text-decoration:none; border-radius:8px; display:inline-block; font-weight:bold; margin:20px 0; }
          .footer { padding:20px; text-align:center; color:#666; font-size:14px; }
        </style></head>
        <body><div class="container">
          <div class="header"><h1>🇰🇷 K-Learn Korean</h1><p>Password Reset Request</p></div>
          <div class="content">
            <h2>안녕하세요 ${userName}! 👋</h2>
            <p>We received a request to reset the password for your K-Learn account.</p>
            <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align:center;">
              <a href="${resetUrl}" class="button">🔐 Reset My Password</a>
            </div>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
            <hr style="margin:30px 0;border:none;border-top:1px solid #ddd;">
            <p><small>If the button doesn't work, copy and paste this link:<br>
            <a href="${resetUrl}">${resetUrl}</a></small></p>
          </div>
          <div class="footer"><p>The K-Learn Korean Team 🇰🇷</p></div>
        </div></body></html>
      `,
      text: `Password Reset\n\nHello ${userName},\n\nReset your K-Learn password here:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`
    };

    const info = await this.transporter.sendMail(mailOptions);
    return {
      success: true,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
    };
  }

  async sendWelcomeEmail(userEmail, userName) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"K-Learn Korean" <noreply@k-learn.com>',
      to: userEmail,
      subject: '🎉 Welcome to K-Learn Korean - Your Journey Begins!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to K-Learn Korean</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f8f9fa; }
            .button { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .feature-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 환영합니다! Welcome!</h1>
              <p>Your Korean learning adventure starts now!</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userName}! 👋</h2>
              
              <p>Your email has been verified and your K-Learn Korean account is now active! We're thrilled to have you join our community of Korean language learners.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">
                  🚀 Start Learning Now
                </a>
              </div>
              
              <h3>🎯 Your Learning Path:</h3>
              
              <div class="feature-box">
                <h4>📝 1. Master Hangul (Korean Alphabet)</h4>
                <p>Start with the foundation - learn to read and write Korean characters with interactive exercises.</p>
              </div>
              
              <div class="feature-box">
                <h4>📚 2. Build Your Vocabulary</h4>
                <p>Learn essential Korean words with AI-powered example sentences and pronunciation guides.</p>
              </div>
              
              <div class="feature-box">
                <h4>📖 3. Grammar & Sentence Structure</h4>
                <p>Understand Korean grammar patterns with cultural context and practical examples.</p>
              </div>
              
              <div class="feature-box">
                <h4>💬 4. Common Phrases & Conversations</h4>
                <p>Practice real-world Korean phrases for everyday situations.</p>
              </div>
              
              <div class="feature-box">
                <h4>🎨 5. Cultural Immersion</h4>
                <p>Discover Korean culture, customs, and modern trends to enhance your language learning.</p>
              </div>
              
              <h3>💡 Pro Tips for Success:</h3>
              <ul>
                <li>🔄 <strong>Consistency is key</strong> - Study for 15-20 minutes daily</li>
                <li>🎧 <strong>Listen actively</strong> - Use our pronunciation features</li>
                <li>📱 <strong>Practice everywhere</strong> - Our app works on all devices</li>
                <li>🌟 <strong>Join the community</strong> - Connect with fellow learners</li>
                <li>🎯 <strong>Set goals</strong> - Track your progress and celebrate wins</li>
              </ul>
              
              <p><strong>Ready to begin?</strong> Click the button above to access your personalized dashboard and start your first lesson!</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p style="text-align: center;">
                <em>Remember: 한 걸음씩 (han georeumssik) - One step at a time!</em><br>
                <strong>화이팅! (Fighting! - You can do it!)</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>Need help? Reply to this email or contact our support team.</p>
              <p>The K-Learn Korean Team</p>
              <p>🇰🇷 Making Korean accessible to everyone 🌍</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Welcome email sent!');
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Welcome email sending error:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}

module.exports = new EmailService();
