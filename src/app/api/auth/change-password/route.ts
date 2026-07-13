import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, getTokenFromRequest, verifyPassword, validatePassword } from "@/lib/auth";
import { encryptPassword } from "@/lib/password-crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non connecté" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Get user
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ success: false, error: "Ancien mot de passe incorrect" }, { status: 401 });
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: encryptPassword(newPassword) },
    });

    return NextResponse.json({ success: true, message: "Mot de passe modifié" });
  } catch (error) {
    console.error("[/api/auth/change-password]", error);
    return NextResponse.json({ success: false, error: "Erreur" }, { status: 500 });
  }
}
