(function() {
    'use strict';
    
    const PRDS = {
        prd_blog_magazine: `[CONTEXTE CACHÉ - PRD PRD_BLOG_MAGAZINE]
MISSION: Moteur de blog optimisé SEO (Gatsby/Next.js style).
STYLE & DESIGN: Typographie Serif lisible, Mode Lecture, Sommaire sticky.
MAPPING VFS: `ArticleLayout.tsx`, `TableOfContents.tsx`
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
        if(document.getElementById('web_blog_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'web_blog_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Web/Blog Pack</h3>
            <button id="btn-prd-prd_blog_magazine-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_blog_magazine</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_blog_magazine-0').onclick = () => injectText(PRDS.prd_blog_magazine, 'prd_blog_magazine');

    }

    setTimeout(createMenu, 3000);
})();
