import os
import json
import time
import requests
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ─── CONFIGURATION ──────────────────────────────────────────────────────────
ELITEQOD_DIR = "/storage/emulated/0/Eliteqod"
PROJECTS_DIR = os.path.join(ELITEQOD_DIR, "projects prod")
LOG_FILE = os.path.join(ELITEQOD_DIR, "build_logs", "mobile_forge.log")
STATE_FILE = os.path.join(ELITEQOD_DIR, "MEMOIRE", "active_forge.json")

os.makedirs(PROJECTS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)

def log_event(msg):
    t = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{t}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
            f.flush()
    except: pass

def load_bridge_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f: return json.load(f)
    return {"status": "idle", "prompt": None, "project_id": None, "prompt_type": None, "last_callback_time": 0, "target_file": None}

def save_bridge_state(state):
    with open(STATE_FILE, "w") as f: json.dump(state, f)

bridge_state = load_bridge_state()

def update_bridge_state(updates):
    global bridge_state
    bridge_state.update(updates)
    save_bridge_state(bridge_state)

# ─── MOTEUR DE MANIFESTE ───────────────────────────────────────────────────
def get_manifest(pid):
    path = os.path.join(PROJECTS_DIR, pid, "manifest.json")
    if not os.path.exists(path): return None
    with open(path, "r", encoding="utf-8") as f: return json.load(f)

def save_manifest(pid, m):
    path = os.path.join(PROJECTS_DIR, pid, "manifest.json")
    with open(path, "w", encoding="utf-8") as f: json.dump(m, f, indent=2)

def extract_code(text):
    if "```" in text:
        parts = text.split("```")
        code_parts = []
        for i in range(1, len(parts), 2):
            block = parts[i].strip()
            for lang in ["json\n", "typescript\n", "tsx\n", "jsx\n", "javascript\n", "scss\n", "css\n", "html\n", "typescript", "tsx", "jsx", "javascript"]:
                if block.startswith(lang):
                    block = block[len(lang):].strip()
                    break
            code_parts.append(block)
        return "\n\n".join(code_parts)
    
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end+1].strip()
        
    return text.strip()

# ─── ORCHESTRATEUR DE MISSION ──────────────────────────────────────────────
def trigger_next_step(pid):
    m = get_manifest(pid)
    if not m: return

    log_event(f"🔄 [ORCHESTRATEUR] Analyse de l'étape suivante pour {pid}...")

    if m["status"] in ["idle", "generating_manifesto"]:
        prds = [
            "MISSION_STRATEGY.md", "USER_FLOW.md", "TECH_STACK.md", 
            "UI_UX_DESIGN_SYSTEM.md", "DATA_ARCHITECTURE.md", "API_SPECIFICATIONS.md",
            "SECURITY_PROTOCOLS.md", "TEST_SUITE.md", "DEPLOYMENT_PLAN.md", "EVOLUTION_ROADMAP.md"
        ]
        next_prd = None
        for p in prds:
            if not os.path.exists(os.path.join(PROJECTS_DIR, pid, p)):
                next_prd = p
                break
        
        if next_prd:
            log_event(f"📜 [FORGE] Génération du PRD : {next_prd}")
            prompt = f"""AGIS EN TANT QU'ARCHITECTE DIAMOND G6.5. 
Genere le fichier PRD suivant pour le projet '{m['name']}' : {next_prd}.
Description du projet : {m['description']}
Stack : {m['stack']}

EXIGENCE DE QUALITÉ SUPRÊME :
- Le contenu doit être extrêmement riche et détaillé (>800 mots).
- PAS de squelettes, PAS de placeholders, PAS de listes à puces vides.
- Rédige des paragraphes complets, une analyse profonde et des spécifications techniques réelles.
- Respecte scrupuleusement les STANDARDS G6.5 GOLD.

IMPORTANT: Termine impérativement ton message par la balise unique : [STATUS: FINISHED]
Réponds uniquement avec le contenu Markdown du fichier."""
            
            update_bridge_state({
                "status": "generating", "project_id": pid, "prompt_type": "prd_single",
                "target_file": next_prd, "prompt": prompt, "last_callback_time": time.time()
            })
            return
        else:
            m["status"] = "manifesto_completed"
            save_manifest(pid, m)
            log_event(f"✅ [FORGE] Bible complétée pour {pid}.")

    if m["status"] == "manifesto_completed":
        log_event(f"🗺️ [FORGE] Génération du plan de fichiers pour {pid}")
        prompt = f"AGIS EN TANT QU'INGÉNIEUR DIAMOND. Crée le plan de fichiers pour '{m['name']}'. Stack: {m['stack']}. Renvoie UNIQUEMENT un JSON: {{'files': [{{'path': 'src/App.tsx', 'description': '...'}}]}}. IMPORTANT: Termine ton message par [STATUS: FINISHED]"
        update_bridge_state({
            "status": "generating", "project_id": pid, "prompt_type": "fileplan",
            "prompt": prompt, "last_callback_time": time.time()
        })
        return

    if m["status"] == "codegen_running":
        next_file = next((f for f in m["files"] if f["status"] == "pending"), None)
        if next_file:
            log_event(f"🛠️ [FORGE] Codage du fichier : {next_file['path']}")
            prompt = f"AGIS EN TANT QUE DÉVELOPPEUR ELITE G6.5. Code le fichier '{next_file['path']}' pour le projet '{m['name']}'. {next_file['description']}. Standards: TypeScript, Design Premium, Zéro Placeholders. Code uniquement. IMPORTANT: Termine par [STATUS: FINISHED]"
            update_bridge_state({
                "status": "generating", "project_id": pid, "prompt_type": "code",
                "current_file_path": next_file['path'], "prompt": prompt, "last_callback_time": time.time()
            })
            return
        else:
            m["status"] = "completed"
            save_manifest(pid, m)
            
            # Création du launcher Web/Test
            project_path = os.path.join(PROJECTS_DIR, pid)
            launcher_path = os.path.join(project_path, "launcher.sh")
            with open(launcher_path, "w", encoding="utf-8") as f:
                f.write("#!/bin/bash\ncd \"$(dirname \"$0\")\"\necho '⚙️ Installation des dependances...'\nnpm install --no-fund --no-audit\necho '🚀 Lancement du serveur Web...'\nnpm run web -- --port 8080\n")
            try:
                os.chmod(launcher_path, 0o755)
            except: pass

            log_event(f"💎 [MISSION ACCOMPLIE] Projet {pid} terminé ! Launcher généré.")
            update_bridge_state({"status": "idle", "prompt": None})

