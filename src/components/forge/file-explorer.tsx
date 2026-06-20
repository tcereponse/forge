"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  FileJson,
  FileCode2,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  ChevronRight,
  Copy,
  Check,
  FileQuestion,
  Braces,
} from "lucide-react";
import type { ProjectRecord, GeneratedFile } from "@/lib/forge-config";
import { buildTree, getSortedChildren, type TreeNode } from "@/lib/file-tree";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadButton } from "@/components/forge/download-button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json":
      return <FileJson className="h-4 w-4 text-amber-400" />;
    case "tsx":
    case "jsx":
      return <FileCode2 className="h-4 w-4 text-cyan-400" />;
    case "ts":
    case "js":
    case "mjs":
    case "cjs":
      return <FileCode2 className="h-4 w-4 text-yellow-400" />;
    case "css":
      return <FileType2 className="h-4 w-4 text-blue-400" />;
    case "html":
      return <FileText className="h-4 w-4 text-orange-400" />;
    case "md":
      return <FileText className="h-4 w-4 text-slate-400" />;
    case "env":
      return <Braces className="h-4 w-4 text-emerald-400" />;
    default:
      return <FileQuestion className="h-4 w-4 text-slate-500" />;
  }
}

function TreeItem({
  node,
  depth,
  activePath,
  onSelect,
  expandedSet,
  toggleExpand,
}: {
  node: TreeNode;
  depth: number;
  activePath: string;
  onSelect: (file: GeneratedFile) => void;
  expandedSet: Set<string>;
  toggleExpand: (path: string) => void;
}) {
  const isExpanded = expandedSet.has(node.path);
  const isActive = activePath === node.path;

  if (node.isFile) {
    return (
      <button
        onClick={() =>
          onSelect({
            path: node.path,
            content: "", // content filled by parent lookup
            language: node.language ?? "text",
          })
        }
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-xs transition",
          isActive
            ? "bg-cyan-500/15 text-cyan-200"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileIcon name={node.name} />
        <span className="truncate font-mono">{node.name}</span>
      </button>
    );
  }

  const children = getSortedChildren(node);
  // Root node has empty name — render children directly
  if (node.path === "") {
    return (
      <div className="space-y-0.5">
        {children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth}
            activePath={activePath}
            onSelect={onSelect}
            expandedSet={expandedSet}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => toggleExpand(node.path)}
        className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-xs text-slate-300 transition hover:bg-slate-800/50"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-slate-500 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-cyan-400/70" />
        ) : (
          <Folder className="h-4 w-4 text-cyan-400/70" />
        )}
        <span className="truncate font-mono font-medium">{node.name}</span>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                onSelect={onSelect}
                expandedSet={expandedSet}
                toggleExpand={toggleExpand}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileExplorer({ project }: { project: ProjectRecord }) {
  const [activePath, setActivePath] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(
    new Set(["", "src", "src/components"])
  );

  const tree = useMemo(() => buildTree(project.files), [project.files]);

  // Auto-select first file
  const currentFile = useMemo(() => {
    if (activePath) {
      return project.files.find((f) => f.path === activePath) ?? null;
    }
    // Default: App.tsx / App.jsx / index.html
    const preferred =
      project.files.find((f) => /src\/App\.(tsx|jsx)$/.test(f.path)) ??
      project.files.find((f) => f.path === "index.html") ??
      project.files.find((f) => f.path === "package.json") ??
      project.files[0] ??
      null;
    return preferred;
  }, [project.files, activePath]);

  const activePathResolved = currentFile?.path ?? "";

  function handleSelect(file: GeneratedFile) {
    setActivePath(file.path);
  }

  function toggleExpand(path: string) {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function copyCode() {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      toast.success("Code copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  }

  const lineCount = currentFile?.content.split("\n").length ?? 0;

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-12 lg:gap-0">
      {/* File tree */}
      <div className="lg:col-span-3 lg:border-r lg:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2.5">
          <p className="font-mono text-xs font-semibold text-slate-300">
            {project.slug}/
          </p>
          <Badge
            variant="outline"
            className="border-slate-700 bg-slate-900/60 text-[10px] text-slate-400"
          >
            {project.files.length} fichiers
          </Badge>
        </div>
        <div className="custom-scroll h-[calc(100%-2.5rem)] overflow-y-auto p-2">
          <TreeItem
            node={tree}
            depth={0}
            activePath={activePathResolved}
            onSelect={handleSelect}
            expandedSet={expandedSet}
            toggleExpand={toggleExpand}
          />
        </div>
      </div>

      {/* Code viewer */}
      <div className="flex h-full flex-col lg:col-span-9">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {currentFile && <FileIcon name={currentFile.path} />}
            <span className="font-mono text-sm text-slate-200">
              {currentFile?.path ?? "—"}
            </span>
            {currentFile && (
              <Badge
                variant="outline"
                className="border-slate-700 bg-slate-900/60 font-mono text-[10px] text-slate-400"
              >
                {currentFile.language}
              </Badge>
            )}
            <span className="hidden text-[10px] text-slate-600 sm:inline">
              {lineCount} lignes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyCode}
              disabled={!currentFile}
              className="h-8 text-slate-400 hover:text-slate-200"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5 hidden text-xs sm:inline">
                {copied ? "Copié" : "Copier"}
              </span>
            </Button>
            <DownloadButton projectId={project.id} />
          </div>
        </div>
        <div className="custom-scroll min-h-0 flex-1 overflow-auto bg-slate-950/60">
          {currentFile ? (
            <SyntaxHighlighter
              language={currentFile.language}
              style={oneDark}
              showLineNumbers
              wrapLongLines={false}
              customStyle={{
                margin: 0,
                background: "transparent",
                fontSize: "12.5px",
                padding: "16px",
                minHeight: "100%",
              }}
              lineNumberStyle={{
                color: "#475569",
                minWidth: "2.5em",
                paddingRight: "1em",
                userSelect: "none",
              }}
            >
              {currentFile.content}
            </SyntaxHighlighter>
          ) : (
            <div className="flex h-full items-center justify-center py-20 text-sm text-slate-600">
              Sélectionne un fichier dans l'arborescence
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
