import os
import shutil
import subprocess
import argparse
import sys
import logging
import platform
import stat
from pathlib import Path
import zipfile

# Configuration de la journalisation de prestige
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("QodmaxSovereign")

def robust_copy(src, dst):
    """Copie un fichier de manière robuste en gérant les fichiers en lecture seule ou verrouillés."""
    dst_path = Path(dst)
    if dst_path.exists():
        try:
            os.chmod(dst_path, stat.S_IWRITE)
        except Exception:
            pass
    try:
        shutil.copy2(src, dst)
    except PermissionError:
        try:
            os.chmod(dst_path, stat.S_IWRITE)
            os.remove(dst_path)
            shutil.copy2(src, dst)
        except Exception as e:
            logger.warning(f"  [!] Impossible d'écraser le fichier verrouillé {dst}: {e}")


class APKBuilder:
    """
    INGÉNIEUR ARCHITECTE INFRASTRUCTURE MOBILE - QODMAX SOUVERAIN (v12.3)
    Ce moteur est 100% indépendant et harmonisé avec le protocole Elite.
    """

    def __init__(self, project_name, package_id, web_build_path):
        self.project_name = project_name
        self.package_id = package_id
        self.root = Path(__file__).resolve().parent.parent
        self.web_build_path = Path(web_build_path).resolve()
        self.output_dir = self.root / "apkbuilder" / f"{project_name.lower()}_android"
        
        self.app_dir = self.output_dir
        self.src_dir = self.app_dir / "src/main"
        self.java_dir = self.src_dir / "java" / self.package_id.replace(".", "/")
        self.assets_dir = self.src_dir / "assets"
        self.root_assets_dir = self.src_dir / "assets"
        self.res_dir = self.src_dir / "res"

    def scaffold(self):
        """Initialise la structure de dossier Android."""
        logger.info(f"[*] Préparation du projet Qodmax : {self.project_name}")
        if self.output_dir.exists():
            # Libérer les verrous sous Windows en arrêtant tous les processus Java/Gradle orphelins
            if platform.system() == "Windows":
                logger.info("[*] Libération des verrous de fichiers sous Windows (Démons Gradle / Java)...")
                try:
                    subprocess.run(["taskkill", "/f", "/im", "java.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    subprocess.run(["taskkill", "/f", "/im", "gradle.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                except Exception:
                    pass
                
                # Tenter d'arrêter proprement les démons Gradle s'il y en a
                gradlew = self.output_dir / "gradlew.bat"
                if gradlew.exists():
                    try:
                        subprocess.run([str(gradlew), "--stop"], cwd=str(self.output_dir), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, shell=True)
                    except Exception:
                        pass
            
            # Suppression robuste et temporisée pour contourner le verrouillage de fichiers Windows
            import time
            for attempt in range(5):
                try:
                    shutil.rmtree(self.output_dir)
                    logger.info("  [+] Répertoire de build nettoyé avec succès.")
                    break
                except Exception as e:
                    if attempt == 4:
                        logger.warning(f"⚠️ [AVERTISSEMENT] Impossible de vider complètement le dossier build (fichiers verrouillés) : {e}")
                        shutil.rmtree(self.output_dir, ignore_errors=True)
                    else:
                        time.sleep(1)
        
        template_dir = self.root / "apkbuilder/templates"
        if not template_dir.exists():
            logger.error(f"❌ Template Qodmax introuvable dans {template_dir} !")
            sys.exit(1)
            
        shutil.copytree(template_dir, self.output_dir, dirs_exist_ok=True, copy_function=robust_copy)
        self.assets_dir.mkdir(parents=True, exist_ok=True)
        logger.info("[+] Zone de forge souveraine prête.")

    def inject_assets(self):
        """Injection de l'Arsenal et de la Connaissance (Injection Directe + ZIP)."""
        logger.info("[*] Embarquement de l'Arsenal Complet...")
        
        # 1. Injection Web DIRECTE (Force Brute pour garantir l'affichage)
        logger.info(f"[*] Injection Web directe depuis {self.web_build_path}")
        www_dir = self.assets_dir / "www"
        if www_dir.exists(): 
            shutil.rmtree(www_dir, ignore_errors=True)
        www_dir.mkdir(parents=True, exist_ok=True)
        shutil.copytree(self.web_build_path, www_dir, dirs_exist_ok=True, copy_function=robust_copy)
        
        # Copie aussi à la racine pour la triple sécurité
        shutil.copytree(self.web_build_path, self.assets_dir, dirs_exist_ok=True, copy_function=robust_copy)
        
        # 2. Emballage ZIP pour le Cerveau (Optionnel mais conservé pour le Bridge)
        ui_zip = self.root_assets_dir / "app_ui.zip"
        with zipfile.ZipFile(ui_zip, 'w', zipfile.ZIP_DEFLATED) as z:
            for f in self.web_build_path.glob("**/*"):
                if f.is_file() and "__pycache__" not in str(f):
                    z.write(f, f.relative_to(self.web_build_path))
        
        # Cerveau Python (Souveraineté E:)
        python_dir = self.src_dir / "python"
        python_dir.mkdir(parents=True, exist_ok=True)
        
        # Injection du Cerveau Diamond Unifié (nexus_bridge.py)
        robust_copy(self.root / "bridge/nexus_bridge.py", python_dir / "nexus_bridge.py")
        if (self.root / "core/diamond_forge.py").exists():
            robust_copy(self.root / "core/diamond_forge.py", python_dir / "diamond_forge.py")
            
        # Embarquement de la machinerie de forge complète (apk_builder, apktool, etc.)
        forge_src = self.root / "forge_setup"
        dest_forge = python_dir / "forge_setup"
        if forge_src.exists():
            if not dest_forge.exists():
                def ignore_heavy_forge_assets(path, names):
                    ignored = []
                    path_obj = Path(path)
                    is_in_compiler = "compiler" in path_obj.parts or path_obj.name == "compiler"
                    
                    for name in names:
                        name_lower = name.lower()
                        if (name in ["java_jdk", "android_sdk", "output", "__pycache__"] or 
                            "_android" in name_lower or 
                            name.startswith(".") or 
                            name in ["build", "node_modules", "temp"]):
                            ignored.append(name)
                        elif is_in_compiler and (name.endswith(".jar") or name == "temp_web" or name == "APK"):
                            ignored.append(name)
                    return ignored
                shutil.copytree(forge_src, dest_forge, dirs_exist_ok=True, ignore=ignore_heavy_forge_assets, copy_function=robust_copy)
            else:
                # Éviter de reparcourir récursivement les sous-dossiers de compilateur profonds
                for item in forge_src.iterdir():
                    if item.is_file():
                        robust_copy(item, dest_forge / item.name)
                    elif item.is_dir() and item.name not in ["java_jdk", "android_sdk", "output", "__pycache__"] and not item.name.startswith("."):
                        os.makedirs(dest_forge / item.name, exist_ok=True)
                        for sub_item in item.iterdir():
                            if sub_item.is_file():
                                if item.name == "compiler" and sub_item.name.endswith(".jar"):
                                    continue
                                robust_copy(sub_item, dest_forge / item.name / sub_item.name)
            logger.info("[+] Machinerie de Forge SOUVERAINE embarquée (forge_setup) !")
            
        logger.info("[+] Cerveau SOUVERAIN Qodmax injecté !")
        
        # Packs de bibliothèque (Protocole G12.3) - OPTIMISATION DE PRESTIGE (GRADE DIAMOND)
        # Exclut les node_modules, les caches Gradle de build, et le dossier 'custom' de l'arsenal
        # Reduit la taille de l'APK de 3 Go à 250 Mo et le temps d'emballage de 9 minutes à 2 secondes !
        mapping = {
            "arsenal": "arsenal_pack.zip",
            "extensions": "extensions_library.zip",
            "structure_library": "structure_library.zip",
            "memoire": "memoire_cognitive.zip",
            "blueprints": "prd_library.zip"
        }
        
        for folder, zip_name in mapping.items():
            src_path = self.root / folder
            if src_path.exists():
                logger.info(f"[*] Emballage de {zip_name}...")
                zip_path = self.root_assets_dir / zip_name
                try:
                    elements_sauves = 0
                    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_STORED) as z:
                        for root_dir, subdirs, files in os.walk(src_path):
                            # Élagage à la racine pour interdire de descendre dans les dossiers lourds
                            subdirs[:] = [d for d in subdirs if d.lower() not in [
                                "node_modules", ".git", "__pycache__", ".gradle", "build", "temp", "dist", "backups"
                            ]]
                            
                            # Élagage de 'custom/' pour l'arsenal (exclut les 14 APKs géants historiques de 70 Mo chacun)
                            if folder == "arsenal":
                                subdirs[:] = [d for d in subdirs if d.lower() != "custom"]
                                
                            for file in files:
                                _, ext = os.path.splitext(file)
                                ext_lower = ext.lower()
                                
                                # Filtrer les fichiers compressés et les logs
                                if ext_lower in [".zip", ".rar", ".log", ".tar", ".gz"] and zip_name != "app_ui.zip":
                                    continue
                                if file.startswith("hs_err_") or file.startswith("replay_"):
                                    continue
                                    
                                if folder == "arsenal" and "custom" in Path(root_dir).parts:
                                    continue
                                    
                                full_path = os.path.join(root_dir, file)
                                rel_path = os.path.relpath(full_path, src_path)
                                z.write(full_path, rel_path)
                                elements_sauves += 1
                                
                    logger.info(f"  [+] Packagé : {zip_name} ({elements_sauves} fichiers)")
                except Exception as e:
                    logger.warning(f"  [!] Problème mineur sur {zip_name} : {e}")
        


        # 3. Injection du Script Furtif (phantom.js) - VERSION G13 DIAMOND COCKPIT
        phantom_js = """
        (function() {
            console.log("💎 STEALTH BRIDGE G13 : Initialisation...");
            let lastCapturedContent = "";
            
            function injectPrompt() {
                const prompt = AndroidBridge.getMissionPrompt();
                if (!prompt || prompt === "") return false;

                const selectors = [
                    'textarea#chat-input', '.ds-textarea', 'textarea[placeholder*="message" i]',
                    'textarea.ds-input__textarea', '#prompt-textarea', '#chat-input',
                    'div[contenteditable="true"]', 'textarea', '[role="textbox"]', 'rich-textarea'
                ];

                for (let s of selectors) {
                    const el = document.querySelector(s);
                    if (el) {
                        console.log("🎯 Cible d'injection détectée : " + s);
                        try {
                            el.focus();
                            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set || 
                                                     Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                                if (nativeSetter) {
                                    nativeSetter.call(el, prompt);
                                } else {
                                    el.value = prompt;
                                }
                            } else {
                                el.innerText = prompt;
                                el.textContent = prompt;
                            }
                            
                            // Dispatch d'événements pour forcer le rafraîchissement d'état React/Vue
                            ['input', 'change', 'keyup'].forEach(name => el.dispatchEvent(new Event(name, { bubbles: true })));
                            
                            // Attente du rafraîchissement et envoi
                            setTimeout(() => {
                                const sendBtnSelectors = [
                                    '.ds-input-send-button', '.ds-input-send-btn', 'button.ds-input-send-btn',
                                    'button[aria-label*="envoyer" i]', 'button[aria-label*="send" i]',
                                    '[data-testid="send-button"]', 'div[role="button"][aria-label*="send" i]',
                                    '.send-button', '[class*="send-button"]'
                                ];
                                
                                let sent = false;
                                for (let btnSel of sendBtnSelectors) {
                                    const btn = document.querySelector(btnSel);
                                    if (btn) {
                                        const isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
                                        if (!isDisabled) {
                                            btn.click();
                                            console.log("🚀 Bouton envoi cliqué (" + btnSel + ")");
                                            sent = true;
                                            break;
                                        }
                                    }
                                }
                                
                                if (!sent) {
                                    // Fallback 1 : Clic sur tout élément avec une icône SVG d'envoi
                                    const svgBtn = document.querySelector('svg path[d*="M2.01"], svg path[d*="M12"]')?.closest('button') ||
                                                   document.querySelector('div[role="button"] svg, span.ds-icon-button');
                                    if (svgBtn) {
                                        const actualBtn = svgBtn.closest('button') || svgBtn.closest('div[role="button"]') || svgBtn;
                                        actualBtn.click();
                                        console.log("🚀 Envoi par clic SVG Fallback réussi !");
                                        sent = true;
                                    }
                                }

                                if (sent) {
                                    try { AndroidBridge.clearMission(); } catch(e){}
                                    startCaptureMonitor();
                                } else {
                                    console.warn("⚠️ Impossible de cliquer sur le bouton d'envoi. Tentative de forcer la touche Entrée...");
                                    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
                                    el.dispatchEvent(enterEvent);
                                    try { AndroidBridge.clearMission(); } catch(e){}
                                    startCaptureMonitor();
                                }
                            }, 1500);
                            
                            return true;
                        } catch (e) {
                            console.error("❌ Échec de l'injection :", e);
                        }
                    }
                }
                return false;
            }

            let lastLength = 0;
            let lastActivityTime = Date.now();

            function startCaptureMonitor() {
                console.log("📡 RADAR DE CAPTURE ACTIVÉ...");
                const checkInterval = setInterval(() => {
                    const messages = document.querySelectorAll('.markdown, .message-content, .ds-markdown, .prose, .ds-message-content, .model-response-text, message-content');
                    if (messages.length === 0) return;
                    
                    const lastMsg = messages[messages.length - 1];
                    const content = lastMsg.innerText || lastMsg.textContent || "";

                    if (content.length > lastLength) {
                        lastActivityTime = Date.now();
                        lastLength = content.length;
                    }

                    const stopBtn = document.querySelector('button[aria-label*="Stop" i], button[aria-label*="Arrêter" i], .ds-input-stop-btn, .ds-stop-button, button.ds-button--stop');
                    const isStillGenerating = !!stopBtn;
                    
                    const hasMarkers = content.includes("FILE:") || content.includes("Fichier:") || content.includes("Fichier :") || content.includes("###") || content.includes("```");
                    
                    if (hasMarkers && content.length > 50) {
                        if (content !== lastCapturedContent) {
                            const silenceDuration = Date.now() - lastActivityTime;
                            if (!isStillGenerating || silenceDuration > 4000) {
                                console.log("💾 CAPTURE DÉTECTÉE ! Envoi au disque mobile...");
                                AndroidBridge.sendCapture(content);
                                lastCapturedContent = content;
                                lastLength = content.length;
                                AndroidBridge.showToast("✅ PRD CAPTURÉS ET SAUVEGARDÉS !");
                            }
                        }
                    }
                }, 3000);
            }

            let attempts = 0;
            const scanner = setInterval(() => {
                if (injectPrompt() || attempts > 30) clearInterval(scanner);
                attempts++;
            }, 1500);
        })();
        """
        (self.assets_dir / "phantom.js").write_text(phantom_js, encoding="utf-8")
        logger.info("[+] Script Furtif G13 (phantom.js) matérialisé !")

    def generate_project_files(self):
        """Matérialisation et placement des fichiers Android (Respect structure main)."""
        logger.info("[*] Écriture des fichiers de forge (Rendu des Templates)...")
        
        mapping = {
            "src/AndroidManifest.xml.j2": "src/main/AndroidManifest.xml",
            "src/MainActivity.java.j2": f"src/main/java/{self.package_id.replace('.', '/')}/MainActivity.java",
            "src/styles.xml.j2": "src/main/res/values/styles.xml",
            "build.gradle": "build.gradle",
            "gradle.properties": "gradle.properties"
        }
        
        for t_name, dest_name in mapping.items():
            t_path = self.output_dir / t_name
            if t_path.exists():
                content = t_path.read_text(encoding="utf-8")
                content = content.replace("{{ package_id }}", self.package_id)
                content = content.replace("{{ app_name }}", self.project_name)
                
                dest_path = self.output_dir / dest_name
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                dest_path.write_text(content, encoding="utf-8")
                logger.info(f"  [+] Rendu : {dest_name}")
                if t_path != dest_path: t_path.unlink()
        
        # SOUVERAINETÉ TOTALE (E:)
        sdk_path = str(self.root / "apkbuilder/android_sdk")
        prop_path = self.output_dir / "local.properties"
        prop_path.write_text(f"sdk.dir={sdk_path.replace('\\', '/')}\n", encoding="utf-8")
        os.environ["JAVA_HOME"] = str(self.root / "apkbuilder/java_jdk/jdk-17.0.18+8")

    def generate_default_icons(self):
        """Génère des icônes adaptatives natives (Grade Gold)."""
        logger.info("[*] Génération des icônes adaptatives souveraines...")
        colors_xml = (self.res_dir / "values/colors.xml")
        colors_xml.parent.mkdir(parents=True, exist_ok=True)
        colors_xml.write_text('<?xml version="1.0" encoding="utf-8"?><resources><color name="ic_launcher_background">#0b0f19</color></resources>', encoding="utf-8")
        
        anydpi = self.res_dir / "mipmap-anydpi-v26"
        anydpi.mkdir(parents=True, exist_ok=True)
        icon_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground>
        <inset android:inset="20%">
            <path android:fillColor="#2196F3" android:pathData="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"/>
        </inset>
    </foreground>
</adaptive-icon>"""
        (anydpi / "ic_launcher.xml").write_text(icon_xml, encoding="utf-8")
        (anydpi / "ic_launcher_round.xml").write_text(icon_xml, encoding="utf-8")

    def run_gradle_build(self):
        """Lancement du Moteur de Forge avec vérification de sortie."""
        logger.info("[*] Lancement du Build Gradle...")
        gradlew = self.output_dir / "gradlew.bat"
        try:
            process = subprocess.Popen([str(gradlew), "assembleDebug", "--no-daemon", "--no-build-cache"], cwd=str(self.output_dir), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True, text=True)
            for line in process.stdout:
                print(f"  [Gradle] {line.strip()}")
            process.wait()
            
            # Recherche intelligente de l'APK (Gradle peut varier selon la structure)
            apk_candidates = list(self.output_dir.glob("**/build/outputs/apk/debug/*.apk"))
            final_apk = self.root / f"APK_OUTPUT/{self.project_name}_diamond.apk"
            
            if process.returncode == 0 and apk_candidates:
                apk_src = apk_candidates[0] # On prend le premier APK trouvé
                final_apk.parent.mkdir(exist_ok=True)
                shutil.copy2(apk_src, final_apk)
                logger.info(f"✅ MISSION RÉUSSIE : APK DIAMOND OPÉRATIONNEL")
                logger.info(f"  [+] Source : {apk_src.name}")
                logger.info(f"  [+] Destination : {final_apk}")
                return True
            else:
                logger.error(f"[!!!] ÉCHEC CRITIQUE : L'APK n'a pas été trouvé après la forge.")
                return False
        except Exception as e:
            logger.error(f"❌ Échec Forge : {e}")
            return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True)
    parser.add_argument("--name", default="QodmaxSovereign")
    parser.add_argument("--package", default="com.qodmax.souverain")
    parser.add_argument("--build", action="store_true")
    args = parser.parse_args()
    
    builder = APKBuilder(args.name, args.package, args.src)
    builder.scaffold()
    builder.inject_assets()
    builder.generate_project_files()
    builder.generate_default_icons()
    if args.build:
        builder.run_gradle_build()

if __name__ == "__main__":
    main()
