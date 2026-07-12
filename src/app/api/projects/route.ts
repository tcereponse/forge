import { NextRequest, NextResponse } from "next/server";
import { getSession, getTokenFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  type ProjectConfig,
  slugify,
  inferLanguage,
  type GeneratedFile,
} from "@/lib/forge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Gets the current user from the session token. Returns null if not authenticated. */
async function getCurrentUser(request: NextRequest): Promise<{ id: string; username: string } | null> {
  const token = getTokenFromRequest(request);
  const session = await getSession(token);
  if (!session) return null;
  return { id: session.userId, username: session.username };
}

interface RawFile {
  path: string;
  content?: string;
  language?: string;
}

function parseFiles(raw: unknown): GeneratedFile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is RawFile => typeof f === "object" && f !== null && "path" in f)
    .map((f) => ({
      path: String(f.path).replace(/^\.?\//, ""),
      content: String(f.content ?? ""),
      language: f.language || inferLanguage(String(f.path)),
    }))
    .filter((f) => f.path.length > 0);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    // STRICT: must be authenticated, only see own projects
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentification requise" }, { status: 401 });
    }

    const projects = await db.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        stack: true,
        typescript: true,
        styling: true,
        routing: true,
        stateMgmt: true,
        uiLib: true,
        features: true,
        fileCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({
      success: true,
      projects: projects.map((p) => ({
        ...p,
        features: safeParseFeatures(p.features),
      })),
    });
  } catch (error) {
    console.error("[/api/projects GET]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de lister les projets" },
      { status: 500 }
    );
  }
}

function safeParseFeatures(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ProjectConfig>;
    const name = body.name?.trim();
    const description = body.description?.trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Le nom du projet est requis" },
        { status: 400 }
      );
    }
    if (!description || description.length < 10) {
      return NextResponse.json(
        { success: false, error: "Décris ton application (10 caractères min.)" },
        { status: 400 }
      );
    }

    const config: ProjectConfig = {
      name,
      description,
      stack: body.stack ?? "vite",
      typescript: body.typescript ?? true,
      styling: body.styling ?? "tailwind",
      routing: body.routing ?? "router",
      stateMgmt: body.stateMgmt ?? "none",
      uiLib: body.uiLib ?? "none",
      features: Array.isArray(body.features) ? body.features : [],
      selectedPacks: Array.isArray(body.selectedPacks) ? body.selectedPacks : [],
    };

    const slug = slugify(name);
    // Ensure unique slug
    let uniqueSlug = slug;
    let n = 1;
    while (await db.project.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${n++}`;
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentification requise" }, { status: 401 });
    }

    const project = await db.project.create({
      data: {
        name: config.name,
        slug: uniqueSlug,
        description: config.description,
        userId: user.id,
        stack: config.stack,
        typescript: config.typescript,
        styling: config.styling,
        routing: config.routing,
        stateMgmt: config.stateMgmt,
        uiLib: config.uiLib,
        features: JSON.stringify(config.features),
        selectedPacks: JSON.stringify(config.selectedPacks ?? []),
        status: "draft",
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        features: config.features,
        prd: "",
        files: [] as GeneratedFile[],
      },
    });
  } catch (error) {
    console.error("[/api/projects POST]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de créer le projet" },
      { status: 500 }
    );
  }
}
