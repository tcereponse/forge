import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-static";

/** Serves the mobile app's index.html from public/mobile/.
 * Injects a <base href="/mobile/"> tag so relative asset paths resolve correctly
 * regardless of whether the URL has a trailing slash or not.
 */
export async function GET() {
  try {
    let html = await fs.readFile(
      path.join(process.cwd(), "public", "mobile", "index.html"),
      "utf-8"
    );
    // Inject <base href="/mobile/"> after <head> so relative URLs (./assets/...) resolve correctly
    html = html.replace("<head>", '<head>\n    <base href="/mobile/">');
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new Response("Mobile app not found. Run: cd mobile-app && npx vite build", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
