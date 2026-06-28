(function() {
    'use strict';
    
    const PRDS = {
        tmpl_marketing_campaign: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_CAMPAIGN]
MISSION: Page pour une campagne spécifique (promo, bundle).
STYLE & DESIGN: Hero avec bande promo, timer optionnel.
MAPPING VFS: CampaignHero.tsx, OfferStrip.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_webinar: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_WEBINAR]
MISSION: Landing webinar (talk, date, speakers).
STYLE & DESIGN: Layout événementiel, agenda.
MAPPING VFS: WebinarHero.tsx, SpeakerRow.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_summit_event: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_SUMMIT_EVENT]
MISSION: Page conférence/summit multi‑tracks.
STYLE & DESIGN: Agenda complexe, track filters.
MAPPING VFS: TrackSchedule.tsx, TicketCta.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_lead_magnet: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_LEAD_MAGNET]
MISSION: Landing pour lead magnet (ebook, template).
STYLE & DESIGN: Focus sur le bénéfice, capture email.
MAPPING VFS: LeadMagnetHero.tsx, DownloadForm.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_quiz_funnel: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_QUIZ_FUNNEL]
MISSION: Landing avec quiz pour qualifier leads.
STYLE & DESIGN: Stepper quiz, résultats.
MAPPING VFS: QuizIntro.tsx, QuizResult.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_waitlist_private: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_WAITLIST_PRIVATE]
MISSION: Waitlist VIP / accès limité.
STYLE & DESIGN: Dark theme, exclusivité.
MAPPING VFS: VipHero.tsx, PriorityBadge.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_referral_program: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_REFERRAL_PROGRAM]
MISSION: Page programme de parrainage.
STYLE & DESIGN: Stats, étapes, rewards visuels.
MAPPING VFS: ReferralSteps.tsx, RewardShowcase.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_ebook_launch: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_EBOOK_LAUNCH]
MISSION: Landing pour lancement ebook / guide.
STYLE & DESIGN: Book mockup, author highlight.
MAPPING VFS: BookHero.tsx, AuthorSection.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_sponsorship: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_SPONSORSHIP]
MISSION: Page sponsoring pour un produit ou event.
STYLE & DESIGN: Pack sponsor cards, KPI.
MAPPING VFS: SponsorTierGrid.tsx, AudienceStats.tsx
[FIN DU CONTEXTE CACHÉ]`,
        tmpl_marketing_upsell_page: `[CONTEXTE CACHÉ - PRD TMPL_MARKETING_UPSELL_PAGE]
MISSION: Page d’upsell après achat.
STYLE & DESIGN: Focus sur valeur supplémentaire.
MAPPING VFS: UpsellHero.tsx, OfferComparison.tsx
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
        if(document.getElementById('marketing_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'marketing_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FFCC00; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FFCC00;">📦 Marketing Pack</h3>
            <button id="btn-prd-tmpl_marketing_campaign-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_campaign</button>
            <button id="btn-prd-tmpl_marketing_webinar-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_webinar</button>
            <button id="btn-prd-tmpl_marketing_summit_event-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_summit_event</button>
            <button id="btn-prd-tmpl_marketing_lead_magnet-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_lead_magnet</button>
            <button id="btn-prd-tmpl_marketing_quiz_funnel-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_quiz_funnel</button>
            <button id="btn-prd-tmpl_marketing_waitlist_private-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_waitlist_private</button>
            <button id="btn-prd-tmpl_marketing_referral_program-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_referral_program</button>
            <button id="btn-prd-tmpl_marketing_ebook_launch-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_ebook_launch</button>
            <button id="btn-prd-tmpl_marketing_sponsorship-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_sponsorship</button>
            <button id="btn-prd-tmpl_marketing_upsell_page-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FFCC00; color:#FFCC00; cursor:pointer; border-radius:5px;">🚀 tmpl_marketing_upsell_page</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-tmpl_marketing_campaign-0').onclick = () => injectText(PRDS.tmpl_marketing_campaign, 'tmpl_marketing_campaign');
        document.getElementById('btn-prd-tmpl_marketing_webinar-1').onclick = () => injectText(PRDS.tmpl_marketing_webinar, 'tmpl_marketing_webinar');
        document.getElementById('btn-prd-tmpl_marketing_summit_event-2').onclick = () => injectText(PRDS.tmpl_marketing_summit_event, 'tmpl_marketing_summit_event');
        document.getElementById('btn-prd-tmpl_marketing_lead_magnet-3').onclick = () => injectText(PRDS.tmpl_marketing_lead_magnet, 'tmpl_marketing_lead_magnet');
        document.getElementById('btn-prd-tmpl_marketing_quiz_funnel-4').onclick = () => injectText(PRDS.tmpl_marketing_quiz_funnel, 'tmpl_marketing_quiz_funnel');
        document.getElementById('btn-prd-tmpl_marketing_waitlist_private-5').onclick = () => injectText(PRDS.tmpl_marketing_waitlist_private, 'tmpl_marketing_waitlist_private');
        document.getElementById('btn-prd-tmpl_marketing_referral_program-6').onclick = () => injectText(PRDS.tmpl_marketing_referral_program, 'tmpl_marketing_referral_program');
        document.getElementById('btn-prd-tmpl_marketing_ebook_launch-7').onclick = () => injectText(PRDS.tmpl_marketing_ebook_launch, 'tmpl_marketing_ebook_launch');
        document.getElementById('btn-prd-tmpl_marketing_sponsorship-8').onclick = () => injectText(PRDS.tmpl_marketing_sponsorship, 'tmpl_marketing_sponsorship');
        document.getElementById('btn-prd-tmpl_marketing_upsell_page-9').onclick = () => injectText(PRDS.tmpl_marketing_upsell_page, 'tmpl_marketing_upsell_page');

    }

    setTimeout(createMenu, 3000);
})();
