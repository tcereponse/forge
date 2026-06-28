(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_gamification_xp: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_XP]
MISSION: XP, niveaux et progression.
STYLE & DESIGN: Progress ring, rewards.
MAPPING VFS: XpRing.tsx, LevelUpModal.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_badges: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_BADGES]
MISSION: Badges, succès, collections.
STYLE & DESIGN: Badge grid.
MAPPING VFS: BadgeGrid.tsx, BadgeDetail.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_streak: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_STREAK]
MISSION: Streak journaliers/hebdo.
STYLE & DESIGN: Calendar heatmap.
MAPPING VFS: StreakCalendar.tsx, StreakCounter.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_leaderboard: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_LEADERBOARD]
MISSION: Classement (amis, global).
STYLE & DESIGN: Tabs, highlight top3.
MAPPING VFS: LeaderboardScreen.tsx, RankRow.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_missions: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_MISSIONS]
MISSION: Système de missions/quests.
STYLE & DESIGN: Mission cards.
MAPPING VFS: MissionList.tsx, MissionDetail.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_spinwheel: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_SPINWHEEL]
MISSION: Roue des récompenses (spin).
STYLE & DESIGN: Animations fun.
MAPPING VFS: SpinWheel.tsx, PrizeReveal.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_checklist: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_CHECKLIST]
MISSION: Checklists gamifiées avec points.
STYLE & DESIGN: Confetti when done.
MAPPING VFS: GamifiedChecklist.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_minigame: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_MINIGAME]
MISSION: Minijeu simple (tap, swipe, avoid).
STYLE & DESIGN: Canvas ou engine léger.
MAPPING VFS: MiniGameCanvas.tsx, ScoreHud.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_event: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_EVENT]
MISSION: Événements limités dans le temps.
STYLE & DESIGN: Countdown + special rewards.
MAPPING VFS: EventBanner.tsx, EventRewardList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_gamification_avatar: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_GAMIFICATION_AVATAR]
MISSION: Avatar customisable (skin, accessoires).
STYLE & DESIGN: Preview + picker.
MAPPING VFS: AvatarEditor.tsx, AccessoryGrid.tsx
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
        if(document.getElementById('gamification_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'gamification_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Gamification Pack</h3>
            <button id="btn-prd-prd_mobile_gamification_xp-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_xp</button>
            <button id="btn-prd-prd_mobile_gamification_badges-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_badges</button>
            <button id="btn-prd-prd_mobile_gamification_streak-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_streak</button>
            <button id="btn-prd-prd_mobile_gamification_leaderboard-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_leaderboard</button>
            <button id="btn-prd-prd_mobile_gamification_missions-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_missions</button>
            <button id="btn-prd-prd_mobile_gamification_spinwheel-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_spinwheel</button>
            <button id="btn-prd-prd_mobile_gamification_checklist-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_checklist</button>
            <button id="btn-prd-prd_mobile_gamification_minigame-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_minigame</button>
            <button id="btn-prd-prd_mobile_gamification_event-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_event</button>
            <button id="btn-prd-prd_mobile_gamification_avatar-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_gamification_avatar</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_gamification_xp-0').onclick = () => injectText(PRDS.prd_mobile_gamification_xp, 'prd_mobile_gamification_xp');
        document.getElementById('btn-prd-prd_mobile_gamification_badges-1').onclick = () => injectText(PRDS.prd_mobile_gamification_badges, 'prd_mobile_gamification_badges');
        document.getElementById('btn-prd-prd_mobile_gamification_streak-2').onclick = () => injectText(PRDS.prd_mobile_gamification_streak, 'prd_mobile_gamification_streak');
        document.getElementById('btn-prd-prd_mobile_gamification_leaderboard-3').onclick = () => injectText(PRDS.prd_mobile_gamification_leaderboard, 'prd_mobile_gamification_leaderboard');
        document.getElementById('btn-prd-prd_mobile_gamification_missions-4').onclick = () => injectText(PRDS.prd_mobile_gamification_missions, 'prd_mobile_gamification_missions');
        document.getElementById('btn-prd-prd_mobile_gamification_spinwheel-5').onclick = () => injectText(PRDS.prd_mobile_gamification_spinwheel, 'prd_mobile_gamification_spinwheel');
        document.getElementById('btn-prd-prd_mobile_gamification_checklist-6').onclick = () => injectText(PRDS.prd_mobile_gamification_checklist, 'prd_mobile_gamification_checklist');
        document.getElementById('btn-prd-prd_mobile_gamification_minigame-7').onclick = () => injectText(PRDS.prd_mobile_gamification_minigame, 'prd_mobile_gamification_minigame');
        document.getElementById('btn-prd-prd_mobile_gamification_event-8').onclick = () => injectText(PRDS.prd_mobile_gamification_event, 'prd_mobile_gamification_event');
        document.getElementById('btn-prd-prd_mobile_gamification_avatar-9').onclick = () => injectText(PRDS.prd_mobile_gamification_avatar, 'prd_mobile_gamification_avatar');

    }

    setTimeout(createMenu, 3000);
})();
