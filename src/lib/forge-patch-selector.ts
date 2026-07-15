/**
 * ═══════════════════════════════════════════════════════════════
 * FORGE PATCH SELECTOR — Grade Gold
 * Migration from rag_memory.py / task_list.md (Elite Forge Mobile v1.0)
 *
 * Auto-injection engine: analyzes user project descriptions,
 * matches them to relevant extension patches via semantic mapping,
 * and injects patch context into DeepSeek prompts.
 *
 * The system automatically detects features from the user's prompt
 * and selects the appropriate extension packs (auth, payments,
 * real-time, AI, etc.) without manual selection.
 * ═══════════════════════════════════════════════════════════════
 */

import { extractTags } from "./forge-rag";
import type { ProjectConfig } from "./forge-config";

// ─── Types ───────────────────────────────────────────────────

export type PatchSeverity = "critical" | "recommended" | "optional";

export interface PatchDefinition {
  /** Unique identifier for the patch */
  id: string;
  /** Human-readable name */
  name: string;
  /** Brief description of what the patch provides */
  description: string;
  /** Keywords that trigger this patch (matched against user's description) */
  keywords: string[];
  /** Tags that trigger this patch (matched via RAG extractTags) */
  triggerTags: string[];
  /** Priority/severity level */
  severity: PatchSeverity;
  /** Technology stack compatibility (empty means all stacks) */
  compatibleStacks?: string[];
  /** File patterns this patch relates to */
  relatedFiles?: string[];
  /** Category for grouping */
  category: string;
  /** Content to inject into prompts (architecture instructions, code standards, etc.) */
  promptInstructions?: string;
  /** Prerequisites (other patch IDs that must also be selected) */
  dependsOn?: string[];
}

// ─── Patch Catalog ───────────────────────────────────────────
//
// This dictionary maps user intent (via keywords and tags) to
// the specific extension packs that should be auto-injected.
//
// Sources: skills/extensions catalog + task_list.md semantique mapping

