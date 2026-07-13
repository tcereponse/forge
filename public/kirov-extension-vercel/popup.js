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
                const phaseNames = ['', 'PRD Generation', 'Code Generation', '', '', 'Done', '', '', '', '', 'One-Shot (Gold)'];
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

// ── GitHub config management ───────────────────────────────────────────────

async function updateGitHubStatus() {
    const ghStatusEl = document.getElementById('gh-status');
    const tokenInput = document.getElementById('gh-token');
    const repoInput = document.getElementById('gh-repo');

    // Load saved config
    chrome.storage.local.get(['github_token', 'github_repo'], (result) => {
        if (result.github_token) {
            ghStatusEl.className = 'gh-status configured';
            ghStatusEl.textContent = '✅ Token GitHub configuré';
            tokenInput.value = result.github_token;
        } else {
            ghStatusEl.className = 'gh-status missing';
            ghStatusEl.textContent = '❌ Token GitHub manquant — push désactivé';
        }
        if (result.github_repo) {
            repoInput.value = result.github_repo;
        }
    });
}

document.getElementById('save-gh-btn').addEventListener('click', () => {
    const token = document.getElementById('gh-token').value.trim();
    const repo = document.getElementById('gh-repo').value.trim() || 'tcereponse/apk-builder';
    const ghStatusEl = document.getElementById('gh-status');

    if (!token) {
        alert('Entre ton token GitHub Personal Access Token (PAT)');
        return;
    }

    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        if (!confirm('Le token ne commence pas par "ghp_" — es-tu sûr que c'est un PAT GitHub valide?')) {
            return;
        }
    }

    chrome.storage.local.set({
        github_token: token,
        github_repo: repo,
    }, () => {
        ghStatusEl.className = 'gh-status configured';
        ghStatusEl.textContent = '✅ Configuration GitHub sauvegardée!';
        setTimeout(() => {
            ghStatusEl.textContent = '✅ Token GitHub configuré';
        }, 2000);
    });
});

// ── Mission controls ────────────────────────────────────────────────────────

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

// ── Init ────────────────────────────────────────────────────────────────────
updateStatus();
updateGitHubStatus();
setInterval(updateStatus, 3000);
