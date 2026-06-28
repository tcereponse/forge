"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — prevents white-screen crashes.
 * Catches any React render error in the subtree and shows
 * a recoverable fallback with retry / home actions.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Log to console (server-side logging could be added via API)
    console.error("[ErrorBoundary] React render error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    // Force a full reload to the root — safest recovery
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message ?? "Erreur inconnue";

    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 ring-1 ring-rose-500/30">
            <AlertTriangle className="h-7 w-7 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            Une erreur est survenue
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            L&apos;interface a rencontré un problème inattendu. Tu peux
            réessayer sans perdre tes données, ou revenir à l&apos;accueil.
          </p>
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="break-words font-mono text-[11px] text-rose-300/80">
              {message.slice(0, 200)}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={this.handleRetry}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
            <Button
              onClick={this.handleHome}
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            >
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
