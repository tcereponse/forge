"use client";

import {
  Moon,
  ShieldCheck,
  Globe,
  FileCode2,
  BarChart3,
  Table2,
  Smartphone,
  Languages,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { GeneratedFile } from "@/lib/forge-config";
import { cn } from "@/lib/utils";

interface FeatureCheck {
  feature: string;
  label: string;
  icon: typeof Moon;
  keywords: string[];
  check: (files: GeneratedFile[]) => boolean;
}

const FEATURE_CHECKS: FeatureCheck[] = [
  {
    feature: "darkmode",
    label: "Dark Mode",
    icon: Moon,
    keywords: ["dark:", "documentElement", "classList.toggle"],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ");
      return content.includes("dark:") && content.includes("documentElement");
    },
  },
  {
    feature: "auth",
    label: "Authentification",
    icon: ShieldCheck,
    keywords: ["login", "password", "isAuthenticated", "logout"],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ").toLowerCase();
      return content.includes("login") && content.includes("password");
    },
  },
  {
    feature: "api",
    label: "Couche API / fetch",
    icon: Globe,
    keywords: ["fetch", "axios", "useEffect", "loading"],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ");
      return content.includes("fetch") || content.includes("axios");
    },
  },
  {
    feature: "forms",
    label: "Formulaires (react-hook-form)",
    icon: FileCode2,
    keywords: ["react-hook-form", "useForm", "handleSubmit", "register"],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ");
      return content.includes("useForm") || content.includes("react-hook-form");
    },
  },
  {
    feature: "charts",
    label: "Graphiques (recharts)",
    icon: BarChart3,
    keywords: ["recharts", "BarChart", "LineChart", "ResponsiveContainer"],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ");
      return content.includes("recharts") && content.includes("Chart");
    },
  },
  {
    feature: "tables",
    label: "Tableaux de données",
    icon: Table2,
    keywords: ["<table", "<th", "<td", "sort"],
    check: (files) => {
      const content = files.map((f) => f.content).join("").toLowerCase();
      return content.includes("<table") || content.includes("<th");
    },
  },
  {
    feature: "pwa",
    label: "PWA / offline",
    icon: Smartphone,
    keywords: ["beforeinstallprompt", "vite-plugin-pwa", "manifest"],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ");
      const pkg = files.find((f) => f.path === "package.json");
      const hasPwaDep = pkg && (pkg.content.includes("vite-plugin-pwa") || pkg.content.includes("workbox"));
      return content.includes("beforeinstallprompt") || !!hasPwaDep;
    },
  },
  {
    feature: "i18n",
    label: "Internationalisation",
    icon: Languages,
    keywords: ["react-i18next", "i18next", "useTranslation", "t("],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ");
      return content.includes("i18n") || content.includes("useTranslation");
    },
  },
  {
    feature: "tests",
    label: "Tests (Vitest)",
    icon: FlaskConical,
    keywords: ["vitest", "describe(", "test(", "expect("],
    check: (files) => {
      const hasTestFile = files.some((f) => f.path.includes(".test.") || f.path.includes(".spec."));
      const pkg = files.find((f) => f.path === "package.json");
      const hasVitestDep = pkg && pkg.content.includes("vitest");
      return hasTestFile || !!hasVitestDep;
    },
  },
  {
    feature: "animations",
    label: "Animations (Framer Motion)",
    icon: Sparkles,
    keywords: ["framer-motion", "motion.", "AnimatePresence", "whileHover"],
    check: (files) => {
      const content = files.map((f) => f.content).join(" ");
      return content.includes("framer-motion") || content.includes("motion.");
    },
  },
];

export function FeatureSummary({
  files,
  features,
}: {
  files: GeneratedFile[];
  features: string[];
}) {
  if (features.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
        Fonctionnalités implémentées ({features.length})
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feat) => {
          const check = FEATURE_CHECKS.find((c) => c.feature === feat);
          if (!check) return null;
          const Icon = check.icon;
          const implemented = check.check(files);
          return (
            <div
              key={feat}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2",
                implemented
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  implemented
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">
                  {check.label}
                </p>
                <p
                  className={cn(
                    "text-[10px]",
                    implemented ? "text-emerald-400" : "text-amber-400"
                  )}
                >
                  {implemented ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Implémenté
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-2.5 w-2.5" />
                      Non détecté
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
