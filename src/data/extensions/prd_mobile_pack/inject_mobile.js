// INJECTEUR PRD (MOBILE PACK)
(function() {
    'use strict';
    
    const PRDS = {
        nav: `[CONTEXTE CACHÉ - PRD MOB TAB NAVIGATION]
MISSION: Système de navigation fluide et intuitif pour applications mobiles.
CORE FEATURES:
- Bottom Tab Bar (Onglets principaux).
- Stack Navigation (Navigation en profondeur).
- Gestures (Swipe to back) et Deep-linking contextuel.
MAPPING VFS: TabNavigator.tsx, StackNavigator.tsx, HomeScreen.tsx.
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
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('mobile-prd-menu')) return;
        const menu = document.createElement('div');
        menu.id = 'mobile-prd-menu';
        menu.style = "position:fixed; bottom:20px; left:280px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px;";
        menu.innerHTML = \`<h3 style="margin-top:0; font-size:14px; color:#FF0055;">📱 Mobile Pack</h3>
            <button id="btn-prd-mob-nav" style="display:block; width:100%; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🧭 Injecter : Tab Navigation</button>\`;
        document.body.appendChild(menu);
        document.getElementById('btn-prd-mob-nav').onclick = () => injectText(PRDS.nav, "Tab Navigation");
    }
    setTimeout(createMenu, 3500);
})();
