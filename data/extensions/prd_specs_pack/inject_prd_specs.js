(function() {
    'use strict';
    
    const PRDS = {
        prd_prd_template_manager: `[CONTEXTE CACHÉ - PRD PRD_PRD_TEMPLATE_MANAGER]
MISSION: Manager templates PRD (sections, structure).
STYLE & DESIGN: Section list.
MAPPING VFS: PrdTemplateList.tsx, SectionEditor.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_instance_viewer: `[CONTEXTE CACHÉ - PRD PRD_PRD_INSTANCE_VIEWER]
MISSION: Viewer d’un PRD structuré (sections, status).
STYLE & DESIGN: Outline + body.
MAPPING VFS: PrdViewer.tsx, PrdStatusBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_change_tracker: `[CONTEXTE CACHÉ - PRD PRD_PRD_CHANGE_TRACKER]
MISSION: Suivi des changements sur un PRD (changelog).
STYLE & DESIGN: Changes timeline.
MAPPING VFS: PrdChangeLog.tsx, ChangeBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_comment_layer: `[CONTEXTE CACHÉ - PRD PRD_PRD_COMMENT_LAYER]
MISSION: Commentaires inline dans PRD.
STYLE & DESIGN: Coment gutter.
MAPPING VFS: PrdCommentThread.tsx, CommentMarker.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_to_tasks_exporter: `[CONTEXTE CACHÉ - PRD PRD_PRD_TO_TASKS_EXPORTER]
MISSION: Export PRD → backlog (tickets).
STYLE & DESIGN: Mapping sections→tickets.
MAPPING VFS: PrdTaskMapping.tsx, ExportToBacklogButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_ai_consistency_audit: `[CONTEXTE CACHÉ - PRD PRD_PRD_AI_CONSISTENCY_AUDIT]
MISSION: Audit IA de cohérence PRD (scope, métriques).
STYLE & DESIGN: Warnings & suggestions.
MAPPING VFS: PrdAuditPanel.tsx, IssueList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_multi_language: `[CONTEXTE CACHÉ - PRD PRD_PRD_MULTI_LANGUAGE]
MISSION: PRD multi‑langues (fr/en/…).
STYLE & DESIGN: Tabs langues.
MAPPING VFS: PrdLanguageTabs.tsx, TranslationEditor.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_linked_assets: `[CONTEXTE CACHÉ - PRD PRD_PRD_LINKED_ASSETS]
MISSION: Lier assets (images, docs, maquettes) à sections.
STYLE & DESIGN: Asset sidebar.
MAPPING VFS: LinkedAssetList.tsx, AttachAssetButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_review_workflow: `[CONTEXTE CACHÉ - PRD PRD_PRD_REVIEW_WORKFLOW]
MISSION: Workflow de review/approval PRD.
STYLE & DESIGN: Steps, approver list.
MAPPING VFS: PrdReviewPanel.tsx, ApprovalStep.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prd_export_bundle: `[CONTEXTE CACHÉ - PRD PRD_PRD_EXPORT_BUNDLE]
MISSION: Exporter PRD + assets en bundle (zip/pdf).
STYLE & DESIGN: Export wizard.
MAPPING VFS: PrdExportWizard.tsx, BundleSummary.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#9900FF; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('prd_specs_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'prd_specs_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #9900FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#9900FF;">📦 PRD & Specs Pack</h3>
            <button id="btn-prd-prd_prd_template_manager-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_template_manager</button>
            <button id="btn-prd-prd_prd_instance_viewer-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_instance_viewer</button>
            <button id="btn-prd-prd_prd_change_tracker-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_change_tracker</button>
            <button id="btn-prd-prd_prd_comment_layer-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_comment_layer</button>
            <button id="btn-prd-prd_prd_to_tasks_exporter-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_to_tasks_exporter</button>
            <button id="btn-prd-prd_prd_ai_consistency_audit-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_ai_consistency_audit</button>
            <button id="btn-prd-prd_prd_multi_language-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_multi_language</button>
            <button id="btn-prd-prd_prd_linked_assets-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_linked_assets</button>
            <button id="btn-prd-prd_prd_review_workflow-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_review_workflow</button>
            <button id="btn-prd-prd_prd_export_bundle-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 prd_prd_export_bundle</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_prd_template_manager-0').onclick = () => injectText(PRDS.prd_prd_template_manager, 'prd_prd_template_manager');
        document.getElementById('btn-prd-prd_prd_instance_viewer-1').onclick = () => injectText(PRDS.prd_prd_instance_viewer, 'prd_prd_instance_viewer');
        document.getElementById('btn-prd-prd_prd_change_tracker-2').onclick = () => injectText(PRDS.prd_prd_change_tracker, 'prd_prd_change_tracker');
        document.getElementById('btn-prd-prd_prd_comment_layer-3').onclick = () => injectText(PRDS.prd_prd_comment_layer, 'prd_prd_comment_layer');
        document.getElementById('btn-prd-prd_prd_to_tasks_exporter-4').onclick = () => injectText(PRDS.prd_prd_to_tasks_exporter, 'prd_prd_to_tasks_exporter');
        document.getElementById('btn-prd-prd_prd_ai_consistency_audit-5').onclick = () => injectText(PRDS.prd_prd_ai_consistency_audit, 'prd_prd_ai_consistency_audit');
        document.getElementById('btn-prd-prd_prd_multi_language-6').onclick = () => injectText(PRDS.prd_prd_multi_language, 'prd_prd_multi_language');
        document.getElementById('btn-prd-prd_prd_linked_assets-7').onclick = () => injectText(PRDS.prd_prd_linked_assets, 'prd_prd_linked_assets');
        document.getElementById('btn-prd-prd_prd_review_workflow-8').onclick = () => injectText(PRDS.prd_prd_review_workflow, 'prd_prd_review_workflow');
        document.getElementById('btn-prd-prd_prd_export_bundle-9').onclick = () => injectText(PRDS.prd_prd_export_bundle, 'prd_prd_export_bundle');

    }

    setTimeout(createMenu, 3000);
})();
