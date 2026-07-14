const SERVER_URL = "https://forge-kohl-kappa.vercel.app";

async function updateStatus() {
    const statusEl = document.getElementById('status');
    const phaseEl = document.getElementById('phase-info');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${SERVER_URL}/api/bridge/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status === 'online') {
            statusEl.className = 'status online';
            statusEl.textContent = 'Bridge Online ✅';
            if (data.mission) {
                const phaseNames = ['', 'PRD', 'Code', '', '', 'Done', '', '', '', '', 'Gold'];
                phaseEl.textContent = `Phase ${data.mission.phase}: ${phaseNames[data.mission.phase] || '?'} — ${data.mission.status}`;
            } else { phaseEl.textContent = 'Aucune mission active — prêt à lancer'; }
        } else {
            statusEl.className = 'status offline';
            statusEl.textContent = 'Bridge Hors-ligne ❌';
        }
    } catch (e) {
        const errMsg = e.name === 'AbortError' ? 'Timeout (8s)' : e.message;
        statusEl.className = 'status offline';
        statusEl.textContent = `Bridge injoignable ❌ (${errMsg})`;
    }
}

async function updateGitHubStatus() {
    const ghStatusEl = document.getElementById('gh-status');
    const tokenInput = document.getElementById('gh-token');
    const repoInput = document.getElementById('gh-repo');
    chrome.storage.local.get(['github_token', 'github_repo'], (result) => {
        if (result.github_token) {
            ghStatusEl.className = 'gh-status configured';
            ghStatusEl.textContent = '✅ Token GitHub configuré';
            tokenInput.value = result.github_token;
        } else {
            ghStatusEl.className = 'gh-status missing';
            ghStatusEl.textContent = '❌ Token GitHub manquant — push désactivé';
        }
        if (result.github_repo) repoInput.value = result.github_repo;
    });
}

document.getElementById('save-gh-btn').addEventListener('click', () => {
    const token = document.getElementById('gh-token').value.trim();
    const repo = document.getElementById('gh-repo').value.trim() || 'tcereponse/apk-builder';
    const ghStatusEl = document.getElementById('gh-status');
    if (!token) { alert('Entre ton token GitHub PAT'); return; }
    chrome.storage.local.set({ github_token: token, github_repo: repo }, () => {
        ghStatusEl.className = 'gh-status configured';
        ghStatusEl.textContent = '✅ Configuration GitHub sauvegardée!';
        setTimeout(() => { ghStatusEl.textContent = '✅ Token GitHub configuré'; }, 2000);
    });
});

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
        chrome.tabs.query({ url: "*://chat.deepseek.com/*" }, (tabs) => {
            if (tabs && tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { active: true });
                alert('Mission lancée! Onglet DeepSeek réutilisé (contexte conservé).');
            } else {
                chrome.tabs.create({ url: 'https://chat.deepseek.com/' });
                alert('Mission lancée! Nouvel onglet DeepSeek ouvert.');
            }
            updateStatus();
        });
    } catch (e) { alert('Erreur: ' + e.message); }
});

document.getElementById('check-btn').addEventListener('click', updateStatus);

document.getElementById('reset-btn').addEventListener('click', async () => {
    try {
        await fetch(`${SERVER_URL}/api/bridge/mission/reset`, { method: 'POST' });
        localStorage.removeItem('kirov_last_hash');
        updateStatus();
    } catch (e) { alert('Erreur: ' + e.message); }
});

updateStatus();
updateGitHubStatus();
setInterval(updateStatus, 3000);