# ─── ROUTES API ─────────────────────────────────────────────────────────────
@app.route('/v1/projects', methods=['GET'])
def list_projects():
    if not os.path.exists(PROJECTS_DIR): return jsonify([])
    dirs = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
    return jsonify(dirs)

@app.route('/v1/projects/<pid>/tree', methods=['GET'])
def get_project_tree(pid):
    project_path = os.path.join(PROJECTS_DIR, pid)
    if not os.path.exists(project_path): return jsonify([])
    
    def build_tree(path):
        tree = []
        for name in sorted(os.listdir(path)):
            if name in ['node_modules', '.git']: continue
            full_path = os.path.join(path, name)
            rel_path = os.path.relpath(full_path, project_path).replace("\\", "/")
            if os.path.isdir(full_path):
                tree.append({"name": name, "path": rel_path, "type": "folder", "children": build_tree(full_path)})
            else:
                tree.append({"name": name, "path": rel_path, "type": "file"})
        return tree
    return jsonify(build_tree(project_path))

@app.route('/v1/projects/<pid>/file', methods=['GET', 'POST'])
def manage_file(pid):
    project_path = os.path.join(PROJECTS_DIR, pid)
    filepath = request.args.get("path")
    if not filepath: return jsonify({"error": "path missing"}), 400
    
    full_path = os.path.join(project_path, filepath)
    if not full_path.startswith(project_path): return jsonify({"error": "invalid path"}), 403

    if request.method == 'GET':
        if not os.path.exists(full_path): return jsonify({"content": ""})
        try:
            with open(full_path, "r", encoding="utf-8") as f: content = f.read()
            return jsonify({"content": content})
        except: return jsonify({"content": "// Fichier binaire ou illisible"})
        
    if request.method == 'POST':
        data = request.get_json(force=True, silent=True) or {}
        content = data.get("content", "")
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f: f.write(content)
        return jsonify({"status": "ok"})

@app.route('/v1/projects/create', methods=['POST'])
def create_project():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name", "Mission")
    pid = f"{name.replace(' ', '_')}_{int(time.time()) % 10000}"
    pdir = os.path.join(PROJECTS_DIR, pid)
    os.makedirs(pdir, exist_ok=True)
    m = {"id": pid, "name": name, "description": data.get("description", ""), "stack": data.get("stack", "React Native + Expo"), "status": "idle", "files": []}
    save_manifest(pid, m)
    log_event(f"🚀 [NOUVELLE MISSION] {pid} initialisée.")
    trigger_next_step(pid)
    return jsonify(m)

