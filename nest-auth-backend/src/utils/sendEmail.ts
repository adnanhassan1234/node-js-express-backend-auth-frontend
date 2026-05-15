/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  name: string;
  verifyLink: string;
}

const sendEmail = async ({
  to,
  subject,
  name,
  verifyLink,
}: SendEmailOptions) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: `
      <h2>Hello ${name}</h2>
      <p>Please click below to verify your email:</p>
      <a href="${verifyLink}">
        Verify Email
      </a>
    `,
  });
};

export default sendEmail;
