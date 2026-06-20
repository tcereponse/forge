(function() {
    'use strict';
    
    const PRDS = {
        prd_design_figma_importer: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_FIGMA_IMPORTER]
MISSION: Connecter un fichier Figma et lister frames.
STYLE & DESIGN: Frames list, thumbnails.
MAPPING VFS: FigmaFrameList.tsx, FramePreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_figma_token_sync: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_FIGMA_TOKEN_SYNC]
MISSION: Synchroniser design tokens Figma ↔ DS.
STYLE & DESIGN: Map tokens UI.
MAPPING VFS: TokenMappingTable.tsx, TokenSyncButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_figma_asset_export: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_FIGMA_ASSET_EXPORT]
MISSION: Exporter assets (icons, images) depuis Figma.
STYLE & DESIGN: Export queue.
MAPPING VFS: AssetExportList.tsx, ExportSettings.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_xd_screen_importer: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_XD_SCREEN_IMPORTER]
MISSION: Importer écrans Adobe XD.
STYLE & DESIGN: Screen gallery.
MAPPING VFS: XdScreenGrid.tsx, XdScreenCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_spec_viewer: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_SPEC_VIEWER]
MISSION: Viewer specs design → dev (spacing, sizes).
STYLE & DESIGN: Inspect overlay.
MAPPING VFS: SpecOverlay.tsx, SpacingInspector.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_flow_diagram: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_FLOW_DIAGRAM]
MISSION: Représenter le flow (frames reliées).
STYLE & DESIGN: Graph view.
MAPPING VFS: FlowGraph.tsx, FlowNode.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_component_matcher: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_COMPONENT_MATCHER]
MISSION: Matcher composants DS ↔ composants design.
STYLE & DESIGN: Matching table.
MAPPING VFS: ComponentMatchTable.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_redline_annotator: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_REDLINE_ANNOTATOR]
MISSION: Annoter maquettes (redlines).
STYLE & DESIGN: Lines + labels.
MAPPING VFS: RedlineLayer.tsx, AnnotationPanel.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_hand_off_pack: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_HAND_OFF_PACK]
MISSION: Pack “hand‑off” dev (zips, docs, liens).
STYLE & DESIGN: Summary panel.
MAPPING VFS: HandOffSummary.tsx, DownloadBundle.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_design_change_log: `[CONTEXTE CACHÉ - PRD PRD_DESIGN_CHANGE_LOG]
MISSION: Historique changements design.
STYLE & DESIGN: Timeline delta.
MAPPING VFS: DesignChangeList.tsx, ChangeDetail.tsx
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
        if(document.getElementById('design_figma_xd_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'design_figma_xd_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Design (Figma/XD) Pack</h3>
            <button id="btn-prd-prd_design_figma_importer-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_figma_importer</button>
            <button id="btn-prd-prd_design_figma_token_sync-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_figma_token_sync</button>
            <button id="btn-prd-prd_design_figma_asset_export-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_figma_asset_export</button>
            <button id="btn-prd-prd_design_xd_screen_importer-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_xd_screen_importer</button>
            <button id="btn-prd-prd_design_spec_viewer-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_spec_viewer</button>
            <button id="btn-prd-prd_design_flow_diagram-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_flow_diagram</button>
            <button id="btn-prd-prd_design_component_matcher-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_component_matcher</button>
            <button id="btn-prd-prd_design_redline_annotator-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_redline_annotator</button>
            <button id="btn-prd-prd_design_hand_off_pack-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_hand_off_pack</button>
            <button id="btn-prd-prd_design_change_log-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_design_change_log</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_design_figma_importer-0').onclick = () => injectText(PRDS.prd_design_figma_importer, 'prd_design_figma_importer');
        document.getElementById('btn-prd-prd_design_figma_token_sync-1').onclick = () => injectText(PRDS.prd_design_figma_token_sync, 'prd_design_figma_token_sync');
        document.getElementById('btn-prd-prd_design_figma_asset_export-2').onclick = () => injectText(PRDS.prd_design_figma_asset_export, 'prd_design_figma_asset_export');
        document.getElementById('btn-prd-prd_design_xd_screen_importer-3').onclick = () => injectText(PRDS.prd_design_xd_screen_importer, 'prd_design_xd_screen_importer');
        document.getElementById('btn-prd-prd_design_spec_viewer-4').onclick = () => injectText(PRDS.prd_design_spec_viewer, 'prd_design_spec_viewer');
        document.getElementById('btn-prd-prd_design_flow_diagram-5').onclick = () => injectText(PRDS.prd_design_flow_diagram, 'prd_design_flow_diagram');
        document.getElementById('btn-prd-prd_design_component_matcher-6').onclick = () => injectText(PRDS.prd_design_component_matcher, 'prd_design_component_matcher');
        document.getElementById('btn-prd-prd_design_redline_annotator-7').onclick = () => injectText(PRDS.prd_design_redline_annotator, 'prd_design_redline_annotator');
        document.getElementById('btn-prd-prd_design_hand_off_pack-8').onclick = () => injectText(PRDS.prd_design_hand_off_pack, 'prd_design_hand_off_pack');
        document.getElementById('btn-prd-prd_design_change_log-9').onclick = () => injectText(PRDS.prd_design_change_log, 'prd_design_change_log');

    }

    setTimeout(createMenu, 3000);
})();
