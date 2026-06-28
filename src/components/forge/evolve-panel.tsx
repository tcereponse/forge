"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Wand2,
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FEATURE_OPTIONS } from "@/lib/forge-config";
import { useForgeStore } from "@/hooks/use-forge-store";

const PACK_OPTIONS = [
  { id: "gamification_pack", label: "Gamification" },
  { id: "audio_pack", label: "Audio" },
  { id: "video_pack", label: "Vidéo" },
  { id: "image_pack", label: "Image" },
  { id: "commerce_paiement_pack", label: "Commerce & Paiement" },
  { id: "ecommerce_pack", label: "E-Commerce" },
  { id: "feed_social_pack", label: "Feed Social" },
  { id: "chat_comms_pack", label: "Chat & Comms" },
  { id: "blog_contenu_pack", label: "Blog & Contenu" },
  { id: "landing_pack", label: "Landing" },
  { id: "landing_saas_pack", label: "Landing SaaS" },
  { id: "saas_pack", label: "SaaS" },
  { id: "marketing_pack", label: "Marketing" },
  { id: "productivity_pack", label: "Productivity" },
  { id: "health_fitness_pack", label: "Health & Fitness" },
  { id: "mobile_pack", label: "Mobile" },
  { id: "forms_inputs_pack", label: "Forms & Inputs" },
  { id: "interface_pack", label: "Interface" },
  { id: "layout_pack", label: "Layout" },
  { id: "widget_pack", label: "Widget" },
  { id: "specialise_pack", label: "Spécialisé" },
  { id: "createur_pack", label: "Créateur" },
  { id: "design_figma_xd_pack", label: "Design (Figma/XD)" },
  { id: "app_web_pack", label: "App Web" },
  { id: "markdown_pack", label: "Markdown" },
  { id: "pdf_docs_pack", label: "PDF & Docs" },
  { id: "evenement_pack", label: "Événement" },
  { id: "local_maps_pack", label: "Local & Maps" },
  { id: "prd_crm_erp_pack", label: "CRM & ERP" },
  { id: "prd_ai_apps_pack", label: "AI Apps" },
  { id: "jeux_video_pack", label: "Jeux Vidéo" },
  { id: "prd_web_landing_pack", label: "Web Landing" },
];

export function EvolvePanel({
  projectId,
  existingFeatures,
  existingPacks,
}: {
  projectId: string;
  existingFeatures: string[];
  existingPacks: string[];
}) {
  const { fetchProject } = useForgeStore();
  const [addFeatures, setAddFeatures] = useState<string[]>([]);
  const [addPacks, setAddPacks] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [evolving, setEvolving] = useState(false);
  const [showPacks, setShowPacks] = useState(false);

  function toggleFeature(f: string) {
    setAddFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function togglePack(p: string) {
    setAddPacks((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleEvolve() {
    if (addFeatures.length === 0 && addPacks.length === 0 && !newDescription.trim()) {
      toast.error("Sélectionne au moins une feature, un pack ou décris l'évolution");
      return;
    }

    setEvolving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/evolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addFeatures,
          addPacks,
          newDescription: newDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(`Projet évoluté ! ${data.project.fileCount} fichiers.`);
      await fetchProject(projectId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'évolution");
    } finally {
      setEvolving(false);
    }
  }

  return (
    <div className="custom-scroll h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Rocket className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Faire évoluer le projet
            </h2>
            <p className="text-xs text-slate-500">
              Ajoute des fonctionnalités, des packs ou modifie la description.
              L'IA préservera le code existant et ajoutera les nouvelles pages.
            </p>
          </div>
        </div>

        {/* Current state */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
            État actuel du projet
          </p>
          <div className="flex flex-wrap gap-1.5">
            {existingFeatures.map((f) => (
              <Badge key={f} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300">
                {f}
              </Badge>
            ))}
            {existingPacks.map((p) => (
              <Badge key={p} variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-[10px] text-cyan-300">
                {p}
              </Badge>
            ))}
            {existingFeatures.length === 0 && existingPacks.length === 0 && (
              <span className="text-[11px] text-slate-600">Aucune feature/pack</span>
            )}
          </div>
        </div>

        {/* New description */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Nouvelle vision / description (optionnel)
          </label>
          <Textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Décris comment tu veux faire évoluer l'app... ex: 'Ajouter une page de profil avec avatar et bio'"
            rows={3}
            maxLength={500}
            className="resize-none border-slate-700 bg-slate-950/60 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/40"
          />
        </div>

        {/* Add features */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Plus className="mr-1.5 inline h-3.5 w-3.5" />
            Ajouter des fonctionnalités ({addFeatures.length} sélectionnées)
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((f) => {
              const alreadyExists = existingFeatures.includes(f.value);
              const isSelected = addFeatures.includes(f.value);
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => !alreadyExists && toggleFeature(f.value)}
                  disabled={alreadyExists}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition",
                    alreadyExists
                      ? "cursor-not-allowed border-emerald-500/20 bg-emerald-500/5 text-emerald-400/50"
                      : isSelected
                        ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                        : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  )}
                >
                  {alreadyExists && <Check className="mr-1 inline h-3 w-3" />}
                  {isSelected && !alreadyExists && <Check className="mr-1 inline h-3 w-3" />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add packs */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <button
            type="button"
            onClick={() => setShowPacks((v) => !v)}
            className="mb-2 flex w-full items-center justify-between"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Plus className="mr-1.5 inline h-3.5 w-3.5" />
              Ajouter des packs ({addPacks.length} sélectionnés)
            </p>
            {showPacks ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
          </button>
          <AnimatePresence>
            {showPacks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="custom-scroll flex flex-wrap gap-1.5 pt-2 max-h-48 overflow-y-auto">
                  {PACK_OPTIONS.map((p) => {
                    const alreadyExists = existingPacks.includes(p.id);
                    const isSelected = addPacks.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => !alreadyExists && togglePack(p.id)}
                        disabled={alreadyExists}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] transition",
                          alreadyExists
                            ? "cursor-not-allowed border-emerald-500/20 bg-emerald-500/5 text-emerald-400/50"
                            : isSelected
                              ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                              : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                        )}
                      >
                        {alreadyExists && <Check className="mr-0.5 inline h-2.5 w-2.5" />}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Evolve button */}
        <div className="sticky bottom-4 z-10">
          <Button
            onClick={handleEvolve}
            disabled={evolving}
            className="h-12 w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-400"
          >
            {evolving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Évolution en cours…
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Faire évoluer le projet
                {(addFeatures.length > 0 || addPacks.length > 0) && (
                  <span className="ml-2 rounded-full bg-slate-950/20 px-2 py-0.5 text-xs">
                    +{addFeatures.length + addPacks.length} ajouts
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
