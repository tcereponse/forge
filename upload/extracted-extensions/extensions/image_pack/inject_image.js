(function() {
    'use strict';
    
    const PRDS = {
        prd_image_gallery_browser: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_GALLERY_BROWSER]
MISSION: Browser d’images (thumbnails, lightbox).
STYLE & DESIGN: Masonry grid, hover info.
MAPPING VFS: ImageGrid.tsx, LightboxViewer.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_upload_cropper: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_UPLOAD_CROPPER]
MISSION: Upload avec crop/resize ratio (avatar, cover).
STYLE & DESIGN: Overlay crop handles.
MAPPING VFS: ImageCropper.tsx, UploadWithCrop.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_metadata_panel: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_METADATA_PANEL]
MISSION: Affiche EXIF, taille, format, couleur dominante.
STYLE & DESIGN: Panel latéral.
MAPPING VFS: ImageMetaPanel.tsx, ColorSwatch.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_optimizer: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_OPTIMIZER]
MISSION: Optimiser poids/format (webp, jpeg) avec preview.
STYLE & DESIGN: Avant/après, sliders qualité.
MAPPING VFS: OptimizationPreview.tsx, FormatSelector.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_ai_alt_text: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_AI_ALT_TEXT]
MISSION: Générer alt‑text IA pour accessibilité.
STYLE & DESIGN: Champ auto‑rempli + edit.
MAPPING VFS: AltTextGenerator.tsx, AltTextList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_sprite_sheet_builder: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_SPRITE_SHEET_BUILDER]
MISSION: Construire sprite sheets à partir d’images.
STYLE & DESIGN: Grid preview sprite.
MAPPING VFS: SpriteEditor.tsx, FrameList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_color_palette_extractor: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_COLOR_PALETTE_EXTRACTOR]
MISSION: Extraire palette de couleurs d’une image.
STYLE & DESIGN: Palette cards.
MAPPING VFS: PalettePreview.tsx, ColorChip.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_annotation_tool: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_ANNOTATION_TOOL]
MISSION: Annoter images (rectangles, labels).
STYLE & DESIGN: Canvas overlay.
MAPPING VFS: AnnotationCanvas.tsx, AnnotationSidebar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_asset_pack_builder: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_ASSET_PACK_BUILDER]
MISSION: Créer “asset packs” (icônes, UI kit).
STYLE & DESIGN: Pack grid, export panel.
MAPPING VFS: AssetPackGrid.tsx, PackExport.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_image_diff_viewer: `[CONTEXTE CACHÉ - PRD PRD_IMAGE_DIFF_VIEWER]
MISSION: Comparer deux images (A/B, slider).
STYLE & DESIGN: Slider avant/après.
MAPPING VFS: ImageDiffSlider.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF6600; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('image_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'image_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF6600; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF6600;">📦 Image Pack</h3>
            <button id="btn-prd-prd_image_gallery_browser-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_gallery_browser</button>
            <button id="btn-prd-prd_image_upload_cropper-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_upload_cropper</button>
            <button id="btn-prd-prd_image_metadata_panel-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_metadata_panel</button>
            <button id="btn-prd-prd_image_optimizer-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_optimizer</button>
            <button id="btn-prd-prd_image_ai_alt_text-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_ai_alt_text</button>
            <button id="btn-prd-prd_image_sprite_sheet_builder-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_sprite_sheet_builder</button>
            <button id="btn-prd-prd_image_color_palette_extractor-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_color_palette_extractor</button>
            <button id="btn-prd-prd_image_annotation_tool-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_annotation_tool</button>
            <button id="btn-prd-prd_image_asset_pack_builder-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_asset_pack_builder</button>
            <button id="btn-prd-prd_image_diff_viewer-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_image_diff_viewer</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_image_gallery_browser-0').onclick = () => injectText(PRDS.prd_image_gallery_browser, 'prd_image_gallery_browser');
        document.getElementById('btn-prd-prd_image_upload_cropper-1').onclick = () => injectText(PRDS.prd_image_upload_cropper, 'prd_image_upload_cropper');
        document.getElementById('btn-prd-prd_image_metadata_panel-2').onclick = () => injectText(PRDS.prd_image_metadata_panel, 'prd_image_metadata_panel');
        document.getElementById('btn-prd-prd_image_optimizer-3').onclick = () => injectText(PRDS.prd_image_optimizer, 'prd_image_optimizer');
        document.getElementById('btn-prd-prd_image_ai_alt_text-4').onclick = () => injectText(PRDS.prd_image_ai_alt_text, 'prd_image_ai_alt_text');
        document.getElementById('btn-prd-prd_image_sprite_sheet_builder-5').onclick = () => injectText(PRDS.prd_image_sprite_sheet_builder, 'prd_image_sprite_sheet_builder');
        document.getElementById('btn-prd-prd_image_color_palette_extractor-6').onclick = () => injectText(PRDS.prd_image_color_palette_extractor, 'prd_image_color_palette_extractor');
        document.getElementById('btn-prd-prd_image_annotation_tool-7').onclick = () => injectText(PRDS.prd_image_annotation_tool, 'prd_image_annotation_tool');
        document.getElementById('btn-prd-prd_image_asset_pack_builder-8').onclick = () => injectText(PRDS.prd_image_asset_pack_builder, 'prd_image_asset_pack_builder');
        document.getElementById('btn-prd-prd_image_diff_viewer-9').onclick = () => injectText(PRDS.prd_image_diff_viewer, 'prd_image_diff_viewer');

    }

    setTimeout(createMenu, 3000);
})();
