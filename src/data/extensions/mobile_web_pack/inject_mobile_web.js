(function() {
    'use strict';
    
    const PRDS = {
        tmpl_mobile_landing_app: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_LANDING_APP]
MISSION: Landing mobile‑first pour une app.
STYLE & DESIGN: Vertical, gros CTA store.
MAPPING VFS: MobileHero.tsx, StoreButtons.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_onboarding_flow: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_ONBOARDING_FLOW]
MISSION: Onboarding mobile avec écrans swipables.
STYLE & DESIGN: Slide cards, dots indicators.
MAPPING VFS: OnboardingSlide.tsx, SlideDots.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_bottom_nav_shell: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_BOTTOM_NAV_SHELL]
MISSION: Shell mobile avec bottom nav.
STYLE & DESIGN: Interaction pouce, icons.
MAPPING VFS: MobileShell.tsx, BottomNavBar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_auth_fullscreen: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_AUTH_FULLSCREEN]
MISSION: Ecran login fullscreen mobile.
STYLE & DESIGN: Keyboard aware, large inputs.
MAPPING VFS: MobileLogin.tsx, MobileAuthHeader.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_stories_view: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_STORIES_VIEW]
MISSION: Vue stories type Instagram.
STYLE & DESIGN: Fullscreen, progress bars.
MAPPING VFS: StoryStrip.tsx, StoryViewer.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_chat_screen: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_CHAT_SCREEN]
MISSION: Ecran chat style messagerie.
STYLE & DESIGN: Bubbles, input docked.
MAPPING VFS: ChatScreen.tsx, MessageBubble.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_feed_scroll: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_FEED_SCROLL]
MISSION: Feed infini mobile (scroll).
STYLE & DESIGN: Cards verticales, pull‑to‑refresh.
MAPPING VFS: FeedItem.tsx, FeedList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_profile_card: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_PROFILE_CARD]
MISSION: Page profil mobile compacte.
STYLE & DESIGN: Card header, tabs.
MAPPING VFS: ProfileCardMobile.tsx, ProfileTabs.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_settings_stack: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_SETTINGS_STACK]
MISSION: Stack de pages settings mobile.
STYLE & DESIGN: List items, chevrons.
MAPPING VFS: SettingsList.tsx, SettingsItem.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_mobile_paywall_screen: `[CONTEXTE CACHÉ - PRD TMPL_MOBILE_PAYWALL_SCREEN]
MISSION: Écran paywall abonnement.
STYLE & DESIGN: Hero, benefits list, CTA cost.
MAPPING VFS: PaywallScreen.tsx, PlanHighlight.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FFCC00; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('mobile_web_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'mobile_web_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Mobile Web Pack</h3>
            <button id="btn-prd-tmpl_mobile_landing_app-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_landing_app</button>
            <button id="btn-prd-tmpl_mobile_onboarding_flow-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_onboarding_flow</button>
            <button id="btn-prd-tmpl_mobile_bottom_nav_shell-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_bottom_nav_shell</button>
            <button id="btn-prd-tmpl_mobile_auth_fullscreen-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_auth_fullscreen</button>
            <button id="btn-prd-tmpl_mobile_stories_view-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_stories_view</button>
            <button id="btn-prd-tmpl_mobile_chat_screen-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_chat_screen</button>
            <button id="btn-prd-tmpl_mobile_feed_scroll-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_feed_scroll</button>
            <button id="btn-prd-tmpl_mobile_profile_card-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_profile_card</button>
            <button id="btn-prd-tmpl_mobile_settings_stack-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_settings_stack</button>
            <button id="btn-prd-tmpl_mobile_paywall_screen-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_mobile_paywall_screen</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_mobile_landing_app-0').onclick = () => injectText(PRDS.tmpl_mobile_landing_app, 'tmpl_mobile_landing_app');
        document.getElementById('btn-prd-tmpl_mobile_onboarding_flow-1').onclick = () => injectText(PRDS.tmpl_mobile_onboarding_flow, 'tmpl_mobile_onboarding_flow');
        document.getElementById('btn-prd-tmpl_mobile_bottom_nav_shell-2').onclick = () => injectText(PRDS.tmpl_mobile_bottom_nav_shell, 'tmpl_mobile_bottom_nav_shell');
        document.getElementById('btn-prd-tmpl_mobile_auth_fullscreen-3').onclick = () => injectText(PRDS.tmpl_mobile_auth_fullscreen, 'tmpl_mobile_auth_fullscreen');
        document.getElementById('btn-prd-tmpl_mobile_stories_view-4').onclick = () => injectText(PRDS.tmpl_mobile_stories_view, 'tmpl_mobile_stories_view');
        document.getElementById('btn-prd-tmpl_mobile_chat_screen-5').onclick = () => injectText(PRDS.tmpl_mobile_chat_screen, 'tmpl_mobile_chat_screen');
        document.getElementById('btn-prd-tmpl_mobile_feed_scroll-6').onclick = () => injectText(PRDS.tmpl_mobile_feed_scroll, 'tmpl_mobile_feed_scroll');
        document.getElementById('btn-prd-tmpl_mobile_profile_card-7').onclick = () => injectText(PRDS.tmpl_mobile_profile_card, 'tmpl_mobile_profile_card');
        document.getElementById('btn-prd-tmpl_mobile_settings_stack-8').onclick = () => injectText(PRDS.tmpl_mobile_settings_stack, 'tmpl_mobile_settings_stack');
        document.getElementById('btn-prd-tmpl_mobile_paywall_screen-9').onclick = () => injectText(PRDS.tmpl_mobile_paywall_screen, 'tmpl_mobile_paywall_screen');

    }

    setTimeout(createMenu, 3000);
})();
