import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, validatePassword, createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const trimmedUsername = String(username || "").trim();

    if (trimmedUsername.length < 3) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur: 3 caractères minimum" }, { status: 400 });
    }
    if (trimmedUsername.length > 30) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur: 30 caractères maximum" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur: lettres, chiffres, _ et - uniquement" }, { status: 400 });
    }

    const validation = validatePassword(password);
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Check if username already exists
    const existing = await db.user.findUnique({ where: { username: trimmedUsername } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Ce nom d'utilisateur est déjà pris" }, { status: 409 });
    }

    // Create user
    const user = await db.user.create({
      data: {
        username: trimmedUsername,
        passwordHash: hashPassword(password),
      },
    });

    // Create session
    const token = await createSession(user.id, user.username);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[/api/auth/register]", error);
    return NextResponse.json({ success: false, error: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
