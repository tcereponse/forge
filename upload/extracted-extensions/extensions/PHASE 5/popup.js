async function updatePopup() {
    try {
        const response = await fetch("http://127.0.0.1:5005/v1/bridge/poll");
        const data = await response.json();
        
        const statusEl = document.getElementById('status');
        const listEl = document.getElementById('nugget-list');

        if (data.project_id) {
            statusEl.textContent = `Projet : ${data.project_id} (Phase ${data.phase})`;
            
            // Affichage des pépites (extensions)
            if (data.active_extensions && data.active_extensions.length > 0) {
                const items = data.active_extensions.map(ext => `<div class="nugget-item">✨ ${ext}</div>`).join('');
                listEl.innerHTML = `<div style="font-size: 10px; opacity: 0.5; margin-bottom: 10px;">PÉPITES DÉTECTÉES :</div>` + items;
            }
        }
    } catch (e) {
        document.getElementById('status').textContent = "Bridge non détecté.";
    }
}

document.getElementById('launch').addEventListener('click', () => {
    chrome.storage.local.set({ phase5_active: true }, () => {
        document.getElementById('status').textContent = "Injection lancée...";
    });
});

setInterval(updatePopup, 2000);
updatePopup();
