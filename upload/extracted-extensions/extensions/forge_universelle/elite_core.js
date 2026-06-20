// ELITE FORGE - UNIVERSAL CORE
(function() {
    'use strict';
    if (window.eliteForgeActive) return;
    window.eliteForgeActive = true;

    // 1. INJECTION DE L'INTERFACE FLOTTANTE
    const panel = document.createElement('div');
    panel.id = 'elite-forge-panel';
    
    panel.innerHTML = `
        <div id="elite-forge-header">
            <span>🛠️ ELITE FORGE G11</span>
            <span style="cursor:pointer;" id="elite-close">❌</span>
        </div>
        <div id="elite-forge-body">
            <div style="font-size:12px; color:#A0B0C0; margin-bottom:5px;">Mode: Architecte Universel</div>
            <button class="elite-btn" id="btn-inject-rules">📋 Forcer Règles FastAPI+Vite</button>
            <button class="elite-btn green" id="btn-sync-server">📡 Connecter au Pont (Port 5005)</button>
            <button class="elite-btn" id="btn-test-api">🔍 Tester API (Port 8088)</button>
        </div>
    `;
    
    document.body.appendChild(panel);

    // 2. LOGIQUE DES BOUTONS
    document.getElementById('elite-close').onclick = () => panel.style.display = 'none';

    // Bouton 1 : Injecter la règle d'or pour tous les futurs projets !
    document.getElementById('btn-inject-rules').onclick = () => {
        const rules = "RÈGLE ABSOLUE POUR CE PROJET : Tu vas créer un projet Full-Stack. Le Backend sera en FastAPI avec base de données SQLite (aucun PostgreSQL). Le Frontend sera en Vite+VueJS. Fournis un fichier launcher.bat avec la commande `python -m uvicorn app.main:app --host 0.0.0.0 --port 8088 --reload`.";
        
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.focus();
            document.execCommand('insertText', false, rules);
        } else {
            alert("Va sur le chat de l'IA pour injecter cette règle !");
        }
    };

    // Bouton 2 : Tester l'API Locale générique
    document.getElementById('btn-test-api').onclick = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8088/health');
            if (res.ok) alert("✅ Succès ! Ton Backend sur le port 8088 est bien en vie et prêt !");
            else alert("⚠️ L'API répond mais avec une erreur.");
        } catch (e) {
            alert("❌ Échec : Aucun Backend n'est détecté sur le port 8088. As-tu lancé le launcher.bat ?");
        }
    };

    // Bouton 3 : Activer la boucle de synchronisation (Le Pont Furtif Originel)
    document.getElementById('btn-sync-server').onclick = () => {
        alert("Pont Furtif activé ! L'extension va écouter les commandes de l'ordinateur.");
        // (Logique du pont similaire à l'ancienne extension)
    };

})();
