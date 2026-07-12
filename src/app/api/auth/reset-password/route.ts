import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token et mot de passe requis" }, { status: 400 });
    }

    // Validate password
    const validation = validatePassword(password);
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Find user by reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Token invalide ou expiré" }, { status: 401 });
    }

    // Update password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        resetToken: null,
        resetExpiry: null,
      },
    });

    return NextResponse.json({ success: true, message: "Mot de passe réinitialisé" });
  } catch (error) {
    console.error("[/api/auth/reset-password]", error);
    return NextResponse.json({ success: false, error: "Erreur" }, { status: 500 });
  }
}
