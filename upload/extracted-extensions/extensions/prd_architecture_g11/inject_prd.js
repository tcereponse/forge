// INJECTEUR AUTOMATIQUE DE PRD
(function() {
    'use strict';
    
    const PRD_CONTENT = `
[CONTEXTE CACHÉ - RÈGLES DE FORGE G11]
Tu es l'Agent de la Sovereign Forge. L'utilisateur a activé le module d'Architecture G11.
TU DOIS RESPECTER CES RÈGLES POUR CE PROJET :
1. Base de données : SQLite OBLIGATOIRE (sqlite:///./app.db). Interdiction d'utiliser PostgreSQL.
2. Backend : FastAPI.
3. Frontend : Vite + VueJS. Toujours inclure postcss.config.js pour Tailwind.
4. Lancement : Fournir un fichier launcher.bat avec la commande : python -m uvicorn app.main:app --host 0.0.0.0 --port 8088 --reload.
[FIN DU CONTEXTE CACHÉ]
    `;

    // Fonction pour injecter silencieusement le PRD dans la zone de texte de l'IA
    function injectPRD() {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input && !window.prdG11Injected) {
            window.prdG11Injected = true;
            // On ajoute le texte
            input.value = PRD_CONTENT + input.value;
            // On crée un petit badge visuel pour prévenir l'utilisateur que le PRD est chargé
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#00FF88; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Architecture G11 : CHARGÉ";
            document.body.appendChild(badge);
            
            setTimeout(() => badge.remove(), 5000);
        }
    }

    // Tenter l'injection quand la page est chargée
    setTimeout(injectPRD, 2000);
})();
