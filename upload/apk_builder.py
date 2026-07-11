import os
import shutil
import subprocess
import argparse
import sys
import logging
import platform
from pathlib import Path
import zipfile

# Configuration de la journalisation de prestige
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("QodmaxSovereign")

class APKBuilder:
    """
    INGÉNIEUR ARCHITECTE INFRASTRUCTURE MOBILE - QODMAX SOUVERAIN (v12.3)
    Ce moteur est 100% indépendant et harmonisé avec le protocole Elite.
    """

    def __init__(self, project_name, package_id, web_build_path):
        self.project_name = project_name
        self.package_id = package_id
        self.root = Path("E:/qodmaxv2").resolve()
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
            shutil.rmtree(self.output_dir, ignore_errors=True)
        
        template_dir = self.root / "apkbuilder/templates"
        if not template_dir.exists():
            logger.error(f"❌ Template Qodmax introuvable dans {template_dir} !")
            sys.exit(1)
            
        shutil.copytree(template_dir, self.output_dir, dirs_exist_ok=True)
        self.assets_dir.mkdir(parents=True, exist_ok=True)
        logger.info("[+] Zone de forge souveraine prête.")

    def inject_assets(self):
        """Injection de l'Arsenal et de la Connaissance (Injection Directe + ZIP)."""
        logger.info("[*] Embarquement de l'Arsenal Complet...")
        
        # 1. Injection Web DIRECTE (Force Brute pour garantir l'affichage)
        logger.info(f"[*] Injection Web directe depuis {self.web_build_path}")
        www_dir = self.assets_dir / "www"
        if www_dir.exists(): shutil.rmtree(www_dir)
        www_dir.mkdir(parents=True, exist_ok=True)
        shutil.copytree(self.web_build_path, www_dir, dirs_exist_ok=True)
        
        # Copie aussi à la racine pour la triple sécurité
        shutil.copytree(self.web_build_path, self.assets_dir, dirs_exist_ok=True)
        
        # 2. Emballage ZIP pour le Cerveau (Optionnel mais conservé pour le Bridge)
        ui_zip = self.root_assets_dir / "app_ui.zip"
        with zipfile.ZipFile(ui_zip, 'w', zipfile.ZIP_DEFLATED) as z:
            for f in self.web_build_path.glob("**/*"):
                if f.is_file() and "__pycache__" not in str(f):
                    z.write(f, f.relative_to(self.web_build_path))
        
        # Cerveau Python (Souveraineté E:)
        python_dir = self.src_dir / "python"
        python_dir.mkdir(parents=True, exist_ok=True)
        
        igniter_src = self.root / "apkbuilder/templates/src/python/mobile_bridge_server.py"
        if igniter_src.exists():
            shutil.copy2(igniter_src, python_dir / "mobile_bridge_server.py")
            logger.info("[+] Serveur Python Souverain Qodmax injecté !")
        
        # Injection des dépendances du cerveau
        shutil.copy2(self.root / "bridge/nexus_bridge.py", python_dir / "nexus_bridge.py")
        shutil.copy2(self.root / "core/diamond_forge.py", python_dir / "diamond_forge.py")
        
        # Packs de bibliothèque (Protocole G12.3)
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
                    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
                        for f in src_path.glob("**/*"):
                            if f.is_file(): z.write(f, f.relative_to(src_path))
                    logger.info(f"  [+] Packagé : {zip_name}")
                except Exception as e:
                    logger.warning(f"  [!] Problème mineur sur {zip_name} : {e}")

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
        sdk_path = "E:/qodmaxv2/apkbuilder/android_sdk"
        prop_path = self.output_dir / "local.properties"
        prop_path.write_text(f"sdk.dir={sdk_path.replace('\\', '/')}\n", encoding="utf-8")
        os.environ["JAVA_HOME"] = "E:/qodmaxv2/apkbuilder/java_jdk/jdk-17.0.18+8"

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
            process = subprocess.Popen([str(gradlew), "assembleDebug"], cwd=str(self.output_dir), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True, text=True)
            for line in process.stdout:
                print(f"  [Gradle] {line.strip()}")
            process.wait()
            
            # Recherche intelligente de l'APK (Gradle peut varier selon la structure)
            apk_candidates = list(self.output_dir.glob("**/build/outputs/apk/debug/*.apk"))
            final_apk = self.root / f"output/{self.project_name}_diamond.apk"
            
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
