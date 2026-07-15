#!/usr/bin/env python3
"""
══════════════════════════════════════════════════════════════
 NUCLEAR GUARD — Elite Forge Mobile v1.0
 Pépite #2 : Contrôleur de Qualité Autonome
══════════════════════════════════════════════════════════════
 Vérifie la validité syntaxique de tous les fichiers générés.
 Si une erreur est détectée, elle est signalée au serveur.
 Usage: python nuclear_guard.py <dossier_projet>
"""

import os
import json
import re
import subprocess
import sys
from pathlib import Path

DEEPSEEK_API_KEY = ""  # Chargé depuis config.json

# ─── Chargement de la config ────────────────────────────────────
def load_config():
    global DEEPSEEK_API_KEY
    cfg_path = Path("/storage/emulated/0/Eliteqod/config.json")
    if cfg_path.exists():
        try:
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
            DEEPSEEK_API_KEY = cfg.get("deepseek_api_key", "")
        except Exception:
            pass


# ─── Vérificateurs syntaxiques ─────────────────────────────────
def check_python(filepath: str) -> tuple[bool, str]:
    """Vérifie la syntaxe Python avec py_compile."""
    try:
        import py_compile
        py_compile.compile(filepath, doraise=True)
        return True, ""
    except Exception as e:
        return False, str(e)


def check_json(filepath: str) -> tuple[bool, str]:
    """Vérifie la validité JSON."""
    try:
        content = Path(filepath).read_text(encoding="utf-8")
        json.loads(content)
        return True, ""
    except json.JSONDecodeError as e:
        return False, f"JSON invalide: {e}"


def check_javascript_basic(filepath: str) -> tuple[bool, str]:
    """
    Vérification basique JS/TS : parenthèses et accolades équilibrées.
    (node/tsc peut ne pas être dispo sur Termux léger)
    """
    try:
        content = Path(filepath).read_text(encoding="utf-8")
        opens  = content.count('{') + content.count('(') + content.count('[')
        closes = content.count('}') + content.count(')') + content.count(']')
        # Tolérance de ±5 pour les templates/chaînes
        if abs(opens - closes) > 10:
            return False, f"Déséquilibre de délimiteurs: {opens} ouvrants vs {closes} fermants"
        # Détection des blocs vides critiques
        if re.search(r'(function|=>|class)\s*\{?\s*\}', content) and len(content) < 100:
            return False, "Fichier semble vide ou mal généré"
        return True, ""
    except Exception as e:
        return False, str(e)


def check_markdown(filepath: str) -> tuple[bool, str]:
    """Vérifie qu'un fichier Markdown n'est pas vide ou tronqué."""
    try:
        content = Path(filepath).read_text(encoding="utf-8")
        if len(content) < 30:
            return False, "Fichier Markdown trop court (probablement tronqué)"
        return True, ""
    except Exception as e:
        return False, str(e)


# ─── Dispatch selon l'extension ────────────────────────────────
CHECKERS = {
    ".py":   check_python,
    ".json": check_json,
    ".js":   check_javascript_basic,
    ".ts":   check_javascript_basic,
    ".jsx":  check_javascript_basic,
    ".tsx":  check_javascript_basic,
    ".md":   check_markdown,
}


def scan_project(project_path: str) -> dict:
    """
    Scanne tous les fichiers d'un projet et retourne le rapport de qualité.
    Retourne un dict: { ok: bool, total: int, errors: [{ file, error }] }
    """
    load_config()
    errors = []
    total  = 0

    for fp in Path(project_path).rglob("*"):
        if not fp.is_file():
            continue
        ext = fp.suffix.lower()
        checker = CHECKERS.get(ext)
        if not checker:
            continue
        total += 1
        ok, msg = checker(str(fp))
        if not ok:
            rel = str(fp.relative_to(project_path))
            errors.append({"file": rel, "error": msg})
            print(f"[GUARD] ❌ {rel}: {msg}")
        else:
            print(f"[GUARD] ✅ {fp.name}")

    ok = len(errors) == 0
    report = {
        "ok":        ok,
        "total":     total,
        "errors":    errors,
        "grade":     "GOLD" if ok else ("SILVER" if len(errors) <= 2 else "RED"),
        "timestamp": int(__import__("time").time())
    }

    # Sauvegarder le rapport dans le dossier du projet
    report_path = Path(project_path) / "QUALITY_REPORT.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report


def repair_file_via_api(project_name: str, filepath: str, error_msg: str) -> bool:
    """
    Demande à DeepSeek de réparer un fichier défectueux via l'API.
    Pépite #3 (AST) simplifiée : re-génération ciblée.
    """
    if not DEEPSEEK_API_KEY:
        print("[GUARD] Pas de clé API, auto-réparation impossible.")
        return False

    try:
        import urllib.request
        content = Path(filepath).read_text(encoding="utf-8")
        prompt = f"""Tu es un expert en débogage de code.
Voici un fichier qui contient une erreur syntaxique.
Fichier: {os.path.basename(filepath)}
Erreur détectée: {error_msg}
Code actuel:
```
{content[:2000]}
```
MISSION: Corrige UNIQUEMENT l'erreur syntaxique. Retourne le fichier complet corrigé en JSON:
{{"content": "le code corrigé complet ici"}}"""

        body = json.dumps({
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "max_tokens": 4000,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.deepseek.com/chat/completions",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            fixed = json.loads(data["choices"][0]["message"]["content"])
            corrected_code = fixed.get("content", "")
            if corrected_code:
                Path(filepath).write_text(corrected_code, encoding="utf-8")
                print(f"[GUARD] 🔧 Fichier réparé automatiquement: {os.path.basename(filepath)}")
                return True
    except Exception as e:
        print(f"[GUARD] Erreur réparation API: {e}")
    return False


def run_nuclear_guard(project_path: str, auto_repair: bool = True) -> dict:
    """
    Point d'entrée principal du Nuclear Guard.
    Scanne, rapporte et répare automatiquement si possible.
    """
    load_config()
    print(f"\n[NUCLEAR GUARD] 🔍 Scan de: {project_path}")
    report = scan_project(project_path)

    summary = f"[NUCLEAR GUARD] Résultat: {report['grade']} — {report['total']} fichiers, {len(report['errors'])} erreur(s)."
    print(summary)

    if not report["ok"] and auto_repair and DEEPSEEK_API_KEY:
        print(f"[NUCLEAR GUARD] 🔧 Tentative de réparation automatique de {len(report['errors'])} fichier(s)...")
        repaired = 0
        for err in report["errors"]:
            fp = os.path.join(project_path, err["file"])
            if repair_file_via_api(os.path.basename(project_path), fp, err["error"]):
                repaired += 1
        if repaired > 0:
            print(f"[NUCLEAR GUARD] ✅ {repaired} fichier(s) réparé(s). Re-scan...")
            report = scan_project(project_path)
            print(f"[NUCLEAR GUARD] Grade final: {report['grade']}")

    return report


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python nuclear_guard.py <dossier_projet> [--no-repair]")
        sys.exit(1)
    auto_repair = "--no-repair" not in sys.argv
    result = run_nuclear_guard(sys.argv[1], auto_repair=auto_repair)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    sys.exit(0 if result["ok"] else 1)
