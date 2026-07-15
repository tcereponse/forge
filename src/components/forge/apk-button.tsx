"use client";

import { useState } from "react";
import { Smartphone, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * APK download button — compiles a real .apk from the project's dist/ using
 * the Android SDK (aapt2, d8, javac, apksigner) and downloads it.
 */
export function ApkButton({ projectId }: { projectId: string }) {
  const [building, setBuilding] = useState(false);

  async function handleBuildApk() {
    setBuilding(true);
    toast.info("Compilation de l'APK en cours… (peut prendre 30-60s)");
    try {
      const res = await fetch(`/api/projects/${projectId}/build-apk`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Échec" }));
        toast.error(data.error || "Échec de la compilation APK");
        if (data.log) {
          console.error("[APK build log]", data.log);
        }
        return;
      }

      // The response is the APK file — download it
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract filename from Content-Disposition header, or use default
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.download = match ? match[1] : `${projectId}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`APK téléchargé : ${a.download} (${(blob.size / 1024 / 1024).toFixed(1)} Mo)`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur réseau lors de la compilation APK"
      );
    } finally {
      setBuilding(false);
    }
  }

  return (
    <Button
      onClick={handleBuildApk}
      disabled={building}
      size="sm"
      variant="outline"
      className={cn(
        "h-9 gap-2 border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-300",
        "hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-200"
      )}
    >
      {building ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Smartphone className="h-3.5 w-3.5" />
      )}
      {building ? "Compilation…" : "APK"}
      {!building && <Download className="h-3 w-3 opacity-60" />}
    </Button>
  );
}
