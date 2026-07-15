import requests
import json
import os
import sys
import time

# ─── CONFIGURATION ──────────────────────────────────────────────────────────
BASE_URL = "http://127.0.0.1:5005/v1"
PROJECTS_DIR = "/storage/emulated/0/Eliteqod/projects prod"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")

def clear_screen():
    os.system('clear')

def nlp_parse(prompt):
    if not DEEPSEEK_API_KEY:
        name = f"mobile_app_{int(time.time()) % 1000}"
        return {"name": name, "stack": "React Native + Expo", "description": prompt, "analysis": "Heuristique"}

    print("🧠 Hermès analyse votre demande...")
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Tu es l'architecte EliteForge Mobile. Renvoie UNIQUEMENT un JSON: {name, stack, description, analysis}. Stacks autorisées: 'React Native + Expo'."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }
    try:
        resp = requests.post("https://api.deepseek.com/chat/completions", json=payload, headers=headers, timeout=15)
        raw_content = resp.json()['choices'][0]['message']['content']
        clean_json = raw_content.strip().strip('`').replace('json\n', '').replace('\n', '')
        return json.loads(clean_json)
    except Exception as e: 
        return {"name": f"mobile_app_{int(time.time()) % 1000}", "stack": "React Native + Expo", "description": prompt}

def create_new_mission():
    clear_screen()
    print("========================================")
    print("   🚀 NOUVELLE MISSION GRADE GOLD MOBILE")
    print("========================================\n")
    user_input = input("🗣️ Que souhaitez-vous forger ?\n> ").strip()
    if not user_input: return

    data = nlp_parse(user_input)
    name = data.get('name', 'nouveau_projet')
    stack = data.get('stack', 'React Native + Expo')
    description = data.get('description', user_input)

    while True:
        clear_screen()
        print("========================================")
        print("   ⚙️ CONFIGURATION DE LA MISSION")
        print("========================================")
        print(f"\n1. 📁 Nom du projet : {name}")
        print(f"2. 📚 Stack (Structure) : {stack}")
        print(f"3. 📝 Description : {description[:50]}...")
        print("\n[V] Valider et Lancer la Forge")
        print("[Q] Abandonner")
        
        choice = input("\nModifier un paramètre (1-3) ou Valider (V) : ").lower()

        if choice == '1': name = input("Nouveau nom : ").strip().replace(' ', '_')
        elif choice == '2': stack = input("Nouvelle stack : ").strip()
        elif choice == '3': description = input("Nouvelle description : ").strip()
        elif choice == 'v': break
        elif choice == 'q': return

    print(f"\n🚀 Initialisation de la Forge pour {name}...")
    try:
        resp = requests.post(f"{BASE_URL}/projects/create", json={"name": name, "stack": stack, "description": description})
        if resp.status_code == 200:
            project = resp.json()
            print(f"✅ MISSION INITIALISÉE : {project['id']}")
            print(f"🔥 LA FORGE EST ACTIVE !")
            print("➡️  Basculez maintenant vers Kiwi Browser sur chat.deepseek.com")
            time.sleep(2)
            monitor_bridge()
        else:
            print(f"❌ Erreur : {resp.text}")
            time.sleep(2)
    except Exception as e:
        print(f"❌ Connexion impossible : {e}")
        time.sleep(2)

def resume_mission():
    clear_screen()
    print("========================================")
    print("   🔄 REPRENDRE UNE MISSION")
    print("========================================\n")
    
    if not os.path.exists(PROJECTS_DIR):
        print("❌ Aucun dossier de projets trouvé.")
        time.sleep(2)
        return

    projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
    if not projects:
        print("❌ Aucun projet trouvé.")
        time.sleep(2)
        return

    for i, p in enumerate(projects, 1):
        print(f"{i}. {p}")
    
    choice = input("\nSélectionnez un projet (ou Q pour annuler) : ")
    if choice.lower() == 'q': return
    
    try:
        idx = int(choice) - 1
        pid = projects[idx]
        print(f"\n🔄 Relance de la Forge pour : {pid}...")
        requests.post(f"{BASE_URL}/bridge/reset")
        resp = requests.post(f"{BASE_URL}/projects/resume", json={"id": pid})
        if resp.status_code == 200:
            print(f"✅ FORGE RÉACTIVÉE POUR {pid}")
            time.sleep(1)
            monitor_bridge()
        else:
            print(f"❌ Erreur : {resp.text}")
            time.sleep(2)
    except Exception as e:
        print(f"❌ Erreur lors de la reprise : {e}")
        time.sleep(2)

