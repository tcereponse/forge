(function() {
    'use strict';
    
    const PRDS = {
        tmpl_blog_magazine_modern: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_MAGAZINE_MODERN]
MISSION: Blog style magazine moderne.
STYLE & DESIGN: Cards visuelles, catégories.
MAPPING VFS: MagazineGrid.tsx, CategoryNav.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_single_post_longform: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_SINGLE_POST_LONGFORM]
MISSION: Template article long‑form.
STYLE & DESIGN: Large typo, TOC sticky.
MAPPING VFS: ArticleLayout.tsx, InlineToc.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_series_hub: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_SERIES_HUB]
MISSION: Hub de série d’articles.
STYLE & DESIGN: Cards numérotées, navigation série.
MAPPING VFS: SeriesList.tsx, SeriesProgress.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_newsroom: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_NEWSROOM]
MISSION: Page “Newsroom / Press”.
STYLE & DESIGN: Communiqués, mentions presse.
MAPPING VFS: PressList.tsx, PressLogoRow.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_docs_landing: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_DOCS_LANDING]
MISSION: Landing portail documentation.
STYLE & DESIGN: Search dominantes, sections docs.
MAPPING VFS: DocsLandingHero.tsx, DocsCategoryGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_resource_library: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_RESOURCE_LIBRARY]
MISSION: Bibliothèque de ressources (pdf, vidéos, guides).
STYLE & DESIGN: Grid filtrable.
MAPPING VFS: ResourceGrid.tsx, ResourceFilter.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_changelog_mini: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_CHANGELOG_MINI]
MISSION: Mini changelog intégré dans site.
STYLE & DESIGN: Timeline compacte.
MAPPING VFS: MiniChangelog.tsx, ChangeBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_author_profile: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_AUTHOR_PROFILE]
MISSION: Page auteur pour blog.
STYLE & DESIGN: Bio, social links, articles.
MAPPING VFS: AuthorHeader.tsx, AuthorPosts.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_podcast_blog: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_PODCAST_BLOG]
MISSION: Blog + podcast hybride.
STYLE & DESIGN: Mix articles/épisodes.
MAPPING VFS: MixedFeed.tsx, TypeBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_blog_event_recaps: `[CONTEXTE CACHÉ - PRD TMPL_BLOG_EVENT_RECAPS]
MISSION: Template pour recaps d’événements répétés.
STYLE & DESIGN: Cards par édition.
MAPPING VFS: EventRecapCard.tsx, RecapGrid.tsx
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
        if(document.getElementById('blog_contenu_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'blog_contenu_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Blog & Contenu Pack</h3>
            <button id="btn-prd-tmpl_blog_magazine_modern-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_magazine_modern</button>
            <button id="btn-prd-tmpl_blog_single_post_longform-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_single_post_longform</button>
            <button id="btn-prd-tmpl_blog_series_hub-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_series_hub</button>
            <button id="btn-prd-tmpl_blog_newsroom-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_newsroom</button>
            <button id="btn-prd-tmpl_blog_docs_landing-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_docs_landing</button>
            <button id="btn-prd-tmpl_blog_resource_library-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_resource_library</button>
            <button id="btn-prd-tmpl_blog_changelog_mini-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_changelog_mini</button>
            <button id="btn-prd-tmpl_blog_author_profile-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_author_profile</button>
            <button id="btn-prd-tmpl_blog_podcast_blog-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_podcast_blog</button>
            <button id="btn-prd-tmpl_blog_event_recaps-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_blog_event_recaps</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_blog_magazine_modern-0').onclick = () => injectText(PRDS.tmpl_blog_magazine_modern, 'tmpl_blog_magazine_modern');
        document.getElementById('btn-prd-tmpl_blog_single_post_longform-1').onclick = () => injectText(PRDS.tmpl_blog_single_post_longform, 'tmpl_blog_single_post_longform');
        document.getElementById('btn-prd-tmpl_blog_series_hub-2').onclick = () => injectText(PRDS.tmpl_blog_series_hub, 'tmpl_blog_series_hub');
        document.getElementById('btn-prd-tmpl_blog_newsroom-3').onclick = () => injectText(PRDS.tmpl_blog_newsroom, 'tmpl_blog_newsroom');
        document.getElementById('btn-prd-tmpl_blog_docs_landing-4').onclick = () => injectText(PRDS.tmpl_blog_docs_landing, 'tmpl_blog_docs_landing');
        document.getElementById('btn-prd-tmpl_blog_resource_library-5').onclick = () => injectText(PRDS.tmpl_blog_resource_library, 'tmpl_blog_resource_library');
        document.getElementById('btn-prd-tmpl_blog_changelog_mini-6').onclick = () => injectText(PRDS.tmpl_blog_changelog_mini, 'tmpl_blog_changelog_mini');
        document.getElementById('btn-prd-tmpl_blog_author_profile-7').onclick = () => injectText(PRDS.tmpl_blog_author_profile, 'tmpl_blog_author_profile');
        document.getElementById('btn-prd-tmpl_blog_podcast_blog-8').onclick = () => injectText(PRDS.tmpl_blog_podcast_blog, 'tmpl_blog_podcast_blog');
        document.getElementById('btn-prd-tmpl_blog_event_recaps-9').onclick = () => injectText(PRDS.tmpl_blog_event_recaps, 'tmpl_blog_event_recaps');

    }

    setTimeout(createMenu, 3000);
})();
