(function() {
    'use strict';
    
    const PRDS = {
        prd_saas_multi_tenant: `[CONTEXTE CACHÉ - PRD PRD_SAAS_MULTI_TENANT]
MISSION: Gestion de multiples entreprises (Workspaces) sur une même app.
STYLE & DESIGN: Dashboard pro, Data-heavy, Sidebar fixe.
MAPPING VFS: `TenantSwitcher.tsx`, `WorkspaceSettings.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_saas_billing_pro: `[CONTEXTE CACHÉ - PRD PRD_SAAS_BILLING_PRO]
MISSION: Facturation complexe (Usage-based, Add-ons, Stripe/LemonSqueezy).
STYLE & DESIGN: Pricing tables dynamiques, Toggle Annuel/Mensuel.
MAPPING VFS: `PricingGrid.tsx`, `InvoiceList.tsx`
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
        if(document.getElementById('saas_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'saas_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 SaaS Pack</h3>
            <button id="btn-prd-prd_saas_multi_tenant-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_saas_multi_tenant</button>
            <button id="btn-prd-prd_saas_billing_pro-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_saas_billing_pro</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_saas_multi_tenant-0').onclick = () => injectText(PRDS.prd_saas_multi_tenant, 'prd_saas_multi_tenant');
        document.getElementById('btn-prd-prd_saas_billing_pro-1').onclick = () => injectText(PRDS.prd_saas_billing_pro, 'prd_saas_billing_pro');

    }

    setTimeout(createMenu, 3000);
})();
