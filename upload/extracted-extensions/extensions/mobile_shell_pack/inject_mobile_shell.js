(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_shell_tabbed: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_TABBED]
MISSION: Shell mobile avec bottom‑tabs et header dynamique.
STYLE & DESIGN: iOS/Android‑like, gestes fluides.
MAPPING VFS: MobileShell.tsx, BottomTabs.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_drawer: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_DRAWER]
MISSION: Shell avec drawer latéral (burger menu).
STYLE & DESIGN: Material‑like, overlay sombre.
MAPPING VFS: DrawerShell.tsx, DrawerMenu.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_stack: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_STACK]
MISSION: Navigation en stack (push/pop) avec headers animés.
STYLE & DESIGN: Transitions swipe, back arrow.
MAPPING VFS: StackNavigator.tsx, HeaderBar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_wizard: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_WIZARD]
MISSION: Shell pour flow multi‑écrans type wizard.
STYLE & DESIGN: Progress indicator, disable back.
MAPPING VFS: WizardShell.tsx, WizardSteps.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_auth_guard: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_AUTH_GUARD]
MISSION: Gestion des routes protégées/logged‑out.
STYLE & DESIGN: Skeleton states, redirects.
MAPPING VFS: AuthGuard.tsx, AuthGate.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_split_view: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_SPLIT_VIEW]
MISSION: Master/detail sur tablette (split).
STYLE & DESIGN: Layout responsive mobile→tablet.
MAPPING VFS: SplitShell.tsx, MasterPane.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_modal_stack: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_MODAL_STACK]
MISSION: Stack de modales mobile‑style (bottom sheet + full).
STYLE & DESIGN: Blur, swipe‑down to close.
MAPPING VFS: ModalStack.tsx, SheetModal.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_offline_first: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_OFFLINE_FIRST]
MISSION: Shell avec gestion offline globale.
STYLE & DESIGN: Banner offline, sync icon.
MAPPING VFS: OfflineBanner.tsx, SyncIndicator.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_deep_link: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_DEEP_LINK]
MISSION: Gestion deeplinks / liens dynamiques.
STYLE & DESIGN: Route preview, params viewer.
MAPPING VFS: DeepLinkHandler.tsx, LinkPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_shell_intro_flow: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SHELL_INTRO_FLOW]
MISSION: Sequence d’intro/apprentissage avant app.
STYLE & DESIGN: Slides onboarding, skip logic.
MAPPING VFS: IntroSlides.tsx, IntroCta.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF6600; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('mobile_shell_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'mobile_shell_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF6600; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF6600;">📦 Mobile Shell Pack</h3>
            <button id="btn-prd-prd_mobile_shell_tabbed-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_tabbed</button>
            <button id="btn-prd-prd_mobile_shell_drawer-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_drawer</button>
            <button id="btn-prd-prd_mobile_shell_stack-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_stack</button>
            <button id="btn-prd-prd_mobile_shell_wizard-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_wizard</button>
            <button id="btn-prd-prd_mobile_shell_auth_guard-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_auth_guard</button>
            <button id="btn-prd-prd_mobile_shell_split_view-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_split_view</button>
            <button id="btn-prd-prd_mobile_shell_modal_stack-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_modal_stack</button>
            <button id="btn-prd-prd_mobile_shell_offline_first-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_offline_first</button>
            <button id="btn-prd-prd_mobile_shell_deep_link-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_deep_link</button>
            <button id="btn-prd-prd_mobile_shell_intro_flow-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_shell_intro_flow</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_shell_tabbed-0').onclick = () => injectText(PRDS.prd_mobile_shell_tabbed, 'prd_mobile_shell_tabbed');
        document.getElementById('btn-prd-prd_mobile_shell_drawer-1').onclick = () => injectText(PRDS.prd_mobile_shell_drawer, 'prd_mobile_shell_drawer');
        document.getElementById('btn-prd-prd_mobile_shell_stack-2').onclick = () => injectText(PRDS.prd_mobile_shell_stack, 'prd_mobile_shell_stack');
        document.getElementById('btn-prd-prd_mobile_shell_wizard-3').onclick = () => injectText(PRDS.prd_mobile_shell_wizard, 'prd_mobile_shell_wizard');
        document.getElementById('btn-prd-prd_mobile_shell_auth_guard-4').onclick = () => injectText(PRDS.prd_mobile_shell_auth_guard, 'prd_mobile_shell_auth_guard');
        document.getElementById('btn-prd-prd_mobile_shell_split_view-5').onclick = () => injectText(PRDS.prd_mobile_shell_split_view, 'prd_mobile_shell_split_view');
        document.getElementById('btn-prd-prd_mobile_shell_modal_stack-6').onclick = () => injectText(PRDS.prd_mobile_shell_modal_stack, 'prd_mobile_shell_modal_stack');
        document.getElementById('btn-prd-prd_mobile_shell_offline_first-7').onclick = () => injectText(PRDS.prd_mobile_shell_offline_first, 'prd_mobile_shell_offline_first');
        document.getElementById('btn-prd-prd_mobile_shell_deep_link-8').onclick = () => injectText(PRDS.prd_mobile_shell_deep_link, 'prd_mobile_shell_deep_link');
        document.getElementById('btn-prd-prd_mobile_shell_intro_flow-9').onclick = () => injectText(PRDS.prd_mobile_shell_intro_flow, 'prd_mobile_shell_intro_flow');

    }

    setTimeout(createMenu, 3000);
})();
