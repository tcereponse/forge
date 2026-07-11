import time
import requests
import os
import subprocess
import json
import shutil
from flask import Flask, request, jsonify

app = Flask(__name__)

POLL_URL = "http://127.0.0.1:5005/v1/bridge/poll"
DONE_URL = "http://127.0.0.1:5005/v1/mission/apk-done"
# Chemins spécifiques à Termux (stockage interne privé)
TERMUX_HOME = os.path.expanduser("~")
TEMP_BUILD_DIR = os.path.join(TERMUX_HOME, "temp_forge_build")
# Chemin partagé Android
ANDROID_SHARED = "/storage/emulated/0/Eliteqod"
BASE_SHELL_APK = os.path.join(ANDROID_SHARED, "forge_setup", "custom", "shell_com.elite.tigerh.apk") # ou générique

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "termux_online"})

@app.route('/build', methods=['POST'])
def build_apk():
    data = request.json or {}
    project_id = data.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id manquant"}), 400
        
    log(f"🔔 DÉLÉGATION REÇUE DANS TERMUX POUR : {project_id}")
    
    # On lance la compilation en asynchrone pour ne pas bloquer la requête
    import threading
    threading.Thread(target=process_delegation, args=(project_id,)).start()
    
    return jsonify({"status": "building"})

