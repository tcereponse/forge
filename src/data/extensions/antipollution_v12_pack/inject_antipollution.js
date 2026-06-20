(function() {
    'use strict';
    
    const ANTIPOLLUTION = `[CONTEXTE CACHÉ - MODULE ANTIPOLLUTION DIAMOND V13 - GRADE SOUVERAIN]
Tu es équipé du module de sécurité ANTIPOLLUTION V13. Ta génération doit être SYNTAXIQUEMENT PARFAITE et DIRECTEMENT COMPILABLE.

🚫 RÈGLES D'INTERDICTION ABSOLUES (ZERO TOLÉRANCE) :

— POLLUTION DE MARQUEURS —
1. NE JAMAIS écrire 'json{', 'typescriptimport', 'yamlpackages', 'markdown#' au début d'un fichier.
2. NE JAMAIS entourer le code de blocs \`\`\` (backticks markdown).
3. NE JAMAIS tronquer le code (Zéro placeholder, Zéro commentaire "...").

— POLLUTION DES MOT-CLÉS JAVASCRIPT/TYPESCRIPT (CRITIQUE) —
4. NE JAMAIS tronquer le mot-clé 'import'. Écris TOUJOURS le mot 'import' en entier.
   ❌ INTERDIT : t React from 'react';
   ❌ INTERDIT : t { useState } from 'react';
   ❌ INTERDIT : port React from 'react';
   ✅ CORRECT  : import React from 'react';
   ✅ CORRECT  : import { useState } from 'react';

5. NE JAMAIS tronquer les mots-clés 'export', 'const', 'function', 'class', 'let', 'return'.
   ❌ INTERDIT : t default function App()
   ✅ CORRECT  : export default function App()

— POLLUTION DES EXTENSIONS DE FICHIERS (CRITIQUE) —
6. TOUJOURS utiliser l'extension .tsx (et NON .ts) pour les fichiers contenant du JSX (balises <...>).
   ❌ INTERDIT : Button.ts (si le fichier contient du JSX)
   ✅ CORRECT  : Button.tsx

💎 FORMAT DE GÉNÉRATION OBLIGATOIRE :
FILE: src/components/Button.tsx
import React from 'react';
// ... reste du code pur, sans aucun caractère superflu au début

[FIN DU CONTEXTE CACHÉ - ANTIPOLLUTION V13]`;

    const VALIDATION_RULES = [
        { pattern: /^t\s+\w/m, fix: 'import ', label: 'Import tronqué (t X)' },
        { pattern: /^t\s*\{/m, fix: 'import {', label: 'Import tronqué (t {)' },
        { pattern: /^port\s+\w/m, fix: 'import ', label: 'Import tronqué (port X)' },
        { pattern: /^(?:json|typescript|javascript|tsx|ts|jsx)\s*[\{\n]/mi, fix: '', label: 'Tag de langage en début de fichier' },
    ];

    function injectText(text) {
        const selectors = [
            'textarea',
            '[contenteditable="true"]',
            '#chat-input',
            'div[role="textbox"]'
        ];
        let input = null;
        for (const sel of selectors) {
            input = document.querySelector(sel);
            if (input) break;
        }
        if (input) {
            const currentVal = input.value || input.innerText || '';
            if (input.value !== undefined) {
                input.value = text + "\n\n" + currentVal;
            } else {
                input.innerText = text + "\n\n" + currentVal;
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            console.log("🛡️ ANTIPOLLUTION V13 Diamond injecté avec succès.");
        } else {
            console.warn("🛡️ ANTIPOLLUTION V13: Champ de saisie non trouvé, réessai dans 3s...");
            setTimeout(() => injectText(text), 3000);
        }
    }

    // Auto-injection au chargement
    setTimeout(() => injectText(ANTIPOLLUTION), 2500);

    // Validation post-réponse IA (scan des réponses générées)
    const observer = new MutationObserver(() => {
        const responses = document.querySelectorAll('[class*="markdown"], [class*="message"], [class*="response"]');
        responses.forEach(el => {
            const codeBlocks = el.querySelectorAll('code, pre');
            codeBlocks.forEach(block => {
                VALIDATION_RULES.forEach(rule => {
                    if (rule.pattern.test(block.innerText)) {
                        block.style.border = '2px solid #ff4444';
                        block.setAttribute('title', `⚠️ ANTIPOLLUTION V13 : ${rule.label} détecté !`);
                    }
                });
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log("🛡️ ANTIPOLLUTION V13 Diamond : Observateur actif.");
})();
