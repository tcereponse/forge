import time
import requests
import os
import subprocess
import shutil
import json

# ==========================================
# ⚙️ CONFIGURATION SOUVERAINE — Cloud-to-Ground Build Worker
# ==========================================
SERVER_URL = "https://forge-kohl-kappa.vercel.app"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.join(BASE_DIR, "workspace")
POLL_INTERVAL = 10  # seconds between polls

def log(msg, level="INFO"):
    icons = {"INFO": "ℹ️", "OK": "✅", "WARN": "⚠️", "ERR": "❌", "BUILD": "🔨", "DL": "📥", "SAVE": "💾"}
    icon = icons.get(level, "ℹ️")
    print(f"[{time.strftime('%H:%M:%S')}] {icon} {msg}")

def process_project(project_id):
    """Download project from Vercel, build it locally, notify server."""
    log(f"Récupération du projet {project_id} depuis Vercel...", "DL")

    # 1. Download the project source code
    try:
        resp = requests.get(f"{SERVER_URL}/api/projects/{project_id}/export", timeout=30)
        if resp.status_code != 200:
            log(f"Impossible de télécharger le projet (HTTP {resp.status_code})", "ERR")
            notify_build_status(project_id, "failed", f"Export failed: HTTP {resp.status_code}")
            return
        project_data = resp.json()
    except Exception as e:
        log(f"Erreur réseau lors du téléchargement: {e}", "ERR")
        notify_build_status(project_id, "failed", f"Network error: {e}")
        return

    files = project_data.get("files", [])
    project_name = project_data.get("name", "project")
    if not files:
        log("Aucun fichier trouvé dans le projet", "WARN")
        notify_build_status(project_id, "failed", "No files in project")
        return

    log(f"Projet '{project_name}' — {len(files)} fichiers à compiler", "INFO")

    # 2. Create sovereign workspace
    safe_name = "".join(c for c in project_name if c.isalnum() or c in "-_").lower() or "project"
    project_dir = os.path.join(WORKSPACE_DIR, f"{safe_name}_{project_id[:8]}")
    if os.path.exists(project_dir):
        shutil.rmtree(project_dir, ignore_errors=True)
    os.makedirs(project_dir, exist_ok=True)

    # 3. Write files physically to disk
    log(f"Écriture des {len(files)} fichiers source en local...", "SAVE")
    for file_obj in files:
        path = file_obj.get("path", "")
        content = file_obj.get("content", "")
        if not path:
            continue
        full_path = os.path.join(project_dir, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full_path) if os.path.dirname(full_path) else ".", exist_ok=True)
        try:
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
        except Exception as e:
            log(f"Erreur écriture {path}: {e}", "WARN")

    log(f"Fichiers écrits dans: {project_dir}", "OK")

    # 4. Install dependencies (pnpm, fallback npm)
    build_log = ""
    log("Exécution de 'pnpm install'...", "BUILD")
    install_cmd = "pnpm install --legacy-peer-deps" if shutil.which("pnpm") else "npm install --legacy-peer-deps"
    install_res = subprocess.run(
        install_cmd.split(),
        cwd=project_dir,
        shell=True,
        capture_output=True,
        text=True,
        timeout=300,
    )
    build_log += "$ " + install_cmd + "\n" + install_res.stdout + install_res.stderr + "\n"

    if install_res.returncode != 0:
        log("Échec de l'installation des dépendances", "ERR")
        notify_build_status(project_id, "failed", build_log)
        return

    log("Dépendances installées avec succès", "OK")

    # 5. Build with Vite
    log("Exécution de 'pnpm run build' (vite build)...", "BUILD")
    build_cmd = "pnpm run build" if shutil.which("pnpm") else "npm run build"
    build_start = time.time()
    build_res = subprocess.run(
        build_cmd.split(),
        cwd=project_dir,
        shell=True,
        capture_output=True,
        text=True,
        timeout=180,
    )
    build_duration = int((time.time() - build_start) * 1000)
    build_log += "$ " + build_cmd + "\n" + build_res.stdout + build_res.stderr + "\n"

    if build_res.returncode != 0:
        log("Échec du build Vite", "ERR")
        log(build_res.stderr[-500:] if build_res.stderr else "Pas de stderr", "ERR")
        notify_build_status(project_id, "failed", build_log, build_duration)
        return

    # Check dist/ exists
    dist_dir = os.path.join(project_dir, "dist")
    if not os.path.isdir(dist_dir):
        log("Dossier dist/ non créé après build", "ERR")
        notify_build_status(project_id, "failed", build_log + "\n❌ dist/ folder missing", build_duration)
        return

    dist_files = os.listdir(dist_dir)
    log(f"Build réussi ! dist/ contient {len(dist_files)} fichiers ({build_duration}ms)", "OK")

    # 6. Notify Vercel of success
    notify_build_status(project_id, "completed", build_log, build_duration)
    log(f"🎉 Vercel notifié du succès ! Projet sauvegardé dans: {project_dir}", "OK")
    log(f"   dist/ prêt pour déploiement: {dist_dir}", "OK")

    # 7. [Future] APK compilation
    # apk_script = os.path.join(BASE_DIR, "apk_builder.py")
    # if os.path.exists(apk_script):
    #     log("Compilation APK...", "BUILD")
    #     subprocess.run(["python", apk_script, "--source", dist_dir, "--project", project_dir])

def notify_build_status(project_id, status, build_log="", duration_ms=0):
    """Notify Vercel of the build result."""
    try:
        requests.post(
            f"{SERVER_URL}/api/projects/{project_id}/build-status",
            json={
                "status": status,
                "buildLog": build_log[:50000],  # cap log size
                "durationMs": duration_ms,
            },
            timeout=10,
        )
    except Exception as e:
        log(f"Impossible de notifier Vercel: {e}", "WARN")

def main():
    os.system("cls" if os.name == "nt" else "clear")
    print("=" * 60)
    print("💎 VERCEL SOVEREIGN BUILD WORKER v2.0 — Cloud-to-Ground")
    print("=" * 60)
    log(f"Serveur Vercel: {SERVER_URL}", "INFO")
    log(f"Espace de travail: {WORKSPACE_DIR}", "INFO")
    log(f"Interval de polling: {POLL_INTERVAL}s", "INFO")
    log("En attente de projets prêts à compiler...", "INFO")
    log("Le worker tourne en arrière-plan. Laisse cette fenêtre ouverte.", "INFO")
    print("=" * 60)

    os.makedirs(WORKSPACE_DIR, exist_ok=True)
    last_processed = None
    last_processed_time = 0

    while True:
        try:
            resp = requests.get(f"{SERVER_URL}/api/bridge/mission/status", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                mission = data.get("mission")

                if mission and mission.get("status") in ["ready_for_build", "code_generated"]:
                    project_id = mission.get("projectId")

                    # Avoid reprocessing the same project within 5 minutes
                    now = time.time()
                    if project_id and (project_id != last_processed or now - last_processed_time > 300):
                        print()
                        log(f"NOUVEAU PROJET DÉTECTÉ POUR COMPILATION: {project_id}", "DL")
                        log(f"Mission: {mission.get('name', 'unknown')} — {mission.get('fileCount', 0)} fichiers", "INFO")
                        process_project(project_id)
                        last_processed = project_id
                        last_processed_time = now
                        log("En attente du prochain projet...", "INFO")

        except requests.exceptions.RequestException as e:
            log(f"Connexion à Vercel échouée (retry dans {POLL_INTERVAL}s): {e}", "WARN")
        except Exception as e:
            log(f"Erreur inattendue: {e}", "WARN")

        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
