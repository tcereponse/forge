// INJECTEUR MULTIPLE DE PRD (SAAS PACK)
(function() {
    'use strict';
    
    const PRDS = {
        auth: `[CONTEXTE CACHÉ - PRD SAAS AUTH GATEWAY]
MISSION: Ce module gère l'entrée sécurisée de l'application SaaS. Il doit être inviolable, élégant et supporter le multi-tenant.
CORE FEATURES:
- Connexion via Email/Password ou Social Login.
- Rôles (Admin, Member, Viewer).
- Page de login vitrine du design system.
DATA MODEL: Table users (id, email, password_hash, role_id, tenant_id), tenants, audit_logs.
MAPPING VFS: LoginForm.tsx, SignupForm.tsx, useAuth.ts, auth.service.ts, AuthPage.tsx.
[FIN DU CONTEXTE CACHÉ]`,

        billing: `[CONTEXTE CACHÉ - PRD SAAS BILLING STRIPE & PUSH]
MISSION: Gestion des abonnements via Stripe, et notifications Push.
CORE FEATURES:
- Intégration Stripe Checkout & Customer Portal.
- Webhooks (Invoice paid, Subscription deleted).
- Enregistrement des Tokens Firebase (FCM).
MAPPING VFS: stripe.ts, PricingTable.tsx, useSubscription.ts, push.ts, NotificationBanner.tsx.
[FIN DU CONTEXTE CACHÉ]`,

        analytics: `[CONTEXTE CACHÉ - PRD SAAS DASHBOARD ANALYTICS]
MISSION: Visualisation de données complexes en temps réel pour une prise de décision rapide.
CORE FEATURES:
- Graphiques interactifs (Recharts/Chart.js).
- Filtres temporels (7j, 30j, Année).
- Widgets de résumé (KPI Cards) et Export CSV/PDF.
MAPPING VFS: AnalyticsChart.tsx, StatsGrid.tsx, export-data.ts, Dashboard.tsx.
[FIN DU CONTEXTE CACHÉ]`
    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\\n\\n" + input.value;
            
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
        if(document.getElementById('saas-prd-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'saas-prd-menu';
        menu.style = "position:fixed; bottom:20px; left:20px; background:rgba(10,15,25,0.9); border:1px solid #00D1FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px;";
        
        menu.innerHTML = \`
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 SaaS Master Pack</h3>
            <button id="btn-prd-auth" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">🔐 Injecter : Auth Gateway</button>
            <button id="btn-prd-billing" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">💳 Injecter : Billing & Push</button>
            <button id="btn-prd-analytics" style="display:block; width:100%; padding:8px; background:#112; border:1px solid #00D1FF; color:#00D1FF; cursor:pointer; border-radius:5px;">📊 Injecter : Dashboard Analytics</button>
        \`;
        
        document.body.appendChild(menu);

        document.getElementById('btn-prd-auth').onclick = () => injectText(PRDS.auth, "Auth Gateway");
        document.getElementById('btn-prd-billing').onclick = () => injectText(PRDS.billing, "Billing & Stripe");
        document.getElementById('btn-prd-analytics').onclick = () => injectText(PRDS.analytics, "Analytics Dashboard");
    }

    setTimeout(createMenu, 3000);
})();
