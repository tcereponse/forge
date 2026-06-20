(function() {
    'use strict';
    
    const PRDS = {
        prd_md_file_browser: `[CONTEXTE CACHÉ - PRD PRD_MD_FILE_BROWSER]
MISSION: Liste de fichiers .md avec preview.
STYLE & DESIGN: Titles + snippet.
MAPPING VFS: MdFileList.tsx, MdFileItem.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_editor_live_preview: `[CONTEXTE CACHÉ - PRD PRD_MD_EDITOR_LIVE_PREVIEW]
MISSION: Éditeur Markdown + preview live.
STYLE & DESIGN: Split pane, highlight.
MAPPING VFS: MarkdownEditor.tsx, MarkdownPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_frontmatter_editor: `[CONTEXTE CACHÉ - PRD PRD_MD_FRONTMATTER_EDITOR]
MISSION: UI pour modifier frontmatter (YAML).
STYLE & DESIGN: Form + source.
MAPPING VFS: FrontmatterForm.tsx, FrontmatterPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_doc_outline: `[CONTEXTE CACHÉ - PRD PRD_MD_DOC_OUTLINE]
MISSION: Générer outline (H1‑H6) pour navigation.
STYLE & DESIGN: TOC sticky.
MAPPING VFS: DocOutline.tsx, AnchorLink.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_snippet_library: `[CONTEXTE CACHÉ - PRD PRD_MD_SNIPPET_LIBRARY]
MISSION: Bibliothèque de snippets MD (FAQ, callout…).
STYLE & DESIGN: Snippet cards.
MAPPING VFS: MdSnippetGrid.tsx, InsertSnippetButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_export_pdf: `[CONTEXTE CACHÉ - PRD PRD_MD_EXPORT_PDF]
MISSION: Export markdown → PDF stylé.
STYLE & DESIGN: Theme switch.
MAPPING VFS: MdExportPanel.tsx, PdfThemeSelector.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_ai_rewriter: `[CONTEXTE CACHÉ - PRD PRD_MD_AI_REWRITER]
MISSION: Réécriture IA (ton, longueur) de sections MD.
STYLE & DESIGN: Selection + suggestions.
MAPPING VFS: RewriterPanel.tsx, RewriteSuggestion.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_link_checker: `[CONTEXTE CACHÉ - PRD PRD_MD_LINK_CHECKER]
MISSION: Vérifier liens internes/externes.
STYLE & DESIGN: Status icons.
MAPPING VFS: LinkCheckReport.tsx, LinkIssueList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_diagram_support: `[CONTEXTE CACHÉ - PRD PRD_MD_DIAGRAM_SUPPORT]
MISSION: Support Mermaid/diagrams intégrés.
STYLE & DESIGN: Diagram frame.
MAPPING VFS: DiagramBlock.tsx, DiagramPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_md_template_pack: `[CONTEXTE CACHÉ - PRD PRD_MD_TEMPLATE_PACK]
MISSION: Pack de templates MD (PRD, RFC, ADR).
STYLE & DESIGN: Template picker.
MAPPING VFS: MdTemplatePicker.tsx, TemplatePreview.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
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
        if(document.getElementById('markdown_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'markdown_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00D1FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00D1FF;">📦 Markdown Pack</h3>
            <button id="btn-prd-prd_md_file_browser-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_file_browser</button>
            <button id="btn-prd-prd_md_editor_live_preview-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_editor_live_preview</button>
            <button id="btn-prd-prd_md_frontmatter_editor-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_frontmatter_editor</button>
            <button id="btn-prd-prd_md_doc_outline-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_doc_outline</button>
            <button id="btn-prd-prd_md_snippet_library-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_snippet_library</button>
            <button id="btn-prd-prd_md_export_pdf-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_export_pdf</button>
            <button id="btn-prd-prd_md_ai_rewriter-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_ai_rewriter</button>
            <button id="btn-prd-prd_md_link_checker-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_link_checker</button>
            <button id="btn-prd-prd_md_diagram_support-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_diagram_support</button>
            <button id="btn-prd-prd_md_template_pack-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_md_template_pack</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_md_file_browser-0').onclick = () => injectText(PRDS.prd_md_file_browser, 'prd_md_file_browser');
        document.getElementById('btn-prd-prd_md_editor_live_preview-1').onclick = () => injectText(PRDS.prd_md_editor_live_preview, 'prd_md_editor_live_preview');
        document.getElementById('btn-prd-prd_md_frontmatter_editor-2').onclick = () => injectText(PRDS.prd_md_frontmatter_editor, 'prd_md_frontmatter_editor');
        document.getElementById('btn-prd-prd_md_doc_outline-3').onclick = () => injectText(PRDS.prd_md_doc_outline, 'prd_md_doc_outline');
        document.getElementById('btn-prd-prd_md_snippet_library-4').onclick = () => injectText(PRDS.prd_md_snippet_library, 'prd_md_snippet_library');
        document.getElementById('btn-prd-prd_md_export_pdf-5').onclick = () => injectText(PRDS.prd_md_export_pdf, 'prd_md_export_pdf');
        document.getElementById('btn-prd-prd_md_ai_rewriter-6').onclick = () => injectText(PRDS.prd_md_ai_rewriter, 'prd_md_ai_rewriter');
        document.getElementById('btn-prd-prd_md_link_checker-7').onclick = () => injectText(PRDS.prd_md_link_checker, 'prd_md_link_checker');
        document.getElementById('btn-prd-prd_md_diagram_support-8').onclick = () => injectText(PRDS.prd_md_diagram_support, 'prd_md_diagram_support');
        document.getElementById('btn-prd-prd_md_template_pack-9').onclick = () => injectText(PRDS.prd_md_template_pack, 'prd_md_template_pack');

    }

    setTimeout(createMenu, 3000);
})();
