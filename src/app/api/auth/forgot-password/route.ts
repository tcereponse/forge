import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

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
      return NextResponse.json({ success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    }

    // Generate reset token (valid 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpiry },
    });

    // Build the reset URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const resetUrl = `${protocol}://${host}/?reset=${resetToken}`;

    // Send the email
    const emailResult = await sendPasswordResetEmail(user.email, user.username, resetUrl);

    if (emailResult.sent) {
      return NextResponse.json({
        success: true,
        message: `Un email de réinitialisation a été envoyé à ${user.email}. Vérifie ta boîte de réception (et tes spams).`,
      });
    } else {
      // SMTP not configured — return the reset URL for dev mode
      return NextResponse.json({
        success: true,
        message: "Email non envoyé (SMTP non configuré). Voici le lien de réinitialisation :",
        resetUrl,
        smtpError: emailResult.error,
      });
    }
  } catch (error) {
    console.error("[/api/auth/forgot-password]", error);
    return NextResponse.json({ success: false, error: "Erreur" }, { status: 500 });
  }
}