def monitor_bridge():
    while True:
        clear_screen()
        print("========================================")
        print("   🔍 MONITEUR DE LA FORGE MOBILE (LIVE)")
        print("========================================\n")
        try:
            resp = requests.get(f"{BASE_URL}/bridge/poll")
            if resp.status_code == 200:
                state = resp.json()
                p_type = state.get('prompt_type', 'N/A')
                if p_type == 'prd_single': p_type = "📄 GÉNÉRATION PRD"
                elif p_type == 'fileplan': p_type = "🗺️ PLAN DE FICHIERS"
                elif p_type == 'code': p_type = "🏗️ GÉNÉRATION CODE"
                elif p_type == 'audit': p_type = "🧠 AUDIT STRATÉGIQUE"
                
                print(f"📡 STATUT : {state.get('status', 'IDLE').upper()}")
                print(f"📂 PROJET : {state.get('project_id', 'Aucun')}")
                print(f"📝 TYPE   : {p_type}")
                if state.get('prompt'):
                    print(f"\n💡 PROMPT ACTIF (Copié vers Kiwi) :\n{state['prompt'][:200]}...")
                else:
                    print("\n💤 En attente de mission...")
            else:
                print("❌ Erreur de connexion au serveur.")
                
            print("\n" + "-"*40)
            print("💾 DERNIERS LOGS")
            print("-"*40)
            try:
                log_resp = requests.get(f"{BASE_URL}/logs")
                if log_resp.status_code == 200:
                    logs = log_resp.json().get('logs', [])
                    for l in logs[-5:]:
                        print(f" {l.strip()}")
                else: print(" [Logs indisponibles]")
            except: print(" [Erreur lecture logs]")
            
        except:
            print("❌ Serveur injoignable.")
            
        print("\n" + "-"*40)
        print("Appuyez sur [Entrée] pour rafraîchir ou [Q] pour quitter")
        cmd = input("> ").lower()
        if cmd == 'q': break

def audit_project():
    clear_screen()
    print("========================================")
    print("   🧠 AUDITER UN PROJET MOBILE")
    print("========================================\n")
    
    if not os.path.exists(PROJECTS_DIR): return
    projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
    for i, p in enumerate(projects, 1): print(f"{i}. {p}")
    
    sel = input("\nSélectionnez un projet (ou Q) : ").strip()
    if sel.upper() == 'Q': return
    
    try:
        pid = projects[int(sel)-1]
        print(f"\n🧠 Lancement de l'audit pour : {pid}...")
        requests.post(f"{BASE_URL}/projects/{pid}/audit")
        print("🛰️ Ordre transmis au Stealth Bridge dans Kiwi.")
        input("\nAppuyez sur une touche...")
    except: pass

def patch_project():
    clear_screen()
    print("========================================")
    print("   🛠️ PATCHER UN PROJET MOBILE")
    print("========================================\n")
    if not os.path.exists(PROJECTS_DIR): return
    projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
    for i, p in enumerate(projects, 1): print(f"{i}. {p}")
    
    sel = input("\nProjet à modifier : ").strip()
    if not sel: return
    try:
        pid = projects[int(sel)-1]
        instruction = input("\n📝 Instruction du patch :\n> ")
        if not instruction: return
        requests.post(f"{BASE_URL}/projects/{pid}/patch", json={"instruction": instruction})
        print("🚀 Patch lancé !")
        time.sleep(2)
        monitor_bridge()
    except: pass

def build_apk():
    clear_screen()
    print("========================================")
    print("   📱 COMPILER APK")
    print("========================================\n")
    if not os.path.exists(PROJECTS_DIR): return
    projects = [d for d in os.listdir(PROJECTS_DIR) if os.path.isdir(os.path.join(PROJECTS_DIR, d))]
    for i, p in enumerate(projects, 1): print(f"{i}. {p}")
    sel = input("\nProjet à compiler : ").strip()
    if not sel: return
    try:
        pid = projects[int(sel)-1]
        print(f"\n🏗️ Lancement du build APK pour {pid}...")
        requests.post(f"{BASE_URL}/projects/{pid}/apk")
        print("✅ Commande envoyée au builder Termux.")
        print("   Vous pouvez vérifier les logs dans le menu 8.")
    except: print("❌ Erreur.")
    input("\nAppuyez sur une touche...")

def view_logs():
    clear_screen()
    print("========================================")
    print("   📋 LOGS DE LA FORGE MOBILE")
    print("========================================\n")
    try:
        resp = requests.get(f"{BASE_URL}/logs")
        if resp.status_code == 200:
            for log in resp.json().get('logs', []):
                print(f" • {log.strip()}")
    except: print("❌ Serveur injoignable.")
    input("\nAppuyez sur une touche...")

def reset_bridge():
    requests.post(f"{BASE_URL}/bridge/reset")
    print("✅ Bridge réinitialisé.")
    time.sleep(1)

def main():
    while True:
        clear_screen()
        print("========================================")
        print("   💎 ELITEFORGE G6.5 - DIAMOND MOBILE")
        print("========================================\n")
        print("1. 🚀 Nouvelle Mission (Grade Gold)")
        print("2. 🔄 Reprendre une Mission Existante")
        print("3. 🔍 Moniteur de la Forge (Live)")
        print("4. 🧠 Auditer un Projet (Analyse Stratégique)")
        print("5. 🛠️ Patcher un Projet (Refactoring IA)")
        print("6. 🏥 Forge Doctor (Diagnostic G6) [Bientôt]")
        print("7. 📱 Compiler APK (Mobile Forge)")
        print("8. 📋 Consulter les Logs")
        print("R. 🔄 Réinitialiser le Bridge (Emergency)")
        print("Q. Quitter")
        
        choice = input("\nChoix : ").strip().upper()
        
        if choice == '1': create_new_mission()
        elif choice == '2': resume_mission()
        elif choice == '3': monitor_bridge()
        elif choice == '4': audit_project()
        elif choice == '5': patch_project()
        elif choice == '7': build_apk()
        elif choice == '8': view_logs()
        elif choice == 'R': reset_bridge()
        elif choice == 'Q': sys.exit()

if __name__ == "__main__":
    main()
