"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionWrapperProps {
  id: string;
  pillar: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function SectionWrapper({
  id,
  pillar,
  title,
  subtitle,
  children,
  className,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full border-t border-slate-800/60 py-16 sm:py-24",
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 sm:mb-14"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono font-medium uppercase tracking-widest text-cyan-300">
              {pillar}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {subtitle}
            </p>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
