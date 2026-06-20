(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_form_wizard: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_WIZARD]
MISSION: Formulaire multi‑écran (wizard mobile).
STYLE & DESIGN: Next/back nav, progress.
MAPPING VFS: FormWizardScreen.tsx, StepDots.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_keyboard_aware: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_KEYBOARD_AWARE]
MISSION: Container keyboard‑aware (scroll + avoid).
STYLE & DESIGN: Smooth scroll to input.
MAPPING VFS: KeyboardAware.tsx, FieldWrapper.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_address: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_ADDRESS]
MISSION: Formulaire adresse avec auto‑complétion.
STYLE & DESIGN: Map preview optional.
MAPPING VFS: AddressFormMobile.tsx, AddressAutocomplete.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_payment: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_PAYMENT]
MISSION: Flow paiement CB mobile.
STYLE & DESIGN: Card input, Braintree/Stripe UI.
MAPPING VFS: MobileCardForm.tsx, PaymentSummary.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_date_time: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_DATE_TIME]
MISSION: Date/heure picker mobile‑friendly.
STYLE & DESIGN: iOS/Android pickers.
MAPPING VFS: DateTimePicker.tsx, SlotSelector.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_stepper_input: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_STEPPER_INPUT]
MISSION: Inputs avec stepper (quantité, temps).
STYLE & DESIGN: + / − buttons.
MAPPING VFS: StepperInput.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_rating: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_RATING]
MISSION: Rating UX (étoiles, smileys).
STYLE & DESIGN: Centered, large tap areas.
MAPPING VFS: RatingPicker.tsx, EmojiScale.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_tags_picker: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_TAGS_PICKER]
MISSION: Sélecteur de tags multi‑sélection.
STYLE & DESIGN: Chips multi‑line.
MAPPING VFS: TagPickerMobile.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_search_bar: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_SEARCH_BAR]
MISSION: Barre de recherche avec suggestions.
STYLE & DESIGN: Debounced, highlight terms.
MAPPING VFS: SearchBarMobile.tsx, SuggestionList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_form_signature: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_FORM_SIGNATURE]
MISSION: Capture signature tactile.
STYLE & DESIGN: Canvas simple + clear.
MAPPING VFS: SignaturePad.tsx, SignaturePreview.tsx
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
        if(document.getElementById('forms_inputs_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'forms_inputs_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #00FF88; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#00FF88;">📦 Forms & Inputs Pack</h3>
            <button id="btn-prd-prd_mobile_form_wizard-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_wizard</button>
            <button id="btn-prd-prd_mobile_form_keyboard_aware-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_keyboard_aware</button>
            <button id="btn-prd-prd_mobile_form_address-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_address</button>
            <button id="btn-prd-prd_mobile_form_payment-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_payment</button>
            <button id="btn-prd-prd_mobile_form_date_time-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_date_time</button>
            <button id="btn-prd-prd_mobile_form_stepper_input-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_stepper_input</button>
            <button id="btn-prd-prd_mobile_form_rating-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_rating</button>
            <button id="btn-prd-prd_mobile_form_tags_picker-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_tags_picker</button>
            <button id="btn-prd-prd_mobile_form_search_bar-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_search_bar</button>
            <button id="btn-prd-prd_mobile_form_signature-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #00FF88; color:#00FF88; cursor:pointer; border-radius:5px;">🚀 prd_mobile_form_signature</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_form_wizard-0').onclick = () => injectText(PRDS.prd_mobile_form_wizard, 'prd_mobile_form_wizard');
        document.getElementById('btn-prd-prd_mobile_form_keyboard_aware-1').onclick = () => injectText(PRDS.prd_mobile_form_keyboard_aware, 'prd_mobile_form_keyboard_aware');
        document.getElementById('btn-prd-prd_mobile_form_address-2').onclick = () => injectText(PRDS.prd_mobile_form_address, 'prd_mobile_form_address');
        document.getElementById('btn-prd-prd_mobile_form_payment-3').onclick = () => injectText(PRDS.prd_mobile_form_payment, 'prd_mobile_form_payment');
        document.getElementById('btn-prd-prd_mobile_form_date_time-4').onclick = () => injectText(PRDS.prd_mobile_form_date_time, 'prd_mobile_form_date_time');
        document.getElementById('btn-prd-prd_mobile_form_stepper_input-5').onclick = () => injectText(PRDS.prd_mobile_form_stepper_input, 'prd_mobile_form_stepper_input');
        document.getElementById('btn-prd-prd_mobile_form_rating-6').onclick = () => injectText(PRDS.prd_mobile_form_rating, 'prd_mobile_form_rating');
        document.getElementById('btn-prd-prd_mobile_form_tags_picker-7').onclick = () => injectText(PRDS.prd_mobile_form_tags_picker, 'prd_mobile_form_tags_picker');
        document.getElementById('btn-prd-prd_mobile_form_search_bar-8').onclick = () => injectText(PRDS.prd_mobile_form_search_bar, 'prd_mobile_form_search_bar');
        document.getElementById('btn-prd-prd_mobile_form_signature-9').onclick = () => injectText(PRDS.prd_mobile_form_signature, 'prd_mobile_form_signature');

    }

    setTimeout(createMenu, 3000);
})();