@app.route('/v1/projects/resume', methods=['POST'])
def resume_project():
    data = request.get_json(force=True, silent=True) or {}
    pid = data.get("id")
    if pid: trigger_next_step(pid)
    return jsonify({"status": "ok"})

@app.route('/v1/bridge/poll', methods=['GET'])
def poll_bridge(): 
    if bridge_state["status"] == "cooling":
        if time.time() - bridge_state["last_callback_time"] > 60:
            log_event(f"❄️ [COOLING] Fin de la pause. Tentative de relance pour {bridge_state['project_id']}...")
            trigger_next_step(bridge_state["project_id"])
        return jsonify({"status": "cooling", "prompt": None})

    if bridge_state["status"] == "generating" and time.time() - bridge_state["last_callback_time"] > 180:
        log_event(f"⚠️ [WATCHDOG] Timeout détecté pour {bridge_state['project_id']}. Relance...")
        trigger_next_step(bridge_state["project_id"])
    return jsonify(bridge_state)

@app.route('/v1/bridge/callback', methods=['POST'])
def bridge_callback():
    global bridge_state
    data = request.get_json(force=True, silent=True) or {}
    pid = data.get("project_id")
    content = data.get("content", "")
    
    if (not pid or pid in ["unknown", "repair_mode"]) and bridge_state.get("project_id"):
        pid = bridge_state["project_id"]
        log_event(f"🔧 [REPAIR] ID inconnu remplacé par : {pid}")

    if not pid or not content: return jsonify({"status": "ignored"})
    
    if not bridge_state.get("prompt_type") or bridge_state["prompt_type"] == "None" or bridge_state["prompt_type"] is None:
        log_event(f"🔧 [REPAIR] État perdu pour {pid}. Tentative de reconstruction...")
        m = get_manifest(pid)
        if m:
            if m["status"] in ["idle", "generating_manifesto"]: update_bridge_state({"prompt_type": "prd_single", "target_file": "MISSION_STRATEGY.md"})
            elif m["status"] == "manifesto_completed": update_bridge_state({"prompt_type": "fileplan"})
            elif m["status"] == "codegen_running": update_bridge_state({"prompt_type": "code"})

    junk_keywords = ["Messages trop fréquentes", "Veuillez réessayer", "too many requests"]
    is_junk = any(kw.lower() in content.lower() for kw in junk_keywords)
    
    ptype = bridge_state.get("prompt_type", "unknown")
    log_event(f"📬 [INCOMING] Type: {ptype}, Taille: {len(content)} chars")

    target_file = bridge_state.get("target_file", "")
    short_file_keywords = ["types/", "utils/", "config", ".d.ts", "vite-env", "index.ts", "constants"]
    is_short_file = any(kw in target_file.lower() for kw in short_file_keywords)
    min_length = 80 if is_short_file else 400
    is_short = (ptype in ["prd_single", "code"] and len(content) < min_length)

    if is_junk or is_short:
        log_event(f"⚠️ [QUALITY GUARD] Rejet de la réponse pour {pid} (Junk: {is_junk}, Short: {is_short}). Pause de 60s.")
        update_bridge_state({"status": "cooling", "last_callback_time": time.time()})
        return jsonify({"status": "rejected", "reason": "quality_fail"})
 
    log_event(f"📥 [BRIDGE] Réponse de qualité reçue pour {pid} (Type: {ptype})")
    update_bridge_state({"last_callback_time": time.time()})
    m = get_manifest(pid)
    if not m: return jsonify({"status": "error", "reason": "no_manifest"})

    if ptype == "prd_single":
        target = bridge_state.get("target_file")
        if not target: return jsonify({"status": "ignored"})
        with open(os.path.join(PROJECTS_DIR, pid, target), "w", encoding="utf-8") as f: f.write(content)
        log_event(f"💎 [CAPTURE] PRD matérialisé : {target}")
        trigger_next_step(pid)

    elif ptype == "fileplan":
        try:
            plan_data = extract_code(content)
            plan = json.loads(plan_data)
            files = plan.get("files", [])
            m["files"] = []
            for f in files:
                path = f.get("path") or f.get("file")
                desc = f.get("description") or f.get("desc") or "Sans description"
                if path: m["files"].append({"path": path, "description": desc, "status": "pending"})
            m["status"] = "codegen_running"
            save_manifest(pid, m)
            log_event(f"💎 [CAPTURE] Plan de fichiers enregistré pour {pid} ({len(m['files'])} fichiers)")
            trigger_next_step(pid)
        except Exception as e:
            update_bridge_state({"status": "cooling", "last_callback_time": time.time()})
            return jsonify({"status": "error", "reason": "invalid_json"})

    elif ptype == "code":
        fpath = bridge_state["current_file_path"]
        if not fpath:
            for f in m["files"]:
                if f["status"] == "pending":
                    fpath = f["path"]
                    break
        if fpath:
            full_path = os.path.join(PROJECTS_DIR, pid, fpath)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            try:
                code_content = extract_code(content)
                with open(full_path, "w", encoding="utf-8") as f: f.write(code_content)
                for f in m["files"]:
                    if f["path"] == fpath: f["status"] = "completed"
                save_manifest(pid, m)
                log_event(f"💎 [CAPTURE] Fichier source matérialisé : {fpath}")
                trigger_next_step(pid)
            except Exception as e:
                update_bridge_state({"status": "cooling", "last_callback_time": time.time()})
                return jsonify({"status": "error", "reason": "write_fail"})

    return jsonify({"status": "ok"})

