import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/projects/[id]/cloud-download?github_token=ghp_xxx
 *
 * Cloud Forge — Poll GitHub Actions status + proxy artifact download.
 *
 * If ?download=true, proxies the artifact ZIP download (with GitHub auth).
 * Otherwise returns status info.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const githubToken = url.searchParams.get("github_token");
    const owner = url.searchParams.get("owner") || "tcereponse";
    const repo = url.searchParams.get("repo") || "apk-builder";
    const wantDownload = url.searchParams.get("download") === "true";

    if (!githubToken) {
      return NextResponse.json(
        { success: false, error: "Token GitHub manquant" },
        { status: 400 }
      );
    }

    const API_BASE = `https://api.github.com/repos/${owner}/${repo}`;

    const githubApi = async (path: string) => {
      const res = await fetch(`${API_BASE}/${path}`, {
        headers: {
          "Authorization": `token ${githubToken}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "CloudForge-Vercel/1.0",
        },
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`GitHub API ${res.status}: ${errText.slice(0, 200)}`);
      }
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    };

    // 1. Get latest workflow runs
    const runs = await githubApi("actions/runs?per_page=5");
    const workflowRuns = runs.workflow_runs || [];

    if (workflowRuns.length === 0) {
      return NextResponse.json({
        success: false,
        status: "no_runs",
        message: "Aucun run GitHub Actions trouvé",
      });
    }

    const latestRun = workflowRuns[0];
    const runId = latestRun.id;
    const status = latestRun.status;
    const conclusion = latestRun.conclusion;
    const htmlUrl = latestRun.html_url;

    console.log(`[cloud-download] Run #${latestRun.run_number}: ${status}/${conclusion}`);

    // 2. Still building
    if (status === "queued" || status === "in_progress") {
      return NextResponse.json({
        success: false,
        status: "building",
        run_id: runId,
        run_number: latestRun.run_number,
        message: `Compilation en cours... (${status})`,
        html_url: htmlUrl,
      });
    }

    // 3. Failed
    if (conclusion === "failure") {
      return NextResponse.json({
        success: false,
        status: "failed",
        run_id: runId,
        message: "Le build a échoué sur GitHub Actions",
        html_url: htmlUrl,
      });
    }

    // 4. Success — get artifacts
    if (status === "completed" && conclusion === "success") {
      const artifacts = await githubApi(`actions/runs/${runId}/artifacts`);
      const artifactList = artifacts.artifacts || [];

      if (artifactList.length === 0) {
        return NextResponse.json({
          success: false,
          status: "no_artifact",
          message: "Build réussi mais aucun artefact trouvé",
          html_url: htmlUrl,
        });
      }

      const artifact = artifactList[0];
      const artifactSize = (artifact.size_in_bytes / 1024 / 1024).toFixed(1);
      const downloadUrl = artifact.archive_download_url;

      // If download=true, proxy the artifact ZIP download with GitHub auth
      if (wantDownload) {
        console.log(`[cloud-download] Proxying artifact download: ${artifact.name}`);
        const zipRes = await fetch(downloadUrl, {
          headers: {
            "Authorization": `token ${githubToken}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "CloudForge-Vercel/1.0",
          },
        });

        if (!zipRes.ok) {
          return NextResponse.json(
            { success: false, error: `Download failed: ${zipRes.status}` },
            { status: 502 }
          );
        }

        const zipBuffer = await zipRes.arrayBuffer();
        return new NextResponse(zipBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${artifact.name}.zip"`,
            "Content-Length": String(zipBuffer.byteLength),
          },
        });
      }

      // Otherwise return status + download link (with download=true param)
      const projectId = id;
      const proxyDownloadUrl = `/api/projects/${projectId}/cloud-download?github_token=${encodeURIComponent(githubToken)}&download=true`;

      return NextResponse.json({
        success: true,
        status: "success",
        run_id: runId,
        run_number: latestRun.run_number,
        artifact_name: artifact.name,
        artifact_size: `${artifactSize} MB`,
        download_url: proxyDownloadUrl,
        message: `APK prêt! ${artifact.name} (${artifactSize} MB)`,
        html_url: htmlUrl,
      });
    }

    return NextResponse.json({
      success: false,
      status: "unknown",
      message: `Statut inconnu: ${status}/${conclusion}`,
      html_url: htmlUrl,
    });
  } catch (error) {
    console.error("[cloud-download]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
