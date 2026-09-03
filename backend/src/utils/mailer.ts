import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOTPEmail(to: string, otp: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: `"Disaster Management System" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your Verification Code — Disaster Management System',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
        <h2 style="color:#60a5fa;margin:0 0 8px">Disaster Management System</h2>
        <p style="color:#94a3b8;margin:0 0 24px">Bangladesh Relief Coordination Platform</p>
        <hr style="border:1px solid #1e293b;margin-bottom:24px"/>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your email verification code is:</p>
        <div style="background:#1e293b;border:2px solid #3b82f6;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">
          <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#60a5fa;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border:1px solid #1e293b;margin:24px 0"/>
        <p style="color:#475569;font-size:12px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
