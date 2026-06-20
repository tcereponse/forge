(function() {
    'use strict';
    
    const PRDS = {
        cto_prd_10_generator: `[CONTEXTE CACHÉ - PRD CTO_PRD_10_GENERATOR]
MISSION: Tu dois agir comme un Senior Engineering CTO (ex-Google/Meta/Netflix).
Ton rôle est de prendre la description du projet et de l'ENRICHIR massivement pour créer 10 PRD (Product Requirements Documents) de Grade Gold.
Tu dois ajouter des fonctionnalités avancées, de l'architecture moderne, et des best practices auxquelles l'utilisateur n'a pas pensé.
STYLE & DESIGN: Grade Diamond — architecture cloud-native, micro-services, sécurité OWASP, observabilité (Prometheus/Grafana), CI/CD GitOps.
MAPPING VFS: 01_Vision_Strategique.md, 02_Architecture_AST.md, 03_Design_UX_UI.md, 04_Modeles_Donnees.md, 05_Services_API.md, 06_Securite_Diamond.md, 07_Strategie_Tests.md, 08_Plan_Deploiement.md, 09_Timeline_Forge.md, 10_Manifesto_Souverain.md
RÈGLE ABSOLUE: Génère UNIQUEMENT des fichiers .md. Aucun code (.js, .ts, .json, .html) n'est autorisé en Phase 1.
FORMAT OBLIGATOIRE POUR CHAQUE FICHIER:
FILE: 01_Vision_Strategique.md
# Contenu Markdown...
FILE: 02_Architecture_AST.md
# Contenu Markdown...
[FIN DU CONTEXTE CACHÉ]`,
    };

    function injectText(text, name) {
        // Sélecteurs DeepSeek 2025/2026
        const selectors = [
            'textarea#chat-input',
            'div[contenteditable="true"][class*="input"]',
            '.ds-textarea',
            '[role="textbox"]',
            'textarea[placeholder]',
            'div[contenteditable="true"]',
            'textarea',
        ];
        let input = null;
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) { input = el; break; }
        }
        
        if (input) {
            // Stratégie React/ContentEditable
            if (input.tagName === 'TEXTAREA') {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
                nativeSetter.set.call(input, text + "\n\n" + (input.value || ''));
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (input.isContentEditable) {
                input.innerText = text + "\n\n" + (input.innerText || '');
                input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
            } else {
                input.value = text + "\n\n" + (input.value || '');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#ffd700; color:#000; padding:5px 12px; border-radius:5px; font-weight:900; z-index:9999; font-family:sans-serif;";
            badge.innerText = "✅ CTO Engine Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('cto_core_engine_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'cto_core_engine_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #ffd700; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#ffd700;">🧠 CTO Core Engine Pack</h3>
            <button id="btn-prd-cto_prd_10_generator-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #ffd700; color:#ffd700; cursor:pointer; border-radius:5px;">🚀 cto_prd_10_generator</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-cto_prd_10_generator-0').onclick = () => injectText(PRDS.cto_prd_10_generator, 'cto_prd_10_generator');

    }

    setTimeout(createMenu, 3000);
})();
