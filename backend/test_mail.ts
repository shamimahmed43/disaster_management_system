import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Wait, maybe we need to strip spaces?
  },
});

async function run() {
  try {
    console.log(`Sending mail with user: ${process.env.GMAIL_USER}, pass: ${process.env.GMAIL_APP_PASSWORD}`);
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // send to self
      subject: 'Test Email',
      text: 'Test mail to see if it works.'
    });
    console.log("Success! ", info.messageId);
  } catch (err) {
    console.error("Error: ", err);
  }
}

run();
