"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Plus,
  RotateCcw,
  Trash2,
  Loader2,
  Camera,
  FileCode2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchWithRetry } from "@/lib/fetch-retry";

interface SnapshotMeta {
  id: string;
  label: string;
  fileCount: number;
  note: string;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  return `il y a ${days} j`;
}

export function SnapshotsPanel({ projectId }: { projectId: string }) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<SnapshotMeta | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry(`/api/projects/${projectId}/snapshots`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setSnapshots(data.snapshots);
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetchWithRetry(`/api/projects/${projectId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Snapshot « ${data.snapshot.label} » créé`);
        setLabel("");
        setNote("");
        await load();
      } else {
        toast.error(data.error || "Échec de la création");
      }
    } catch {
      toast.error("Erreur réseau lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function handleRestore(s: SnapshotMeta) {
    setRestoring(s.id);
    try {
      const res = await fetchWithRetry(
        `/api/projects/${projectId}/snapshots/${s.id}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Projet restauré");
        setRestoreTarget(null);
        // Refresh the project in the store so the UI updates with restored files
        const { useForgeStore } = await import("@/hooks/use-forge-store");
        await useForgeStore.getState().refreshCurrentProject();
      } else {
        toast.error(data.error || "Échec de la restauration");
      }
    } catch {
      toast.error("Erreur réseau lors de la restauration");
    } finally {
      setRestoring(null);
    }
  }

  async function handleDelete(s: SnapshotMeta) {
    setDeleting(s.id);
    try {
      const res = await fetchWithRetry(
        `/api/projects/${projectId}/snapshots/${s.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Snapshot supprimé");
        await load();
      } else {
        toast.error(data.error || "Échec de la suppression");
      }
    } catch {
      toast.error("Erreur réseau lors de la suppression");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="custom-scroll h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-300" />
          <h2 className="text-base font-semibold text-slate-100">
            Snapshots & historique
          </h2>
          <Badge
            variant="outline"
            className="border-slate-700 bg-slate-900/60 text-[10px] text-slate-400"
          >
            {snapshots.length}
          </Badge>
        </div>
        <p className="mb-5 text-xs leading-relaxed text-slate-400">
          Sauvegarde des points de restauration avant de faire évoluer ou
          régénérer ton projet. Chaque snapshot capture l&apos;état complet des
          fichiers et du PRD. Tu peux restaurer un snapshot à tout moment — les
          fichiers actuels seront remplacés.
        </p>

        {/* Create form */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Camera className="h-3.5 w-3.5 text-cyan-300" />
            Créer un nouveau snapshot
          </p>
          <div className="space-y-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Libellé (ex: Avant ajout dark mode) — optionnel"
              maxLength={80}
              className="border-slate-700 bg-slate-950/60 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/40"
            />
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note descriptive (optionnel)"
              maxLength={280}
              className="border-slate-700 bg-slate-950/60 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/40"
            />
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {creating ? "Création…" : "Sauvegarder le snapshot"}
            </Button>
          </div>
        </div>

        {/* Snapshots list */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement des snapshots…
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-12 text-center">
            <History className="mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">
              Aucun snapshot pour l&apos;instant.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Crée ton premier snapshot ci-dessus pour pouvoir revenir en
              arrière plus tard.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {snapshots.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.04 }}
                  className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 transition hover:border-slate-700"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
                    <Camera className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {s.label}
                      </p>
                      {i === 0 && (
                        <Badge className="shrink-0 bg-emerald-500/15 text-[9px] text-emerald-300 hover:bg-emerald-500/15">
                          <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                          récent
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {timeAgo(s.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileCode2 className="h-3 w-3" />
                        {s.fileCount} fichiers
                      </span>
                    </div>
                    {s.note && (
                      <p className="mt-1 line-clamp-1 text-[11px] italic text-slate-500">
                        « {s.note} »
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRestoreTarget(s)}
                      disabled={restoring === s.id}
                      className="h-8 border-slate-700 bg-slate-900/60 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                    >
                      {restoring === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1 hidden sm:inline">Restaurer</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(s)}
                      disabled={deleting === s.id}
                      className="h-8 px-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      {deleting === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Restore confirmation dialog */}
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
      >
        <AlertDialogContent className="border-slate-800 bg-slate-950 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Restaurer ce snapshot ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Le projet « {restoreTarget?.label} » sera réinitialisé aux
              fichiers de ce snapshot ({restoreTarget?.fileCount} fichiers).
              L&apos;état actuel sera remplacé. Pense à créer un snapshot
              d&apos;abord si tu veux le conserver.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreTarget && handleRestore(restoreTarget)}
              className={cn(
                "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
              )}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
