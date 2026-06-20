"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Wand2,
  ChevronRight,
  Layers,
  Palette,
  Route,
  Boxes,
  Component,
  Check,
} from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";
import {
  STACK_OPTIONS,
  STYLING_OPTIONS,
  ROUTING_OPTIONS,
  STATE_OPTIONS,
  UI_LIB_OPTIONS,
  FEATURE_OPTIONS,
  type ProjectConfig,
  type ProjectRecord,
} from "@/lib/forge-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OptionCard<T extends string> {
  value: T;
  label: string;
  desc: string;
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  icon: Icon,
}: {
  options: OptionCard<T>[];
  value: T;
  onChange: (v: T) => void;
  icon: typeof Layers;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "group relative rounded-lg border p-3 text-left transition",
              active
                ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
            )}
          >
            <div className="flex items-center justify-between">
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-cyan-300" : "text-slate-500"
                )}
              />
              {active && (
                <Check className="h-3.5 w-3.5 text-cyan-400" />
              )}
            </div>
            <p
              className={cn(
                "mt-2 text-xs font-semibold",
                active ? "text-slate-100" : "text-slate-300"
              )}
            >
              {opt.label}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
              {opt.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function BuilderForm() {
  const { fetchProjects, selectProject, setGenerating, setPhase, fetchProject } =
    useForgeStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stack, setStack] = useState<ProjectConfig["stack"]>("vite");
  const [typescript, setTypescript] = useState(true);
  const [styling, setStyling] = useState<ProjectConfig["styling"]>("tailwind");
  const [routing, setRouting] = useState<ProjectConfig["routing"]>("router");
  const [stateMgmt, setStateMgmt] =
    useState<ProjectConfig["stateMgmt"]>("none");
  const [uiLib, setUiLib] = useState<ProjectConfig["uiLib"]>("none");
  const [features, setFeatures] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Extension packs state
  const [extPacks, setExtPacks] = useState<
    { id: string; name: string; prdCount: number }[]
  >([]);
  const [extFeatureMap, setExtFeatureMap] = useState<Record<string, string[]>>(
    {}
  );

  useEffect(() => {
    fetch("/api/extensions")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setExtPacks(data.packs);
          setExtFeatureMap(data.featureMap);
        }
      })
      .catch(() => {});
  }, []);

  function toggleFeature(f: string) {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Donne un nom à ton projet");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Décris ton application (10 caractères min.)");
      return;
    }

    setCreating(true);
    setGenerating(true);
    setPhase("prd");

    try {
      // 1. Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          stack,
          typescript,
          styling,
          routing,
          stateMgmt,
          uiLib,
          features,
        } satisfies ProjectConfig),
      });
      const createData = await createRes.json();
      if (!createData.success) throw new Error(createData.error);
      const project: ProjectRecord = createData.project;

      toast.success("Projet créé — lancement de la génération IA…");

      // Refresh gallery in background
      fetchProjects();

      // 2. Generate (phased UI handled client-side via timers while we wait)
      setPhase("code");
      const genRes = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
      });
      const genData = await genRes.json();

      if (!genData.success) {
        setPhase("error");
        setGenerating(false);
        toast.error(genData.error || "Échec de la génération");
        // Still load the project so user can see the PRD/error
        await fetchProject(project.id);
        fetchProjects();
        return;
      }

      setPhase("saving");
      await new Promise((r) => setTimeout(r, 400));
      setPhase("done");
      setGenerating(false);

      await fetchProject(project.id);
      fetchProjects();
      toast.success(`Projet « ${name} » généré avec ${genData.project.fileCount} fichiers !`);
    } catch (e) {
      setPhase("error");
      setGenerating(false);
      toast.error(e instanceof Error ? e.message : "Échec de la création");
    } finally {
      setCreating(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-mono uppercase tracking-widest">
            Nouveau projet React
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-50 sm:text-3xl">
          Décris ton application
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
          L'IA génère un projet React complet et fonctionnel — code source,
          configuration, composants — prêt à télécharger.
        </p>
      </div>

      {/* Name + description */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Nom du projet
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: TaskFlow, RecipeBox, DevPortfolio…"
            maxLength={50}
            className="border-slate-700 bg-slate-950/60 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Description de l’application
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décris ce que fait ton app, ses écrans principaux, ses fonctionnalités clés… Plus c'est précis, mieux l'IA génère."
            rows={4}
            maxLength={800}
            className="resize-none border-slate-700 bg-slate-950/60 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/40"
          />
          <p className="mt-1 text-right text-[10px] text-slate-600">
            {description.length}/800
          </p>
        </div>
      </div>

      {/* Stack options */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Layers className="mr-1.5 inline h-3.5 w-3.5" />
            Build tool
          </p>
          <OptionGrid
            options={STACK_OPTIONS}
            value={stack}
            onChange={setStack}
            icon={Layers}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <div>
            <p className="text-sm font-medium text-slate-200">TypeScript</p>
            <p className="text-[11px] text-slate-500">
              Typage statique, recommandé
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTypescript((v) => !v)}
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              typescript ? "bg-cyan-500" : "bg-slate-700"
            )}
            aria-pressed={typescript}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
                typescript ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Palette className="mr-1.5 inline h-3.5 w-3.5" />
            Styling
          </p>
          <OptionGrid
            options={STYLING_OPTIONS}
            value={styling}
            onChange={setStyling}
            icon={Palette}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Route className="mr-1.5 inline h-3.5 w-3.5" />
            Routing
          </p>
          <OptionGrid
            options={ROUTING_OPTIONS}
            value={routing}
            onChange={setRouting}
            icon={Route}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Boxes className="mr-1.5 inline h-3.5 w-3.5" />
            State management
          </p>
          <OptionGrid
            options={STATE_OPTIONS}
            value={stateMgmt}
            onChange={setStateMgmt}
            icon={Boxes}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Component className="mr-1.5 inline h-3.5 w-3.5" />
            Bibliothèque UI
          </p>
          <OptionGrid
            options={UI_LIB_OPTIONS}
            value={uiLib}
            onChange={setUiLib}
            icon={Component}
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Check className="mr-1.5 inline h-3.5 w-3.5" />
            Fonctionnalités ({features.length} sélectionnées)
          </p>
          {extPacks.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400/70">
              <Sparkles className="h-3 w-3" />
              {extPacks.length} packs d'extensions PRD chargés
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => {
            const active = features.includes(f.value);
            const hasExtension = extFeatureMap[f.value]?.length > 0;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => toggleFeature(f.value)}
                className={cn(
                  "group relative rounded-full border px-3 py-1.5 text-xs transition",
                  active
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                    : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                )}
              >
                {active && <Check className="mr-1 inline h-3 w-3" />}
                {f.label}
                {hasExtension && (
                  <span
                    className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400"
                    title={`${extFeatureMap[f.value].length} pack(s) d'extension PRD`}
                  />
                )}
              </button>
            );
          })}
        </div>
        {features.length > 0 && (
          <div className="border-t border-slate-800 pt-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
              Extensions PRD actives pour cette génération :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {features.map((feat) => {
                const packs = extFeatureMap[feat] ?? [];
                return packs.length > 0 ? (
                  <span
                    key={feat}
                    className="rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] text-cyan-300/80"
                  >
                    {feat} ← {packs.join(", ")}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="sticky bottom-4 z-10">
        <Button
          type="submit"
          disabled={creating}
          className="h-12 w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-400"
        >
          {creating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Génération en cours…
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Générer le projet
              <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
}
