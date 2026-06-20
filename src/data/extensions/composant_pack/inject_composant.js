(function() {
    'use strict';
    
    const PRDS = {
        prd_ui_buttons: `[CONTEXTE CACHÉ - PRD PRD_UI_BUTTONS]
MISSION: Tous les styles de boutons interactifs.
STYLE & DESIGN: Neon glow, 3D press, Ripple effect, Loading spinner.
MAPPING VFS: `Button.tsx`, `IconButton.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_ui_modals: `[CONTEXTE CACHÉ - PRD PRD_UI_MODALS]
MISSION: Fenêtres pop-up (Alertes, Confirmations, Formulaires).
STYLE & DESIGN: Overlay flou (backdrop-blur), Animation de slide-up.
MAPPING VFS: `DialogModal.tsx`, `ConfirmAlert.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_ui_toast: `[CONTEXTE CACHÉ - PRD PRD_UI_TOAST]
MISSION: Notifications non-bloquantes (Succès, Erreur).
STYLE & DESIGN: Toast flottant en bas à droite, Barre de progression.
MAPPING VFS: `ToastProvider.tsx`, `ToastMessage.tsx`
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#00FF88; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('composant_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'composant_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00FF88; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 Composant Pack</h3>
            <button id="btn-prd-prd_ui_buttons-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_ui_buttons</button>
            <button id="btn-prd-prd_ui_modals-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_ui_modals</button>
            <button id="btn-prd-prd_ui_toast-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_ui_toast</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_ui_buttons-0').onclick = () => injectText(PRDS.prd_ui_buttons, 'prd_ui_buttons');
        document.getElementById('btn-prd-prd_ui_modals-1').onclick = () => injectText(PRDS.prd_ui_modals, 'prd_ui_modals');
        document.getElementById('btn-prd-prd_ui_toast-2').onclick = () => injectText(PRDS.prd_ui_toast, 'prd_ui_toast');

    }

    setTimeout(createMenu, 3000);
})();
