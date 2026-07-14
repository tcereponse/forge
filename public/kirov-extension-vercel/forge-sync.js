/**
 * forge-sync.js — Synchronise le token GitHub depuis l'extension vers le Forge
 *
 * Ce script s'injecte sur forge-kohl-kappa.vercel.app et:
 * 1. Lit le token GitHub depuis chrome.storage.local
 * 2. L'écrit dans window.localStorage('github_token')
 * 3. Ainsi les boutons Cloud Forge du PreviewPanel peuvent l'utiliser
 *
 * S'exécute automatiquement à chaque visite du Forge.
 */

(async function() {
    try {
        const result = await chrome.storage.local.get(['github_token', 'github_repo']);
        const token = result.github_token;
        const repo = result.github_repo;

        if (token) {
            // Sync token to localStorage (Forge buttons use this)
            window.localStorage.setItem('github_token', token);
            console.log('[KIROV3-FORGE] Token GitHub synchronisé vers localStorage ✅');
        } else {
            console.log('[KIROV3-FORGE] Aucun token GitHub dans l\'extension — configure-le dans le popup');
        }

        if (repo) {
            window.localStorage.setItem('github_repo', repo);
        }
    } catch (e) {
        console.error('[KIROV3-FORGE] Erreur sync token:', e);
    }
})();
