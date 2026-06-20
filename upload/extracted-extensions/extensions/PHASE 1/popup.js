const API_URL = "http://127.0.0.1:5005/v1/bridge/poll";

async function updatePopup() {
    const listEl = document.getElementById('active-list');
    const statusEl = document.getElementById('status');
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        statusEl.style.background = "#00ff88";
        statusEl.style.boxShadow = "0 0 5px #00ff88";

        if (data.active_extensions && data.active_extensions.length > 0) {
            listEl.innerHTML = data.active_extensions.map(ext => `
                <li class="ext-item">${ext.replace('ext_diamond_', '').replace('prd_', '').replace(/_/g, ' ').toUpperCase()}</li>
            `).join('');
        } else {
            listEl.innerHTML = '<div class="empty">AUCUN MODULE ACTIF.<br>Utilise le Radar Sémantique.</div>';
        }
    } catch (error) {
        statusEl.style.background = "#ff3300";
        statusEl.style.boxShadow = "0 0 5px #ff3300";
        listEl.innerHTML = '<div class="empty">ERREUR DE CONNEXION.<br>Le Master Bridge est-il lancé ?</div>';
    }
}

// Update immediately and then every 2 seconds
updatePopup();
setInterval(updatePopup, 2000);