const PATCH_CATALOG: PatchDefinition[] = [
  // ── Authentication & Security ───────────────────────────
  {
    id: "auth_mobile_pack",
    name: "Authentication Mobile Pack",
    description: "Complete auth system: login, register, password reset, OAuth, JWT tokens",
    keywords: [
      "login", "auth", "inscription", "connexion", "mot de passe",
      "password", "register", "signup", "signin", "oauth",
      "jwt", "authentification", "authentication", "sso",
    ],
    triggerTags: ["authentication", "security"],
    severity: "critical",
    category: "security",
    promptInstructions: `[PATCH: auth_mobile_pack]
INSTRUCTIONS D'AUTHENTIFICATION OBLIGATOIRES:
- Système complet: Inscription, Connexion, Réinitialisation mot de passe
- JWT tokens avec refresh token (stockage sécurisé)
- OAuth 2.0 providers (Google, Apple, GitHub)
- Rate limiting sur les endpoints d'auth (5 tentatives/minute)
- Validation Zod côté client ET serveur
- Sessions persistées avec SecureStorage
- Middleware de protection des routes privées
- Protection CSRF sur toutes les mutations
- Hash bcrypt pour les mots de passe (salt rounds: 12)`,
  },
  {
    id: "auth_mfa_pack",
    name: "Multi-Factor Authentication",
    description: "Two-factor authentication with TOTP, SMS, or email codes",
    keywords: [
      "2fa", "mfa", "two-factor", "authentification forte",
      "totp", "code verification", "verification code",
    ],
    triggerTags: ["authentication", "security"],
    severity: "optional",
    category: "security",
    dependsOn: ["auth_mobile_pack"],
    promptInstructions: `[PATCH: auth_mfa_pack]
INSTRUCTIONS 2FA:
- Authentification à deux facteurs avec TOTP (RFC 6238)
- QR code pour setup avec Google Authenticator / Authy
- Backup codes (10 codes à usage unique)
- Option SMS/Email comme fallback`,
  },

  // ── Payments & Commerce ─────────────────────────────────
  {
    id: "commerce_payment_pack",
    name: "E-Commerce & Payment Pack",
    description: "Stripe/PayPal integration, product catalog, shopping cart, checkout flow",
    keywords: [
      "paiement", "payment", "stripe", "paypal", "achat",
      "panier", "cart", "checkout", "ecommerce", "e-commerce",
      "boutique", "shop", "store", "commerce", "subscription",
      "abonnement", "facture", "invoice", "pricing", "tarif",
    ],
    triggerTags: ["payment"],
    severity: "critical",
    category: "commerce",
    promptInstructions: `[PATCH: commerce_payment_pack]
INSTRUCTIONS DE PAIEMENT OBLIGATOIRES:
- Intégration Stripe Elements (Card, Ideal, Bancontact)
- Webhook Stripe pour confirmation asynchrone
- États: idle, processing, success, error pour chaque transaction
- Gestion des erreurs: carte refusée, fonds insuffisants, 3D Secure
- Panier persistant (AsyncStorage / SQLite local)
- Calcul des taxes et frais de livraison
- Historique des transactions avec statut visible
- Remboursement et annulation depuis le panneau admin`,
  },
  {
    id: "commerce_pack",
    name: "E-Commerce Core Pack",
    description: "Product catalog, categories, search, inventory management",
    keywords: [
      "catalogue", "catalog", "product", "produit", "inventaire",
      "inventory", "categorie", "category", "recherche", "search",
      "filtre", "filter", "stock",
    ],
    triggerTags: ["payment"],
    severity: "recommended",
    category: "commerce",
    promptInstructions: `[PATCH: commerce_pack]
INSTRUCTIONS E-COMMERCE:
- Catalogue produits avec catégories et sous-catégories
- Recherche full-text avec filtres (prix, catégorie, note)
- Page produit détaillée: images, description, avis, produits similaires
- Gestion des stocks avec alertes basse quantité
- Panier d'achat avec modification des quantités
- Comparaison de produits`,
  },

  // ── Real-time & Communication ───────────────────────────
  {
    id: "realtime_chat_pack",
    name: "Real-time Chat & Messaging",
    description: "WebSocket-based messaging, presence indicators, push notifications",
    keywords: [
      "chat", "messagerie", "message", "temps réel", "realtime",
      "real-time", "websocket", "socket", "notification",
      "push", "presence", "discussion", "conversation",
    ],
    triggerTags: ["websocket"],
    severity: "critical",
    category: "communication",
    promptInstructions: `[PATCH: realtime_chat_pack]
INSTRUCTIONS TEMPS RÉEL OBLIGATOIRES:
- WebSocket avec reconnexion automatique (exponential backoff)
- File d'attente de messages offline avec sync à la reconnexion
- Indicateurs de présence (online/offline/typing...)
- Notifications push pour les messages hors-ligne
- Cryptage de bout en bout pour les messages privés
- Historique des conversations paginé (chunks de 50 messages)
- Support des messages: texte, image, audio, pièce jointe
- Réactions et réponses aux messages`,
  },
  {
    id: "push_notifications_pack",
    name: "Push Notifications",
    description: "Expo Push Notifications, local notifications, scheduling",
    keywords: [
      "notification", "push", "notif", "alert", "rappel",
      "reminder", "notification push",
    ],
    triggerTags: ["mobile"],
    severity: "recommended",
    category: "communication",
    promptInstructions: `[PATCH: push_notifications_pack]
INSTRUCTIONS NOTIFICATIONS:
- Expo Push Notifications avec permissions
- Notifications locales programmées
- Gestion du token push (save/update/delete)
- Deep linking depuis la notification
- Badge count sur l'icône de l'app
- Catégories de notifications (message, rappel, alerte)`,
  },

  // ── Database & Storage ──────────────────────────────────
  {
    id: "database_sqlite_pack",
    name: "SQLite Database Pack",
    description: "Local SQLite database with migrations, relations, and queries",
    keywords: [
      "sqlite", "base de donnees", "database", "bdd",
      "stockage local", "local storage", "persistance",
      "offline", "hors-ligne", "cache",
    ],
    triggerTags: ["database"],
    severity: "critical",
    category: "data",
    promptInstructions: `[PATCH: database_sqlite_pack]
INSTRUCTIONS BASE DE DONNÉES:
- SQLite avec expo-sqlite ou better-sqlite3
- Migrations automatiques avec rollback
- Relations: one-to-many, many-to-many
- Requêtes préparées (protection injection SQL)
- Cache intelligent avec TTL configurable
- Synchronisation offline -> online quand disponible
- Backup automatique de la base`,
  },
  {
    id: "api_rest_pack",
    name: "REST API Integration Pack",
    description: "Axios/fetch client with interceptors, caching, retry logic",
    keywords: [
      "api", "rest", "api rest", "fetch", "axios",
      "endpoint", "crud", "backend",
    ],
    triggerTags: ["api", "http", "rest"],
    severity: "recommended",
    category: "data",
    promptInstructions: `[PATCH: api_rest_pack]
INSTRUCTIONS API REST:
- Client Axios avec intercepteurs (auth token, retry, logging)
- Gestion des erreurs: 4xx, 5xx avec messages explicites
- Cache in-memory avec invalidation automatique
- Retry logic (3 tentatives, exponential backoff)
- Timeout configurable par endpoint
- Type-safe avec TypeScript generics
- Support pagination, tri, filtre côté serveur`,
  },

  // ── UI & Design ─────────────────────────────────────────
  {
    id: "ui_ux_pro_pack",
    name: "UI/UX Professional Pack",
    description: "Advanced animations, transitions, gestures, haptic feedback",
    keywords: [
      "animation", "transition", "gesture", "haptic",
      "ui", "ux", "design", "interface", "animé",
      "smooth", "swipe", "drag", "drop",
    ],
    triggerTags: ["ui"],
    severity: "recommended",
    category: "ui",
    promptInstructions: `[PATCH: ui_ux_pro_pack]
INSTRUCTIONS UI/UX:
- Animations fluides avec Framer Motion / Reanimated
- Gestes: swipe to delete, pull to refresh, drag and drop
- Retour haptique sur les actions importantes
- Skeleton loading pour tous les écrans
- Empty states et error states pour chaque vue
- Transitions d'écran personnalisées
- Design system cohérent (couleurs, typographie, espacement)`,
  },
  {
    id: "dark_mode_pack",
    name: "Dark Mode Pack",
    description: "System-aware dark mode with theme persistence and smooth transitions",
    keywords: [
      "dark mode", "darkmode", "theme", "night", "sombre",
      "light mode", "clair", "thème",
    ],
    triggerTags: ["ui"],
    severity: "optional",
    category: "ui",
    promptInstructions: `[PATCH: dark_mode_pack]
INSTRUCTIONS DARK MODE:
- Détection automatique du thème système (prefers-color-scheme)
- Persistance du choix utilisateur dans SecureStorage
- Transitions fluides entre les thèmes
- Palette complète: light + dark pour chaque composant
- Support des couleurs dynamiques iOS/iOS`,
  },

  // ── AI & Machine Learning ───────────────────────────────
  {
    id: "ai_integration_pack",
    name: "AI Integration Pack",
    description: "DeepSeek/OpenAI API client, streaming responses, prompt templates",
    keywords: [
      "ai", "ia", "intelligence artificielle", "machine learning",
      "deepseek", "openai", "chatgpt", "llm", "gpt",
      "smart", "intelligent", "predictif", "predictive",
    ],
    triggerTags: ["ai", "deepseek", "openai", "machine_learning"],
    severity: "critical",
    category: "ai",
    promptInstructions: `[PATCH: ai_integration_pack]
INSTRUCTIONS IA OBLIGATOIRES:
- Client API avec streaming (Server-Sent Events)
- Gestion des tokens et rate limiting
- Cache des réponses pour les requêtes identiques
- Fallback mode (offline -> résultats mis en cache)
- Templates de prompts avec variables typées
- Streaming UI: typage en temps réel avec indicateur
- Historique des conversations IA avec contexte limité`,
  },

  // ── Maps & Location ─────────────────────────────────────
  {
    id: "maps_location_pack",
    name: "Maps & Location Pack",
    description: "Mapbox/Google Maps integration, geolocation, geocoding, markers",
    keywords: [
      "carte", "map", "maps", "localisation", "location",
      "gps", "geolocalisation", "geolocation", "itineraire",
      "trajet", "navigation", "adresse", "address",
    ],
    triggerTags: ["mobile", "api"],
    severity: "recommended",
    category: "location",
    promptInstructions: `[PATCH: maps_location_pack]
INSTRUCTIONS CARTE & LOCALISATION:
- Intégration carte interactive (Mapbox / Google Maps)
- Marqueurs personnalisés avec infobulles
- Géolocalisation avec permission handling
- Recherche d'adresses (autocomplete)
- Calcul d'itinéraire avec étapes
- Géocodage inverse (coords -> adresse)
- Clustering de marqueurs pour grandes données`,
  },

  // ── Testing & Quality ───────────────────────────────────
  {
    id: "testing_full_pack",
    name: "Testing Suite Pack",
    description: "Unit tests, integration tests, E2E tests with coverage reports",
    keywords: [
      "test", "tests", "testing", "unitaire", "unit",
      "integration", "e2e", "jest", "cypress", "vitest",
      "couverture", "coverage", "tdd",
    ],
    triggerTags: ["testing"],
    severity: "recommended",
    category: "quality",
    promptInstructions: `[PATCH: testing_full_pack]
INSTRUCTIONS TESTS:
- Tests unitaires avec Vitest pour chaque fonction utilitaire
- Tests d'intégration pour les flux métier critiques
- Coverage minimum: 80% (configuré dans vitest.config.ts)
- Mocks des services externes (API, base de données)
- Tests de snapshot pour les composants UI
- Tests E2E avec Detox (mobile) ou Playwright (web)
- Integration CI/CD avec GitHub Actions`,
  },

  // ── Social & Sharing ────────────────────────────────────
  {
    id: "social_share_pack",
    name: "Social Sharing Pack",
    description: "Share to social media, invite friends, referral system",
    keywords: [
      "social", "partage", "share", "invite", "invitation",
      "referral", "parrainage", "amis", "friends",
      "réseau social", "social network", "follow",
    ],
    triggerTags: ["api"],
    severity: "optional",
    category: "social",
    promptInstructions: `[PATCH: social_share_pack]
INSTRUCTIONS SOCIAL:
- Partage vers WhatsApp, Telegram, email, SMS
- Système d'invitation avec code unique
- Lien de parrainage avec suivi des conversions
- Deep linking vers l'application
- Prévisualisation riche des liens partagés (OG tags)`,
  },

  // ── Media & File Handling ───────────────────────────────
  {
    id: "media_upload_pack",
    name: "Media Upload Pack",
    description: "Image/video capture, upload with progress, compression, gallery",
    keywords: [
      "photo", "video", "camera", "image", "upload",
      "telechargement", "gallery", "galerie", "media",
      "fichier", "file", "document", "scan",
    ],
    triggerTags: ["mobile"],
    severity: "recommended",
    category: "media",
    promptInstructions: `[PATCH: media_upload_pack]
INSTRUCTIONS MEDIA:
- Capture photo/video depuis la caméra ou la galerie
- Compression des images avant upload (max 1080px)
- Upload avec barre de progression (resumable)
- Galerie locale avec aperçu et sélection multiple
- Cache des miniatures pour chargement rapide
- Support des formats: JPEG, PNG, HEIC, MP4`,
  },

  // ── Performance & Optimization ──────────────────────────
  {
    id: "performance_pack",
    name: "Performance Optimization Pack",
    description: "Code splitting, lazy loading, image optimization, memoization",
    keywords: [
      "performance", "optimisation", "optimization",
      "rapide", "fast", "lent", "slow", "chargement",
      "loading", "lazy", "code splitting",
    ],
    triggerTags: ["react", "ui"],
    severity: "optional",
    category: "performance",
    promptInstructions: `[PATCH: performance_pack]
INSTRUCTIONS PERFORMANCE:
- React.lazy + Suspense pour le code splitting par route
- Image optimization (format WebP, srcSet responsive)
- useMemo/useCallback sur les calculs coûteux
- Virtual list pour les longues listes (react-window)
- Debounce et throttle sur les entrées utilisateur
- Prefetching des données avant navigation
- Bundle analysis (source-map-explorer)`,
  },

  // ── Accessibility ──────────────────────────────────────
  {
    id: "a11y_pack",
    name: "Accessibility Pack",
    description: "Screen reader support, keyboard navigation, ARIA labels, contrast",
    keywords: [
      "accessibilite", "accessibility", "a11y", "handicap",
      "screen reader", "lecteur d'écran", "contraste",
      "clavier", "keyboard", "aria",
    ],
    triggerTags: ["ui"],
    severity: "optional",
    category: "ui",
    promptInstructions: `[PATCH: a11y_pack]
INSTRUCTIONS ACCESSIBILITÉ:
- Labels ARIA sur tous les éléments interactifs
- Navigation clavier complète (Tab, Enter, Escape)
- Contraste des couleurs minimum WCAG AA (4.5:1)
- Support des lecteurs d'écran (VoiceOver, TalkBack)
- Taille de texte adaptable (Dynamic Type / font scaling)
- Indicateurs de focus visibles
- Messages d'erreur explicites pour les formulaires`,
  },
];

