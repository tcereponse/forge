"use client";

import type { GeneratedFile } from "@/lib/forge-config";

export interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  language?: string;
  children: Map<string, TreeNode>;
}

export function buildTree(files: GeneratedFile[]): TreeNode {
  const root: TreeNode = {
    name: "",
    path: "",
    isFile: false,
    children: new Map(),
  };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: fullPath,
          isFile: isLast,
          language: isLast ? file.language : undefined,
          children: new Map(),
        });
      }
      current = current.children.get(part)!;
      if (isLast) {
        current.isFile = true;
        current.language = file.language;
      }
    }
  }

  return root;
}

export function getSortedChildren(node: TreeNode): TreeNode[] {
  return Array.from(node.children.values()).sort((a, b) => {
    // Directories first, then files, alphabetical
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}
