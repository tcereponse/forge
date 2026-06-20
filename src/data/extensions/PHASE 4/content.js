const SERVER_URL = "http://127.0.0.1:5005";
let lastLogCount = 0;
let isActivated = false;

async function checkBuildStatus() {
    try {
        const pollRes = await fetch(`${SERVER_URL}/v1/bridge/poll`);
        const pollData = await pollRes.json();
        const serverPhase = pollData.phase || 1;

        if (serverPhase !== 4) {
            if (isActivated) {
                console.log("💤 Monitor Phase 4 : Mise en veille (Phase " + serverPhase + " détectée)");
                isActivated = false;
            }
            return;
        }

        if (!isActivated) {
            console.log("📦 Phase 4 : ACTIVATION (Moniteur de Build)");
            isActivated = true;
        }

        const res = await fetch(`${SERVER_URL}/v1/logs`);
        const data = await res.json();
        const logs = data.logs || [];
        
        if (logs.length > lastLogCount) {
            const newLogs = logs.slice(lastLogCount);
            lastLogCount = logs.length;
            
            for (const log of newLogs) {
                if (log.includes("MISSION RÉUSSIE")) {
                    showBuildToast(log);
                }
            }
        }
    } catch (e) {}
}

function showBuildToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: linear-gradient(135deg, #00f2ff, #0060ff);
        color: white; padding: 15px 25px; border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,242,255,0.4);
        font-family: 'Inter', sans-serif; font-weight: bold;
        animation: slideIn 0.5s ease-out;
    `;
    toast.innerHTML = `📦 APK MATÉRIALISÉ !<br><small style="font-weight:normal;opacity:0.8">${message}</small>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s ease-in forwards';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// Styles pour l'animation
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

setInterval(checkBuildStatus, 3000);
