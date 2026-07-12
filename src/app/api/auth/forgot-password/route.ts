import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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
      return NextResponse.json({ success: true, message: "Si cet email existe, un lien de réinitialisation a été généré." });
    }

    // Generate reset token (valid 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpiry },
    });

    // Build the reset URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const resetUrl = `${protocol}://${host}/?reset=${resetToken}`;

    // In production, send email here. For now, return the reset URL.
    // (Email sending requires SMTP configuration — see .env SMTP_HOST)
    return NextResponse.json({
      success: true,
      message: "Lien de réinitialisation généré.",
      resetUrl, // In production, this would be sent by email instead
    });
  } catch (error) {
    console.error("[/api/auth/forgot-password]", error);
    return NextResponse.json({ success: false, error: "Erreur" }, { status: 500 });
  }
}
