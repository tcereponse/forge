"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:text-slate-100",
        "prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2",
        "prose-h2:text-lg prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-cyan-300",
        "prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1 prose-h3:text-slate-200",
        "prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2",
        "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5 prose-li:my-0.5 prose-li:text-slate-300",
        "prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5",
        "prose-strong:text-slate-100 prose-strong:font-semibold",
        "prose-code:text-cyan-300 prose-code:bg-slate-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:text-[0.85em] prose-code:font-mono",
        "prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-3 prose-pre:overflow-x-auto",
        "prose-blockquote:border-l-cyan-500 prose-blockquote:bg-slate-800/40 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r prose-blockquote:not-italic prose-blockquote:text-slate-300",
        "prose-a:text-cyan-400 prose-a:underline prose-a:hover:text-cyan-300",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
