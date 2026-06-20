(function() {
    'use strict';
    
    const PRDS = {
        prd_text_editor: `[CONTEXTE CACHÉ - PRD PRD_TEXT_EDITOR]
MISSION: Éditeur de texte riche (WYSIWYG) type Notion.
STYLE & DESIGN: Slash commands (/h1), Markdown support, Barre flottante.
MAPPING VFS: `RichTextEditor.tsx`, `Toolbar.tsx`
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
        if(document.getElementById('texte_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'texte_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00FF88; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 Texte Pack</h3>
            <button id="btn-prd-prd_text_editor-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_text_editor</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_text_editor-0').onclick = () => injectText(PRDS.prd_text_editor, 'prd_text_editor');

    }

    setTimeout(createMenu, 3000);
})();
