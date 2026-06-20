const API_URL = "http://127.0.0.1:5005/v1/bridge/poll";

async function updatePopup() {
    const statusEl = document.getElementById('status');
    const titleEl = document.querySelector('.title');
    const dots = document.querySelectorAll('.dot');
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (response.ok) {
            const isActive = data.phase_num === 3;
            const isPrompt = data.status === "prompt";
            const isGenerating = data.status === "generating";
            
            // État Global
            statusEl.style.background = isActive ? (isGenerating ? "#00f2ff" : "#a78bfa") : "#444";
            statusEl.style.boxShadow = isActive ? `0 0 10px ${isGenerating ? "#00f2ff" : "#a78bfa"}` : "none";
            
            // Libellé Dynamique
            if (isActive) {
                if (isPrompt) {
                    titleEl.innerText = "🛡️ PHASE 3 : INJECTION...";
                    titleEl.style.color = "#00f2ff";
                } else if (isGenerating) {
                    titleEl.innerText = "🛡️ PHASE 3 : MATÉRIALISATION";
                    titleEl.style.color = "#ff9900"; // Orange pour l'action
                } else {
                    titleEl.innerText = "🛡️ PHASE 3 : PRÊTE";
                    titleEl.style.color = "#a78bfa";
                }
                
                // Animation des points Arsenal
                dots.forEach((dot, i) => {
                    dot.style.color = (isPrompt || isGenerating) ? "#00f2ff" : "#a78bfa";
                    if (isPrompt || isGenerating) {
                        dot.style.textShadow = "0 0 5px #00f2ff";
                    }
                });
            } else {
                titleEl.innerText = "🛡️ PHASE 3 : VEILLE";
                titleEl.style.color = "#444";
                dots.forEach(dot => {
                    dot.style.color = "#444";
                    dot.style.textShadow = "none";
                });
            }
        }
    } catch (error) {
        statusEl.style.background = "#ff3300";
        statusEl.style.boxShadow = "0 0 8px #ff3300";
        titleEl.innerText = "🛡️ PHASE 3 : OFFLINE";
    }
}

updatePopup();
setInterval(updatePopup, 1000);
