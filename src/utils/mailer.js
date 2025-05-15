import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const domain = process.env.RESEND_DOMAIN;

const EMAIL_TEMPLATES = {
  INTEREST: (senderName) => ({
    subject: `Dev Connect | ${senderName} is interested in you!`,
    html: `<p>${senderName} has shown interest in you. Check their profile now!</p>`,
    plainTextContent: `${senderName} has shown interest in you. Check their profile now!`
  }),

  VERIFICATION: (verificationToken) => ({
    subject: "Verify Your Email Address",
    html: `<p>Verification code : ${verificationToken} </p>`,
    plainTextContent: `Verification code : ${verificationToken}`
  }),

  FORGOT_PASSWORD: (resetLink) => ({
    subject: "Reset Your Password",
    html: `<p>Click the link below to reset your password:</p>
           <a href="${resetLink}">Reset Password</a>`,
    plainTextContent: "Click the link below to reset your password: " + resetLink,
  }),

  PASSWORD_CHANGED: (user) => ({
    subject: "Password Changed",
    html: `<p>Hi ${user}, Your password has been changed</p>`,
    plainTextContent: "Hi ${user}, Your password has been changed",
  }),

  USER_WELCOME: (userName) => ({
    subject: `Welcome to Dev Connect, ${userName}!`,
    html: `<p>Hi <strong>${userName}</strong>,</p>
           <p>Welcome to Dev Connect! We're excited to have you onboard. Start exploring and connect with fellow developers today.</p>`,
    plainTextContent: `Hi ${userName},\n\nWelcome to Dev Connect! We're excited to have you onboard. Start exploring and connect with fellow developers today.`
  }),

  USER_LOGIN: ({ browser, browserVersion, os, osVersion, device }) => ({
    subject: `New Login Detected`,
    html: `
    <h2>New Login Detected</h2>
    <p>A login to your account was detected from the following device:</p>
    <ul>
      <li>Device: ${device}</li>
      <li>Browser: ${browser} ${browserVersion}</li>
      <li>OS: ${os} ${osVersion}</li>
    </ul>
    <p>If this was not you, please secure your account immediately.</p>`,
    plainTextContent: `A login to your account was detected from ${device}`
  }),

  REMINDER_CRON_JOB: (email) => ({
    subject: "New Friend Requests pending for " + email,
    html: `<p>There are friend requests pending, please login to Dev-Connect and accept or reject the requests.</p>`,
    plainTextContent: "There are friend requests pending, please login to Dev-Connect and accept or reject the requests."
  })
};

const sendEmail = async (recipientEmail, type, data) => {
  try {
    if (!EMAIL_TEMPLATES[type]) {
      throw new Error("Invalid email type");
    }

    const { subject, html, plainTextContent } = EMAIL_TEMPLATES[type](data);

    const response = await resend.emails.send({
      from: "dev-connect@" + domain,
      to: recipientEmail,
      subject,
      html,
      text: plainTextContent,
    });

    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
