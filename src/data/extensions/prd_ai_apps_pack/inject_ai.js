// INJECTEUR PRD (AI PACK)
(function() {
    'use strict';
    const PRDS = {
        chat: `[CONTEXTE CACHÉ - PRD AI CHAT COPILOT]
MISSION: Interface de chat intelligente capable de streamer des réponses, gérer des fichiers et maintenir un contexte long.
CORE FEATURES:
- Streaming SSE (Server-Sent Events).
- Markdown Rendering (Code, Tableaux, LaTeX).
- Historique local persistant (LocalStorage/SQLite).
- Gestion des pièces jointes.
DESIGN SYSTEM: Layout 2 colonnes, Skeleton screens, Code blocks auto-detect.
[ORDRE CTO]: Toujours implémenter un "Safety Guard" contre les injections.
MAPPING VFS: ChatWindow.tsx, MessageBubble.tsx, useChatStream.ts, ai.service.ts.
[FIN DU CONTEXTE CACHÉ]`
    };
    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\\n\\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#00D1FF; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        }
    }
    function createMenu() {
        if(document.getElementById('ai-prd-menu')) return;
        const menu = document.createElement('div');
        menu.id = 'ai-prd-menu';
        menu.style = "position:fixed; bottom:160px; left:280px; background:rgba(10,15,25,0.9); border:1px solid #00FFFF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px;";
        menu.innerHTML = \`<h3 style="margin-top:0; font-size:14px; color:#00FFFF;">🤖 AI Apps Pack</h3>
            <button id="btn-prd-ai" style="display:block; width:100%; padding:8px; background:#112; border:1px solid #00FFFF; color:#00FFFF; cursor:pointer; border-radius:5px;">💬 Injecter : AI Chat Copilot</button>\`;
        document.body.appendChild(menu);
        document.getElementById('btn-prd-ai').onclick = () => injectText(PRDS.chat, "AI Chat Copilot");
    }
    setTimeout(createMenu, 5000);
})();
