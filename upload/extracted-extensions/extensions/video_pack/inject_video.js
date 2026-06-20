(function() {
    'use strict';
    
    const PRDS = {
        prd_video_file_browser: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_FILE_BROWSER]
MISSION: Liste de vidéos avec miniatures.
STYLE & DESIGN: Thumbnails, durée overlay.
MAPPING VFS: VideoGrid.tsx, VideoCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_player_advanced: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_PLAYER_ADVANCED]
MISSION: Lecteur vidéo (chapters, vitesse, subtitles).
STYLE & DESIGN: Controls avancés.
MAPPING VFS: VideoPlayer.tsx, ChapterList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_upload_transcoder: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_UPLOAD_TRANSCODER]
MISSION: Upload + choix de profil transcodage.
STYLE & DESIGN: Queue jobs, status.
MAPPING VFS: TranscodeQueue.tsx, ProfileSelector.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_thumbnail_picker: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_THUMBNAIL_PICKER]
MISSION: Choisir miniature vidéo (auto + frames).
STYLE & DESIGN: Frame strip.
MAPPING VFS: ThumbnailStrip.tsx, ThumbnailSelector.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_subtitle_manager: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_SUBTITLE_MANAGER]
MISSION: Gérer sous‑titres (import/export .srt, edit).
STYLE & DESIGN: Timeline sous‑titres.
MAPPING VFS: SubtitleEditor.tsx, SubtitleList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_clip_cutter: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_CLIP_CUTTER]
MISSION: Découper clips vidéo depuis un fichier.
STYLE & DESIGN: Range slider.
MAPPING VFS: ClipRangeSelector.tsx, ClipList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_storyboard_view: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_STORYBOARD_VIEW]
MISSION: Storyboard (séquence d’images clés).
STYLE & DESIGN: Grid scènes.
MAPPING VFS: StoryboardGrid.tsx, SceneCard.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_ai_summary: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_AI_SUMMARY]
MISSION: Résumé IA du contenu d’une vidéo.
STYLE & DESIGN: TL;DR section, timestamps.
MAPPING VFS: VideoSummaryPanel.tsx, TimestampList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_comment_timeline: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_COMMENT_TIMELINE]
MISSION: Commentaires liés à des timestamps.
STYLE & DESIGN: Timeline avec markers.
MAPPING VFS: CommentTimeline.tsx, TimeMarker.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_video_playlist_builder: `[CONTEXTE CACHÉ - PRD PRD_VIDEO_PLAYLIST_BUILDER]
MISSION: Créer playlists et ordonner vidéos.
STYLE & DESIGN: Drag & drop list.
MAPPING VFS: PlaylistEditor.tsx, PlaylistCard.tsx
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
        if(document.getElementById('video_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'video_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Vidéo Pack</h3>
            <button id="btn-prd-prd_video_file_browser-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_file_browser</button>
            <button id="btn-prd-prd_video_player_advanced-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_player_advanced</button>
            <button id="btn-prd-prd_video_upload_transcoder-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_upload_transcoder</button>
            <button id="btn-prd-prd_video_thumbnail_picker-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_thumbnail_picker</button>
            <button id="btn-prd-prd_video_subtitle_manager-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_subtitle_manager</button>
            <button id="btn-prd-prd_video_clip_cutter-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_clip_cutter</button>
            <button id="btn-prd-prd_video_storyboard_view-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_storyboard_view</button>
            <button id="btn-prd-prd_video_ai_summary-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_ai_summary</button>
            <button id="btn-prd-prd_video_comment_timeline-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_comment_timeline</button>
            <button id="btn-prd-prd_video_playlist_builder-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 prd_video_playlist_builder</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_video_file_browser-0').onclick = () => injectText(PRDS.prd_video_file_browser, 'prd_video_file_browser');
        document.getElementById('btn-prd-prd_video_player_advanced-1').onclick = () => injectText(PRDS.prd_video_player_advanced, 'prd_video_player_advanced');
        document.getElementById('btn-prd-prd_video_upload_transcoder-2').onclick = () => injectText(PRDS.prd_video_upload_transcoder, 'prd_video_upload_transcoder');
        document.getElementById('btn-prd-prd_video_thumbnail_picker-3').onclick = () => injectText(PRDS.prd_video_thumbnail_picker, 'prd_video_thumbnail_picker');
        document.getElementById('btn-prd-prd_video_subtitle_manager-4').onclick = () => injectText(PRDS.prd_video_subtitle_manager, 'prd_video_subtitle_manager');
        document.getElementById('btn-prd-prd_video_clip_cutter-5').onclick = () => injectText(PRDS.prd_video_clip_cutter, 'prd_video_clip_cutter');
        document.getElementById('btn-prd-prd_video_storyboard_view-6').onclick = () => injectText(PRDS.prd_video_storyboard_view, 'prd_video_storyboard_view');
        document.getElementById('btn-prd-prd_video_ai_summary-7').onclick = () => injectText(PRDS.prd_video_ai_summary, 'prd_video_ai_summary');
        document.getElementById('btn-prd-prd_video_comment_timeline-8').onclick = () => injectText(PRDS.prd_video_comment_timeline, 'prd_video_comment_timeline');
        document.getElementById('btn-prd-prd_video_playlist_builder-9').onclick = () => injectText(PRDS.prd_video_playlist_builder, 'prd_video_playlist_builder');

    }

    setTimeout(createMenu, 3000);
})();
