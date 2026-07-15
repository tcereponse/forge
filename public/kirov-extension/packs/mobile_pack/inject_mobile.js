(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_social: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SOCIAL]
MISSION: Clone d'Instagram/TikTok (Feed infini, Stories, Likes).
STYLE & DESIGN: Full-screen swipe, Bottom sheet modals.
MAPPING VFS: `FeedReel.tsx`, `StoryViewer.tsx`, `LikeButton.tsx`
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FFCC00; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('mobile_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'mobile_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Mobile Pack</h3>
            <button id="btn-prd-prd_mobile_social-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_social</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_social-0').onclick = () => injectText(PRDS.prd_mobile_social, 'prd_mobile_social');

    }

    setTimeout(createMenu, 3000);
})();
