(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_chat_basic: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_BASIC]
MISSION: Chat 1:1 classique.
STYLE & DESIGN: Bubbles align left/right.
MAPPING VFS: ChatScreen.tsx, MessageBubble.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_group: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_GROUP]
MISSION: Chat de groupe avec avatars, mentions.
STYLE & DESIGN: Header group, member count.
MAPPING VFS: GroupChatHeader.tsx, GroupMemberList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_threaded: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_THREADED]
MISSION: Conversations threadées (réponses à un message).
STYLE & DESIGN: Thread preview.
MAPPING VFS: ThreadPreview.tsx, ThreadedMessage.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_reactions: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_REACTIONS]
MISSION: Réactions aux messages (emoji long‑press).
STYLE & DESIGN: Popover emoji, counters.
MAPPING VFS: MessageReactionBar.tsx, ReactionPicker.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_attachments: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_ATTACHMENTS]
MISSION: Envoi fichiers, images, audio.
STYLE & DESIGN: Input row + preview bar.
MAPPING VFS: AttachmentBar.tsx, AttachmentPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_voice_notes: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_VOICE_NOTES]
MISSION: Enregistrement et lecture de vocaux.
STYLE & DESIGN: Hold‑to‑record UI.
MAPPING VFS: VoiceRecordButton.tsx, VoiceMessageBubble.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_presence: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_PRESENCE]
MISSION: Indicateurs online / typing.
STYLE & DESIGN: Subtle status dots.
MAPPING VFS: TypingIndicator.tsx, PresenceDot.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_inbox_list: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_INBOX_LIST]
MISSION: Liste conversations type inbox.
STYLE & DESIGN: Last message preview.
MAPPING VFS: ChatList.tsx, ChatListItem.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_support_bot: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_SUPPORT_BOT]
MISSION: Chat support avec bot + fallback humain.
STYLE & DESIGN: Bot tags, quick replies.
MAPPING VFS: SupportChat.tsx, QuickReplyButtons.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_chat_announcement: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_CHAT_ANNOUNCEMENT]
MISSION: Channel read‑only pour annonces.
STYLE & DESIGN: Highlight messages.
MAPPING VFS: AnnouncementChannel.tsx, PinnedBanner.tsx
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
        if(document.getElementById('chat_comms_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'chat_comms_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Chat & Comms Pack</h3>
            <button id="btn-prd-prd_mobile_chat_basic-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_basic</button>
            <button id="btn-prd-prd_mobile_chat_group-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_group</button>
            <button id="btn-prd-prd_mobile_chat_threaded-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_threaded</button>
            <button id="btn-prd-prd_mobile_chat_reactions-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_reactions</button>
            <button id="btn-prd-prd_mobile_chat_attachments-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_attachments</button>
            <button id="btn-prd-prd_mobile_chat_voice_notes-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_voice_notes</button>
            <button id="btn-prd-prd_mobile_chat_presence-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_presence</button>
            <button id="btn-prd-prd_mobile_chat_inbox_list-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_inbox_list</button>
            <button id="btn-prd-prd_mobile_chat_support_bot-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_support_bot</button>
            <button id="btn-prd-prd_mobile_chat_announcement-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_chat_announcement</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_chat_basic-0').onclick = () => injectText(PRDS.prd_mobile_chat_basic, 'prd_mobile_chat_basic');
        document.getElementById('btn-prd-prd_mobile_chat_group-1').onclick = () => injectText(PRDS.prd_mobile_chat_group, 'prd_mobile_chat_group');
        document.getElementById('btn-prd-prd_mobile_chat_threaded-2').onclick = () => injectText(PRDS.prd_mobile_chat_threaded, 'prd_mobile_chat_threaded');
        document.getElementById('btn-prd-prd_mobile_chat_reactions-3').onclick = () => injectText(PRDS.prd_mobile_chat_reactions, 'prd_mobile_chat_reactions');
        document.getElementById('btn-prd-prd_mobile_chat_attachments-4').onclick = () => injectText(PRDS.prd_mobile_chat_attachments, 'prd_mobile_chat_attachments');
        document.getElementById('btn-prd-prd_mobile_chat_voice_notes-5').onclick = () => injectText(PRDS.prd_mobile_chat_voice_notes, 'prd_mobile_chat_voice_notes');
        document.getElementById('btn-prd-prd_mobile_chat_presence-6').onclick = () => injectText(PRDS.prd_mobile_chat_presence, 'prd_mobile_chat_presence');
        document.getElementById('btn-prd-prd_mobile_chat_inbox_list-7').onclick = () => injectText(PRDS.prd_mobile_chat_inbox_list, 'prd_mobile_chat_inbox_list');
        document.getElementById('btn-prd-prd_mobile_chat_support_bot-8').onclick = () => injectText(PRDS.prd_mobile_chat_support_bot, 'prd_mobile_chat_support_bot');
        document.getElementById('btn-prd-prd_mobile_chat_announcement-9').onclick = () => injectText(PRDS.prd_mobile_chat_announcement, 'prd_mobile_chat_announcement');

    }

    setTimeout(createMenu, 3000);
})();
