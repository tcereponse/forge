(function() {
    'use strict';
    
    const PRDS = {
        tmpl_shop_home_modern: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_HOME_MODERN]
MISSION: Home e‑commerce généraliste.
STYLE & DESIGN: Grid produits, hero promo.
MAPPING VFS: ShopHero.tsx, FeaturedGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_brand_story: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_BRAND_STORY]
MISSION: Page “Notre histoire” de marque.
STYLE & DESIGN: Storytelling, photos lifestyle.
MAPPING VFS: StorySection.tsx, TimelineStrip.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_gift_guide: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_GIFT_GUIDE]
MISSION: Guide cadeaux saisonnier.
STYLE & DESIGN: Cartes thématiques, tags.
MAPPING VFS: GiftGuideGrid.tsx, CategoryTag.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_collection_landing: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_COLLECTION_LANDING]
MISSION: Landing pour une collection spécifique.
STYLE & DESIGN: Hero collection, lookbook.
MAPPING VFS: CollectionHero.tsx, LookbookStrip.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_sale_event: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_SALE_EVENT]
MISSION: Landing pour soldes/black friday.
STYLE & DESIGN: Couleurs fortes, urgency UI.
MAPPING VFS: SaleBanner.tsx, DealGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_brand_collab: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_BRAND_COLLAB]
MISSION: Page collaboration de marques.
STYLE & DESIGN: Dual branding, split layout.
MAPPING VFS: CollabHero.tsx, CollabProductGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_sustainability: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_SUSTAINABILITY]
MISSION: Page “Impact / Sustainability”.
STYLE & DESIGN: Sections chiffres, storytelling.
MAPPING VFS: ImpactStats.tsx, InitiativeGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_loyalty_program: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_LOYALTY_PROGRAM]
MISSION: Landing programme fidélité.
STYLE & DESIGN: Tiers, points, perks.
MAPPING VFS: LoyaltyTiers.tsx, PointSummary.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_preorder_page: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_PREORDER_PAGE]
MISSION: Landing pour précommandes.
STYLE & DESIGN: Countdown, progress bar.
MAPPING VFS: PreorderHero.tsx, PreorderProgress.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_shop_drops_page: `[CONTEXTE CACHÉ - PRD TMPL_SHOP_DROPS_PAGE]
MISSION: Page “drops” (lancements limités).
STYLE & DESIGN: Card drop, “sold‑out” states.
MAPPING VFS: DropList.tsx, DropCard.tsx
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
        if(document.getElementById('ecommerce_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'ecommerce_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #9900FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#9900FF;">📦 E‑commerce Pack</h3>
            <button id="btn-prd-tmpl_shop_home_modern-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_home_modern</button>
            <button id="btn-prd-tmpl_shop_brand_story-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_brand_story</button>
            <button id="btn-prd-tmpl_shop_gift_guide-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_gift_guide</button>
            <button id="btn-prd-tmpl_shop_collection_landing-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_collection_landing</button>
            <button id="btn-prd-tmpl_shop_sale_event-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_sale_event</button>
            <button id="btn-prd-tmpl_shop_brand_collab-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_brand_collab</button>
            <button id="btn-prd-tmpl_shop_sustainability-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_sustainability</button>
            <button id="btn-prd-tmpl_shop_loyalty_program-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_loyalty_program</button>
            <button id="btn-prd-tmpl_shop_preorder_page-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_preorder_page</button>
            <button id="btn-prd-tmpl_shop_drops_page-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_shop_drops_page</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_shop_home_modern-0').onclick = () => injectText(PRDS.tmpl_shop_home_modern, 'tmpl_shop_home_modern');
        document.getElementById('btn-prd-tmpl_shop_brand_story-1').onclick = () => injectText(PRDS.tmpl_shop_brand_story, 'tmpl_shop_brand_story');
        document.getElementById('btn-prd-tmpl_shop_gift_guide-2').onclick = () => injectText(PRDS.tmpl_shop_gift_guide, 'tmpl_shop_gift_guide');
        document.getElementById('btn-prd-tmpl_shop_collection_landing-3').onclick = () => injectText(PRDS.tmpl_shop_collection_landing, 'tmpl_shop_collection_landing');
        document.getElementById('btn-prd-tmpl_shop_sale_event-4').onclick = () => injectText(PRDS.tmpl_shop_sale_event, 'tmpl_shop_sale_event');
        document.getElementById('btn-prd-tmpl_shop_brand_collab-5').onclick = () => injectText(PRDS.tmpl_shop_brand_collab, 'tmpl_shop_brand_collab');
        document.getElementById('btn-prd-tmpl_shop_sustainability-6').onclick = () => injectText(PRDS.tmpl_shop_sustainability, 'tmpl_shop_sustainability');
        document.getElementById('btn-prd-tmpl_shop_loyalty_program-7').onclick = () => injectText(PRDS.tmpl_shop_loyalty_program, 'tmpl_shop_loyalty_program');
        document.getElementById('btn-prd-tmpl_shop_preorder_page-8').onclick = () => injectText(PRDS.tmpl_shop_preorder_page, 'tmpl_shop_preorder_page');
        document.getElementById('btn-prd-tmpl_shop_drops_page-9').onclick = () => injectText(PRDS.tmpl_shop_drops_page, 'tmpl_shop_drops_page');

    }

    setTimeout(createMenu, 3000);
})();
