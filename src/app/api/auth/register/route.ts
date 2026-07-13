import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, validatePassword, createSession } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();
    const trimmedUsername = String(username || "").trim().toLowerCase();
    const trimmedEmail = String(email || "").trim().toLowerCase();

    // Validate username
    if (trimmedUsername.length < 3) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur: 3 caractères minimum" }, { status: 400 });
    }
    if (trimmedUsername.length > 30) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur: 30 caractères maximum" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur: lettres, chiffres, _ et - uniquement" }, { status: 400 });
    }

    // Validate email
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ success: false, error: "Email invalide" }, { status: 400 });
    }

    // Validate password
    const validation = validatePassword(password);
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Check if username already exists
    const existingUsername = await db.user.findUnique({ where: { username: trimmedUsername } });
    if (existingUsername) {
      return NextResponse.json({ success: false, error: "Ce nom d'utilisateur est déjà pris" }, { status: 409 });
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({ where: { email: trimmedEmail } });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    // Create user
    const user = await db.user.create({
      data: {
        username: trimmedUsername,
        email: trimmedEmail,
        passwordHash: hashPassword(password),
      },
    });

    // Create session
    const token = await createSession(user.id, user.username);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.username).catch(() => {});

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
    });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[/api/auth/register]", error);
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ success: false, error: `Erreur: ${errorMsg}` }, { status: 500 });
  }
}
