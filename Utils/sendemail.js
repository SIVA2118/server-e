import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html = null, attachmentPath = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000
    });

    await transporter.verify();
    console.log("✅ SMTP connection verified");

    const mailOptions = {
      from: `"Boutique App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    };

    // ✅ Attach PDF if provided
    if (attachmentPath) {
      mailOptions.attachments = [
        {
          filename: "invoice.pdf",
          path: attachmentPath,
          contentType: "application/pdf"
        }
      ];
    }

    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully to", to);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Email could not be sent");
  }
};
