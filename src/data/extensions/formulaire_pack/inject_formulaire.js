(function() {
    'use strict';
    
    const PRDS = {
        prd_form_wizard: `[CONTEXTE CACHÉ - PRD PRD_FORM_WIZARD]
MISSION: Formulaire en plusieurs étapes (Step-by-step).
STYLE & DESIGN: Barre d'étapes (Stepper), Transitions fluides.
MAPPING VFS: `MultiStepForm.tsx`, `StepIndicator.tsx`
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#9900FF; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('formulaire_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'formulaire_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #9900FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#9900FF;">📦 Formulaire Pack</h3>
            <button id="btn-prd-prd_form_wizard-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_form_wizard</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_form_wizard-0').onclick = () => injectText(PRDS.prd_form_wizard, 'prd_form_wizard');

    }

    setTimeout(createMenu, 3000);
})();
