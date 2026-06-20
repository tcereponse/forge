(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_feed_infinite_scroll: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_INFINITE_SCROLL]
MISSION: Feed infini optimisé (pagination, cache).
STYLE & DESIGN: Cards, pull‑to‑refresh.
MAPPING VFS: FeedList.tsx, FeedCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_stories: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_STORIES]
MISSION: Stories bar + viewer full‑screen.
STYLE & DESIGN: Progress bars, tap zones.
MAPPING VFS: StoryStrip.tsx, StoryViewer.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_reactions: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_REACTIONS]
MISSION: Réactions emoji + likes + counters.
STYLE & DESIGN: Bottom bar, haptics.
MAPPING VFS: ReactionBar.tsx, ReactionPicker.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_comments: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_COMMENTS]
MISSION: Thread de commentaires mobile.
STYLE & DESIGN: Reply inline, lazy load.
MAPPING VFS: CommentThreadMobile.tsx, CommentInput.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_saved_items: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_SAVED_ITEMS]
MISSION: Section éléments sauvegardés.
STYLE & DESIGN: Grid ou list view.
MAPPING VFS: SavedList.tsx, SavedFilter.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_filters_bar: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_FILTERS_BAR]
MISSION: Barre filtres sticky en haut du feed.
STYLE & DESIGN: Chips scrollables.
MAPPING VFS: FilterChips.tsx, FilterBar.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_sponsored_slots: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_SPONSORED_SLOTS]
MISSION: Intégrer slots sponsors dans feed.
STYLE & DESIGN: Cards marquées “sponsor”.
MAPPING VFS: SponsoredCard.tsx, FeedSlotManager.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_multimedia: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_MULTIMEDIA]
MISSION: Mix texte + images + vidéo auto‑play.
STYLE & DESIGN: Video inline, mute toggle.
MAPPING VFS: MediaPost.tsx, InlineVideo.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_hashtag_view: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_HASHTAG_VIEW]
MISSION: Vue par hashtag / tags.
STYLE & DESIGN: Hashtag header, related tags.
MAPPING VFS: HashtagHeader.tsx, TagTimeline.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_feed_notification_teaser: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FEED_NOTIFICATION_TEASER]
MISSION: Teaser notifications en haut du feed.
STYLE & DESIGN: Banner with count.
MAPPING VFS: NotifTeaser.tsx, NotifDot.tsx
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
        if(document.getElementById('feed_social_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'feed_social_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Feed & Social Pack</h3>
            <button id="btn-prd-prd_mobile_feed_infinite_scroll-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_infinite_scroll</button>
            <button id="btn-prd-prd_mobile_feed_stories-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_stories</button>
            <button id="btn-prd-prd_mobile_feed_reactions-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_reactions</button>
            <button id="btn-prd-prd_mobile_feed_comments-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_comments</button>
            <button id="btn-prd-prd_mobile_feed_saved_items-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_saved_items</button>
            <button id="btn-prd-prd_mobile_feed_filters_bar-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_filters_bar</button>
            <button id="btn-prd-prd_mobile_feed_sponsored_slots-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_sponsored_slots</button>
            <button id="btn-prd-prd_mobile_feed_multimedia-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_multimedia</button>
            <button id="btn-prd-prd_mobile_feed_hashtag_view-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_hashtag_view</button>
            <button id="btn-prd-prd_mobile_feed_notification_teaser-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_mobile_feed_notification_teaser</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_feed_infinite_scroll-0').onclick = () => injectText(PRDS.prd_mobile_feed_infinite_scroll, 'prd_mobile_feed_infinite_scroll');
        document.getElementById('btn-prd-prd_mobile_feed_stories-1').onclick = () => injectText(PRDS.prd_mobile_feed_stories, 'prd_mobile_feed_stories');
        document.getElementById('btn-prd-prd_mobile_feed_reactions-2').onclick = () => injectText(PRDS.prd_mobile_feed_reactions, 'prd_mobile_feed_reactions');
        document.getElementById('btn-prd-prd_mobile_feed_comments-3').onclick = () => injectText(PRDS.prd_mobile_feed_comments, 'prd_mobile_feed_comments');
        document.getElementById('btn-prd-prd_mobile_feed_saved_items-4').onclick = () => injectText(PRDS.prd_mobile_feed_saved_items, 'prd_mobile_feed_saved_items');
        document.getElementById('btn-prd-prd_mobile_feed_filters_bar-5').onclick = () => injectText(PRDS.prd_mobile_feed_filters_bar, 'prd_mobile_feed_filters_bar');
        document.getElementById('btn-prd-prd_mobile_feed_sponsored_slots-6').onclick = () => injectText(PRDS.prd_mobile_feed_sponsored_slots, 'prd_mobile_feed_sponsored_slots');
        document.getElementById('btn-prd-prd_mobile_feed_multimedia-7').onclick = () => injectText(PRDS.prd_mobile_feed_multimedia, 'prd_mobile_feed_multimedia');
        document.getElementById('btn-prd-prd_mobile_feed_hashtag_view-8').onclick = () => injectText(PRDS.prd_mobile_feed_hashtag_view, 'prd_mobile_feed_hashtag_view');
        document.getElementById('btn-prd-prd_mobile_feed_notification_teaser-9').onclick = () => injectText(PRDS.prd_mobile_feed_notification_teaser, 'prd_mobile_feed_notification_teaser');

    }

    setTimeout(createMenu, 3000);
})();
