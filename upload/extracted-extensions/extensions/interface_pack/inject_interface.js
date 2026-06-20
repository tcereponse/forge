(function() {
    'use strict';
    
    const PRDS = {
        prd_ui_datatable: `[CONTEXTE CACHÉ - PRD PRD_UI_DATATABLE]
MISSION: Tableau de données complexe.
STYLE & DESIGN: Tri, Pagination, Recherche globale, Actions en masse.
MAPPING VFS: `DataTable.tsx`, `Pagination.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_ui_upload: `[CONTEXTE CACHÉ - PRD PRD_UI_UPLOAD]
MISSION: Zone de Glisser-Déposer pour fichiers (Drag & Drop).
STYLE & DESIGN: Bordure en pointillés (dashed), Prévisualisation image.
MAPPING VFS: `Dropzone.tsx`, `FilePreview.tsx`
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF0055; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('interface_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'interface_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Interface Pack</h3>
            <button id="btn-prd-prd_ui_datatable-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_ui_datatable</button>
            <button id="btn-prd-prd_ui_upload-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_ui_upload</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_ui_datatable-0').onclick = () => injectText(PRDS.prd_ui_datatable, 'prd_ui_datatable');
        document.getElementById('btn-prd-prd_ui_upload-1').onclick = () => injectText(PRDS.prd_ui_upload, 'prd_ui_upload');

    }

    setTimeout(createMenu, 3000);
})();
