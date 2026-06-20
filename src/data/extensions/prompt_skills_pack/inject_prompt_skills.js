(function() {
    'use strict';
    
    const PRDS = {
        prd_prompt_library_core: `[CONTEXTE CACHÉ - PRD PRD_PROMPT_LIBRARY_CORE]
MISSION: Bibliothèque de prompts (tags, versions).
STYLE & DESIGN: Prompt cards, search.
MAPPING VFS: PromptLibrary.tsx, PromptCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prompt_editor_advanced: `[CONTEXTE CACHÉ - PRD PRD_PROMPT_EDITOR_ADVANCED]
MISSION: Éditeur de prompts paramétrables.
STYLE & DESIGN: Variables, sliders.
MAPPING VFS: PromptEditor.tsx, PromptParam.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prompt_testbench: `[CONTEXTE CACHÉ - PRD PRD_PROMPT_TESTBENCH]
MISSION: Tester un prompt sur plusieurs inputs.
STYLE & DESIGN: Matrix résultats.
MAPPING VFS: PromptTestGrid.tsx, RunPromptButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prompt_ab_testing: `[CONTEXTE CACHÉ - PRD PRD_PROMPT_AB_TESTING]
MISSION: A/B test prompts sur mêmes cas.
STYLE & DESIGN: Side‑by‑side results.
MAPPING VFS: PromptABPanel.tsx, WinnerBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prompt_template_pack: `[CONTEXTE CACHÉ - PRD PRD_PROMPT_TEMPLATE_PACK]
MISSION: Pack de templates prompts (code, UX, PRD).
STYLE & DESIGN: Template picker.
MAPPING VFS: PromptTemplateList.tsx, TemplateDetails.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_skill_manifest_editor: `[CONTEXTE CACHÉ - PRD PRD_SKILL_MANIFEST_EDITOR]
MISSION: Éditeur de manifest de skill (tools, schemas).
STYLE & DESIGN: JSON form + preview.
MAPPING VFS: SkillManifestEditor.tsx, SchemaViewer.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_skill_registry_view: `[CONTEXTE CACHÉ - PRD PRD_SKILL_REGISTRY_VIEW]
MISSION: Registre de skills/agents disponibles.
STYLE & DESIGN: Skill catalog.
MAPPING VFS: SkillRegistry.tsx, SkillCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_skill_connection_test: `[CONTEXTE CACHÉ - PRD PRD_SKILL_CONNECTION_TEST]
MISSION: Tester un skill (input/output) rapidement.
STYLE & DESIGN: Console I/O.
MAPPING VFS: SkillTestConsole.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_skill_dependency_map: `[CONTEXTE CACHÉ - PRD PRD_SKILL_DEPENDENCY_MAP]
MISSION: Visualiser dépendances entre skills/outils.
STYLE & DESIGN: Graph nodes.
MAPPING VFS: SkillDependencyGraph.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_prompt_usage_analytics: `[CONTEXTE CACHÉ - PRD PRD_PROMPT_USAGE_ANALYTICS]
MISSION: Stats usage prompts (succès, temps, coûts).
STYLE & DESIGN: Metrics dashboard.
MAPPING VFS: PromptUsageChart.tsx, PromptLeaderboard.tsx
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
        if(document.getElementById('prompt_skills_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'prompt_skills_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00D1FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00D1FF;">📦 Prompt & Skills Pack</h3>
            <button id="btn-prd-prd_prompt_library_core-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_prompt_library_core</button>
            <button id="btn-prd-prd_prompt_editor_advanced-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_prompt_editor_advanced</button>
            <button id="btn-prd-prd_prompt_testbench-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_prompt_testbench</button>
            <button id="btn-prd-prd_prompt_ab_testing-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_prompt_ab_testing</button>
            <button id="btn-prd-prd_prompt_template_pack-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_prompt_template_pack</button>
            <button id="btn-prd-prd_skill_manifest_editor-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_skill_manifest_editor</button>
            <button id="btn-prd-prd_skill_registry_view-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_skill_registry_view</button>
            <button id="btn-prd-prd_skill_connection_test-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_skill_connection_test</button>
            <button id="btn-prd-prd_skill_dependency_map-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_skill_dependency_map</button>
            <button id="btn-prd-prd_prompt_usage_analytics-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 prd_prompt_usage_analytics</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_prompt_library_core-0').onclick = () => injectText(PRDS.prd_prompt_library_core, 'prd_prompt_library_core');
        document.getElementById('btn-prd-prd_prompt_editor_advanced-1').onclick = () => injectText(PRDS.prd_prompt_editor_advanced, 'prd_prompt_editor_advanced');
        document.getElementById('btn-prd-prd_prompt_testbench-2').onclick = () => injectText(PRDS.prd_prompt_testbench, 'prd_prompt_testbench');
        document.getElementById('btn-prd-prd_prompt_ab_testing-3').onclick = () => injectText(PRDS.prd_prompt_ab_testing, 'prd_prompt_ab_testing');
        document.getElementById('btn-prd-prd_prompt_template_pack-4').onclick = () => injectText(PRDS.prd_prompt_template_pack, 'prd_prompt_template_pack');
        document.getElementById('btn-prd-prd_skill_manifest_editor-5').onclick = () => injectText(PRDS.prd_skill_manifest_editor, 'prd_skill_manifest_editor');
        document.getElementById('btn-prd-prd_skill_registry_view-6').onclick = () => injectText(PRDS.prd_skill_registry_view, 'prd_skill_registry_view');
        document.getElementById('btn-prd-prd_skill_connection_test-7').onclick = () => injectText(PRDS.prd_skill_connection_test, 'prd_skill_connection_test');
        document.getElementById('btn-prd-prd_skill_dependency_map-8').onclick = () => injectText(PRDS.prd_skill_dependency_map, 'prd_skill_dependency_map');
        document.getElementById('btn-prd-prd_prompt_usage_analytics-9').onclick = () => injectText(PRDS.prd_prompt_usage_analytics, 'prd_prompt_usage_analytics');

    }

    setTimeout(createMenu, 3000);
})();
