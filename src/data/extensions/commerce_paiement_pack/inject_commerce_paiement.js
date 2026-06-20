(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_checkout_onepage: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHECKOUT_ONEPAGE]
MISSION: Checkout mobile en un écran.
STYLE & DESIGN: Sections collapsibles.
MAPPING VFS: MobileCheckout.tsx, OrderSummary.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_cart_drawer: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CART_DRAWER]
MISSION: Panier en bottom sheet.
STYLE & DESIGN: Swipe‑up, swipe‑down.
MAPPING VFS: CartSheet.tsx, CartItemRow.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_product_gallery: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_PRODUCT_GALLERY]
MISSION: Galerie produit (swipe images).
STYLE & DESIGN: Zoom & swipe gestures.
MAPPING VFS: ProductGalleryMobile.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_product_variants: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_PRODUCT_VARIANTS]
MISSION: Sélecteur de variantes (taille, couleur).
STYLE & DESIGN: Pills, preview.
MAPPING VFS: VariantSelectorMobile.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_order_tracking: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_ORDER_TRACKING]
MISSION: Suivi de commande en timeline.
STYLE & DESIGN: Steps with icons.
MAPPING VFS: OrderTrackingScreen.tsx, StatusStep.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_payment_methods: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_PAYMENT_METHODS]
MISSION: Gestion des moyens de paiement.
STYLE & DESIGN: Cards, default badge.
MAPPING VFS: PaymentMethodList.tsx, AddCardButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_subscription_manager: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SUBSCRIPTION_MANAGER]
MISSION: Gestion abonnements (plan, renouvellement).
STYLE & DESIGN: Plan card, next billing.
MAPPING VFS: SubscriptionScreen.tsx, PlanCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_tip_donation: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_TIP_DONATION]
MISSION: Écran pour tips/dons rapides.
STYLE & DESIGN: Slider montant.
MAPPING VFS: TipAmountSlider.tsx, TipScreen.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_coupon_apply: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_COUPON_APPLY]
MISSION: Ajout coupons dans le flux.
STYLE & DESIGN: Input + applied state.
MAPPING VFS: CouponInput.tsx, CouponApplied.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_loyalty_wallet: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_LOYALTY_WALLET]
MISSION: Wallet points/fidélité.
STYLE & DESIGN: Card, progress level.
MAPPING VFS: LoyaltyWallet.tsx, PointsHistory.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF0055; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('commerce_paiement_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'commerce_paiement_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Commerce & Paiement Pack</h3>
            <button id="btn-prd-prd_mobile_checkout_onepage-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_checkout_onepage</button>
            <button id="btn-prd-prd_mobile_cart_drawer-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_cart_drawer</button>
            <button id="btn-prd-prd_mobile_product_gallery-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_product_gallery</button>
            <button id="btn-prd-prd_mobile_product_variants-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_product_variants</button>
            <button id="btn-prd-prd_mobile_order_tracking-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_order_tracking</button>
            <button id="btn-prd-prd_mobile_payment_methods-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_payment_methods</button>
            <button id="btn-prd-prd_mobile_subscription_manager-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_subscription_manager</button>
            <button id="btn-prd-prd_mobile_tip_donation-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_tip_donation</button>
            <button id="btn-prd-prd_mobile_coupon_apply-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_coupon_apply</button>
            <button id="btn-prd-prd_mobile_loyalty_wallet-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_loyalty_wallet</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_checkout_onepage-0').onclick = () => injectText(PRDS.prd_mobile_checkout_onepage, 'prd_mobile_checkout_onepage');
        document.getElementById('btn-prd-prd_mobile_cart_drawer-1').onclick = () => injectText(PRDS.prd_mobile_cart_drawer, 'prd_mobile_cart_drawer');
        document.getElementById('btn-prd-prd_mobile_product_gallery-2').onclick = () => injectText(PRDS.prd_mobile_product_gallery, 'prd_mobile_product_gallery');
        document.getElementById('btn-prd-prd_mobile_product_variants-3').onclick = () => injectText(PRDS.prd_mobile_product_variants, 'prd_mobile_product_variants');
        document.getElementById('btn-prd-prd_mobile_order_tracking-4').onclick = () => injectText(PRDS.prd_mobile_order_tracking, 'prd_mobile_order_tracking');
        document.getElementById('btn-prd-prd_mobile_payment_methods-5').onclick = () => injectText(PRDS.prd_mobile_payment_methods, 'prd_mobile_payment_methods');
        document.getElementById('btn-prd-prd_mobile_subscription_manager-6').onclick = () => injectText(PRDS.prd_mobile_subscription_manager, 'prd_mobile_subscription_manager');
        document.getElementById('btn-prd-prd_mobile_tip_donation-7').onclick = () => injectText(PRDS.prd_mobile_tip_donation, 'prd_mobile_tip_donation');
        document.getElementById('btn-prd-prd_mobile_coupon_apply-8').onclick = () => injectText(PRDS.prd_mobile_coupon_apply, 'prd_mobile_coupon_apply');
        document.getElementById('btn-prd-prd_mobile_loyalty_wallet-9').onclick = () => injectText(PRDS.prd_mobile_loyalty_wallet, 'prd_mobile_loyalty_wallet');

    }

    setTimeout(createMenu, 3000);
})();
