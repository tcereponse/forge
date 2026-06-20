// 💎 STEALTH BRIDGE V11.2 — SÉCURISÉ (GRADE DIAMOND)
// Optimisé pour éviter les erreurs "Max challenge attempts exceeded"
(function() {
    const NEXUS_API = "http://127.0.0.1:5005/v1";
    let isPaused = false;

    function checkChallenge() {
        const challengeDetected = 
            document.querySelector('.challenge-container') || 
            document.querySelector('#challenge-form') || 
            document.querySelector('.cf-turnstile') ||
            document.title.includes("Just a moment") ||
            document.body.innerText.includes("attempts exceeded");

        if (challengeDetected) {
            if (!isPaused) {
                console.warn("🛡️ Challenge détecté. Suspension immédiate du Bridge.");
                isPaused = true;
                showStatusBadge("⚠️ BRIDGE EN PAUSE (CHALLENGE)");
            }
            return true;
        }
        
        if (isPaused) {
            console.log("✅ Challenge résolu. Reprise du Bridge.");
            isPaused = false;
            showStatusBadge("🚀 BRIDGE ACTIF");
            setTimeout(() => removeStatusBadge(), 3000);
        }
        return false;
    }

    function showStatusBadge(text) {
        let badge = document.getElementById('nexus-stealth-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'nexus-stealth-badge';
            badge.style = "position:fixed; top:10px; left:50%; transform:translateX(-50%); z-index:999999; background:rgba(0,0,0,0.8); color:#00FFCC; padding:8px 15px; border-radius:20px; font-weight:bold; border:1px solid #00FFCC; font-family:sans-serif; pointer-events:none;";
            document.body.appendChild(badge);
        }
        badge.innerText = text;
        badge.style.display = 'block';
    }

    function removeStatusBadge() {
        const badge = document.getElementById('nexus-stealth-badge');
        if (badge) badge.style.display = 'none';
    }

    async function injectMission() {
        if (checkChallenge()) return;

        try {
            const response = await fetch(NEXUS_API + '/bridge/poll');
            const data = await response.json();
            
            if (data.status === "active" && data.prompt) {
                const input = document.querySelector('textarea, [contenteditable="true"]');
                if (input && !input.dataset.injected) {
                    input.value = data.prompt;
                    if (input.innerText !== undefined) input.innerText = data.prompt;
                    
                    // Déclenchement événement pour DeepSeek
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    input.dataset.injected = "true";
                    console.log("🚀 Mission injectée avec succès.");
                    showStatusBadge("✅ MISSION INJECTÉE");
                    setTimeout(() => removeStatusBadge(), 5000);
                }
            }
        } catch(e) {
            // Silence en cas d'erreur de connexion pour éviter de polluer la console
        }
    }

    // Vérification challenge haute fréquence (1s)
    setInterval(checkChallenge, 1000);

    // Polling mission basse fréquence (15s) pour la discrétion
    setInterval(injectMission, 15000);
    
    console.log("💎 Stealth Bridge v11.2 chargé.");
})();
