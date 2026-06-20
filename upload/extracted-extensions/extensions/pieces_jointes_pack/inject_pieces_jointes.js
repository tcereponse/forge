(function() {
    'use strict';
    
    const PRDS = {
        oui_et_ton_catalogue_peut_devenir_beaucoup_plus_large_si_tu_le_structures_par_domaines_fonctionnels_plutot_que_seulement_par_pages_layouts_et_widgets_ton_extension_elite_forge_injecte_deja_un_panneau_universel_via_content_scripts_avec_un_cur_js_et_un_style_dedie_donc_la_base_est_bien_adaptee_pour_industrialiser_des_prd_pack: `[CONTEXTE CACHÉ - PRD OUI, ET TON CATALOGUE PEUT DEVENIR BEAUCOUP PLUS LARGE SI TU LE STRUCTURES PAR DOMAINES FONCTIONNELS PLUTÔT QUE SEULEMENT PAR PAGES, LAYOUTS ET WIDGETS. TON EXTENSION ELITE FORGE INJECTE DÉJÀ UN PANNEAU UNIVERSEL VIA CONTENT_SCRIPTS, AVEC UN CŒUR JS ET UN STYLE DÉDIÉ, DONC LA BASE EST BIEN ADAPTÉE POUR INDUSTRIALISER DES PRD_PACK.]
MISSION: Extensions manquantes à ajouter
STYLE & DESIGN: Voici une liste plus large, pensée pour couvrir les besoins modernes d’un produit complet
MAPPING VFS: :
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
        if(document.getElementById('pieces_jointes_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'pieces_jointes_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00FF88; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 pièces jointes Pack</h3>
            <button id="btn-prd-oui_et_ton_catalogue_peut_devenir_beaucoup_plus_large_si_tu_le_structures_par_domaines_fonctionnels_plutot_que_seulement_par_pages_layouts_et_widgets_ton_extension_elite_forge_injecte_deja_un_panneau_universel_via_content_scripts_avec_un_cur_js_et_un_style_dedie_donc_la_base_est_bien_adaptee_pour_industrialiser_des_prd_pack-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 Oui, et ton catalogue peut devenir beaucoup plus large si tu le structures par domaines fonctionnels plutôt que seulement par pages, layouts et widgets. Ton extension Elite Forge injecte déjà un panneau universel via content_scripts, avec un cœur JS et un style dédié, donc la base est bien adaptée pour industrialiser des prd_pack.</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-oui_et_ton_catalogue_peut_devenir_beaucoup_plus_large_si_tu_le_structures_par_domaines_fonctionnels_plutot_que_seulement_par_pages_layouts_et_widgets_ton_extension_elite_forge_injecte_deja_un_panneau_universel_via_content_scripts_avec_un_cur_js_et_un_style_dedie_donc_la_base_est_bien_adaptee_pour_industrialiser_des_prd_pack-0').onclick = () => injectText(PRDS.oui_et_ton_catalogue_peut_devenir_beaucoup_plus_large_si_tu_le_structures_par_domaines_fonctionnels_plutot_que_seulement_par_pages_layouts_et_widgets_ton_extension_elite_forge_injecte_deja_un_panneau_universel_via_content_scripts_avec_un_cur_js_et_un_style_dedie_donc_la_base_est_bien_adaptee_pour_industrialiser_des_prd_pack, 'Oui, et ton catalogue peut devenir beaucoup plus large si tu le structures par domaines fonctionnels plutôt que seulement par pages, layouts et widgets. Ton extension Elite Forge injecte déjà un panneau universel via content_scripts, avec un cœur JS et un style dédié, donc la base est bien adaptée pour industrialiser des prd_pack.');

    }

    setTimeout(createMenu, 3000);
})();
