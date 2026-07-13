import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { decryptPassword } from "@/lib/password-crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const trimmedEmail = String(email || "").trim().toLowerCase();

    if (!trimmedEmail) {
      return NextResponse.json({ success: false, error: "Email requis" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: trimmedEmail } });

    // Always return success (don't leak if email exists)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si cet email existe, ton mot de passe t'a été envoyé.",
      });
    }

    // Decrypt the password
    let plainPassword = "";
    try {
      plainPassword = decryptPassword(user.passwordHash);
    } catch {
      return NextResponse.json({
        success: true,
        message: "Si cet email existe, ton mot de passe t'a été envoyé.",
      });
    }

    // Send the password by email
    const emailResult = await sendEmail({
      to: user.email,
      subject: "React Forge — Ton mot de passe",
      text: `Bonjour ${user.username},\n\nTu as demandé ton mot de passe sur React Forge.\n\nTon mot de passe est : ${plainPassword}\n\nPour le modifier, connecte-toi puis va dans ton profil.\n\n— L'équipe React Forge`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #06b6d4;">React Forge</h2>
          <p>Bonjour <strong>${user.username}</strong>,</p>
          <p>Tu as demandé ton mot de passe. Le voici :</p>
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <span style="font-family: monospace; font-size: 20px; color: #06b6d4; font-weight: bold;">${plainPassword}</span>
          </div>
          <p>Connecte-toi avec ce mot de passe, puis tu pourras le modifier dans ton profil.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 11px;">— L'équipe React Forge</p>
        </div>
      `,
    });

    if (emailResult.sent) {
      return NextResponse.json({
        success: true,
        message: `Ton mot de passe a été envoyé à ${user.email}. Vérifie ta boîte de réception (et tes spams).`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Impossible d'envoyer l'email. Réessaie plus tard.",
      });
    }
  } catch (error) {
    console.error("[/api/auth/forgot-password]", error);
    return NextResponse.json({ success: false, error: "Erreur" }, { status: 500 });
  }
}
