import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, getTokenFromRequest, deleteSession } from "@/lib/auth";
import { sendAccountDeletedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Non connecté" }, { status: 401 });
    }

    // Get user email before deletion (for confirmation email)
    const user = await db.user.findUnique({ where: { id: session.userId } });

    // Delete user (cascades to projects via onDelete: Cascade)
    await db.user.delete({ where: { id: session.userId } });

    // Send confirmation email (non-blocking)
    if (user?.email) {
      sendAccountDeletedEmail(user.email, user.username).catch(() => {});
    }

    // Delete session
    await deleteSession(token);

    const response = NextResponse.json({ success: true, message: "Compte supprimé" });
    response.cookies.delete("auth-token");
    return response;
  } catch (error) {
    console.error("[/api/auth/delete-account]", error);
    return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
