(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_todo_kanban: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_TODO_KANBAN]
MISSION: To‑do en mini‑Kanban mobile.
STYLE & DESIGN: Columns scrollable horizontal.
MAPPING VFS: KanbanStrip.tsx, TaskCardMobile.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_task_list_swipe: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_TASK_LIST_SWIPE]
MISSION: Liste tâches avec actions swipe (done, delete).
STYLE & DESIGN: Swipe cells.
MAPPING VFS: SwipeTaskList.tsx, SwipeActionButtons.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_reminder_screen: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_REMINDER_SCREEN]
MISSION: Création/gestion de rappels.
STYLE & DESIGN: Time selectors, list view.
MAPPING VFS: ReminderList.tsx, ReminderForm.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_calendar_agenda: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CALENDAR_AGENDA]
MISSION: Vue agenda journalière, agenda liste.
STYLE & DESIGN: Sticky hour slots.
MAPPING VFS: AgendaView.tsx, EventCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_notes_quick: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_NOTES_QUICK]
MISSION: Notes rapides (capture instantanée).
STYLE & DESIGN: Floating add button.
MAPPING VFS: QuickNotesList.tsx, QuickNoteModal.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_focus_timer: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FOCUS_TIMER]
MISSION: Pomodoro/focus mode.
STYLE & DESIGN: Big timer, session history.
MAPPING VFS: FocusTimer.tsx, SessionList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_habit_tracker: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_HABIT_TRACKER]
MISSION: Tracker d’habitudes.
STYLE & DESIGN: Dot grid, streaks.
MAPPING VFS: HabitList.tsx, HabitCalendar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_doc_scanner: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_DOC_SCANNER]
MISSION: Scanner de documents (photo → crop).
STYLE & DESIGN: Overlay guidage.
MAPPING VFS: ScannerView.tsx, ScanPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_file_browser: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FILE_BROWSER]
MISSION: Explorateur de fichiers interne.
STYLE & DESIGN: List + icons.
MAPPING VFS: FileListMobile.tsx, FileItem.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_clipboard_manager: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CLIPBOARD_MANAGER]
MISSION: Gestion snippets/copier‑coller.
STYLE & DESIGN: Snippet cards, search.
MAPPING VFS: ClipboardList.tsx, SnippetItem.tsx
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
        if(document.getElementById('productivity_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'productivity_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Productivity Pack</h3>
            <button id="btn-prd-prd_mobile_todo_kanban-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_todo_kanban</button>
            <button id="btn-prd-prd_mobile_task_list_swipe-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_task_list_swipe</button>
            <button id="btn-prd-prd_mobile_reminder_screen-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_reminder_screen</button>
            <button id="btn-prd-prd_mobile_calendar_agenda-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_calendar_agenda</button>
            <button id="btn-prd-prd_mobile_notes_quick-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_notes_quick</button>
            <button id="btn-prd-prd_mobile_focus_timer-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_focus_timer</button>
            <button id="btn-prd-prd_mobile_habit_tracker-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_habit_tracker</button>
            <button id="btn-prd-prd_mobile_doc_scanner-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_doc_scanner</button>
            <button id="btn-prd-prd_mobile_file_browser-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_file_browser</button>
            <button id="btn-prd-prd_mobile_clipboard_manager-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_mobile_clipboard_manager</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_todo_kanban-0').onclick = () => injectText(PRDS.prd_mobile_todo_kanban, 'prd_mobile_todo_kanban');
        document.getElementById('btn-prd-prd_mobile_task_list_swipe-1').onclick = () => injectText(PRDS.prd_mobile_task_list_swipe, 'prd_mobile_task_list_swipe');
        document.getElementById('btn-prd-prd_mobile_reminder_screen-2').onclick = () => injectText(PRDS.prd_mobile_reminder_screen, 'prd_mobile_reminder_screen');
        document.getElementById('btn-prd-prd_mobile_calendar_agenda-3').onclick = () => injectText(PRDS.prd_mobile_calendar_agenda, 'prd_mobile_calendar_agenda');
        document.getElementById('btn-prd-prd_mobile_notes_quick-4').onclick = () => injectText(PRDS.prd_mobile_notes_quick, 'prd_mobile_notes_quick');
        document.getElementById('btn-prd-prd_mobile_focus_timer-5').onclick = () => injectText(PRDS.prd_mobile_focus_timer, 'prd_mobile_focus_timer');
        document.getElementById('btn-prd-prd_mobile_habit_tracker-6').onclick = () => injectText(PRDS.prd_mobile_habit_tracker, 'prd_mobile_habit_tracker');
        document.getElementById('btn-prd-prd_mobile_doc_scanner-7').onclick = () => injectText(PRDS.prd_mobile_doc_scanner, 'prd_mobile_doc_scanner');
        document.getElementById('btn-prd-prd_mobile_file_browser-8').onclick = () => injectText(PRDS.prd_mobile_file_browser, 'prd_mobile_file_browser');
        document.getElementById('btn-prd-prd_mobile_clipboard_manager-9').onclick = () => injectText(PRDS.prd_mobile_clipboard_manager, 'prd_mobile_clipboard_manager');

    }

    setTimeout(createMenu, 3000);
})();
