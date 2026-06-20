// Shared types & config for the React Forge generator

export type StackOption = "vite" | "next" | "cra";
export type StylingOption = "tailwind" | "css" | "styled";
export type RoutingOption = "router" | "none";
export type StateOption = "none" | "zustand" | "context" | "redux";
export type UiLibOption = "none" | "shadcn" | "mui";

export interface ProjectConfig {
  name: string;
  description: string;
  stack: StackOption;
  typescript: boolean;
  styling: StylingOption;
  routing: RoutingOption;
  stateMgmt: StateOption;
  uiLib: UiLibOption;
  features: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  stack: StackOption;
  typescript: boolean;
  styling: StylingOption;
  routing: RoutingOption;
  stateMgmt: StateOption;
  uiLib: UiLibOption;
  features: string[];
  prd: string;
  files: GeneratedFile[];
  fileCount: number;
  status: "draft" | "generating" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  category: "dependencies" | "config" | "utils" | "architecture" | "css";
  message: string;
  file?: string;
  fix?: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  ok: boolean;
  autoFixed: string[];
  stats: {
    filesScanned: number;
    importsFound: number;
    packagesAdded: number;
  };
}

export const STACK_OPTIONS: {
  value: StackOption;
  label: string;
  desc: string;
}[] = [
  { value: "vite", label: "Vite + React", desc: "Rapide, moderne, recommandé" },
  { value: "next", label: "Next.js", desc: "SSR, routing fichier, API routes" },
  { value: "cra", label: "Create React App", desc: "Classique, sans build tool" },
];

export const STYLING_OPTIONS: {
  value: StylingOption;
  label: string;
  desc: string;
}[] = [
  { value: "tailwind", label: "Tailwind CSS", desc: "Utility-first" },
  { value: "css", label: "CSS Modules", desc: "Scoped CSS" },
  { value: "styled", label: "Styled Components", desc: "CSS-in-JS" },
];

export const ROUTING_OPTIONS: {
  value: RoutingOption;
  label: string;
  desc: string;
}[] = [
  { value: "router", label: "React Router", desc: "Routing client-side" },
  { value: "none", label: "Aucun", desc: "Single page" },
];

export const STATE_OPTIONS: {
  value: StateOption;
  label: string;
  desc: string;
}[] = [
  { value: "none", label: "Aucun", desc: "useState local" },
  { value: "zustand", label: "Zustand", desc: "Léger, hook-based" },
  { value: "context", label: "React Context", desc: "Built-in" },
  { value: "redux", label: "Redux Toolkit", desc: "Prédictible" },
];

export const UI_LIB_OPTIONS: {
  value: UiLibOption;
  label: string;
  desc: string;
}[] = [
  { value: "none", label: "Aucune", desc: "Composants custom" },
  { value: "shadcn", label: "shadcn/ui", desc: "Radix + Tailwind" },
  { value: "mui", label: "Material UI", desc: "Composants Material" },
];

export const FEATURE_OPTIONS: { value: string; label: string }[] = [
  { value: "darkmode", label: "Dark Mode" },
  { value: "auth", label: "Authentification" },
  { value: "api", label: "Couche API / fetch" },
  { value: "forms", label: "Formulaires (react-hook-form)" },
  { value: "charts", label: "Graphiques (recharts)" },
  { value: "tables", label: "Tableaux de données" },
  { value: "pwa", label: "PWA / offline" },
  { value: "i18n", label: "Internationalisation" },
  { value: "tests", label: "Tests (Vitest)" },
  { value: "animations", label: "Animations (Framer Motion)" },
];

// Helpers to map a file path to a language for syntax highlighting
export function inferLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
      return "html";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "env":
      return "bash";
    default:
      return "text";
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || `project-${Date.now().toString(36)}`;
}

// Build the LLM instruction describing the chosen stack
export function buildStackDirective(config: ProjectConfig): string {
  const parts: string[] = [];
  parts.push(`Stack: ${config.stack.toUpperCase()} + React 18${config.typescript ? " + TypeScript 5" : ""}.`);
  parts.push(`Styling: ${config.styling}.`);
  if (config.routing === "router") parts.push("Routing: React Router DOM v6 (HashRouter pour compatibilité maximale).");
  if (config.stateMgmt === "zustand") parts.push("State global: Zustand.");
  if (config.stateMgmt === "context") parts.push("State global: React Context API.");
  if (config.stateMgmt === "redux") parts.push("State global: Redux Toolkit.");
  if (config.uiLib === "shadcn") parts.push("UI: shadcn/ui (Radix + Tailwind).");
  if (config.uiLib === "mui") parts.push("UI: Material UI (@mui/material).");
  if (config.features.length > 0) parts.push(`Fonctionnalités: ${config.features.join(", ")}.`);
  return parts.join(" ");
}
