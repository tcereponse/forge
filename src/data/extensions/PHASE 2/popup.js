const API_URL = "http://127.0.0.1:5005/v1/bridge/poll";

const ARSENAL = {
    structure: [
        {id: "protocol_master_g12", name: "PROTOCOL MASTER G12"},
        {id: "prd_architecture_g11", name: "ARCHITECTURE G11"}
    ],
    integrity: [
        {id: "ext_diamond_react_performance", name: "REACT PERFORMANCE"},
        {id: "forms_inputs_pack", name: "FORMS & INPUTS PACK"},
        {id: "ext_diamond_typescript_syntax_safety", name: "TYPESCRIPT SAFETY"}
    ],
    hygiene: [
        {id: "stealth_bridge", name: "STEALTH BRIDGE"},
        {id: "design_figma_xd_pack", name: "TAILWIND DESIGN"},
        {id: "antipollution_v12_pack", name: "ANTI-POLLUTION V13"},
        {id: "ia_pack", name: "IA PACK"}
    ]
};

function renderArsenal() {
    const listEl = document.getElementById('active-list');
    let html = "";

    // 1. Structure
    html += `<div class="category-title cat-structure">🛡️ BOUCLIER DE STRUCTURE</div>`;
    ARSENAL.structure.forEach(m => {
        html += `<li class="ext-item">${m.name}</li>`;
    });

    // 2. Integrity
    html += `<div class="category-title cat-integrity">💎 INTÉGRITÉ REACT/TS</div>`;
    ARSENAL.integrity.forEach(m => {
        html += `<li class="ext-item">${m.name}</li>`;
    });

    // 3. Hygiene
    html += `<div class="category-title cat-hygiene">🚀 LIAISON & HYGIÈNE</div>`;
    ARSENAL.hygiene.forEach(m => {
        html += `<li class="ext-item">${m.name}</li>`;
    });

    listEl.innerHTML = html;
}

async function updatePopup() {
    const statusEl = document.getElementById('status');
    try {
        const response = await fetch(API_URL);
        if(response.ok) {
            statusEl.style.background = "#00ff88";
            statusEl.style.boxShadow = "0 0 5px #00ff88";
        }
    } catch (error) {
        statusEl.style.background = "#ff3300";
        statusEl.style.boxShadow = "0 0 5px #ff3300";
    }
    renderArsenal();
}

updatePopup();
setInterval(updatePopup, 2000);
