const SERVER_URL = "https://forge-kohl-kappa.vercel.app";

async function updateStatus() {
    try {
        const res = await fetch(`${SERVER_URL}/api/bridge/health`);
        const data = await res.json();
        const statusEl = document.getElementById('status');
        const phaseEl = document.getElementById('phase-info');

        if (data.status === 'online') {
            statusEl.className = 'status online';
            statusEl.textContent = 'Bridge Online ✅';
            if (data.mission) {
                const phaseNames = ['', 'PRD Generation', 'Code Generation', '', '', 'Done'];
                phaseEl.textContent = `Phase ${data.mission.phase}: ${phaseNames[data.mission.phase] || 'Unknown'} — ${data.mission.status}`;
            } else {
                phaseEl.textContent = 'Aucune mission active';
            }
        } else {
            statusEl.className = 'status offline';
            statusEl.textContent = 'Bridge Hors-ligne ❌';
        }
    } catch (e) {
        document.getElementById('status').className = 'status offline';
        document.getElementById('status').textContent = 'Bridge Hors-ligne ❌';
    }
}

document.getElementById('start-btn').addEventListener('click', async () => {
    const name = prompt("Nom du projet:");
    if (!name) return;
    const desc = prompt("Description du projet:");
    if (!desc) return;

    try {
        await fetch(`${SERVER_URL}/api/bridge/mission/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, prompt: desc, stack: 'react-vite' }),
        });
        alert('Mission lancée! Ouvre chat.deepseek.com dans un nouvel onglet.');
        updateStatus();
    } catch (e) {
        alert('Erreur: ' + e.message);
    }
});

document.getElementById('check-btn').addEventListener('click', updateStatus);

document.getElementById('reset-btn').addEventListener('click', async () => {
    try {
        await fetch(`${SERVER_URL}/api/bridge/mission/reset`, { method: 'POST' });
        localStorage.removeItem('kirov_last_hash');
        updateStatus();
    } catch (e) {
        alert('Erreur: ' + e.message);
    }
});

updateStatus();
setInterval(updateStatus, 3000);
