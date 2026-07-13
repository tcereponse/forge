import { NextRequest, NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

/**
 * POST /api/bridge/constitution-report
 *
 * Called by the KIROV3 extension v14.1 after it validates the captured code.
 * The extension sends its validation report (issues found + fixes applied).
 *
 * The server stores this report in memory (keyed by missionId) so that
 * autoHealingCycles() can use it to skip redundant healing if the extension
 * already fixed everything.
 *
 * Body:
 *   {
 *     "missionId": "oneshot_...",
 *     "ok": true/false,
 *     "criticalCount": 0,
 *     "errorCount": 0,
 *     "warningCount": 0,
 *     "fixesApplied": ["Index.html->index.html", "BrowserRouter->HashRouter"],
 *     "issues": [{ severity, path, issue, rule }],
 *     "timestamp": 1783927000000
 *   }
 *
 * Returns: { success: true, stored: true }
 */

// In-memory store (keyed by missionId) — persists for the server's lifetime
const reportStore = new Map<string, ExtensionValidationReport>();

export interface ExtensionValidationReport {
  missionId: string;
  ok: boolean;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  fixesApplied: string[];
  issues: Array<{ severity: string; path: string; issue: string; rule: string }>;
  timestamp: number;
}

/** Get the latest extension validation report for a mission (or the latest overall). */
export function getExtensionReport(missionId?: string): ExtensionValidationReport | null {
  if (missionId) {
    return reportStore.get(missionId) || null;
  }
  // Return the most recent report
  let latest: ExtensionValidationReport | null = null;
  for (const report of reportStore.values()) {
    if (!latest || report.timestamp > latest.timestamp) {
      latest = report;
    }
  }
  return latest;
}

/** Clear reports (called on mission reset). */
export function clearExtensionReports(): void {
  reportStore.clear();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const report: ExtensionValidationReport = {
      missionId: body.missionId || "unknown",
      ok: Boolean(body.ok),
      criticalCount: Number(body.criticalCount) || 0,
      errorCount: Number(body.errorCount) || 0,
      warningCount: Number(body.warningCount) || 0,
      fixesApplied: Array.isArray(body.fixesApplied) ? body.fixesApplied : [],
      issues: Array.isArray(body.issues) ? body.issues : [],
      timestamp: Number(body.timestamp) || Date.now(),
    };

    reportStore.set(report.missionId, report);
    console.log(`[constitution-report] Stored report for ${report.missionId}: ok=${report.ok}, critical=${report.criticalCount}, fixes=${report.fixesApplied.length}`);

    return withCORS(NextResponse.json({
      success: true,
      stored: true,
      ok: report.ok,
      message: report.ok
        ? "Rapport reçu — code validé côté extension, le serveur skipera le healing"
        : `Rapport reçu — ${report.criticalCount} erreurs critiques, le serveur fera le healing`,
    }));
  } catch (e) {
    return withCORS(NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erreur" },
      { status: 500 }
    ));
  }
}

/** GET — returns the latest report (useful for debugging). */
export async function GET() {
  const report = getExtensionReport();
  if (!report) {
    return withCORS(NextResponse.json({ success: true, report: null }));
  }
  return withCORS(NextResponse.json({ success: true, report }));
}