def process_delegation(project_id):
    try:
        log(f"📥 Copie du projet {project_id} vers le stockage privé Termux...")
        os.makedirs(TEMP_BUILD_DIR, exist_ok=True)
        
        proj_termux_path = os.path.join(TEMP_BUILD_DIR, project_id)
        if os.path.exists(proj_termux_path):
            shutil.rmtree(proj_termux_path, ignore_errors=True)
            
        mobile_proj_path = os.path.join(ANDROID_SHARED, "PROJECTS", project_id)
        shutil.copytree(mobile_proj_path, proj_termux_path)
        log("✅ Copie terminée.")

        # 0. Patch de Souveraineté (Nettoyage PostCSS, Tailwind et Vite)
        log("🩹 Application des patchs de nettoyage de code...")
        for root, _, files in os.walk(proj_termux_path):
            for file in files:
                fpath = os.path.join(root, file)
                if file == "postcss.config.js":
                    try:
                        with open(fpath, "r", encoding="utf-8") as f: content = f.read()
                        new_content = content.replace('@tailwindcss/postcss', 'tailwindcss')
                        if new_content != content:
                            with open(fpath, "w", encoding="utf-8") as f: f.write(new_content)
                            log("   ✅ postcss.config.js réparé.")
                    except: pass
                elif file == "package.json":
                    try:
                        import json
                        with open(fpath, "r", encoding="utf-8") as f: pkg = json.load(f)
                        changed = False
                        for dtype in ["dependencies", "devDependencies"]:
                            if dtype in pkg and "@tailwindcss/postcss" in pkg[dtype]:
                                del pkg[dtype]["@tailwindcss/postcss"]
                                changed = True
                        if "tailwindcss" not in pkg.get("devDependencies", {}) and "tailwindcss" not in pkg.get("dependencies", {}):
                            pkg.setdefault("devDependencies", {})["tailwindcss"] = "^3.4.1"
                            changed = True
                        if "autoprefixer" not in pkg.get("devDependencies", {}) and "autoprefixer" not in pkg.get("dependencies", {}):
                            pkg.setdefault("devDependencies", {})["autoprefixer"] = "^10.4.17"
                            changed = True
                        if changed:
                            with open(fpath, "w", encoding="utf-8") as f: json.dump(pkg, f, indent=2)
                            log("   ✅ package.json réparé (Tailwind/PostCSS).")
                    except: pass
                elif file in ["vite.config.ts", "vite.config.js"]:
                    try:
                        with open(fpath, "r", encoding="utf-8") as f: content = f.read()
                        if "base:" not in content:
                            import re
                            content = re.sub(r'(defineConfig\(\{)', r"\1\n  base: './',", content)
                            with open(fpath, "w", encoding="utf-8") as f: f.write(content)
                            log(f"   ✅ {file} configuré (base: './').")
                    except: pass
        
        # 1. Compilation Node.js (Vite)
        log("📦 Lancement de npm install...")
        res_inst = subprocess.run("npm install --no-fund --no-audit", cwd=proj_termux_path, shell=True, capture_output=True, text=True)
        if res_inst.returncode != 0:
            log(f"⚠️ npm install erreur (on tente quand même la suite): {res_inst.stderr[:200]}")
            
        log("⚙️ Lancement de vite build...")
        res_build = subprocess.run("npm run build", cwd=proj_termux_path, shell=True, capture_output=True, text=True)
        
        dist_path = os.path.join(proj_termux_path, "dist")
        if not os.path.exists(dist_path) or not os.listdir(dist_path):
            log(f"❌ Échec de compilation. Logs:\n{res_build.stdout[-500:]}\n{res_build.stderr[-500:]}")
            return
        log("✅ Compilation Vite réussie !")

        # 2. Injection dans la coquille APK (avec zipfile en Python pur)
        import zipfile
        
        # Trouver la coquille de base (on prend la générique si personnalisée n'existe pas)
        shell_apk = os.path.join(ANDROID_SHARED, "forge_setup", "custom", f"shell_com.elite.{project_id.lower()}.apk")
        if not os.path.exists(shell_apk):
            shell_apk = os.path.join(ANDROID_SHARED, "forge_setup", "custom", "diamondvveer124_android.apk")
            
        if not os.path.exists(shell_apk):
            log(f"❌ Coquille APK introuvable à {shell_apk}")
            return
            
        work_apk = os.path.join(TEMP_BUILD_DIR, f"{project_id}_unsigned.apk")
        shutil.copy2(shell_apk, work_apk)
        
        log("💉 Injection du code dans la coquille APK...")
        with zipfile.ZipFile(work_apk, 'a', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(dist_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Le chemin dans l'APK doit être assets/www/...
                    arcname = os.path.join("assets", "www", os.path.relpath(file_path, dist_path))
                    zf.write(file_path, arcname)
        log("✅ Injection terminée.")

        # 3. Signature de l'APK (avec apksigner)
        log("🔐 Signature de l'APK...")
        keystore = os.path.join(ANDROID_SHARED, "forge_setup", "core", "elite_jks.keystore")
        final_apk = os.path.join(TEMP_BUILD_DIR, f"{project_id}_diamond.apk")
        
        # Commande apksigner (dispo dans Termux si installé via 'pkg install apksigner')
        sign_cmd = f"apksigner sign --ks {keystore} --ks-pass pass:qodmax --out {final_apk} {work_apk}"
        res_sign = subprocess.run(sign_cmd, shell=True, capture_output=True, text=True)
        
        if res_sign.returncode != 0:
            log(f"❌ Erreur de signature: {res_sign.stderr}")
            return
        log("✅ Signature réussie !")

        # 4. Transfert vers le stockage partagé Android
        mobile_apk_path = os.path.join(ANDROID_SHARED, "APK", f"{project_id}_diamond.apk")
        os.makedirs(os.path.dirname(mobile_apk_path), exist_ok=True)
        shutil.copy2(final_apk, mobile_apk_path)
        log(f"📤 APK final exporté vers {mobile_apk_path}")
        
        # 5. Notifier Chaquopy
        log("✅ Notification de Chaquopy (apk-done)...")
        try:
            requests.post(DONE_URL, json={"apk_path": mobile_apk_path}, timeout=5)
            log("🎉 MISSION 100% MOBILE ACCOMPLIE !")
        except Exception as e:
            log(f"⚠️ Impossible de notifier Chaquopy : {e}")
            
    except Exception as e:
        log(f"❌ Exception générale : {e}")

if __name__ == "__main__":
    log("💎 TERMUX FORGE WATCHER DÉMARRÉ SUR LE PORT 5006...")
    # On écoute sur toutes les interfaces locales
    app.run(host='127.0.0.1', port=5006, debug=False)
