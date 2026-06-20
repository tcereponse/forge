(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_auth_sms_otp: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_SMS_OTP]
MISSION: Login/verify via SMS OTP.
STYLE & DESIGN: Fullscreen, numpad friendly.
MAPPING VFS: SmsOtpScreen.tsx, OtpInput.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_biometrics: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_BIOMETRICS]
MISSION: Login avec Face ID / Touch ID.
STYLE & DESIGN: Prompt natif + fallback PIN.
MAPPING VFS: BiometricPrompt.tsx, PinFallback.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_social: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_SOCIAL]
MISSION: Login social via deep link (Google, Apple, etc.).
STYLE & DESIGN: Buttons brandés, loading overlay.
MAPPING VFS: SocialLoginButtons.tsx, AuthLoading.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_magic_link: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_MAGIC_LINK]
MISSION: Login par magic link ouvert sur mobile.
STYLE & DESIGN: Explication claire, resend.
MAPPING VFS: MagicLinkScreen.tsx, MagicStatus.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_device_pin: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_DEVICE_PIN]
MISSION: PIN interne à l’app pour actions sensibles.
STYLE & DESIGN: Numpad, dots animation.
MAPPING VFS: PinPad.tsx, PinLockScreen.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_session_manager: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_SESSION_MANAGER]
MISSION: Liste devices connectés et session kill.
STYLE & DESIGN: Cards devices, swipe actions.
MAPPING VFS: SessionListMobile.tsx, KillSessionButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_signup_phone: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_SIGNUP_PHONE]
MISSION: Signup basé téléphone + vérification.
STYLE & DESIGN: Steps courts, progress bar.
MAPPING VFS: PhoneSignup.tsx, PhoneVerify.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_reauth_modal: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_REAUTH_MODAL]
MISSION: Modale de re-auth pour action critique.
STYLE & DESIGN: Small overlay, reason text.
MAPPING VFS: ReauthModal.tsx, ReauthButton.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_consent_screen: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_CONSENT_SCREEN]
MISSION: Écrans consent RGPD adaptés mobile.
STYLE & DESIGN: Long scroll, anchors.
MAPPING VFS: ConsentScreen.tsx, ConsentCheckboxList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_auth_profile_setup: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_AUTH_PROFILE_SETUP]
MISSION: Setup profil post-signup (avatar, pseudo).
STYLE & DESIGN: One‑hand UX, preview.
MAPPING VFS: ProfileSetupScreen.tsx, AvatarPicker.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#00FF88; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('auth_mobile_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'auth_mobile_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00FF88; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 Auth Mobile Pack</h3>
            <button id="btn-prd-prd_mobile_auth_sms_otp-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_sms_otp</button>
            <button id="btn-prd-prd_mobile_auth_biometrics-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_biometrics</button>
            <button id="btn-prd-prd_mobile_auth_social-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_social</button>
            <button id="btn-prd-prd_mobile_auth_magic_link-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_magic_link</button>
            <button id="btn-prd-prd_mobile_auth_device_pin-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_device_pin</button>
            <button id="btn-prd-prd_mobile_auth_session_manager-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_session_manager</button>
            <button id="btn-prd-prd_mobile_auth_signup_phone-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_signup_phone</button>
            <button id="btn-prd-prd_mobile_auth_reauth_modal-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_reauth_modal</button>
            <button id="btn-prd-prd_mobile_auth_consent_screen-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_consent_screen</button>
            <button id="btn-prd-prd_mobile_auth_profile_setup-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_auth_profile_setup</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_auth_sms_otp-0').onclick = () => injectText(PRDS.prd_mobile_auth_sms_otp, 'prd_mobile_auth_sms_otp');
        document.getElementById('btn-prd-prd_mobile_auth_biometrics-1').onclick = () => injectText(PRDS.prd_mobile_auth_biometrics, 'prd_mobile_auth_biometrics');
        document.getElementById('btn-prd-prd_mobile_auth_social-2').onclick = () => injectText(PRDS.prd_mobile_auth_social, 'prd_mobile_auth_social');
        document.getElementById('btn-prd-prd_mobile_auth_magic_link-3').onclick = () => injectText(PRDS.prd_mobile_auth_magic_link, 'prd_mobile_auth_magic_link');
        document.getElementById('btn-prd-prd_mobile_auth_device_pin-4').onclick = () => injectText(PRDS.prd_mobile_auth_device_pin, 'prd_mobile_auth_device_pin');
        document.getElementById('btn-prd-prd_mobile_auth_session_manager-5').onclick = () => injectText(PRDS.prd_mobile_auth_session_manager, 'prd_mobile_auth_session_manager');
        document.getElementById('btn-prd-prd_mobile_auth_signup_phone-6').onclick = () => injectText(PRDS.prd_mobile_auth_signup_phone, 'prd_mobile_auth_signup_phone');
        document.getElementById('btn-prd-prd_mobile_auth_reauth_modal-7').onclick = () => injectText(PRDS.prd_mobile_auth_reauth_modal, 'prd_mobile_auth_reauth_modal');
        document.getElementById('btn-prd-prd_mobile_auth_consent_screen-8').onclick = () => injectText(PRDS.prd_mobile_auth_consent_screen, 'prd_mobile_auth_consent_screen');
        document.getElementById('btn-prd-prd_mobile_auth_profile_setup-9').onclick = () => injectText(PRDS.prd_mobile_auth_profile_setup, 'prd_mobile_auth_profile_setup');

    }

    setTimeout(createMenu, 3000);
})();
