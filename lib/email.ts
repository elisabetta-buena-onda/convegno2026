import nodemailer from 'nodemailer';

// In production or via .env, we pull the SMTP details
// Example Google config:
// SMTP_HOST="smtp.gmail.com"
// SMTP_PORT="465" (for secure)
// SMTP_USER="myemail@gmail.com"
// SMTP_PASS="myapppassword"

export const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });
};

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@convegno2026.it';

  // If no SMTP config is present, just mock it (useful for local development if not configured)
  if (!process.env.SMTP_USER && !process.env.SMTP_PASS) {
      console.log(`
        [MOCK EMAIL SENT]
        TO: ${to}
        FROM: ${from}
        SUBJECT: ${subject}
        ---------------------------
        ${html.replace(/<[^>]*>?/gm, '')} // Strips html tags for console reading
      `);
      return true;
  }

  try {
    const transporter = getTransporter();
    
    // verify connection configuration
    await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                resolve(success);
            }
        });
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    
    console.log("Messaggio inviato: %s", info.messageId);
    return true;
  } catch (err) {
    console.error("Errore invio email: ", err);
    throw new Error('Impossibile inviare l\'email. Verifica i paramentri SMTP.');
  }
}
