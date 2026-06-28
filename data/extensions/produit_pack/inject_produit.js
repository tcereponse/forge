(function() {
    'use strict';
    
    const PRDS = {
        tmpl_product_single_feature: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_SINGLE_FEATURE]
MISSION: Page centrée sur une seule feature “hero”.
STYLE & DESIGN: Hero asymétrique, story forte.
MAPPING VFS: FeatureHero.tsx, BenefitBullets.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_comparison: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_COMPARISON]
MISSION: Comparatif produit vs concurrents.
STYLE & DESIGN: Table comparatif, badges.
MAPPING VFS: ComparisonTable.tsx, VsSection.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_release_launch: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_RELEASE_LAUNCH]
MISSION: Page pour le lancement d’une grosse feature.
STYLE & DESIGN: Layout “event”, confetti subtil.
MAPPING VFS: LaunchHero.tsx, ReleaseTimeline.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_changelog: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_CHANGELOG]
MISSION: Page publique des changelogs.
STYLE & DESIGN: Timeline, tags par type de changement.
MAPPING VFS: ChangelogTimeline.tsx, ChangeTag.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_roadmap_public: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_ROADMAP_PUBLIC]
MISSION: Roadmap publique (public roadmap).
STYLE & DESIGN: Kanban ou timeline.
MAPPING VFS: PublicRoadmap.tsx, RoadmapColumn.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_beta_program: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_BETA_PROGRAM]
MISSION: Landing pour un programme beta.
STYLE & DESIGN: Sections “pré‑requis”, formulaire d’inscription.
MAPPING VFS: BetaHero.tsx, BetaSignupForm.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_migration_guide: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_MIGRATION_GUIDE]
MISSION: Page guidant une migration (v1 → v2, autre outil).
STYLE & DESIGN: Stepper détaillé, callouts risques.
MAPPING VFS: MigrationSteps.tsx, WarningCallout.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_compare_plans: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_COMPARE_PLANS]
MISSION: Page comparant en détail les plans.
STYLE & DESIGN: Table comparison + accordéons.
MAPPING VFS: PlanComparison.tsx, FeatureMatrix.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_solution_hub: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_SOLUTION_HUB]
MISSION: Page hub “Solutions par segment/persona”.
STYLE & DESIGN: Cards persona, sections segmentées.
MAPPING VFS: SolutionGrid.tsx, PersonaCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_product_addon_store: `[CONTEXTE CACHÉ - PRD TMPL_PRODUCT_ADDON_STORE]
MISSION: Mini‑store pour add‑ons/extensions du produit.
STYLE & DESIGN: Grid cartes, tags “popular”.
MAPPING VFS: AddonGrid.tsx, AddonCard.tsx
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
        if(document.getElementById('produit_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'produit_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00D1FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00D1FF;">📦 Produit Pack</h3>
            <button id="btn-prd-tmpl_product_single_feature-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_single_feature</button>
            <button id="btn-prd-tmpl_product_comparison-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_comparison</button>
            <button id="btn-prd-tmpl_product_release_launch-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_release_launch</button>
            <button id="btn-prd-tmpl_product_changelog-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_changelog</button>
            <button id="btn-prd-tmpl_product_roadmap_public-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_roadmap_public</button>
            <button id="btn-prd-tmpl_product_beta_program-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_beta_program</button>
            <button id="btn-prd-tmpl_product_migration_guide-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_migration_guide</button>
            <button id="btn-prd-tmpl_product_compare_plans-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_compare_plans</button>
            <button id="btn-prd-tmpl_product_solution_hub-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_solution_hub</button>
            <button id="btn-prd-tmpl_product_addon_store-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🚀 tmpl_product_addon_store</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_product_single_feature-0').onclick = () => injectText(PRDS.tmpl_product_single_feature, 'tmpl_product_single_feature');
        document.getElementById('btn-prd-tmpl_product_comparison-1').onclick = () => injectText(PRDS.tmpl_product_comparison, 'tmpl_product_comparison');
        document.getElementById('btn-prd-tmpl_product_release_launch-2').onclick = () => injectText(PRDS.tmpl_product_release_launch, 'tmpl_product_release_launch');
        document.getElementById('btn-prd-tmpl_product_changelog-3').onclick = () => injectText(PRDS.tmpl_product_changelog, 'tmpl_product_changelog');
        document.getElementById('btn-prd-tmpl_product_roadmap_public-4').onclick = () => injectText(PRDS.tmpl_product_roadmap_public, 'tmpl_product_roadmap_public');
        document.getElementById('btn-prd-tmpl_product_beta_program-5').onclick = () => injectText(PRDS.tmpl_product_beta_program, 'tmpl_product_beta_program');
        document.getElementById('btn-prd-tmpl_product_migration_guide-6').onclick = () => injectText(PRDS.tmpl_product_migration_guide, 'tmpl_product_migration_guide');
        document.getElementById('btn-prd-tmpl_product_compare_plans-7').onclick = () => injectText(PRDS.tmpl_product_compare_plans, 'tmpl_product_compare_plans');
        document.getElementById('btn-prd-tmpl_product_solution_hub-8').onclick = () => injectText(PRDS.tmpl_product_solution_hub, 'tmpl_product_solution_hub');
        document.getElementById('btn-prd-tmpl_product_addon_store-9').onclick = () => injectText(PRDS.tmpl_product_addon_store, 'tmpl_product_addon_store');

    }

    setTimeout(createMenu, 3000);
})();
