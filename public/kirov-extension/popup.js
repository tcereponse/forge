const SERVER_URL = "http://localhost:3000";

async function updateUI() {
    try {
        const res = await fetch(`${SERVER_URL}/v1/bridge/poll`);
        const data = await res.json();
        const phase = data.phase_num || 1;
        
        // Update LEDs
        for(let i=1; i<=6; i++) {
            const led = document.getElementById(`led-${i}`);
            if (i <= phase) led.classList.add('active');
            else led.classList.remove('active');
        }

        const statusText = document.getElementById('status-text');
        statusText.innerText = `PHASE ${phase} : ${data.status.toUpperCase()}`;
    } catch (e) {
        document.getElementById('status-text').innerText = "Bridge Hors-ligne";
    }
}

document.getElementById('oneshot-btn').addEventListener('click', async () => {
    const name = prompt("Nom du nouveau projet KIROV-LIKE :");
    if (!name) return;

    try {
        await fetch(`${SERVER_URL}/v1/mission/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: name,
                prompt: "Créer une application identique à KIROV3 (Monorepo pnpm, React Client, Hono Server).",
                stack: "react-pnpm",
                arch: "monorepo"
            })
        });
        alert("🚀 Mission One-Shot Lancée !");
    } catch (e) {
        alert("❌ Erreur lancement mission.");
    }
});

document.getElementById('p6-btn').addEventListener('click', async () => {
    const promptP6 = `En tant que Senior Fullstack Engineer, ta mission est d'ajouter de nouvelles fonctionnalités (Phase P6) TOUT EN MAINTENANT STRICTEMENT l'Architecture Plate (Flat Structure) de la Forge Diamond. Tous les fichiers de configuration (vite.config.ts, package.json, postcss.config.js, tailwind.config.js, .npmrc, index.html) DOIVENT rester à la RACINE absolue. Le code source est uniquement dans un dossier src/. Ne crée jamais de monorepo (app/, server/). MISSION ACTUELLE : `;
    try {
        await navigator.clipboard.writeText(promptP6);
        alert("✅ Protocole P6 copié dans le presse-papier !\n\nCollez-le dans l'interface de chat IA, ajoutez votre demande, et envoyez !");
    } catch (err) {
        alert("❌ Impossible de copier dans le presse-papier.");
    }
});

setInterval(updateUI, 2000);
updateUI();
