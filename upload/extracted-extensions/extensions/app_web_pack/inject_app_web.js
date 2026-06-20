(function() {
    'use strict';
    
    const PRDS = {
        tmpl_app_dashboard_starter: `[CONTEXTE CACHÉ - PRD TMPL_APP_DASHBOARD_STARTER]
MISSION: Dashboard app générique.
STYLE & DESIGN: Layout pro, 3–4 cards.
MAPPING VFS: DashboardShell.tsx, StatsRow.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_auth_split: `[CONTEXTE CACHÉ - PRD TMPL_APP_AUTH_SPLIT]
MISSION: Template page login/inscription split.
STYLE & DESIGN: Hero visuel + form.
MAPPING VFS: AuthSplitLayout.tsx, AuthSidePanel.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_settings_center: `[CONTEXTE CACHÉ - PRD TMPL_APP_SETTINGS_CENTER]
MISSION: Page paramètres utilisateur.
STYLE & DESIGN: Tabs settings, cards sections.
MAPPING VFS: SettingsTabs.tsx, SettingsCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_notifications_center: `[CONTEXTE CACHÉ - PRD TMPL_APP_NOTIFICATIONS_CENTER]
MISSION: Centre de notifications/boîte de réception.
STYLE & DESIGN: Three‑pane layout.
MAPPING VFS: NotificationList.tsx, NotificationDetail.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_profile_public: `[CONTEXTE CACHÉ - PRD TMPL_APP_PROFILE_PUBLIC]
MISSION: Page profil publique (réseaux, stats).
STYLE & DESIGN: Header profil, cards.
MAPPING VFS: ProfileHeader.tsx, ProfileStats.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_inbox_layout: `[CONTEXTE CACHÉ - PRD TMPL_APP_INBOX_LAYOUT]
MISSION: Layout style email/inbox.
STYLE & DESIGN: Sidebar + thread list + detail.
MAPPING VFS: InboxShell.tsx, ThreadList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_kanban_board: `[CONTEXTE CACHÉ - PRD TMPL_APP_KANBAN_BOARD]
MISSION: Template board Kanban productivité.
STYLE & DESIGN: Colonne drag‑and‑drop.
MAPPING VFS: KanbanColumn.tsx, TaskCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_todo_minimal: `[CONTEXTE CACHÉ - PRD TMPL_APP_TODO_MINIMAL]
MISSION: App to‑do minimaliste.
STYLE & DESIGN: Mono‑colonne, focus UX.
MAPPING VFS: TodoList.tsx, TodoItem.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_notes_editor: `[CONTEXTE CACHÉ - PRD TMPL_APP_NOTES_EDITOR]
MISSION: App de notes type Notion light.
STYLE & DESIGN: Blocks, sidebar.
MAPPING VFS: NoteBlock.tsx, NoteSidebar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_app_calendar_view: `[CONTEXTE CACHÉ - PRD TMPL_APP_CALENDAR_VIEW]
MISSION: Vue agenda/calendrier app.
STYLE & DESIGN: Month/week switch.
MAPPING VFS: CalendarShell.tsx, EventPopover.tsx
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
        if(document.getElementById('app_web_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'app_web_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 App Web Pack</h3>
            <button id="btn-prd-tmpl_app_dashboard_starter-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_dashboard_starter</button>
            <button id="btn-prd-tmpl_app_auth_split-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_auth_split</button>
            <button id="btn-prd-tmpl_app_settings_center-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_settings_center</button>
            <button id="btn-prd-tmpl_app_notifications_center-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_notifications_center</button>
            <button id="btn-prd-tmpl_app_profile_public-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_profile_public</button>
            <button id="btn-prd-tmpl_app_inbox_layout-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_inbox_layout</button>
            <button id="btn-prd-tmpl_app_kanban_board-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_kanban_board</button>
            <button id="btn-prd-tmpl_app_todo_minimal-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_todo_minimal</button>
            <button id="btn-prd-tmpl_app_notes_editor-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_notes_editor</button>
            <button id="btn-prd-tmpl_app_calendar_view-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_app_calendar_view</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_app_dashboard_starter-0').onclick = () => injectText(PRDS.tmpl_app_dashboard_starter, 'tmpl_app_dashboard_starter');
        document.getElementById('btn-prd-tmpl_app_auth_split-1').onclick = () => injectText(PRDS.tmpl_app_auth_split, 'tmpl_app_auth_split');
        document.getElementById('btn-prd-tmpl_app_settings_center-2').onclick = () => injectText(PRDS.tmpl_app_settings_center, 'tmpl_app_settings_center');
        document.getElementById('btn-prd-tmpl_app_notifications_center-3').onclick = () => injectText(PRDS.tmpl_app_notifications_center, 'tmpl_app_notifications_center');
        document.getElementById('btn-prd-tmpl_app_profile_public-4').onclick = () => injectText(PRDS.tmpl_app_profile_public, 'tmpl_app_profile_public');
        document.getElementById('btn-prd-tmpl_app_inbox_layout-5').onclick = () => injectText(PRDS.tmpl_app_inbox_layout, 'tmpl_app_inbox_layout');
        document.getElementById('btn-prd-tmpl_app_kanban_board-6').onclick = () => injectText(PRDS.tmpl_app_kanban_board, 'tmpl_app_kanban_board');
        document.getElementById('btn-prd-tmpl_app_todo_minimal-7').onclick = () => injectText(PRDS.tmpl_app_todo_minimal, 'tmpl_app_todo_minimal');
        document.getElementById('btn-prd-tmpl_app_notes_editor-8').onclick = () => injectText(PRDS.tmpl_app_notes_editor, 'tmpl_app_notes_editor');
        document.getElementById('btn-prd-tmpl_app_calendar_view-9').onclick = () => injectText(PRDS.tmpl_app_calendar_view, 'tmpl_app_calendar_view');

    }

    setTimeout(createMenu, 3000);
})();
