const SERVER_URL = "http://127.0.0.1:5005";

async function updateLogs() {
    try {
        const res = await fetch(`${SERVER_URL}/v1/logs`);
        const data = await res.json();
        const logsDiv = document.getElementById('logs');
        if (data.logs) {
            logsDiv.innerHTML = data.logs.reverse().slice(0, 50).map(l => {
                let color = l.includes("✅") ? "#00f2ff" : (l.includes("❌") ? "#ff4444" : "#fff");
                return `<div style="color:${color};margin-bottom:4px;">${l}</div>`;
            }).join('');
        }
    } catch (e) {}
}

document.getElementById('btn-rebuild').onclick = async () => {
    try {
        const res = await fetch(`${SERVER_URL}/v1/compile`, { method: 'POST' });
        const data = await res.json();
        alert("Force Build lancé pour : " + data.project);
    } catch (e) {
        alert("Erreur Serveur");
    }
};

setInterval(updateLogs, 2000);
updateLogs();
