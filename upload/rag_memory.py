#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════
 RAG MEMORY ENGINE — Elite Forge Mobile v1.0
 Pépite #1 : Mémoire Infinie à base de Spirales
══════════════════════════════════════════════════════════════
 Usage: import depuis build_server.py ou lancer directement.
 Stocke les connaissances de chaque projet forgé et fournit
 un contexte enrichi à DeepSeek avant chaque nouvelle forge.
"""

import os
import json
import time
import hashlib
import re
from pathlib import Path
from typing import Optional

# ─── Configuration ─────────────────────────────────────────────
ROOT_DIR   = "/storage/emulated/0/Eliteqod/projects prod"
MEMORY_DIR = "/storage/emulated/0/Eliteqod/MEMOIRE"
SPIRALES   = ["modeles", "standards", "exemples", "outils", "logs"]

# ─── Utils ─────────────────────────────────────────────────────
def ensure_memory():
    """Crée l'arborescence de la mémoire si elle n'existe pas."""
    os.makedirs(MEMORY_DIR, exist_ok=True)
    for sp in SPIRALES:
        os.makedirs(os.path.join(MEMORY_DIR, sp), exist_ok=True)
    index_path = os.path.join(MEMORY_DIR, "index.json")
    if not os.path.exists(index_path):
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump({"version": "1.0", "entries": []}, f, indent=2)
    print("[RAG] Mémoire initialisée dans:", MEMORY_DIR)


def classify_file(filepath: str, content: str) -> str:
    """Classe un fichier dans une spirale selon son type et contenu."""
    name = os.path.basename(filepath).lower()
    ext  = os.path.splitext(name)[1]
    c    = content.lower()

    # Standards / SOP / PRDs
    if ext == ".md" or "prd" in name or "manifeste" in name or "sop" in name:
        return "standards"
    # Schémas de données / modèles
    if ext in (".json", ".yaml", ".yml") or "schema" in name or "model" in name:
        return "modeles"
    # Code source = exemples de code réel
    if ext in (".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".kt"):
        return "exemples"
    # Scripts / outils
    if ext in (".sh", ".bat", ".ps1") or "build" in name or "script" in name:
        return "outils"
    # Logs par défaut
    return "logs"


def index_project(project_name: str) -> int:
    """
    Indexe un projet forgé dans la mémoire spirale.
    Retourne le nombre de fichiers indexés.
    """
    ensure_memory()
    project_path = Path(ROOT_DIR) / project_name
    if not project_path.exists():
        print(f"[RAG] Projet introuvable: {project_path}")
        return 0

    index_path = Path(MEMORY_DIR) / "index.json"
    with open(index_path, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    count = 0
    for fp in project_path.rglob("*"):
        if not fp.is_file():
            continue
        try:
            content = fp.read_text(encoding="utf-8", errors="ignore")
            if len(content) < 20:
                continue

            spirale = classify_file(str(fp), content)
            rel_path = str(fp.relative_to(project_path))

            # Créer l'entrée de connaissance
            entry = {
                "id":         hashlib.md5(f"{project_name}/{rel_path}".encode()).hexdigest()[:12],
                "project":    project_name,
                "file":       rel_path,
                "spirale":    spirale,
                "preview":    content[:500],
                "size":       len(content),
                "indexed_at": int(time.time()),
                "tags":       extract_tags(content, rel_path),
                "score":      0.5,  # Score de pertinence de départ
            }

            # Sauvegarder le chunk dans la spirale correspondante
            chunk_file = Path(MEMORY_DIR) / spirale / f"{entry['id']}.json"
            with open(chunk_file, "w", encoding="utf-8") as cf:
                json.dump({**entry, "full_content": content[:3000]}, cf, ensure_ascii=False, indent=2)

            # Mettre à jour l'index
            index_data["entries"] = [e for e in index_data["entries"] if e["id"] != entry["id"]]
            index_data["entries"].append({k: entry[k] for k in ["id","project","file","spirale","tags","score","indexed_at"]})
            count += 1

        except Exception as e:
            pass

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    print(f"[RAG] Projet '{project_name}' indexé : {count} fichiers dans {len(SPIRALES)} spirales.")
    return count


def extract_tags(content: str, filepath: str) -> list:
    """Extrait des tags simples basés sur les mots-clés du contenu."""
    tags = []
    keywords = {
        "react": "react", "expo": "expo", "android": "android",
        "api": "api", "fetch": "http", "sqlite": "database",
        "auth": "authentication", "login": "authentication",
        "style": "ui", "navigation": "navigation",
        "hook": "hooks", "component": "component",
        "python": "python", "flask": "flask", "fastapi": "fastapi"
    }
    c = content.lower()
    for kw, tag in keywords.items():
        if kw in c and tag not in tags:
            tags.append(tag)
    return tags[:5]


def search_memory(query: str, top_k: int = 3) -> list:
    """
    Recherche dans la mémoire spirale.
    Retourne les top_k chunks les plus pertinents.
    """
    ensure_memory()
    results = []
    query_words = set(query.lower().split())

    for spirale in SPIRALES:
        spirale_dir = Path(MEMORY_DIR) / spirale
        for chunk_file in spirale_dir.glob("*.json"):
            try:
                with open(chunk_file, "r", encoding="utf-8") as f:
                    chunk = json.load(f)

                # Score simple basé sur les mots en commun
                text = (chunk.get("preview","") + " " + " ".join(chunk.get("tags",[]))).lower()
                chunk_words = set(text.split())
                overlap = len(query_words & chunk_words)
                if overlap > 0:
                    relevance = overlap / max(len(query_words), 1)
                    results.append({
                        "spirale":   spirale,
                        "project":   chunk.get("project"),
                        "file":      chunk.get("file"),
                        "content":   chunk.get("full_content","")[:600],
                        "relevance": relevance * chunk.get("score", 0.5),
                        "tags":      chunk.get("tags", []),
                    })
            except Exception:
                pass

    results.sort(key=lambda x: x["relevance"], reverse=True)
    return results[:top_k]


def build_context_for_deepseek(project_name: str, description: str, stack: str) -> str:
    """
    Construit le contexte enrichi à injecter dans le prompt DeepSeek.
    C'est le cœur du moteur RAG.
    """
    query = f"{project_name} {description} {stack}"
    memories = search_memory(query, top_k=3)

    if not memories:
        return ""

    lines = ["[MÉMOIRE FORGE — Exemples de projets précédents à réutiliser :]"]
    for i, mem in enumerate(memories, 1):
        lines.append(f"\n--- Exemple {i} (Spirale: {mem['spirale'].upper()}, Projet: {mem['project']}) ---")
        lines.append(f"Fichier : {mem['file']}")
        if mem['tags']:
            lines.append(f"Tags : {', '.join(mem['tags'])}")
        lines.append("Extrait :")
        lines.append(mem['content'][:400])
        lines.append("---")

    context = "\n".join(lines)
    print(f"[RAG] Contexte enrichi généré : {len(memories)} souvenir(s) injecté(s).")
    return context


def update_score(chunk_id: str, positive: bool = True):
    """Met à jour le score de pertinence d'un chunk après feedback."""
    for spirale in SPIRALES:
        cf = Path(MEMORY_DIR) / spirale / f"{chunk_id}.json"
        if cf.exists():
            with open(cf, "r", encoding="utf-8") as f:
                chunk = json.load(f)
            chunk["score"] = min(1.0, chunk["score"] + 0.1) if positive else max(0.0, chunk["score"] - 0.1)
            with open(cf, "w", encoding="utf-8") as f:
                json.dump(chunk, f, ensure_ascii=False, indent=2)
            print(f"[RAG] Score mis à jour pour {chunk_id}: {chunk['score']:.2f}")
            return


def get_memory_stats() -> dict:
    """Retourne les statistiques de la mémoire."""
    ensure_memory()
    stats = {"total": 0, "spirales": {}}
    for sp in SPIRALES:
        count = len(list((Path(MEMORY_DIR) / sp).glob("*.json")))
        stats["spirales"][sp] = count
        stats["total"] += count
    index_path = Path(MEMORY_DIR) / "index.json"
    if index_path.exists():
        with open(index_path, "r", encoding="utf-8") as f:
            idx = json.load(f)
        stats["projects_indexed"] = len(set(e["project"] for e in idx.get("entries", [])))
    return stats


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python rag_memory.py <index|search|stats> [args]")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "index" and len(sys.argv) >= 3:
        n = index_project(sys.argv[2])
        print(f"Indexation terminée: {n} fichiers.")
    elif cmd == "search" and len(sys.argv) >= 3:
        results = search_memory(" ".join(sys.argv[2:]))
        for r in results:
            print(f"[{r['spirale']}] {r['project']}/{r['file']} (score={r['relevance']:.2f})")
    elif cmd == "stats":
        print(json.dumps(get_memory_stats(), indent=2))
    else:
        print("Commandes: index <projet>, search <mots>, stats")
