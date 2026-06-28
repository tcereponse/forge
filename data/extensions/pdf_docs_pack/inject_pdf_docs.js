(function() {
    'use strict';
    
    const PRDS = {
        prd_pdf_viewer_pro: `[CONTEXTE CACHÉ - PRD PRD_PDF_VIEWER_PRO]
MISSION: Viewer PDF multipage (zoom, search).
STYLE & DESIGN: Toolbar, thumbnails.
MAPPING VFS: PdfViewer.tsx, PageThumbnailStrip.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_comment_annotate: `[CONTEXTE CACHÉ - PRD PRD_PDF_COMMENT_ANNOTATE]
MISSION: Annoter PDF (highlights, notes).
STYLE & DESIGN: Overlay annot.
MAPPING VFS: PdfAnnotationLayer.tsx, NoteSidebar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_form_filler: `[CONTEXTE CACHÉ - PRD PRD_PDF_FORM_FILLER]
MISSION: Remplir formulaires PDF (AcroForm).
STYLE & DESIGN: Fields overlay.
MAPPING VFS: PdfFormField.tsx, FormSidebar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_split_merge_tool: `[CONTEXTE CACHÉ - PRD PRD_PDF_SPLIT_MERGE_TOOL]
MISSION: Scinder ou fusionner PDFs.
STYLE & DESIGN: Page picker UI.
MAPPING VFS: PdfPagePicker.tsx, MergeConfig.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_to_image_exporter: `[CONTEXTE CACHÉ - PRD PRD_PDF_TO_IMAGE_EXPORTER]
MISSION: Exporter pages → images.
STYLE & DESIGN: Format selector.
MAPPING VFS: PdfExportPanel.tsx, PageSelection.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_ai_summary: `[CONTEXTE CACHÉ - PRD PRD_PDF_AI_SUMMARY]
MISSION: Résumé IA d’un PDF long.
STYLE & DESIGN: Sections TL;DR.
MAPPING VFS: PdfSummaryPanel.tsx, OutlineList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_signature_panel: `[CONTEXTE CACHÉ - PRD PRD_PDF_SIGNATURE_PANEL]
MISSION: Signer PDF (signature dessinée ou image).
STYLE & DESIGN: Signature overlay.
MAPPING VFS: SignaturePanel.tsx, SignerInfo.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_redaction_tool: `[CONTEXTE CACHÉ - PRD PRD_PDF_REDACTION_TOOL]
MISSION: Rendre des zones illisibles (redaction).
STYLE & DESIGN: Black boxes overlay.
MAPPING VFS: RedactionLayer.tsx, RedactionList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_doc_diff_viewer: `[CONTEXTE CACHÉ - PRD PRD_DOC_DIFF_VIEWER]
MISSION: Comparer versions de docs (PDF→texte diff).
STYLE & DESIGN: Side‑by‑side diff.
MAPPING VFS: DocDiffViewer.tsx, ChangeList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_pdf_bookmark_manager: `[CONTEXTE CACHÉ - PRD PRD_PDF_BOOKMARK_MANAGER]
MISSION: Gérer bookmarks PDF (chapitres).
STYLE & DESIGN: Sidebar navigation.
MAPPING VFS: BookmarkList.tsx, BookmarkEditor.tsx
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
        if(document.getElementById('pdf_docs_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'pdf_docs_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 PDF & Docs Pack</h3>
            <button id="btn-prd-prd_pdf_viewer_pro-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_viewer_pro</button>
            <button id="btn-prd-prd_pdf_comment_annotate-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_comment_annotate</button>
            <button id="btn-prd-prd_pdf_form_filler-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_form_filler</button>
            <button id="btn-prd-prd_pdf_split_merge_tool-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_split_merge_tool</button>
            <button id="btn-prd-prd_pdf_to_image_exporter-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_to_image_exporter</button>
            <button id="btn-prd-prd_pdf_ai_summary-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_ai_summary</button>
            <button id="btn-prd-prd_pdf_signature_panel-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_signature_panel</button>
            <button id="btn-prd-prd_pdf_redaction_tool-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_redaction_tool</button>
            <button id="btn-prd-prd_doc_diff_viewer-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_doc_diff_viewer</button>
            <button id="btn-prd-prd_pdf_bookmark_manager-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_pdf_bookmark_manager</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_pdf_viewer_pro-0').onclick = () => injectText(PRDS.prd_pdf_viewer_pro, 'prd_pdf_viewer_pro');
        document.getElementById('btn-prd-prd_pdf_comment_annotate-1').onclick = () => injectText(PRDS.prd_pdf_comment_annotate, 'prd_pdf_comment_annotate');
        document.getElementById('btn-prd-prd_pdf_form_filler-2').onclick = () => injectText(PRDS.prd_pdf_form_filler, 'prd_pdf_form_filler');
        document.getElementById('btn-prd-prd_pdf_split_merge_tool-3').onclick = () => injectText(PRDS.prd_pdf_split_merge_tool, 'prd_pdf_split_merge_tool');
        document.getElementById('btn-prd-prd_pdf_to_image_exporter-4').onclick = () => injectText(PRDS.prd_pdf_to_image_exporter, 'prd_pdf_to_image_exporter');
        document.getElementById('btn-prd-prd_pdf_ai_summary-5').onclick = () => injectText(PRDS.prd_pdf_ai_summary, 'prd_pdf_ai_summary');
        document.getElementById('btn-prd-prd_pdf_signature_panel-6').onclick = () => injectText(PRDS.prd_pdf_signature_panel, 'prd_pdf_signature_panel');
        document.getElementById('btn-prd-prd_pdf_redaction_tool-7').onclick = () => injectText(PRDS.prd_pdf_redaction_tool, 'prd_pdf_redaction_tool');
        document.getElementById('btn-prd-prd_doc_diff_viewer-8').onclick = () => injectText(PRDS.prd_doc_diff_viewer, 'prd_doc_diff_viewer');
        document.getElementById('btn-prd-prd_pdf_bookmark_manager-9').onclick = () => injectText(PRDS.prd_pdf_bookmark_manager, 'prd_pdf_bookmark_manager');

    }

    setTimeout(createMenu, 3000);
})();
