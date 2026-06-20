// INJECTEUR PRD (LANDING PACK)
(function() {
    'use strict';
    const PRDS = {
        gold: `[CONTEXTE CACHÉ - PRD WEB LANDING GOLD]
MISSION: Créer une landing page à fort impact visuel, optimisée SEO (conversion < 10s).
SECTIONS:
- Hero Section (CTA néon).
- Trusted By (Social Proof).
- Features Grid, Testimonials, Pricing, FAQ.
MAPPING VFS: Hero.tsx, Features.tsx, Pricing.tsx, NeonButton.tsx, GlassCard.tsx.
PERFORMANCES: Framer Motion, WebP, Fonts Inter & Space Grotesk. Mobile First OBLIGATOIRE.
[FIN DU CONTEXTE CACHÉ]`
    };
    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\\n\\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#00D1FF; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        }
    }
    function createMenu() {
        if(document.getElementById('landing-prd-menu')) return;
        const menu = document.createElement('div');
        menu.id = 'landing-prd-menu';
        menu.style = "position:fixed; bottom:20px; left:540px; background:rgba(10,15,25,0.9); border:1px solid #FFD700; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px;";
        menu.innerHTML = \`<h3 style="margin-top:0; font-size:14px; color:#FFD700;">🌍 Web Landing Pack</h3>
            <button id="btn-prd-landing" style="display:block; width:100%; padding:8px; background:#112; border:1px solid #FFD700; color:#FFD700; cursor:pointer; border-radius:5px;">⭐ Injecter : Landing Gold</button>\`;
        document.body.appendChild(menu);
        document.getElementById('btn-prd-landing').onclick = () => injectText(PRDS.gold, "Landing Gold");
    }
    setTimeout(createMenu, 4000);
})();
