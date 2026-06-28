"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer } from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";
import { Sidebar } from "@/components/forge/sidebar";
import { BuilderForm } from "@/components/forge/builder-form";
import { Workspace } from "@/components/forge/workspace";
import { WelcomeView } from "@/components/forge/welcome-view";
import { GenerationOverlay } from "@/components/forge/generation-overlay";
import { CommandPalette } from "@/components/forge/command-palette";

export function ForgeApp() {
  const {
    showBuilder,
    currentProject,
    projects,
    generating,
    fetchProjects,
  } = useForgeStore();

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const showWorkspace = !showBuilder && currentProject !== null;
  const showWelcome = !showBuilder && currentProject === null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar — hidden on mobile, toggled could be added; keep simple: hidden on small screens */}
      <div className="hidden w-72 shrink-0 md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2.5 md:hidden">
          <div className="flex items-center gap-2">
            <HammerIcon />
            <span className="font-mono text-sm font-bold text-slate-100">
              React Forge
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {projects.length} projet(s)
          </span>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {showBuilder ? (
              <motion.div
                key="builder"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="custom-scroll h-full overflow-y-auto"
              >
                <div className="px-4 py-8 sm:px-6 sm:py-12">
                  <BuilderForm />
                </div>
              </motion.div>
            ) : showWorkspace ? (
              <motion.div
                key="workspace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Workspace />
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <WelcomeView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <GenerationOverlay />
      <CommandPalette />
    </div>
  );
}

function HammerIcon() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
      <Hammer className="h-4 w-4 text-cyan-300" />
    </div>
  );
}
