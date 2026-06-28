(function() {
    'use strict';
    
    const PRDS = {
        prd_layout_split: `[CONTEXTE CACHÉ - PRD PRD_LAYOUT_SPLIT]
MISSION: Écran coupé en deux (ex: Login à gauche, Image à droite).
STYLE & DESIGN: Asymétrique, Contraste fort (Dark/Light).
MAPPING VFS: `SplitScreen.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_layout_bento: `[CONTEXTE CACHÉ - PRD PRD_LAYOUT_BENTO]
MISSION: Grille "Bento Box" (Style Apple/iOS).
STYLE & DESIGN: Cartes arrondies, Ombres douces, Hover scale.
MAPPING VFS: `BentoGrid.tsx`, `BentoCard.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_layout_kanban: `[CONTEXTE CACHÉ - PRD PRD_LAYOUT_KANBAN]
MISSION: Tableau de gestion de projet type Trello/Jira.
STYLE & DESIGN: Drag & Drop fluide, Colonnes scrollables.
MAPPING VFS: `KanbanBoard.tsx`, `DraggableCard.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_layout_sidebar: `[CONTEXTE CACHÉ - PRD PRD_LAYOUT_SIDEBAR]
MISSION: Tableau de bord avec menu latéral rétractable.
STYLE & DESIGN: Collapsible, Icônes (Lucide/Heroicons).
MAPPING VFS: `Sidebar.tsx`, `MainContent.tsx`
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
        if(document.getElementById('layout_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'layout_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00FF88; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 Layout Pack</h3>
            <button id="btn-prd-prd_layout_split-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_layout_split</button>
            <button id="btn-prd-prd_layout_bento-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_layout_bento</button>
            <button id="btn-prd-prd_layout_kanban-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_layout_kanban</button>
            <button id="btn-prd-prd_layout_sidebar-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_layout_sidebar</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_layout_split-0').onclick = () => injectText(PRDS.prd_layout_split, 'prd_layout_split');
        document.getElementById('btn-prd-prd_layout_bento-1').onclick = () => injectText(PRDS.prd_layout_bento, 'prd_layout_bento');
        document.getElementById('btn-prd-prd_layout_kanban-2').onclick = () => injectText(PRDS.prd_layout_kanban, 'prd_layout_kanban');
        document.getElementById('btn-prd-prd_layout_sidebar-3').onclick = () => injectText(PRDS.prd_layout_sidebar, 'prd_layout_sidebar');

    }

    setTimeout(createMenu, 3000);
})();
