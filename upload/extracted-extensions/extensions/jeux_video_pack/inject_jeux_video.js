(function() {
    'use strict';
    
    const PRDS = {
        prd_game_engine_2d: `[CONTEXTE CACHÉ - PRD PRD_GAME_ENGINE_2D]
MISSION: Moteur de jeu Web (Canvas/WebGL) pour RPG ou plateforme.
STYLE & DESIGN: Pixel Art, Retro, ou Neon Cyberpunk.
MAPPING VFS: `GameCanvas.tsx`, `SpriteRenderer.ts`, `Joypad.tsx`
[FIN DU CONTEXTE CACHÉ]`,
        prd_game_leaderboard: `[CONTEXTE CACHÉ - PRD PRD_GAME_LEADERBOARD]
MISSION: Système de classement mondial en temps réel.
STYLE & DESIGN: Gamification, Médailles Or/Argent/Bronze, Animations.
MAPPING VFS: `LeaderboardTable.tsx`, `UserRank.tsx`
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF0055; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('jeux_video_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'jeux_video_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Jeux Vidéo Pack</h3>
            <button id="btn-prd-prd_game_engine_2d-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_game_engine_2d</button>
            <button id="btn-prd-prd_game_leaderboard-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_game_leaderboard</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_game_engine_2d-0').onclick = () => injectText(PRDS.prd_game_engine_2d, 'prd_game_engine_2d');
        document.getElementById('btn-prd-prd_game_leaderboard-1').onclick = () => injectText(PRDS.prd_game_leaderboard, 'prd_game_leaderboard');

    }

    setTimeout(createMenu, 3000);
})();
