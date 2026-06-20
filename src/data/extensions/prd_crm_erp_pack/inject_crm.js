// INJECTEUR PRD (CRM PACK)
(function() {
    'use strict';
    const PRDS = {
        crm: `[CONTEXTE CACHÉ - PRD CRM CONTACT MANAGER]
MISSION: Gestion centralisée des relations clients avec historique complet et segmentation.
CORE FEATURES:
- Base de données Contacts & Entreprises.
- Historique d'activités (Appels, Emails, Notes).
- Tags et Filtres avancés. Import/Export Excel.
MAPPING VFS: ContactList.tsx, ContactDetail.tsx, useContacts.ts, api/crm.ts.
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
        }
    }
    function createMenu() {
        if(document.getElementById('crm-prd-menu')) return;
        const menu = document.createElement('div');
        menu.id = 'crm-prd-menu';
        menu.style = "position:fixed; bottom:160px; left:20px; background:rgba(10,15,25,0.9); border:1px solid #9900FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px;";
        menu.innerHTML = \`<h3 style="margin-top:0; font-size:14px; color:#9900FF;">🏢 CRM / ERP Pack</h3>
            <button id="btn-prd-crm" style="display:block; width:100%; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🤝 Injecter : Contact Manager</button>\`;
        document.body.appendChild(menu);
        document.getElementById('btn-prd-crm').onclick = () => injectText(PRDS.crm, "CRM Contact Manager");
    }
    setTimeout(createMenu, 4500);
})();
