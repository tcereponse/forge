import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const trimmedUsername = String(username || "").trim().toLowerCase();

    if (!trimmedUsername || !password) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur et mot de passe requis" }, { status: 400 });
    }

    // Case-insensitive: search by lowercase (username stored in lowercase at registration)
    const user = await db.user.findUnique({ where: { username: trimmedUsername } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur ou mot de passe incorrect" }, { status: 401 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ success: false, error: "Nom d'utilisateur ou mot de passe incorrect" }, { status: 401 });
    }

    const token = await createSession(user.id, user.username);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
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
    console.error("[/api/auth/login]", error);
    return NextResponse.json({ success: false, error: "Erreur de connexion" }, { status: 500 });
  }
}
