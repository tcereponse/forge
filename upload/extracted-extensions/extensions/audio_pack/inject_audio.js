(function() {
    'use strict';
    
    const PRDS = {
        prd_audio_file_library: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_FILE_LIBRARY]
MISSION: Librairie audio (pistes, podcasts).
STYLE & DESIGN: List + waveform mini.
MAPPING VFS: AudioLibrary.tsx, TrackRow.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_player_podcast: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_PLAYER_PODCAST]
MISSION: Lecteur audio type podcast.
STYLE & DESIGN: Speed, skip, chapters.
MAPPING VFS: PodcastPlayer.tsx, ChapterMarkers.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_waveform_editor: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_WAVEFORM_EDITOR]
MISSION: Éditeur waveform pour couper ou annoter.
STYLE & DESIGN: Waveform interactif.
MAPPING VFS: WaveformEditor.tsx, WaveMarker.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_recording_widget: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_RECORDING_WIDGET]
MISSION: Recorder audio (micro) depuis le navigateur.
STYLE & DESIGN: Big record button.
MAPPING VFS: AudioRecorder.tsx, RecordingStatus.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_transcript_viewer: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_TRANSCRIPT_VIEWER]
MISSION: Afficher/éditer transcription texte.
STYLE & DESIGN: Transcript + time links.
MAPPING VFS: TranscriptView.tsx, WordHighlight.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_ai_transcribe: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_AI_TRANSCRIBE]
MISSION: Transcrire audio → texte via IA.
STYLE & DESIGN: Job status, segments.
MAPPING VFS: TranscriptionJobList.tsx, SegmentEditor.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_soundboard_pack: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_SOUNDBOARD_PACK]
MISSION: Pack de sons (soundboard).
STYLE & DESIGN: Buttons grid.
MAPPING VFS: SoundboardGrid.tsx, SoundButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_metadata_editor: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_METADATA_EDITOR]
MISSION: Éditer tags ID3 (titre, artiste, cover).
STYLE & DESIGN: Form + cover preview.
MAPPING VFS: AudioMetaForm.tsx, CoverPreview.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_mix_playlist: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_MIX_PLAYLIST]
MISSION: Créer playlists multi‑fichiers.
STYLE & DESIGN: List reorder drag.
MAPPING VFS: AudioPlaylistEditor.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_audio_commentable_snippets: `[CONTEXTE CACHÉ - PRD PRD_AUDIO_COMMENTABLE_SNIPPETS]
MISSION: Snippets audio commentables.
STYLE & DESIGN: Wave snippet preview.
MAPPING VFS: AudioSnippet.tsx, SnippetCommentList.tsx
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
        if(document.getElementById('audio_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'audio_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Audio Pack</h3>
            <button id="btn-prd-prd_audio_file_library-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_file_library</button>
            <button id="btn-prd-prd_audio_player_podcast-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_player_podcast</button>
            <button id="btn-prd-prd_audio_waveform_editor-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_waveform_editor</button>
            <button id="btn-prd-prd_audio_recording_widget-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_recording_widget</button>
            <button id="btn-prd-prd_audio_transcript_viewer-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_transcript_viewer</button>
            <button id="btn-prd-prd_audio_ai_transcribe-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_ai_transcribe</button>
            <button id="btn-prd-prd_audio_soundboard_pack-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_soundboard_pack</button>
            <button id="btn-prd-prd_audio_metadata_editor-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_metadata_editor</button>
            <button id="btn-prd-prd_audio_mix_playlist-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_mix_playlist</button>
            <button id="btn-prd-prd_audio_commentable_snippets-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 prd_audio_commentable_snippets</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_audio_file_library-0').onclick = () => injectText(PRDS.prd_audio_file_library, 'prd_audio_file_library');
        document.getElementById('btn-prd-prd_audio_player_podcast-1').onclick = () => injectText(PRDS.prd_audio_player_podcast, 'prd_audio_player_podcast');
        document.getElementById('btn-prd-prd_audio_waveform_editor-2').onclick = () => injectText(PRDS.prd_audio_waveform_editor, 'prd_audio_waveform_editor');
        document.getElementById('btn-prd-prd_audio_recording_widget-3').onclick = () => injectText(PRDS.prd_audio_recording_widget, 'prd_audio_recording_widget');
        document.getElementById('btn-prd-prd_audio_transcript_viewer-4').onclick = () => injectText(PRDS.prd_audio_transcript_viewer, 'prd_audio_transcript_viewer');
        document.getElementById('btn-prd-prd_audio_ai_transcribe-5').onclick = () => injectText(PRDS.prd_audio_ai_transcribe, 'prd_audio_ai_transcribe');
        document.getElementById('btn-prd-prd_audio_soundboard_pack-6').onclick = () => injectText(PRDS.prd_audio_soundboard_pack, 'prd_audio_soundboard_pack');
        document.getElementById('btn-prd-prd_audio_metadata_editor-7').onclick = () => injectText(PRDS.prd_audio_metadata_editor, 'prd_audio_metadata_editor');
        document.getElementById('btn-prd-prd_audio_mix_playlist-8').onclick = () => injectText(PRDS.prd_audio_mix_playlist, 'prd_audio_mix_playlist');
        document.getElementById('btn-prd-prd_audio_commentable_snippets-9').onclick = () => injectText(PRDS.prd_audio_commentable_snippets, 'prd_audio_commentable_snippets');

    }

    setTimeout(createMenu, 3000);
})();
