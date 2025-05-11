import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const domain = process.env.RESEND_DOMAIN;

const EMAIL_TEMPLATES = {
  INTEREST: (senderName) => ({
    subject: `Dev Connect | ${senderName} is interested in you!`,
    html: `<p>${senderName} has shown interest in you. Check their profile now!</p>`,
    plainTextContent: `${senderName} has shown interest in you. Check their profile now!`
  }),

  VERIFICATION: (verificationLink) => ({
    subject: "Verify Your Email Address",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verificationLink}">Verify Email</a>`,
    plainTextContent: "Click the link below to verify your email: " + verificationLink,
  }),

  FORGOT_PASSWORD: (resetLink) => ({
    subject: "Reset Your Password",
    html: `<p>Click the link below to reset your password:</p>
           <a href="${resetLink}">Reset Password</a>`,
    plainTextContent: "Click the link below to reset your password: " + resetLink,
  }),

  REMINDER_CRON_JOB: (email) =>({
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

    console.log(`Email sent to ${recipientEmail} : ${response.data.id}`);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
