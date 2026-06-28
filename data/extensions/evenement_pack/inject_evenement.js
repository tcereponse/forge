(function() {
    'use strict';
    
    const PRDS = {
        tmpl_event_conference_full: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_CONFERENCE_FULL]
MISSION: Site complet conférence (home + agenda + speakers).
STYLE & DESIGN: Multi‑section, navigation claire.
MAPPING VFS: ConfHero.tsx, ScheduleSection.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_meetup_simple: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_MEETUP_SIMPLE]
MISSION: Landing meetup simple.
STYLE & DESIGN: One‑pager, call‑to‑action unique.
MAPPING VFS: MeetupHero.tsx, LocationBlock.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_online_summit: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_ONLINE_SUMMIT]
MISSION: Page sommet en ligne (sessions + replays).
STYLE & DESIGN: Grid sessions, tags.
MAPPING VFS: SessionGrid.tsx, ReplayCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_hackathon: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_HACKATHON]
MISSION: Landing hackathon.
STYLE & DESIGN: Timeline, sponsors, prix.
MAPPING VFS: HackathonHero.tsx, PrizeList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_product_launch_live: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_PRODUCT_LAUNCH_LIVE]
MISSION: Page live de lancement produit (stream embed).
STYLE & DESIGN: Hero vidéo, CTA chat.
MAPPING VFS: LiveHero.tsx, LiveCtaBar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_workshop_series: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_WORKSHOP_SERIES]
MISSION: Landing série de workshops.
STYLE & DESIGN: Cards sessions, form global.
MAPPING VFS: WorkshopGrid.tsx, GlobalSignup.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_retreat_offsite: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_RETREAT_OFFSITE]
MISSION: Page offsite/retreat d’équipe.
STYLE & DESIGN: Photos, agenda, infos logistiques.
MAPPING VFS: RetreatHero.tsx, TravelInfo.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_virtual_expo: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_VIRTUAL_EXPO]
MISSION: Landing expo virtuelle (stands, sponsors).
STYLE & DESIGN: Expo map, stand cards.
MAPPING VFS: ExpoMap.tsx, BoothCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_ticketing_page: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_TICKETING_PAGE]
MISSION: Page achat billets (pricing + détails).
STYLE & DESIGN: Card tickets, FAQ.
MAPPING VFS: TicketOptions.tsx, TicketFaq.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_event_highlight_recap: `[CONTEXTE CACHÉ - PRD TMPL_EVENT_HIGHLIGHT_RECAP]
MISSION: Page récap après event (photos, replays).
STYLE & DESIGN: Grid recap, highlight reel.
MAPPING VFS: RecapGallery.tsx, ReplaySection.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#9900FF; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('evenement_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'evenement_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #9900FF; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#9900FF;">📦 Événement Pack</h3>
            <button id="btn-prd-tmpl_event_conference_full-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_conference_full</button>
            <button id="btn-prd-tmpl_event_meetup_simple-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_meetup_simple</button>
            <button id="btn-prd-tmpl_event_online_summit-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_online_summit</button>
            <button id="btn-prd-tmpl_event_hackathon-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_hackathon</button>
            <button id="btn-prd-tmpl_event_product_launch_live-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_product_launch_live</button>
            <button id="btn-prd-tmpl_event_workshop_series-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_workshop_series</button>
            <button id="btn-prd-tmpl_event_retreat_offsite-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_retreat_offsite</button>
            <button id="btn-prd-tmpl_event_virtual_expo-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_virtual_expo</button>
            <button id="btn-prd-tmpl_event_ticketing_page-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_ticketing_page</button>
            <button id="btn-prd-tmpl_event_highlight_recap-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #9900FF; color:#9900FF; cursor:pointer; border-radius:5px;">🚀 tmpl_event_highlight_recap</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_event_conference_full-0').onclick = () => injectText(PRDS.tmpl_event_conference_full, 'tmpl_event_conference_full');
        document.getElementById('btn-prd-tmpl_event_meetup_simple-1').onclick = () => injectText(PRDS.tmpl_event_meetup_simple, 'tmpl_event_meetup_simple');
        document.getElementById('btn-prd-tmpl_event_online_summit-2').onclick = () => injectText(PRDS.tmpl_event_online_summit, 'tmpl_event_online_summit');
        document.getElementById('btn-prd-tmpl_event_hackathon-3').onclick = () => injectText(PRDS.tmpl_event_hackathon, 'tmpl_event_hackathon');
        document.getElementById('btn-prd-tmpl_event_product_launch_live-4').onclick = () => injectText(PRDS.tmpl_event_product_launch_live, 'tmpl_event_product_launch_live');
        document.getElementById('btn-prd-tmpl_event_workshop_series-5').onclick = () => injectText(PRDS.tmpl_event_workshop_series, 'tmpl_event_workshop_series');
        document.getElementById('btn-prd-tmpl_event_retreat_offsite-6').onclick = () => injectText(PRDS.tmpl_event_retreat_offsite, 'tmpl_event_retreat_offsite');
        document.getElementById('btn-prd-tmpl_event_virtual_expo-7').onclick = () => injectText(PRDS.tmpl_event_virtual_expo, 'tmpl_event_virtual_expo');
        document.getElementById('btn-prd-tmpl_event_ticketing_page-8').onclick = () => injectText(PRDS.tmpl_event_ticketing_page, 'tmpl_event_ticketing_page');
        document.getElementById('btn-prd-tmpl_event_highlight_recap-9').onclick = () => injectText(PRDS.tmpl_event_highlight_recap, 'tmpl_event_highlight_recap');

    }

    setTimeout(createMenu, 3000);
})();
