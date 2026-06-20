(function() {
    'use strict';
    
    const PRDS = {
        prd_file_manager_core: `[CONTEXTE CACHÉ - PRD PRD_FILE_MANAGER_CORE]
MISSION: Explorateur de fichiers virtuel (VFS) avec dossiers/projets.
STYLE & DESIGN: Arborescence, vue liste et grid.
MAPPING VFS: FileTree.tsx, FileList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_recent_panel: `[CONTEXTE CACHÉ - PRD PRD_FILE_RECENT_PANEL]
MISSION: Panneau de fichiers récents tous formats.
STYLE & DESIGN: Liste compact, icons type.
MAPPING VFS: RecentFiles.tsx, FileTypeIcon.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_quick_actions: `[CONTEXTE CACHÉ - PRD PRD_FILE_QUICK_ACTIONS]
MISSION: Barre d’actions rapides (rename, move, duplicate).
STYLE & DESIGN: Toolbar contextuelle.
MAPPING VFS: FileActionBar.tsx, ContextMenu.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_drag_drop_zone: `[CONTEXTE CACHÉ - PRD PRD_FILE_DRAG_DROP_ZONE]
MISSION: Zone drag & drop pour upload multi‑fichiers.
STYLE & DESIGN: Zone dashed, previews.
MAPPING VFS: Dropzone.tsx, FilePreviewGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_search_fuzzy: `[CONTEXTE CACHÉ - PRD PRD_FILE_SEARCH_FUZZY]
MISSION: Recherche fuzzy sur noms et métadonnées.
STYLE & DESIGN: Search bar + résultats en liste.
MAPPING VFS: FileSearchBar.tsx, SearchResults.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_tagging_system: `[CONTEXTE CACHÉ - PRD PRD_FILE_TAGGING_SYSTEM]
MISSION: Tags/catégories sur fichiers (couleurs, labels).
STYLE & DESIGN: Pills colorées.
MAPPING VFS: FileTagList.tsx, TagFilterBar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_trash_recovery: `[CONTEXTE CACHÉ - PRD PRD_FILE_TRASH_RECOVERY]
MISSION: Corbeille, restore, purge définitive.
STYLE & DESIGN: Liste corbeille, CTA restaurer.
MAPPING VFS: TrashView.tsx, RestoreButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_version_history: `[CONTEXTE CACHÉ - PRD PRD_FILE_VERSION_HISTORY]
MISSION: Historique de versions + rollback.
STYLE & DESIGN: Timeline versions.
MAPPING VFS: VersionTimeline.tsx, DiffPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_permissions_panel: `[CONTEXTE CACHÉ - PRD PRD_FILE_PERMISSIONS_PANEL]
MISSION: Droits d’accès par fichier/dossier.
STYLE & DESIGN: Matrix users/roles.
MAPPING VFS: PermissionMatrix.tsx, ShareDialog.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_file_bulk_operations: `[CONTEXTE CACHÉ - PRD PRD_FILE_BULK_OPERATIONS]
MISSION: Sélection multiple, actions masse (move, tag).
STYLE & DESIGN: Multi‑select UX.
MAPPING VFS: BulkSelector.tsx, BulkActionsBar.tsx
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
        if(document.getElementById('fichiers_base_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'fichiers_base_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Fichiers – Base Pack</h3>
            <button id="btn-prd-prd_file_manager_core-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_manager_core</button>
            <button id="btn-prd-prd_file_recent_panel-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_recent_panel</button>
            <button id="btn-prd-prd_file_quick_actions-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_quick_actions</button>
            <button id="btn-prd-prd_file_drag_drop_zone-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_drag_drop_zone</button>
            <button id="btn-prd-prd_file_search_fuzzy-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_search_fuzzy</button>
            <button id="btn-prd-prd_file_tagging_system-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_tagging_system</button>
            <button id="btn-prd-prd_file_trash_recovery-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_trash_recovery</button>
            <button id="btn-prd-prd_file_version_history-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_version_history</button>
            <button id="btn-prd-prd_file_permissions_panel-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_permissions_panel</button>
            <button id="btn-prd-prd_file_bulk_operations-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_file_bulk_operations</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_file_manager_core-0').onclick = () => injectText(PRDS.prd_file_manager_core, 'prd_file_manager_core');
        document.getElementById('btn-prd-prd_file_recent_panel-1').onclick = () => injectText(PRDS.prd_file_recent_panel, 'prd_file_recent_panel');
        document.getElementById('btn-prd-prd_file_quick_actions-2').onclick = () => injectText(PRDS.prd_file_quick_actions, 'prd_file_quick_actions');
        document.getElementById('btn-prd-prd_file_drag_drop_zone-3').onclick = () => injectText(PRDS.prd_file_drag_drop_zone, 'prd_file_drag_drop_zone');
        document.getElementById('btn-prd-prd_file_search_fuzzy-4').onclick = () => injectText(PRDS.prd_file_search_fuzzy, 'prd_file_search_fuzzy');
        document.getElementById('btn-prd-prd_file_tagging_system-5').onclick = () => injectText(PRDS.prd_file_tagging_system, 'prd_file_tagging_system');
        document.getElementById('btn-prd-prd_file_trash_recovery-6').onclick = () => injectText(PRDS.prd_file_trash_recovery, 'prd_file_trash_recovery');
        document.getElementById('btn-prd-prd_file_version_history-7').onclick = () => injectText(PRDS.prd_file_version_history, 'prd_file_version_history');
        document.getElementById('btn-prd-prd_file_permissions_panel-8').onclick = () => injectText(PRDS.prd_file_permissions_panel, 'prd_file_permissions_panel');
        document.getElementById('btn-prd-prd_file_bulk_operations-9').onclick = () => injectText(PRDS.prd_file_bulk_operations, 'prd_file_bulk_operations');

    }

    setTimeout(createMenu, 3000);
})();