// ─── Helpers ────────────────────────────────────────────────

/**
 * Compute a match score between a project description and a patch.
 * Considers keyword matches, tag matches, and semantic relevance.
 */
function computeMatchScore(
  description: string,
  tags: string[],
  patch: PatchDefinition
): number {
  let score = 0;
  const desc = description.toLowerCase();

  // Keyword matching (direct)
  for (const kw of patch.keywords) {
    if (desc.includes(kw.toLowerCase())) {
      score += 2; // Direct keyword match is weighted higher
    }
  }

  // Tag matching (via RAG extractTags)
  for (const tag of tags) {
    if (patch.triggerTags.includes(tag)) {
      score += 1.5;
    }
  }

  // Bonus for matching multiple tags/keywords
  const matchedKeywords = patch.keywords.filter((kw) =>
    desc.includes(kw.toLowerCase())
  ).length;
  if (matchedKeywords >= 3) score += 1.5; // Strong semantic match bonus
  if (matchedKeywords >= 5) score += 2.0; // Very strong match bonus

  // Bonus for matching the category name itself
  if (desc.includes(patch.category.toLowerCase())) {
    score += 1;
  }

  return score;
}

/**
 * Check if a patch's dependencies are satisfied by the selected patches.
 */
function checkDependencies(
  patchId: string,
  selectedPatchIds: Set<string>,
  catalog: PatchDefinition[]
): boolean {
  const patch = catalog.find((p) => p.id === patchId);
  if (!patch || !patch.dependsOn || patch.dependsOn.length === 0) {
    return true;
  }
  return patch.dependsOn.every((depId) => selectedPatchIds.has(depId));
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Select matching patches based on a project description.
 * Uses semantic keyword matching and RAG tag extraction.
 *
 * @param description - The project description to analyze
 * @param options - Optional filtering options
 * @returns Array of matching PatchDefinition objects
 */
export function selectPatches(
  description: string,
  options?: {
    minScore?: number;
    maxPatches?: number;
    category?: string;
    stack?: string;
    minSeverity?: PatchSeverity;
    catalog?: PatchDefinition[];
  }
): PatchDefinition[] {
  const catalog = options?.catalog || PATCH_CATALOG;
  const minScore = options?.minScore ?? 1.5; // Minimum relevance score
  const maxPatches = options?.maxPatches ?? 10;
  const minSeverity = options?.minSeverity;

  // Extract tags from the description using the RAG engine
  const tags = extractTags(description);

  // Score all patches
  const scored = catalog
    .map((patch) => ({
      patch,
      score: computeMatchScore(description, tags, patch),
    }))
    .filter(({ score }) => score >= minScore)
    .filter(({ patch }) => {
      // Filter by severity if specified
      if (minSeverity === "critical") return patch.severity === "critical";
      if (minSeverity === "recommended")
        return ["critical", "recommended"].includes(patch.severity);
      return true;
    })
    .filter(({ patch }) => {
      // Filter by category if specified
      if (options?.category) return patch.category === options.category;
      return true;
    })
    .filter(({ patch }) => {
      // Filter by stack compatibility if specified
      if (options?.stack && patch.compatibleStacks) {
        return patch.compatibleStacks.includes(options.stack);
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  // Deduplicate and respect dependencies
  const selectedPatchIds = new Set<string>();
  const selectedPatches: PatchDefinition[] = [];

  for (const { patch } of scored) {
    if (selectedPatches.length >= maxPatches) break;
    if (selectedPatchIds.has(patch.id)) continue;

    // Check dependencies
    if (checkDependencies(patch.id, selectedPatchIds, catalog)) {
      selectedPatchIds.add(patch.id);
      selectedPatches.push(patch);

      // Auto-include critical dependencies
      if (patch.dependsOn) {
        for (const depId of patch.dependsOn) {
          if (!selectedPatchIds.has(depId)) {
            const depPatch = catalog.find((p) => p.id === depId);
            if (depPatch) {
              selectedPatchIds.add(depId);
              selectedPatches.push(depPatch);
            }
          }
        }
      }
    }
  }

  return selectedPatches;
}

/**
 * Build an enriched context string by concatenating the instructions
 * of all selected patches.
 *
 * This context is designed to be injected into LLM prompts for
 * Phase 1 (Architecture) and Phase 2 (Code Generation).
 *
 * @param patchIds - Array of patch IDs to include
 * @param catalog - Optional custom patch catalog (uses default if omitted)
 * @returns Concatenated patch instructions string
 */
export function buildPatchContext(
  patchIds: string[],
  catalog?: PatchDefinition[]
): string {
  const patches = (catalog || PATCH_CATALOG).filter((p) =>
    patchIds.includes(p.id)
  );

  if (patches.length === 0) {
    return "";
  }

  const sections: string[] = [];

  // Group patches by category for better organization
  const grouped = patches.reduce(
    (acc, patch) => {
      if (!acc[patch.category]) acc[patch.category] = [];
      acc[patch.category].push(patch);
      return acc;
    },
    {} as Record<string, PatchDefinition[]>
  );

  for (const [category, categoryPatches] of Object.entries(grouped)) {
    sections.push(`[AUTO-SELECTED PATCHES — Category: ${category.toUpperCase()}]`);

    for (const patch of categoryPatches) {
      sections.push(`\n### ${patch.name} (${patch.severity.toUpperCase()})`);
      sections.push(`Description: ${patch.description}`);

      if (patch.promptInstructions) {
        sections.push(patch.promptInstructions);
      }
    }

    sections.push("");
  }

  const context = sections.join("\n");
  console.log(
    `[PATCH SELECTOR] Context built: ${patches.length} patches selected across ${Object.keys(grouped).length} categories.`
  );

  return context;
}

/**
 * High-level function: given a project config/description, select patches
 * and build the full context for LLM injection.
 *
 * This is the main entry point used by the pipeline.
 *
 * @param description - The project description to analyze
 * @param config - Optional full ProjectConfig for additional context
 * @returns Object with selected patches and their concatenated context
 */
export function autoSelectAndBuildContext(
  description: string,
  config?: Partial<ProjectConfig>
): {
  selectedPatches: PatchDefinition[];
  patchContext: string;
  patchIds: string[];
} {
  const selected = selectPatches(description, {
    minScore: config?.features?.length ? 1.0 : 1.5,
    stack: config?.stack,
  });

  const patchIds = selected.map((p) => p.id);
  const patchContext = buildPatchContext(patchIds);

  return {
    selectedPatches: selected,
    patchContext,
    patchIds,
  };
}

/**
 * Get all available patches in the catalog, optionally filtered.
 *
 * @param options - Filtering options
 * @returns Array of PatchDefinition objects
 */
export function getAvailablePatches(options?: {
  category?: string;
  severity?: PatchSeverity;
  stack?: string;
}): PatchDefinition[] {
  let patches = [...PATCH_CATALOG];

  if (options?.category) {
    patches = patches.filter((p) => p.category === options.category);
  }
  if (options?.severity) {
    patches = patches.filter((p) => p.severity === options.severity);
  }
  if (options?.stack) {
    patches = patches.filter(
      (p) => !p.compatibleStacks || p.compatibleStacks.includes(options.stack)
    );
  }

  return patches;
}

/**
 * Get patches grouped by category.
 * Useful for UI display and manual patch selection.
 */
export function getPatchesByCategory(): Record<string, PatchDefinition[]> {
  const grouped: Record<string, PatchDefinition[]> = {};

  for (const patch of PATCH_CATALOG) {
    if (!grouped[patch.category]) {
      grouped[patch.category] = [];
    }
    grouped[patch.category].push(patch);
  }

  return grouped;
}

/**
 * Analyze a project description and return a summary of auto-detected features
 * with the patches that will be applied.
 */
export function analyzeProjectDescription(
  description: string
): {
  detectedFeatures: string[];
  selectedPatches: { id: string; name: string; severity: PatchSeverity; category: string }[];
  matchDetails: { keyword: string; matchedTo: string }[];
} {
  const tags = extractTags(description);
  const selected = selectPatches(description);
  const desc = description.toLowerCase();

  // Build match details for transparency
  const matchDetails: { keyword: string; matchedTo: string }[] = [];

  for (const patch of selected) {
    for (const kw of patch.keywords) {
      if (desc.includes(kw.toLowerCase())) {
        matchDetails.push({
          keyword: kw,
          matchedTo: patch.name,
        });
        break; // One keyword per patch is enough for the summary
      }
    }
  }

  return {
    detectedFeatures: tags,
    selectedPatches: selected.map((p) => ({
      id: p.id,
      name: p.name,
      severity: p.severity,
      category: p.category,
    })),
    matchDetails,
  };
}
