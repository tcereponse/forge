const SERVER_URLS = [
    'http://localhost:5005',
    'http://localhost:3000',
    'https://preview-chat-f2f839ba-f732-4613-9010-8f458d16225c.space-z.ai'
];

let activeServer = null;

async function detectServer() {
    for (const url of SERVER_URLS) {
        try {
            const res = await fetch(`${url}/api/bridge/health`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) { activeServer = url; return url; }
        } catch {}
    }
    return null;
}

async function updateUI() {
    if (!activeServer) await detectServer();
    try {
        const res = await fetch(`${activeServer}/api/bridge/mission/status`);
        const data = await res.json();
        const phase = data.phase || 0;
        
        for(let i=1; i<=6; i++) {
            const led = document.getElementById(`led-${i}`);
            if (i <= phase) led.classList.add('active');
            else led.classList.remove('active');
        }

        const statusText = document.getElementById('status-text');
        if (phase === 0) {
            statusText.innerText = "Pret";
        } else {
            statusText.innerText = `PHASE ${phase} : ${data.status?.toUpperCase() || 'ACTIVE'}`;
        }
    } catch (e) {
        document.getElementById('status-text').innerText = "Bridge Hors-ligne";
    }
}

document.getElementById('oneshot-btn')?.addEventListener('click', async () => {
    if (!activeServer) await detectServer();
    if (!activeServer) { alert("Bridge hors-ligne"); return; }
    
    const name = prompt("Nom du nouveau projet :");
    if (!name) return;

    try {
        await fetch(`${activeServer}/api/bridge/mission/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, prompt: name, stack: "react-vite" })
        });
        alert("Mission lancee !");
    } catch (e) {
        alert("Erreur: " + e.message);
    }
});

setInterval(updateUI, 2000);
updateUI();
