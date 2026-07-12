import nodemailer from "nodemailer";

/** Email transporter — uses Gmail SMTP. */
function getTransporter() {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends an email. Returns true if sent, false if SMTP not configured. */
export async function sendEmail(options: SendEmailOptions): Promise<{ sent: boolean; error?: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    return { sent: false, error: "SMTP non configuré (SMTP_USER/SMTP_PASS manquants dans .env)" };
  }

  try {
    await transporter.sendMail({
      from: `"React Forge" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return { sent: true };
  } catch (error) {
    console.error("[sendEmail]", error);
    return { sent: false, error: error instanceof Error ? error.message : "Erreur d'envoi" };
  }
}

/** Sends a password reset email with the reset link. */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetUrl: string
): Promise<{ sent: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: "React Forge — Réinitialisation de ton mot de passe",
    text: `Bonjour ${username},\n\nTu as demandé à réinitialiser ton mot de passe sur React Forge.\n\nClique sur ce lien pour définir un nouveau mot de passe :\n${resetUrl}\n\nCe lien expire dans 1 heure.\n\nSi tu n'as pas fait cette demande, ignore cet email.\n\n— L'équipe React Forge`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #06b6d4;">React Forge</h2>
        <p>Bonjour <strong>${username}</strong>,</p>
        <p>Tu as demandé à réinitialiser ton mot de passe sur React Forge.</p>
        <p>Clique sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
        <a href="${resetUrl}" style="display: inline-block; background: #06b6d4; color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Réinitialiser mon mot de passe</a>
        <p style="color: #64748b; font-size: 12px;">Ou copie ce lien : ${resetUrl}</p>
        <p style="color: #64748b; font-size: 12px;">Ce lien expire dans 1 heure.</p>
        <p style="color: #64748b; font-size: 12px;">Si tu n'as pas fait cette demande, ignore cet email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 11px;">— L'équipe React Forge</p>
      </div>
    `,
  });
}

/** Sends a welcome email after registration. */
export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Bienvenue sur React Forge !",
    text: `Bonjour ${username},\n\nTon compte React Forge a été créé avec succès.\n\nTu peux maintenant créer des projets React complets avec l'IA GLM-4.6.\n\n— L'équipe React Forge`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #06b6d4;">Bienvenue sur React Forge ! 🎉</h2>
        <p>Bonjour <strong>${username}</strong>,</p>
        <p>Ton compte a été créé avec succès. Tu peux maintenant :</p>
        <ul>
          <li>Créer des projets React complets avec l'IA</li>
          <li>Générer du code Gold Grade (5 passes LLM)</li>
          <li>Compiler des APK Android</li>
          <li>Exporter en ZIP</li>
        </ul>
        <p>Connecte-toi pour commencer : ${process.env.NEXTAUTH_URL || "https://react-forge.app"}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 11px;">— L'équipe React Forge</p>
      </div>
    `,
  });
}

/** Sends a account deletion confirmation email. */
export async function sendAccountDeletedEmail(email: string, username: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "React Forge — Compte supprimé",
    text: `Bonjour ${username},\n\nTon compte React Forge a été supprimé avec succès. Tous tes projets ont été définitivement supprimés.\n\nSi tu souhaites revenir, tu peux créer un nouveau compte à tout moment.\n\n— L'équipe React Forge`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #06b6d4;">Compte supprimé</h2>
        <p>Bonjour <strong>${username}</strong>,</p>
        <p>Ton compte React Forge a été supprimé avec succès. Tous tes projets ont été définitivement supprimés.</p>
        <p>Si tu souhaites revenir, tu peux créer un nouveau compte à tout moment.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 11px;">— L'équipe React Forge</p>
      </div>
    `,
  });
}
