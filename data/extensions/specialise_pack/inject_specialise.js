(function() {
    'use strict';
    
    const PRDS = {
        tmpl_lp_open_source_project: `[CONTEXTE CACHÉ - PRD TMPL_LP_OPEN_SOURCE_PROJECT]
MISSION: Landing pour projet open‑source.
STYLE & DESIGN: Repo stats, contributors.
MAPPING VFS: OsHero.tsx, ContributorGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_job_career_page: `[CONTEXTE CACHÉ - PRD TMPL_LP_JOB_CAREER_PAGE]
MISSION: Page carrière / jobs.
STYLE & DESIGN: Job cards, culture section.
MAPPING VFS: CareerHero.tsx, JobList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_agency_minimal: `[CONTEXTE CACHÉ - PRD TMPL_LP_AGENCY_MINIMAL]
MISSION: Landing agence créative.
STYLE & DESIGN: Grande typo, portfolio.
MAPPING VFS: AgencyHero.tsx, CaseGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_saas_migration_offer: `[CONTEXTE CACHÉ - PRD TMPL_LP_SAAS_MIGRATION_OFFER]
MISSION: Page offre “migration depuis X”.
STYLE & DESIGN: Comparatif, checklist migration.
MAPPING VFS: MigrationOfferHero.tsx, SwitchReasons.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_security_audit_service: `[CONTEXTE CACHÉ - PRD TMPL_LP_SECURITY_AUDIT_SERVICE]
MISSION: Landing service d’audit sécurité.
STYLE & DESIGN: Trust, badges certif.
MAPPING VFS: AuditHero.tsx, ServiceList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_consulting_firm: `[CONTEXTE CACHÉ - PRD TMPL_LP_CONSULTING_FIRM]
MISSION: Landing cabinet de conseil.
STYLE & DESIGN: Clean, section “approche”.
MAPPING VFS: ConsultHero.tsx, ApproachSection.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_freelancer_dev: `[CONTEXTE CACHÉ - PRD TMPL_LP_FREELANCER_DEV]
MISSION: Landing dev freelance sénior.
STYLE & DESIGN: Stack highlights, testimonials.
MAPPING VFS: FreelanceHero.tsx, StackList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_non_profit: `[CONTEXTE CACHÉ - PRD TMPL_LP_NON_PROFIT]
MISSION: Landing organisation non‑profit.
STYLE & DESIGN: Storytelling, dons.
MAPPING VFS: NonProfitHero.tsx, DonationCta.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_mobile_app_store: `[CONTEXTE CACHÉ - PRD TMPL_LP_MOBILE_APP_STORE]
MISSION: Page style App Store pour app.
STYLE & DESIGN: Screenshots phone, ratings.
MAPPING VFS: AppStoreHero.tsx, ReviewStars.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_lp_coming_soon_full: `[CONTEXTE CACHÉ - PRD TMPL_LP_COMING_SOON_FULL]
MISSION: Page “Coming Soon” très travaillée.
STYLE & DESIGN: Full screen, animation fond.
MAPPING VFS: ComingSoonHero.tsx, NotifyForm.tsx
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
        if(document.getElementById('specialise_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'specialise_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Spécialisé Pack</h3>
            <button id="btn-prd-tmpl_lp_open_source_project-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_open_source_project</button>
            <button id="btn-prd-tmpl_lp_job_career_page-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_job_career_page</button>
            <button id="btn-prd-tmpl_lp_agency_minimal-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_agency_minimal</button>
            <button id="btn-prd-tmpl_lp_saas_migration_offer-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_saas_migration_offer</button>
            <button id="btn-prd-tmpl_lp_security_audit_service-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_security_audit_service</button>
            <button id="btn-prd-tmpl_lp_consulting_firm-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_consulting_firm</button>
            <button id="btn-prd-tmpl_lp_freelancer_dev-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_freelancer_dev</button>
            <button id="btn-prd-tmpl_lp_non_profit-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_non_profit</button>
            <button id="btn-prd-tmpl_lp_mobile_app_store-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_mobile_app_store</button>
            <button id="btn-prd-tmpl_lp_coming_soon_full-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_lp_coming_soon_full</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_lp_open_source_project-0').onclick = () => injectText(PRDS.tmpl_lp_open_source_project, 'tmpl_lp_open_source_project');
        document.getElementById('btn-prd-tmpl_lp_job_career_page-1').onclick = () => injectText(PRDS.tmpl_lp_job_career_page, 'tmpl_lp_job_career_page');
        document.getElementById('btn-prd-tmpl_lp_agency_minimal-2').onclick = () => injectText(PRDS.tmpl_lp_agency_minimal, 'tmpl_lp_agency_minimal');
        document.getElementById('btn-prd-tmpl_lp_saas_migration_offer-3').onclick = () => injectText(PRDS.tmpl_lp_saas_migration_offer, 'tmpl_lp_saas_migration_offer');
        document.getElementById('btn-prd-tmpl_lp_security_audit_service-4').onclick = () => injectText(PRDS.tmpl_lp_security_audit_service, 'tmpl_lp_security_audit_service');
        document.getElementById('btn-prd-tmpl_lp_consulting_firm-5').onclick = () => injectText(PRDS.tmpl_lp_consulting_firm, 'tmpl_lp_consulting_firm');
        document.getElementById('btn-prd-tmpl_lp_freelancer_dev-6').onclick = () => injectText(PRDS.tmpl_lp_freelancer_dev, 'tmpl_lp_freelancer_dev');
        document.getElementById('btn-prd-tmpl_lp_non_profit-7').onclick = () => injectText(PRDS.tmpl_lp_non_profit, 'tmpl_lp_non_profit');
        document.getElementById('btn-prd-tmpl_lp_mobile_app_store-8').onclick = () => injectText(PRDS.tmpl_lp_mobile_app_store, 'tmpl_lp_mobile_app_store');
        document.getElementById('btn-prd-tmpl_lp_coming_soon_full-9').onclick = () => injectText(PRDS.tmpl_lp_coming_soon_full, 'tmpl_lp_coming_soon_full');

    }

    setTimeout(createMenu, 3000);
})();
