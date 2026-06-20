(function() {
    'use strict';
    
    const PRDS = {
        tmpl_landing_saas_minimal: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_MINIMAL]
MISSION: Landing SaaS ultra épurée pour early B2B.
STYLE & DESIGN: Hero clean, 1 CTA, très peu de texte.
MAPPING VFS: HeroMinimal.tsx, SingleCtaBar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_enterprise: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_ENTERPRISE]
MISSION: Landing SaaS orientée grands comptes/enterprise.
STYLE & DESIGN: Layout sérieux, logos clients, sections conformité.
MAPPING VFS: EnterpriseHero.tsx, TrustSection.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_vertical: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_VERTICAL]
MISSION: Landing SaaS pour un vertical (santé, éducation, finance).
STYLE & DESIGN: Illustrations métier, use cases spécifiques.
MAPPING VFS: VerticalUseCases.tsx, IndustryBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_product_tour: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_PRODUCT_TOUR]
MISSION: Landing centrée sur un “product tour” guidé.
STYLE & DESIGN: Carousel d’écrans, stepper.
MAPPING VFS: TourCarousel.tsx, StepDots.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_security: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_SECURITY]
MISSION: Page “Sécurité” dédiée (SOC2, RGPD, pratiques).
STYLE & DESIGN: Iconographie sécurité, sections denses.
MAPPING VFS: SecurityHighlights.tsx, ComplianceGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_pricing: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_PRICING]
MISSION: Page Pricing complète avec FAQ et modales.
STYLE & DESIGN: Grille pricing, badges plan populaire.
MAPPING VFS: PricingTable.tsx, PlanToggle.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_customer_stories: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_CUSTOMER_STORIES]
MISSION: Page “Customer Stories” / études de cas.
STYLE & DESIGN: Cards témoignages, logos, citations.
MAPPING VFS: StoryCard.tsx, LogoWall.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_integrations: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_INTEGRATIONS]
MISSION: Page listant toutes les intégrations.
STYLE & DESIGN: Grille cartes logos, categories.
MAPPING VFS: IntegrationGrid.tsx, IntegrationFilter.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_api: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_API]
MISSION: Landing pour l’API (dev‑first).
STYLE & DESIGN: Code blocks, SDK cards, exemples.
MAPPING VFS: ApiHero.tsx, SdkLanguageGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_landing_saas_partner: `[CONTEXTE CACHÉ - PRD TMPL_LANDING_SAAS_PARTNER]
MISSION: Landing “Partenaires / Resellers”.
STYLE & DESIGN: Cards partenaires, étapes programme.
MAPPING VFS: PartnerProgram.tsx, BenefitList.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#00FF88; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('landing_saas_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'landing_saas_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00FF88; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 Landing SaaS Pack</h3>
            <button id="btn-prd-tmpl_landing_saas_minimal-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_minimal</button>
            <button id="btn-prd-tmpl_landing_saas_enterprise-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_enterprise</button>
            <button id="btn-prd-tmpl_landing_saas_vertical-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_vertical</button>
            <button id="btn-prd-tmpl_landing_saas_product_tour-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_product_tour</button>
            <button id="btn-prd-tmpl_landing_saas_security-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_security</button>
            <button id="btn-prd-tmpl_landing_saas_pricing-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_pricing</button>
            <button id="btn-prd-tmpl_landing_customer_stories-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_customer_stories</button>
            <button id="btn-prd-tmpl_landing_saas_integrations-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_integrations</button>
            <button id="btn-prd-tmpl_landing_saas_api-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_api</button>
            <button id="btn-prd-tmpl_landing_saas_partner-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 tmpl_landing_saas_partner</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_landing_saas_minimal-0').onclick = () => injectText(PRDS.tmpl_landing_saas_minimal, 'tmpl_landing_saas_minimal');
        document.getElementById('btn-prd-tmpl_landing_saas_enterprise-1').onclick = () => injectText(PRDS.tmpl_landing_saas_enterprise, 'tmpl_landing_saas_enterprise');
        document.getElementById('btn-prd-tmpl_landing_saas_vertical-2').onclick = () => injectText(PRDS.tmpl_landing_saas_vertical, 'tmpl_landing_saas_vertical');
        document.getElementById('btn-prd-tmpl_landing_saas_product_tour-3').onclick = () => injectText(PRDS.tmpl_landing_saas_product_tour, 'tmpl_landing_saas_product_tour');
        document.getElementById('btn-prd-tmpl_landing_saas_security-4').onclick = () => injectText(PRDS.tmpl_landing_saas_security, 'tmpl_landing_saas_security');
        document.getElementById('btn-prd-tmpl_landing_saas_pricing-5').onclick = () => injectText(PRDS.tmpl_landing_saas_pricing, 'tmpl_landing_saas_pricing');
        document.getElementById('btn-prd-tmpl_landing_customer_stories-6').onclick = () => injectText(PRDS.tmpl_landing_customer_stories, 'tmpl_landing_customer_stories');
        document.getElementById('btn-prd-tmpl_landing_saas_integrations-7').onclick = () => injectText(PRDS.tmpl_landing_saas_integrations, 'tmpl_landing_saas_integrations');
        document.getElementById('btn-prd-tmpl_landing_saas_api-8').onclick = () => injectText(PRDS.tmpl_landing_saas_api, 'tmpl_landing_saas_api');
        document.getElementById('btn-prd-tmpl_landing_saas_partner-9').onclick = () => injectText(PRDS.tmpl_landing_saas_partner, 'tmpl_landing_saas_partner');

    }

    setTimeout(createMenu, 3000);
})();
