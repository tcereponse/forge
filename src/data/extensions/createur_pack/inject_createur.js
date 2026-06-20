(function() {
    'use strict';
    
    const PRDS = {
        tmpl_creator_portfolio_minimal: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_PORTFOLIO_MINIMAL]
MISSION: Portfolio minimaliste (projets, stack, about).
STYLE & DESIGN: Typo forte, beaucoup de blanc.
MAPPING VFS: ProjectGrid.tsx, AboutBlock.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_linkhub_dark: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_LINKHUB_DARK]
MISSION: Linktree‑like version dark premium.
STYLE & DESIGN: Cartes verre, glow.
MAPPING VFS: LinkHubList.tsx, SocialIconRow.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_personal_blog: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_PERSONAL_BLOG]
MISSION: Blog personnel avec page auteur.
STYLE & DESIGN: Layout éditorial, images hero.
MAPPING VFS: BlogHero.tsx, PostList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_podcast_page: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_PODCAST_PAGE]
MISSION: Page émission/podcast.
STYLE & DESIGN: Player intégré, épisodes en liste.
MAPPING VFS: PodcastHero.tsx, EpisodeList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_course_landing: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_COURSE_LANDING]
MISSION: Landing pour une formation solo.
STYLE & DESIGN: Hero instructeur, curriculum.
MAPPING VFS: InstructorHero.tsx, CourseOutline.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_membership_site: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_MEMBERSHIP_SITE]
MISSION: Landing pour membership communautaire.
STYLE & DESIGN: Badges “tiers”, perks.
MAPPING VFS: MembershipTiers.tsx, PerksGrid.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_photo_gallery: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_PHOTO_GALLERY]
MISSION: Galerie photo responsive.
STYLE & DESIGN: Masonry grid, lightbox.
MAPPING VFS: PhotoGrid.tsx, Lightbox.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_cv_online: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_CV_ONLINE]
MISSION: CV/Resume interactif.
STYLE & DESIGN: Timeline pro, skills bar.
MAPPING VFS: ResumeTimeline.tsx, SkillBars.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_landing_book: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_LANDING_BOOK]
MISSION: Page pour promo d’un livre/auteur.
STYLE & DESIGN: Hero cover, reviews.
MAPPING VFS: BookCoverHero.tsx, ReviewStrip.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_creator_sponsorship_kit: `[CONTEXTE CACHÉ - PRD TMPL_CREATOR_SPONSORSHIP_KIT]
MISSION: Page “Sponsor me” pour créateur.
STYLE & DESIGN: Media kit, stats audience.
MAPPING VFS: MediaKit.tsx, StatsPanel.tsx
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
        if(document.getElementById('createur_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'createur_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF0055; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF0055;">📦 Créateur Pack</h3>
            <button id="btn-prd-tmpl_creator_portfolio_minimal-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_portfolio_minimal</button>
            <button id="btn-prd-tmpl_creator_linkhub_dark-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_linkhub_dark</button>
            <button id="btn-prd-tmpl_creator_personal_blog-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_personal_blog</button>
            <button id="btn-prd-tmpl_creator_podcast_page-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_podcast_page</button>
            <button id="btn-prd-tmpl_creator_course_landing-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_course_landing</button>
            <button id="btn-prd-tmpl_creator_membership_site-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_membership_site</button>
            <button id="btn-prd-tmpl_creator_photo_gallery-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_photo_gallery</button>
            <button id="btn-prd-tmpl_creator_cv_online-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_cv_online</button>
            <button id="btn-prd-tmpl_creator_landing_book-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_landing_book</button>
            <button id="btn-prd-tmpl_creator_sponsorship_kit-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF0055; color:#FF0055; cursor:pointer; border-radius:5px;">🚀 tmpl_creator_sponsorship_kit</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_creator_portfolio_minimal-0').onclick = () => injectText(PRDS.tmpl_creator_portfolio_minimal, 'tmpl_creator_portfolio_minimal');
        document.getElementById('btn-prd-tmpl_creator_linkhub_dark-1').onclick = () => injectText(PRDS.tmpl_creator_linkhub_dark, 'tmpl_creator_linkhub_dark');
        document.getElementById('btn-prd-tmpl_creator_personal_blog-2').onclick = () => injectText(PRDS.tmpl_creator_personal_blog, 'tmpl_creator_personal_blog');
        document.getElementById('btn-prd-tmpl_creator_podcast_page-3').onclick = () => injectText(PRDS.tmpl_creator_podcast_page, 'tmpl_creator_podcast_page');
        document.getElementById('btn-prd-tmpl_creator_course_landing-4').onclick = () => injectText(PRDS.tmpl_creator_course_landing, 'tmpl_creator_course_landing');
        document.getElementById('btn-prd-tmpl_creator_membership_site-5').onclick = () => injectText(PRDS.tmpl_creator_membership_site, 'tmpl_creator_membership_site');
        document.getElementById('btn-prd-tmpl_creator_photo_gallery-6').onclick = () => injectText(PRDS.tmpl_creator_photo_gallery, 'tmpl_creator_photo_gallery');
        document.getElementById('btn-prd-tmpl_creator_cv_online-7').onclick = () => injectText(PRDS.tmpl_creator_cv_online, 'tmpl_creator_cv_online');
        document.getElementById('btn-prd-tmpl_creator_landing_book-8').onclick = () => injectText(PRDS.tmpl_creator_landing_book, 'tmpl_creator_landing_book');
        document.getElementById('btn-prd-tmpl_creator_sponsorship_kit-9').onclick = () => injectText(PRDS.tmpl_creator_sponsorship_kit, 'tmpl_creator_sponsorship_kit');

    }

    setTimeout(createMenu, 3000);
})();
