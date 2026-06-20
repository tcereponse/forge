(function() {
    'use strict';
    
    const PRDS = {
        prd_excel_file_browser: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_FILE_BROWSER]
MISSION: Browser de fichiers .xlsx/.csv.
STYLE & DESIGN: Table icon + metadata.
MAPPING VFS: ExcelFileList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_sheet_viewer: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_SHEET_VIEWER]
MISSION: Viewer feuilles Excel en tableau.
STYLE & DESIGN: Sticky header, pagination.
MAPPING VFS: SheetViewer.tsx, ColumnHeader.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_range_selector: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_RANGE_SELECTOR]
MISSION: Sélecteur de plage (A1:C10).
STYLE & DESIGN: Grid highlight.
MAPPING VFS: RangeSelector.tsx, RangeInput.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_import_mapper: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_IMPORT_MAPPER]
MISSION: Mapper colonnes vers schémas internes.
STYLE & DESIGN: Mapping UI.
MAPPING VFS: ColumnMappingTable.tsx, FieldSelect.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_export_config: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_EXPORT_CONFIG]
MISSION: Configurer export de données → Excel.
STYLE & DESIGN: Field chooser.
MAPPING VFS: ExportConfigPanel.tsx, FieldSelector.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_formula_helper: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_FORMULA_HELPER]
MISSION: Aide/hints sur formules.
STYLE & DESIGN: Inline suggestions.
MAPPING VFS: FormulaHint.tsx, FormulaBar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_ai_cleaner: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_AI_CLEANER]
MISSION: Nettoyer/normaliser colonnes (IA).
STYLE & DESIGN: Before/after rows.
MAPPING VFS: DataCleanPanel.tsx, TransformRuleList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_pivot_builder: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_PIVOT_BUILDER]
MISSION: Builder de “pseudo” pivot table.
STYLE & DESIGN: Drag columns rows/values.
MAPPING VFS: PivotBuilder.tsx, PivotTable.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_chart_exporter: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_CHART_EXPORTER]
MISSION: Générer charts depuis sheet.
STYLE & DESIGN: Chart config panel.
MAPPING VFS: ChartConfig.tsx, SheetChartPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_excel_diff_viewer: `[CONTEXTE CACHÉ - PRD PRD_EXCEL_DIFF_VIEWER]
MISSION: Comparer deux versions de sheet.
STYLE & DESIGN: Cell diff highlight.
MAPPING VFS: SheetDiffView.tsx, DiffLegend.tsx
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
        if(document.getElementById('office_excel_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'office_excel_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF6600; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF6600;">📦 Office/Excel Pack</h3>
            <button id="btn-prd-prd_excel_file_browser-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_file_browser</button>
            <button id="btn-prd-prd_excel_sheet_viewer-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_sheet_viewer</button>
            <button id="btn-prd-prd_excel_range_selector-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_range_selector</button>
            <button id="btn-prd-prd_excel_import_mapper-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_import_mapper</button>
            <button id="btn-prd-prd_excel_export_config-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_export_config</button>
            <button id="btn-prd-prd_excel_formula_helper-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_formula_helper</button>
            <button id="btn-prd-prd_excel_ai_cleaner-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_ai_cleaner</button>
            <button id="btn-prd-prd_excel_pivot_builder-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_pivot_builder</button>
            <button id="btn-prd-prd_excel_chart_exporter-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_chart_exporter</button>
            <button id="btn-prd-prd_excel_diff_viewer-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_excel_diff_viewer</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_excel_file_browser-0').onclick = () => injectText(PRDS.prd_excel_file_browser, 'prd_excel_file_browser');
        document.getElementById('btn-prd-prd_excel_sheet_viewer-1').onclick = () => injectText(PRDS.prd_excel_sheet_viewer, 'prd_excel_sheet_viewer');
        document.getElementById('btn-prd-prd_excel_range_selector-2').onclick = () => injectText(PRDS.prd_excel_range_selector, 'prd_excel_range_selector');
        document.getElementById('btn-prd-prd_excel_import_mapper-3').onclick = () => injectText(PRDS.prd_excel_import_mapper, 'prd_excel_import_mapper');
        document.getElementById('btn-prd-prd_excel_export_config-4').onclick = () => injectText(PRDS.prd_excel_export_config, 'prd_excel_export_config');
        document.getElementById('btn-prd-prd_excel_formula_helper-5').onclick = () => injectText(PRDS.prd_excel_formula_helper, 'prd_excel_formula_helper');
        document.getElementById('btn-prd-prd_excel_ai_cleaner-6').onclick = () => injectText(PRDS.prd_excel_ai_cleaner, 'prd_excel_ai_cleaner');
        document.getElementById('btn-prd-prd_excel_pivot_builder-7').onclick = () => injectText(PRDS.prd_excel_pivot_builder, 'prd_excel_pivot_builder');
        document.getElementById('btn-prd-prd_excel_chart_exporter-8').onclick = () => injectText(PRDS.prd_excel_chart_exporter, 'prd_excel_chart_exporter');
        document.getElementById('btn-prd-prd_excel_diff_viewer-9').onclick = () => injectText(PRDS.prd_excel_diff_viewer, 'prd_excel_diff_viewer');

    }

    setTimeout(createMenu, 3000);
})();