@app.route('/v1/logs', methods=['GET'])
def get_logs():
    if not os.path.exists(LOG_FILE): return jsonify({"logs": []})
    with open(LOG_FILE, "r", encoding="utf-8") as f: lines = f.readlines()
    return jsonify({"logs": lines[-50:]})

@app.route('/v1/bridge/reset', methods=['POST'])
def bridge_reset():
    update_bridge_state({"status": "idle", "prompt": None, "project_id": None, "prompt_type": None, "last_callback_time": 0})
    return jsonify({"status": "ok"})

@app.route('/v1/projects/<pid>/audit', methods=['POST'])
def trigger_audit(pid):
    prompt = f"AGIS EN TANT QU'AUDITEUR EXPERT. Analyse le projet '{pid}' et génère un rapport complet d'audit stratégique. IMPORTANT: Termine par [STATUS: FINISHED]"
    update_bridge_state({"status": "generating", "project_id": pid, "prompt_type": "audit", "prompt": prompt, "last_callback_time": time.time()})
    return jsonify({"status": "ok"})

@app.route('/v1/projects/<pid>/patch', methods=['POST'])
def trigger_patch(pid):
    data = request.get_json(force=True, silent=True) or {}
    instruction = data.get("instruction", "")
    prompt = f"AGIS EN TANT QU'EXPERT REFACTORING. Applique ce patch sur le projet '{pid}': {instruction}. Génère uniquement le code source des fichiers modifiés avec leur chemin. IMPORTANT: Termine par [STATUS: FINISHED]"
    update_bridge_state({"status": "generating", "project_id": pid, "prompt_type": "code", "prompt": prompt, "last_callback_time": time.time()})
    return jsonify({"status": "ok"})

@app.route('/v1/projects/<pid>/doctor', methods=['POST'])
def trigger_doctor(pid):
    prompt = f"AGIS EN TANT QUE DOCTOR G6. Analyse la structure du projet '{pid}' et corrige les éventuels bugs structurels. IMPORTANT: Termine par [STATUS: FINISHED]"
    update_bridge_state({"status": "generating", "project_id": pid, "prompt_type": "code", "prompt": prompt, "last_callback_time": time.time()})
    return jsonify({"status": "ok"})

@app.route('/v1/projects/<pid>/run', methods=['POST'])
def trigger_run(pid):
    project_path = os.path.join(PROJECTS_DIR, pid)
    launcher = os.path.join(project_path, "launcher.sh")
    if os.path.exists(launcher):
        subprocess.Popen(["sh", launcher])
        return jsonify({"status": "started", "url": "http://127.0.0.1:8080"})
    return jsonify({"status": "error", "reason": "no launcher"})

@app.route('/v1/projects/<pid>/apk', methods=['POST'])
def trigger_apk(pid):
    project_path = os.path.join(PROJECTS_DIR, pid)
    subprocess.Popen(["sh", os.path.join(os.path.expanduser("~"), "build_apk.sh"), project_path])
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    log_event("💎 [SERVEUR MOBILE] Moteur Diamond G6.5 Mobile Natif sur port 5005.")
    app.run(host='0.0.0.0', port=5005, debug=False)
