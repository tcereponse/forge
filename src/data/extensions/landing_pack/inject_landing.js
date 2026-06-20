(function() {
    'use strict';
    
    const PRDS = {
        prd_landing_waitlist: `[CONTEXTE CACHÉ - PRD PRD_LANDING_WAITLIST]
MISSION: Capturer des emails avant un lancement (Coming Soon).
STYLE & DESIGN: Glassmorphism, Compte à rebours, Fond animé.
MAPPING VFS: `WaitlistForm.tsx`, `Countdown.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_landing_saas: `[CONTEXTE CACHÉ - PRD PRD_LANDING_SAAS]
MISSION: Convertir des visiteurs B2B.
STYLE & DESIGN: Hero section puissante, Logos partenaires, FAQ en accordéon.
MAPPING VFS: `HeroSection.tsx`, `FeatureZigZag.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_landing_creator: `[CONTEXTE CACHÉ - PRD PRD_LANDING_CREATOR]
MISSION: Linktree/Portfolio pour créateur de contenu.
STYLE & DESIGN: Vibrant, Boutons arrondis, Intégration réseaux sociaux.
MAPPING VFS: `LinkList.tsx`, `SocialBadges.tsx`
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF6600; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('landing_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'landing_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF6600; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF6600;">📦 Landing Pack</h3>
            <button id="btn-prd-prd_landing_waitlist-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_landing_waitlist</button>
            <button id="btn-prd-prd_landing_saas-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_landing_saas</button>
            <button id="btn-prd-prd_landing_creator-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_landing_creator</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_landing_waitlist-0').onclick = () => injectText(PRDS.prd_landing_waitlist, 'prd_landing_waitlist');
        document.getElementById('btn-prd-prd_landing_saas-1').onclick = () => injectText(PRDS.prd_landing_saas, 'prd_landing_saas');
        document.getElementById('btn-prd-prd_landing_creator-2').onclick = () => injectText(PRDS.prd_landing_creator, 'prd_landing_creator');

    }

    setTimeout(createMenu, 3000);
})();
