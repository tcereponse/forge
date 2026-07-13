// forge-scaffolder.ts — Deterministic feature templates for the Gold Grade pipeline.
//
// Phase 2 of the Gold Grade Industrial plan: generates reusable feature folders
// (auth, crud, dashboard, filters) that the pipeline can inject deterministically
// (no LLM round-trip) for guaranteed senior-engineer-grade output on common
// feature shapes. Each template ships with:
//   - typed Zod schemas + interfaces
//   - repository pattern with in-memory mock data
//   - TanStack Query hooks (queries + mutations)
//   - Tailwind components handling loading / error / empty / success states
//
// Import types from ./forge-config so the rest of the forge can consume the
// generated files uniformly.

import type { ProjectConfig, GeneratedFile } from "./forge-config";

// ─── Public types ────────────────────────────────────────────────────────────

export interface FeatureTemplate {
  id: string;
  name: string;
  description: string;
  detect: (config: { description: string; features: string[] }) => boolean;
  generateFiles: (featureName: string, config: ProjectConfig) => GeneratedFile[];
}

export interface DetectInput {
  description: string;
  features: string[];
}

// ─── Naming helpers ──────────────────────────────────────────────────────────

/** Plural slug ("tasks") → singular ("task"). Conservative English heuristic. */
export function singularize(name: string): string {
  if (name.length === 0) return "item";
  if (name.endsWith("ies") && name.length > 3) return name.slice(0, -3) + "y"; // recipes → recipe, cities → city
  if (name.endsWith("sses")) return name.slice(0, -2); // addresses → address, classes → class
  if (name.endsWith("xes")) return name.slice(0, -2); // boxes → box
  if (name.endsWith("shes")) return name.slice(0, -2); // wishes → wish
  if (name.endsWith("ches")) return name.slice(0, -2); // churches → church
  if (name.endsWith("zes")) return name.slice(0, -2); // buzzes → buzz
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1); // tasks → task, expenses → expense
  return name;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/** Slug ("tasks" | "shopping-items") → singular PascalCase ("Task" | "ShoppingItem"). */
export function toPascalCase(name: string): string {
  const parts = name.split(/[-_\s]+/).filter(Boolean);
  if (parts.length === 0) return "Item";
  const head = parts.slice(0, -1).map(capitalize);
  const tail = capitalize(singularize(parts[parts.length - 1]));
  return [...head, tail].join("");
}

/** CamelCase from a slug ("tasks" → "tasks", "shopping-items" → "shoppingItems"). */
export function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ─── CRUD entity detection ────────────────────────────────────────────────────

const CRUD_KEYWORDS: ReadonlyArray<{ pattern: RegExp; entity: string }> = [
  // Order matters: more specific patterns first so ambiguous words like
  // "carnet de liens" do not get matched as notes (only "carnet de notes" does).
  { pattern: /t[âa]che|task|todo/i, entity: "tasks" },
  { pattern: /recette|recipe/i, entity: "recipes" },
  { pattern: /\bnotes?\b/i, entity: "notes" },
  { pattern: /d[ée]pense|expense|spending|budget/i, entity: "expenses" },
  { pattern: /\bcontact|adresse|address\b/i, entity: "contacts" },
  { pattern: /course|shopping|panier|cart/i, entity: "items" },
  { pattern: /projet|project/i, entity: "projects" },
  { pattern: /client|customer/i, entity: "customers" },
  { pattern: /produit|product/i, entity: "products" },
  { pattern: /[ée]v[ée]nement|event|rendez-vous|appointment/i, entity: "events" },
  { pattern: /r[ée]servation|booking|reservation/i, entity: "bookings" },
  { pattern: /\blien|link|bookmark|favori/i, entity: "bookmarks" },
  { pattern: /article|post|blog/i, entity: "posts" },
  { pattern: /habit|v[êe]tement|clothing|wardrobe/i, entity: "clothing" },
  { pattern: /boisson|drink|cocktail/i, entity: "drinks" },
];

/** Guess the primary CRUD entity (plural slug) from the project description. */
export function deriveCrudEntityName(config: ProjectConfig): string {
  for (const { pattern, entity } of CRUD_KEYWORDS) {
    if (pattern.test(config.description)) return entity;
  }
  return "items";
}

// ─── AUTH feature ─────────────────────────────────────────────────────────────

function detectAuth({ description, features }: DetectInput): boolean {
  if (features.includes("auth")) return true;
  return /auth|login|connexion|inscription|compte|sign[ -]?in|sign[ -]?up/i.test(description);
}

function authFiles(_featureName: string, _config: ProjectConfig): GeneratedFile[] {
  return [
    {
      path: "src/features/auth/types.ts",
      language: "typescript",
      content: `import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  createdAt: z.string().datetime(),
})

export const loginInputSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court (8 caracteres minimum)'),
})

export const registerInputSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Mot de passe trop court')
    .regex(/[A-Z]/, 'Une majuscule est requise')
    .regex(/[0-9]/, 'Un chiffre est requis'),
})

export type User = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
export type RegisterInput = z.infer<typeof registerInputSchema>

export interface AuthSession {
  user: User
  token: string
  expiresAt: string
}
`,
    },
    {
      path: "src/features/auth/api/auth-repository.ts",
      language: "typescript",
      content: `import type { User, LoginInput, RegisterInput, AuthSession } from '../types'

/**
 * AuthRepository - in-memory mock. Replace the body of each method with real
 * HTTP calls when wiring a backend; the public signature stays the same so
 * hooks and components do not change.
 */
const LATENCY_MS = 250
const TOKEN_PREFIX = 'mock-token-'
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

interface StoredUser extends User {
  password: string
}

const users = new Map<string, StoredUser>([
  [
    'demo@forge.dev',
    {
      id: '1',
      email: 'demo@forge.dev',
      name: 'Demo User',
      avatarUrl: null,
      role: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
      password: 'password123',
    },
  ],
])

const sessions = new Map<string, AuthSession>()
let nextUserId = 2

function toPublicUser(u: StoredUser): User {
  const { password: _password, ...publicUser } = u
  void _password
  return publicUser
}

export class AuthRepository {
  async login(input: LoginInput): Promise<AuthSession> {
    await wait(LATENCY_MS)
    const found = users.get(input.email.toLowerCase())
    if (!found || found.password !== input.password) {
      throw new Error('Email ou mot de passe invalide')
    }
    return this.createSession(found)
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    await wait(LATENCY_MS)
    const email = input.email.toLowerCase()
    if (users.has(email)) {
      throw new Error('Un compte existe deja avec cet email')
    }
    const user: StoredUser = {
      id: String(nextUserId++),
      email,
      name: input.name,
      avatarUrl: null,
      role: 'user',
      createdAt: new Date().toISOString(),
      password: input.password,
    }
    users.set(email, user)
    return this.createSession(user)
  }

  async me(token: string): Promise<User> {
    await wait(LATENCY_MS)
    const session = sessions.get(token)
    if (!session) throw new Error('Session invalide ou expiree')
    return session.user
  }

  async logout(token: string): Promise<void> {
    await wait(LATENCY_MS)
    sessions.delete(token)
  }

  private createSession(user: StoredUser): AuthSession {
    const token = TOKEN_PREFIX + user.id + '-' + Date.now()
    const session: AuthSession = {
      user: toPublicUser(user),
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
    sessions.set(token, session)
    return session
  }
}

export const authRepository = new AuthRepository()
`,
    },
    {
      path: "src/features/auth/hooks/use-auth.ts",
      language: "typescript",
      content: `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authRepository } from '../api/auth-repository'
import type { User, LoginInput, RegisterInput } from '../types'

const STORAGE_KEY = 'forge.auth.token'
const ME_QUERY_KEY = ['auth', 'me'] as const

function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable (private mode, SSR) */
  }
}

export interface UseAuthResult {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  loginError: Error | null
  registerError: Error | null
  isLoggingIn: boolean
  isRegistering: boolean
  isLoggingOut: boolean
}

export function useAuth(): UseAuthResult {
  const queryClient = useQueryClient()
  const token = getToken()

  const me = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => authRepository.me(token ?? ''),
    enabled: Boolean(token),
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authRepository.login(input),
    onSuccess: (session) => {
      setToken(session.token)
      queryClient.setQueryData(ME_QUERY_KEY, session.user)
    },
  })

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authRepository.register(input),
    onSuccess: (session) => {
      setToken(session.token)
      queryClient.setQueryData(ME_QUERY_KEY, session.user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authRepository.logout(token ?? ''),
    onSettled: () => {
      setToken(null)
      queryClient.setQueryData(ME_QUERY_KEY, null)
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
    },
  })

  return {
    user: me.data ?? null,
    isLoading: me.isLoading,
    isAuthenticated: Boolean(me.data),
    login: async (input) => {
      await loginMutation.mutateAsync(input)
    },
    register: async (input) => {
      await registerMutation.mutateAsync(input)
    },
    logout: async () => {
      await logoutMutation.mutateAsync()
    },
    loginError: loginMutation.error instanceof Error ? loginMutation.error : null,
    registerError: registerMutation.error instanceof Error ? registerMutation.error : null,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}
`,
    },
    {
      path: "src/features/auth/components/LoginForm.tsx",
      language: "tsx",
      content: `import { useState } from 'react'
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAuth } from '../hooks/use-auth'
import type { LoginInput } from '../types'

export interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
  className?: string
}

export function LoginForm({ onSuccess, onSwitchToRegister, className }: LoginFormProps) {
  const { login, isLoggingIn, loginError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    if (!email.includes('@')) {
      setValidationError('Email invalide')
      return
    }
    if (password.length < 8) {
      setValidationError('Mot de passe trop court (8 caracteres minimum)')
      return
    }
    const input: LoginInput = { email, password }
    try {
      await login(input)
      onSuccess?.()
    } catch {
      /* surfaced via loginError */
    }
  }

  const error = validationError ?? (loginError ? loginError.message : null)

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        'space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm',
        className
      )}
    >
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">Connexion</h2>
        <p className="text-sm text-muted-foreground">Accedez a votre compte</p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Email</span>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Mot de passe</span>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>
      </label>

      <button
        type="submit"
        disabled={isLoggingIn}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingIn ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden="true" />
        )}
        {isLoggingIn ? 'Connexion...' : 'Se connecter'}
      </button>

      {onSwitchToRegister && (
        <p className="text-center text-sm text-muted-foreground">
          Pas de compte ?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-primary hover:underline"
          >
            Creer un compte
          </button>
        </p>
      )}
    </form>
  )
}

export default LoginForm
`,
    },
    {
      path: "src/features/auth/components/RegisterForm.tsx",
      language: "tsx",
      content: `import { useState } from 'react'
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAuth } from '../hooks/use-auth'
import type { RegisterInput } from '../types'

export interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
  className?: string
}

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8 caracteres minimum' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Une majuscule' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Un chiffre' },
]

export function RegisterForm({ onSuccess, onSwitchToLogin, className }: RegisterFormProps) {
  const { register, isRegistering, registerError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    if (name.trim().length < 2) {
      setValidationError('Nom trop court')
      return
    }
    if (!email.includes('@')) {
      setValidationError('Email invalide')
      return
    }
    const failed = PASSWORD_RULES.find((r) => !r.test(password))
    if (failed) {
      setValidationError(failed.label)
      return
    }
    const input: RegisterInput = { name: name.trim(), email, password }
    try {
      await register(input)
      onSuccess?.()
    } catch {
      /* surfaced via registerError */
    }
  }

  const error = validationError ?? (registerError ? registerError.message : null)

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        'space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm',
        className
      )}
    >
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">Inscription</h2>
        <p className="text-sm text-muted-foreground">Creez votre compte en quelques secondes</p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Nom</span>
        <div className="relative">
          <User
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Email</span>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Mot de passe</span>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            required
          />
        </div>
        <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(password)
            return (
              <li key={rule.label} className={ok ? 'text-emerald-600' : undefined}>
                {ok ? '\u2713' : '\u2022'} {rule.label}
              </li>
            )
          })}
        </ul>
      </label>

      <button
        type="submit"
        disabled={isRegistering}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRegistering ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        )}
        {isRegistering ? 'Creation...' : 'Creer mon compte'}
      </button>

      {onSwitchToLogin && (
        <p className="text-center text-sm text-muted-foreground">
          Deja un compte ?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:underline"
          >
            Se connecter
          </button>
        </p>
      )}
    </form>
  )
}

export default RegisterForm
`,
    },
    {
      path: "src/features/auth/components/UserMenu.tsx",
      language: "tsx",
      content: `import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, User as UserIcon, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAuth } from '../hooks/use-auth'

export interface UserMenuProps {
  className?: string
  onLoggedOut?: () => void
}

export function UserMenu({ className, onLoggedOut }: UserMenuProps) {
  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Chargement...</span>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')

  const handleLogout = async () => {
    await logout()
    setOpen(false)
    onLoggedOut?.()
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm text-foreground transition hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials || <UserIcon className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{user.name}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border border-border bg-background p-1 shadow-md"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-1 flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
`,
    },
    {
      path: "src/features/auth/index.ts",
      language: "typescript",
      content: `export * from './types'
export * from './api/auth-repository'
export * from './hooks/use-auth'
export { LoginForm } from './components/LoginForm'
export { RegisterForm } from './components/RegisterForm'
export { UserMenu } from './components/UserMenu'
export { default as LoginFormDefault } from './components/LoginForm'
export { default as RegisterFormDefault } from './components/RegisterForm'
export { default as UserMenuDefault } from './components/UserMenu'
`,
    },
  ];
}

// ─── CRUD feature (generic) ───────────────────────────────────────────────────

function detectCrud({ description, features }: DetectInput): boolean {
  if (features.some((f) => f === "crud")) return true;
  return /gestion|gestion de|liste|carnet|tracker|tracker de|inventaire|catalogue/i.test(
    description
  );
}

interface CrudNames {
  /** Plural slug, used for folder + file names ("tasks"). */
  plural: string;
  /** Singular slug ("task"). */
  singular: string;
  /** PascalCase singular ("Task") — used for type names + component suffixes. */
  entity: string;
  /** Plural PascalCase ("Tasks") — used for collection component suffixes. */
  entityPlural: string;
  /** Plural camelCase ("tasks") — used for hook names (useTasks). */
  camelPlural: string;
  /** Singular camelCase ("task") — used for hook names (useTask). */
  camelSingular: string;
  /** Human label for one record ("une tache"). */
  labelOne: string;
  /** Human label for many records ("des taches"). */
  labelMany: string;
}

function buildCrudNames(featureName: string): CrudNames {
  const plural = featureName;
  const singular = singularize(plural);
  const entity = toPascalCase(plural);
  const entityPlural = entity + (entity.endsWith("s") ? "" : "s");
  const camelPlural = toCamelCase(plural);
  const camelSingular = toCamelCase(singular);
  return {
    plural,
    singular,
    entity,
    entityPlural,
    camelPlural,
    camelSingular,
    labelOne: singular,
    labelMany: plural,
  };
}

function crudFiles(featureName: string, _config: ProjectConfig): GeneratedFile[] {
  const n = buildCrudNames(featureName);
  const cap = n.entity; // e.g. "Task"
  const lower = n.plural; // e.g. "tasks"
  const entityPlural = n.entityPlural; // e.g. "Tasks"
  const useList = "use" + entityPlural; // useTasks
  const useOne = "use" + cap; // useTask
  const useCreate = "useCreate" + cap;
  const useUpdate = "useUpdate" + cap;
  const useDelete = "useDelete" + cap;
  const repoClass = cap + "Repository";
  const repoInstance = lower + "Repository";
  const queryKeyList = "['" + lower + "']";

  return [
    {
      path: "src/features/" + lower + "/types.ts",
      language: "typescript",
      content: `import { z } from 'zod'

export const ${n.singular}Schema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  status: z.enum(['active', 'done', 'archived']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const create${cap}InputSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().default(''),
  status: z.enum(['active', 'done', 'archived']).default('active'),
})

export const update${cap}InputSchema = create${cap}InputSchema.partial()

export type ${cap} = z.infer<typeof ${n.singular}Schema>
export type Create${cap}Input = z.infer<typeof create${cap}InputSchema>
export type Update${cap}Input = z.infer<typeof update${cap}InputSchema>
export type ${cap}Status = ${cap}['status']
`,
    },
    {
      path: "src/features/" + lower + "/api/" + lower + "-repository.ts",
      language: "typescript",
      content: `import type { ${cap}, Create${cap}Input, Update${cap}Input } from '../types'

/**
 * ${repoClass} - in-memory mock with seed data. Swap the storage for a real
 * HTTP client (fetch / axios); the public contract stays the same so hooks and
 * components do not change.
 */
const LATENCY_MS = 200
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function now(): string {
  return new Date().toISOString()
}

const seed: ${cap}[] = [
  {
    id: '1',
    title: '${cap} exemple',
    description: 'Un exemple de ${n.labelOne} pour demarrer.',
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '2',
    title: 'Autre ${n.labelOne}',
    description: 'Description optionnelle.',
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '3',
    title: '${cap} termine(e)',
    description: 'Marque(e) comme termine(e).',
    status: 'done',
    createdAt: now(),
    updatedAt: now(),
  },
]

export class ${repoClass} {
  private items: ${cap}[] = seed.map((x) => ({ ...x }))
  private nextId = 4

  async list(): Promise<${cap}[]> {
    await wait(LATENCY_MS)
    return [...this.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async get(id: string): Promise<${cap}> {
    await wait(LATENCY_MS)
    const found = this.items.find((i) => i.id === id)
    if (!found) throw new Error('${cap} introuvable: ' + id)
    return { ...found }
  }

  async create(input: Create${cap}Input): Promise<${cap}> {
    await wait(LATENCY_MS)
    const created: ${cap} = {
      id: String(this.nextId++),
      title: input.title,
      description: input.description ?? '',
      status: input.status ?? 'active',
      createdAt: now(),
      updatedAt: now(),
    }
    this.items = [created, ...this.items]
    return created
  }

  async update(id: string, input: Update${cap}Input): Promise<${cap}> {
    await wait(LATENCY_MS)
    const idx = this.items.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error('${cap} introuvable: ' + id)
    const updated: ${cap} = {
      ...this.items[idx],
      ...input,
      id: this.items[idx].id,
      updatedAt: now(),
    } as ${cap}
    this.items[idx] = updated
    return { ...updated }
  }

  async delete(id: string): Promise<void> {
    await wait(LATENCY_MS)
    const idx = this.items.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error('${cap} introuvable: ' + id)
    this.items.splice(idx, 1)
  }
}

export const ${repoInstance} = new ${repoClass}()
`,
    },
    {
      path: "src/features/" + lower + "/hooks/use-" + lower + ".ts",
      language: "typescript",
      content: `import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { ${repoInstance} } from '../api/${lower}-repository'
import type { ${cap}, Create${cap}Input, Update${cap}Input } from '../types'

const LIST_KEY = ${queryKeyList}
const ONE_KEY = (id: string) => ['${lower}', id] as const

export function ${useList}<TData = ${cap}[]>(
  options?: Omit<UseQueryOptions<${cap}[], Error, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery<${cap}[], Error, TData>({
    queryKey: LIST_KEY,
    queryFn: () => ${repoInstance}.list(),
    ...options,
  })
}

export function ${useOne}(id: string | undefined) {
  return useQuery({
    queryKey: ONE_KEY(id ?? ''),
    queryFn: () => ${repoInstance}.get(id as string),
    enabled: Boolean(id),
  })
}

export function ${useCreate}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Create${cap}Input) => ${repoInstance}.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function ${useUpdate}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Update${cap}Input }) =>
      ${repoInstance}.update(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(ONE_KEY(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function ${useDelete}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ${repoInstance}.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
`,
    },
    {
      path: "src/features/" + lower + "/components/" + entityPlural + "List.tsx",
      language: "tsx",
      content: `import { Loader2, AlertCircle, Plus, Inbox } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ${useList} } from '../hooks/use-${lower}'
import { ${cap}Item } from './${cap}Item'
import type { ${cap} } from '../types'

export interface ${entityPlural}ListProps {
  onCreate?: () => void
  onSelect?: (item: ${cap}) => void
  className?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function ${entityPlural}List({
  onCreate,
  onSelect,
  className,
  emptyTitle,
  emptyDescription,
}: ${entityPlural}ListProps) {
  const { data: items, isLoading, error, refetch, isFetching } = ${useList}()

  if (isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center gap-2 py-12 text-muted-foreground', className)}
        role="status"
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>Chargement des ${n.labelMany}...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn('rounded-md border border-destructive/30 bg-destructive/10 p-4', className)}
        role="alert"
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <p className="font-medium">Erreur de chargement</p>
        </div>
        <p className="mt-1 text-sm text-destructive/80">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive transition hover:bg-destructive/10"
        >
          Reessayer
        </button>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-12 text-center',
          className
        )}
      >
        <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">
            {emptyTitle ?? 'Aucun(e) ${n.labelOne}'}
          </p>
          <p className="text-sm text-muted-foreground">
            {emptyDescription ?? 'Commencez par creer votre premiere entree.'}
          </p>
        </div>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {isFetching && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          Synchronisation...
        </p>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <${cap}Item item={item} onSelect={onSelect ? () => onSelect(item) : undefined} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ${entityPlural}List
`,
    },
    {
      path: "src/features/" + lower + "/components/" + cap + "Form.tsx",
      language: "tsx",
      content: `import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, Save, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ${useCreate}, ${useUpdate} } from '../hooks/use-${lower}'
import type { ${cap}, Create${cap}Input, Update${cap}Input } from '../types'

export interface ${cap}FormProps {
  /** When provided, the form switches to edit mode. */
  item?: ${cap}
  onSubmitted?: (item: ${cap}) => void
  onCancel?: () => void
  className?: string
}

type Status = 'active' | 'done' | 'archived'
const STATUS_OPTIONS: ReadonlyArray<{ value: Status; label: string }> = [
  { value: 'active', label: 'Actif' },
  { value: 'done', label: 'Termine' },
  { value: 'archived', label: 'Archive' },
]

export function ${cap}Form({ item, onSubmitted, onCancel, className }: ${cap}FormProps) {
  const isEdit = Boolean(item)
  const createMutation = ${useCreate}()
  const updateMutation = ${useUpdate}()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('active')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setDescription(item.description ?? '')
      setStatus(item.status)
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    if (title.trim().length === 0) {
      setValidationError('Le titre est requis')
      return
    }

    if (isEdit && item) {
      const input: Update${cap}Input = {
        title: title.trim(),
        description: description.trim(),
        status,
      }
      try {
        const updated = await updateMutation.mutateAsync({ id: item.id, input })
        onSubmitted?.(updated)
      } catch {
        /* surfaced via updateMutation.error */
      }
    } else {
      const input: Create${cap}Input = {
        title: title.trim(),
        description: description.trim(),
        status,
      }
      try {
        const created = await createMutation.mutateAsync(input)
        onSubmitted?.(created)
      } catch {
        /* surfaced via createMutation.error */
      }
    }
  }

  const mutationError = isEdit ? updateMutation.error : createMutation.error
  const isPending = isEdit ? updateMutation.isPending : createMutation.isPending
  const error = validationError ?? (mutationError instanceof Error ? mutationError.message : null)

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn('space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm', className)}
    >
      <h2 className="text-lg font-semibold text-foreground">
        {isEdit ? 'Modifier' : 'Nouvel(le) ${n.labelOne}'}
      </h2>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Titre</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de ${n.labelOne}"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          required
          maxLength={120}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          rows={3}
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Statut</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending ? 'Sauvegarde...' : isEdit ? 'Mettre a jour' : 'Creer'}
        </button>
      </div>
    </form>
  )
}

export default ${cap}Form
`,
    },
    {
      path: "src/features/" + lower + "/components/" + cap + "Item.tsx",
      language: "tsx",
      content: `import { useState } from 'react'
import { Pencil, Trash2, AlertCircle, Loader2, CheckCircle2, Archive } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ${useDelete} } from '../hooks/use-${lower}'
import type { ${cap} } from '../types'

export interface ${cap}ItemProps {
  item: ${cap}
  onSelect?: () => void
  onEdit?: () => void
  className?: string
}

const STATUS_META: Record<
  ${cap}['status'],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: 'Actif',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
    icon: CheckCircle2,
  },
  done: {
    label: 'Termine',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600',
    icon: CheckCircle2,
  },
  archived: {
    label: 'Archive',
    className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    icon: Archive,
  },
}

export function ${cap}Item({ item, onSelect, onEdit, className }: ${cap}ItemProps) {
  const deleteMutation = ${useDelete}()
  const [confirming, setConfirming] = useState(false)
  const status = STATUS_META[item.status]
  const StatusIcon = status.icon

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(item.id)
      setConfirming(false)
    } catch {
      /* surfaced via deleteMutation.error */
    }
  }

  return (
    <article
      className={cn(
        'group rounded-md border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-sm',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-foreground">{item.title}</h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                status.className
              )}
            >
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {status.label}
            </span>
          </div>
          {item.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          )}
          <p className="text-xs text-muted-foreground/70">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              aria-label="Modifier"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {!confirming ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setConfirming(true)
              }}
              aria-label="Supprimer"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
              role="group"
              aria-label="Confirmation de suppression"
            >
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-60"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                )}
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-md border border-border px-2 py-1 text-xs text-foreground transition hover:bg-muted"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      {deleteMutation.error && (
        <p
          className="mt-2 flex items-center gap-1.5 text-xs text-destructive"
          role="alert"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {deleteMutation.error.message}
        </p>
      )}
    </article>
  )
}

export default ${cap}Item
`,
    },
    {
      path: "src/features/" + lower + "/index.ts",
      language: "typescript",
      content: `export * from './types'
export * from './api/${lower}-repository'
export * from './hooks/use-${lower}'
export { ${entityPlural}List } from './components/${entityPlural}List'
export { ${cap}Form } from './components/${cap}Form'
export { ${cap}Item } from './components/${cap}Item'
export { default as ${entityPlural}ListDefault } from './components/${entityPlural}List'
export { default as ${cap}FormDefault } from './components/${cap}Form'
export { default as ${cap}ItemDefault } from './components/${cap}Item'
`,
    },
  ];
}

// ─── Dashboard feature ────────────────────────────────────────────────────────

function detectDashboard({ description, features }: DetectInput): boolean {
  if (features.includes("dashboard") || features.includes("charts")) return true;
  return /dashboard|statistique|stats|analytique|analytics|reporting/i.test(description);
}

function dashboardFiles(_featureName: string, _config: ProjectConfig): GeneratedFile[] {
  return [
    {
      path: "src/features/dashboard/types.ts",
      language: "typescript",
      content: `import { z } from 'zod'

export const statSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  /** Trend in percent (positive = up, negative = down). */
  trend: z.number().optional(),
  /** Hint for color tone. */
  tone: z.enum(['neutral', 'positive', 'negative', 'info']).default('neutral'),
  icon: z.string().optional(),
})

export const chartPointSchema = z.object({
  label: z.string(),
  value: z.number(),
})

export const chartDataSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  points: z.array(chartPointSchema),
})

export type Stat = z.infer<typeof statSchema>
export type ChartPoint = z.infer<typeof chartPointSchema>
export type ChartData = z.infer<typeof chartDataSchema>
export type StatTone = Stat['tone']
`,
    },
    {
      path: "src/features/dashboard/components/StatCard.tsx",
      language: "tsx",
      content: `import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Stat } from '../types'

export interface StatCardProps {
  stat: Stat
  className?: string
}

const TONE_STYLES: Record<Stat['tone'], string> = {
  neutral: 'text-muted-foreground',
  positive: 'text-emerald-600',
  negative: 'text-destructive',
  info: 'text-blue-600',
}

export function StatCard({ stat, className }: StatCardProps) {
  const trend = stat.trend
  const TrendIcon = typeof trend === 'number' && trend > 0
    ? TrendingUp
    : typeof trend === 'number' && trend < 0
      ? TrendingDown
      : Minus

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background p-4 shadow-sm transition hover:shadow-md',
        className
      )}
      role="group"
      aria-label={stat.label}
    >
      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-foreground">
          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
        </span>
        {stat.unit && (
          <span className="text-sm text-muted-foreground">{stat.unit}</span>
        )}
      </div>
      {typeof trend === 'number' && (
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium',
            TONE_STYLES[stat.tone]
          )}
        >
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          <span>
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
          <span className="text-muted-foreground/70">vs periode precedente</span>
        </div>
      )}
    </div>
  )
}

export default StatCard
`,
    },
    {
      path: "src/features/dashboard/components/StatsGrid.tsx",
      language: "tsx",
      content: `import { cn } from '@/shared/lib/utils'
import { StatCard } from './StatCard'
import type { Stat } from '../types'

export interface StatsGridProps {
  stats: Stat[]
  className?: string
  /** Tailwind grid columns override. Defaults to a responsive 1-4 columns grid. */
  columnsClassName?: string
}

export function StatsGrid({ stats, className, columnsClassName }: StatsGridProps) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Aucune statistique a afficher.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        columnsClassName ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  )
}

export default StatsGrid
`,
    },
    {
      path: "src/features/dashboard/components/SimpleChart.tsx",
      language: "tsx",
      content: `import { cn } from '@/shared/lib/utils'
import type { ChartData } from '../types'

export interface SimpleChartProps {
  data: ChartData
  className?: string
  height?: number
  /** Optional value formatter for axis labels. */
  formatValue?: (value: number) => string
}

const DEFAULT_HEIGHT = 200
const PADDING_TOP = 16
const PADDING_BOTTOM = 28
const PADDING_LEFT = 8
const PADDING_RIGHT = 8
const BAR_GAP = 8

export function SimpleChart({
  data,
  className,
  height = DEFAULT_HEIGHT,
  formatValue,
}: SimpleChartProps) {
  const points = data.points
  const innerHeight = height - PADDING_TOP - PADDING_BOTTOM
  const innerWidth = 600 // viewBox width; scales responsively via CSS

  if (points.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground',
          className
        )}
        style={{ height }}
        role="status"
      >
        Aucune donnee a afficher.
      </div>
    )
  }

  const max = Math.max(...points.map((p) => p.value), 0)
  const min = Math.min(...points.map((p) => p.value), 0)
  const range = max - min || 1
  const availableWidth = innerWidth - PADDING_LEFT - PADDING_RIGHT
  const barWidth = Math.max(
    8,
    (availableWidth - BAR_GAP * (points.length - 1)) / points.length
  )

  const zeroY = PADDING_TOP + innerHeight * (max / range)

  return (
    <figure className={cn('w-full', className)} aria-label={data.title ?? 'Graphique en barres'}>
      {data.title && (
        <figcaption className="mb-2 text-sm font-medium text-foreground">{data.title}</figcaption>
      )}
      <svg
        viewBox={'0 0 ' + innerWidth + ' ' + height}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        role="img"
      >
        {/* Zero baseline (only visible if min < 0) */}
        {min < 0 && (
          <line
            x1={PADDING_LEFT}
            x2={innerWidth - PADDING_RIGHT}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-border"
          />
        )}

        {points.map((p, i) => {
          const barHeight = (Math.abs(p.value) / range) * innerHeight
          const x = PADDING_LEFT + i * (barWidth + BAR_GAP)
          const y = p.value >= 0 ? zeroY - barHeight : zeroY
          const labelX = x + barWidth / 2
          const labelY = height - 8
          return (
            <g key={p.label + '-' + i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={3}
                className={p.value >= 0 ? 'fill-primary' : 'fill-destructive'}
              >
                <title>
                  {p.label}: {formatValue ? formatValue(p.value) : String(p.value)}
                </title>
              </rect>
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {p.label.length > 6 ? p.label.slice(0, 5) + '\u2026' : p.label}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

export default SimpleChart
`,
    },
    {
      path: "src/features/dashboard/components/DashboardLayout.tsx",
      language: "tsx",
      content: `import { cn } from '@/shared/lib/utils'
import { StatsGrid } from './StatsGrid'
import { SimpleChart } from './SimpleChart'
import type { Stat, ChartData } from '../types'

export interface DashboardLayoutProps {
  title?: string
  description?: string
  stats: Stat[]
  charts?: ChartData[]
  /** Optional extra content rendered at the bottom (e.g., a data table). */
  children?: React.ReactNode
  className?: string
}

export function DashboardLayout({
  title,
  description,
  stats,
  charts,
  children,
  className,
}: DashboardLayoutProps) {
  return (
    <section className={cn('space-y-6', className)} aria-label={title ?? 'Tableau de bord'}>
      {(title || description) && (
        <header className="space-y-1">
          {title && <h2 className="text-2xl font-semibold text-foreground">{title}</h2>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </header>
      )}

      <StatsGrid stats={stats} />

      {charts && charts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="rounded-lg border border-border bg-background p-4 shadow-sm"
            >
              <SimpleChart data={chart} />
            </div>
          ))}
        </div>
      )}

      {children && <div className="space-y-4">{children}</div>}
    </section>
  )
}

export default DashboardLayout
`,
    },
    {
      path: "src/features/dashboard/index.ts",
      language: "typescript",
      content: `export * from './types'
export { StatCard } from './components/StatCard'
export { StatsGrid } from './components/StatsGrid'
export { SimpleChart } from './components/SimpleChart'
export { DashboardLayout } from './components/DashboardLayout'
export { default as StatCardDefault } from './components/StatCard'
export { default as StatsGridDefault } from './components/StatsGrid'
export { default as SimpleChartDefault } from './components/SimpleChart'
export { default as DashboardLayoutDefault } from './components/DashboardLayout'
`,
    },
  ];
}

// ─── Search / filter feature ──────────────────────────────────────────────────

function detectSearchFilter({ description, features }: DetectInput): boolean {
  if (features.some((f) => f === "search" || f === "filters" || f === "filter")) {
    return true;
  }
  return /recherche|filtrage|filter|trier|sort/i.test(description);
}

function searchFilterFiles(_featureName: string, _config: ProjectConfig): GeneratedFile[] {
  return [
    {
      path: "src/features/filters/types.ts",
      language: "typescript",
      content: `import { z } from 'zod'

export const sortDirectionSchema = z.enum(['asc', 'desc'])
export type SortDirection = z.infer<typeof sortDirectionSchema>

export const sortOptionSchema = z.object({
  /** Field id used by the consumer to actually sort the collection. */
  value: z.string(),
  /** Human label shown in the dropdown. */
  label: z.string(),
  /** Default direction applied when first selected. */
  direction: sortDirectionSchema.default('asc'),
})
export type SortOption = z.infer<typeof sortOptionSchema>

export const filterStateSchema = z.object({
  search: z.string().default(''),
  /** Active filter values keyed by filter id. */
  filters: z.record(z.string(), z.array(z.string())).default({}),
  sort: z.string().default(''),
  sortDirection: sortDirectionSchema.default('asc'),
})
export type FilterState = z.infer<typeof filterStateSchema>

export interface FilterDefinition {
  id: string
  label: string
  /** When true, only one value can be selected at a time. */
  single?: boolean
  options: ReadonlyArray<{ value: string; label: string }>
}
`,
    },
    {
      path: "src/features/filters/hooks/use-filters.ts",
      language: "typescript",
      content: `import { create } from 'zustand'
import type { FilterState, SortDirection } from '../types'

interface FiltersStore extends FilterState {
  setSearch: (value: string) => void
  setFilter: (id: string, values: string[]) => void
  toggleFilterValue: (id: string, value: string, single?: boolean) => void
  clearFilter: (id: string) => void
  setSort: (value: string, direction?: SortDirection) => void
  toggleSortDirection: () => void
  reset: () => void
}

const INITIAL: FilterState = {
  search: '',
  filters: {},
  sort: '',
  sortDirection: 'asc',
}

export const useFilters = create<FiltersStore>((set) => ({
  ...INITIAL,
  setSearch: (value) => set({ search: value }),
  setFilter: (id, values) =>
    set((state) => ({ filters: { ...state.filters, [id]: values } })),
  toggleFilterValue: (id, value, single) =>
    set((state) => {
      const current = state.filters[id] ?? []
      if (single) {
        return {
          filters: { ...state.filters, [id]: current.includes(value) ? [] : [value] },
        }
      }
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { filters: { ...state.filters, [id]: next } }
    }),
  clearFilter: (id) =>
    set((state) => {
      const next = { ...state.filters }
      delete next[id]
      return { filters: next }
    }),
  setSort: (value, direction) =>
    set((state) => ({
      sort: value,
      sortDirection: direction ?? state.sortDirection,
    })),
  toggleSortDirection: () =>
    set((state) => ({
      sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),
  reset: () => set({ ...INITIAL, filters: {} }),
}))

/** Selector hook to count active filter values (excludes the free-text search). */
export function useActiveFilterCount(): number {
  return useFilters((state) =>
    Object.values(state.filters).reduce((acc, arr) => acc + arr.length, 0)
  )
}
`,
    },
    {
      path: "src/features/filters/components/SearchBar.tsx",
      language: "tsx",
      content: `import { useEffect, useRef, useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useFilters } from '../hooks/use-filters'

export interface SearchBarProps {
  /** Debounce delay in ms (default 250). */
  debounceMs?: number
  placeholder?: string
  className?: string
  /** When provided, displays a spinner instead of the search icon. */
  isLoading?: boolean
}

export function SearchBar({
  debounceMs = 250,
  placeholder = 'Rechercher...',
  className,
  isLoading = false,
}: SearchBarProps) {
  const setSearch = useFilters((s) => s.setSearch)
  const committed = useFilters((s) => s.search)
  const [local, setLocal] = useState(committed)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (local === committed) return
    timerRef.current = setTimeout(() => {
      setSearch(local)
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [local, debounceMs, setSearch, committed])

  const handleClear = () => {
    setLocal('')
    setSearch('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : local.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Effacer la recherche"
            className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default SearchBar
`,
    },
    {
      path: "src/features/filters/components/FilterPanel.tsx",
      language: "tsx",
      content: `import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useFilters } from '../hooks/use-filters'
import type { FilterDefinition } from '../types'

export interface FilterPanelProps {
  filters: ReadonlyArray<FilterDefinition>
  className?: string
  /** When true, renders as a collapsible card with a header. */
  collapsible?: boolean
  defaultOpen?: boolean
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
      />
      <span>{label}</span>
    </label>
  )
}

function Radio({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-foreground">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-border text-primary focus:ring-2 focus:ring-primary/30"
      />
      <span>{label}</span>
    </label>
  )
}

export function FilterPanel({
  filters,
  className,
  collapsible = false,
  defaultOpen = true,
}: FilterPanelProps) {
  const state = useFilters()
  const [open, setOpen] = useState(defaultOpen)

  const activeCount = Object.values(state.filters).reduce(
    (acc, arr) => acc + arr.length,
    0
  )

  const body = (
    <div className="space-y-4">
      {filters.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun filtre disponible.</p>
      )}
      {filters.map((filter) => {
        const selected = state.filters[filter.id] ?? []
        return (
          <fieldset key={filter.id} className="space-y-1.5">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {filter.label}
            </legend>
            <div className="space-y-0.5">
              {filter.options.map((opt) => {
                const checked = selected.includes(opt.value)
                const onChange = () =>
                  state.toggleFilterValue(filter.id, opt.value, filter.single)
                return filter.single ? (
                  <Radio
                    key={opt.value}
                    checked={checked}
                    onChange={onChange}
                    label={opt.label}
                  />
                ) : (
                  <Checkbox
                    key={opt.value}
                    checked={checked}
                    onChange={onChange}
                    label={opt.label}
                  />
                )
              })}
            </div>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => state.clearFilter(filter.id)}
                className="text-xs text-primary hover:underline"
              >
                Reinitialiser
              </button>
            )}
          </fieldset>
        )
      })}
    </div>
  )

  if (collapsible) {
    return (
      <div className={cn('rounded-md border border-border bg-background', className)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtres
            {activeCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">{open ? 'Masquer' : 'Afficher'}</span>
        </button>
        {open && <div className="border-t border-border p-4">{body}</div>}
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border border-border bg-background p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtres
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => state.reset()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Tout effacer
          </button>
        )}
      </div>
      {body}
    </div>
  )
}

export default FilterPanel
`,
    },
    {
      path: "src/features/filters/components/SortDropdown.tsx",
      language: "tsx",
      content: `import { ArrowDownAZ, ArrowUpAZ, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useFilters } from '../hooks/use-filters'
import type { SortOption } from '../types'

export interface SortDropdownProps {
  options: ReadonlyArray<SortOption>
  className?: string
  ariaLabel?: string
}

export function SortDropdown({ options, className, ariaLabel }: SortDropdownProps) {
  const sort = useFilters((s) => s.sort)
  const sortDirection = useFilters((s) => s.sortDirection)
  const setSort = useFilters((s) => s.setSort)
  const toggleDirection = useFilters((s) => s.toggleSortDirection)

  const current = options.find((o) => o.value === sort) ?? null
  const isAsc = sortDirection === 'asc'
  const DirectionIcon = isAsc ? ArrowDownAZ : ArrowUpAZ

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => {
            const opt = options.find((o) => o.value === e.target.value)
            if (opt) setSort(opt.value, opt.direction)
            else setSort('', 'asc')
          }}
          aria-label={ariaLabel ?? 'Trier par'}
          className="appearance-none rounded-md border border-border bg-background py-2 pl-3 pr-8 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Trier par...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <button
        type="button"
        onClick={toggleDirection}
        disabled={!current}
        aria-label={'Direction: ' + (isAsc ? 'ascendant' : 'descendant')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <DirectionIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      {current && (
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
          <Check className="h-3 w-3" aria-hidden="true" />
          {current.label}
        </span>
      )}
    </div>
  )
}

export default SortDropdown
`,
    },
    {
      path: "src/features/filters/index.ts",
      language: "typescript",
      content: `export * from './types'
export * from './hooks/use-filters'
export { SearchBar } from './components/SearchBar'
export { FilterPanel } from './components/FilterPanel'
export { SortDropdown } from './components/SortDropdown'
export { default as SearchBarDefault } from './components/SearchBar'
export { default as FilterPanelDefault } from './components/FilterPanel'
export { default as SortDropdownDefault } from './components/SortDropdown'
`,
    },
  ];
}

// ─── Public registry ──────────────────────────────────────────────────────────

export const FEATURE_TEMPLATES: Record<string, FeatureTemplate> = {
  auth: {
    id: "auth",
    name: "Authentication",
    description:
      "Login / register / logout flow with TanStack Query, Zod schemas, in-memory repository and Tailwind forms (LoginForm, RegisterForm, UserMenu).",
    detect: detectAuth,
    generateFiles: authFiles,
  },
  crud: {
    id: "crud",
    name: "Generic CRUD feature",
    description:
      "Entity CRUD scaffold (types + repository + TanStack Query hooks + List/Form/Item components) with loading/error/empty states. Entity name is auto-detected from the project description.",
    detect: detectCrud,
    generateFiles: crudFiles,
  },
  dashboard: {
    id: "dashboard",
    name: "Dashboard / analytics",
    description:
      "Stats grid + dependency-free SVG bar chart + dashboard layout. Includes StatCard, StatsGrid, SimpleChart and DashboardLayout.",
    detect: detectDashboard,
    generateFiles: dashboardFiles,
  },
  "search-filter": {
    id: "search-filter",
    name: "Search & filters",
    description:
      "Debounced SearchBar, multi/single-select FilterPanel and SortDropdown backed by a Zustand store. Plug-and-play with any list view.",
    detect: detectSearchFilter,
    generateFiles: searchFilterFiles,
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the list of feature template ids that should be scaffolded for the
 * given project, based on the description and the selected features array.
 */
export function detectFeatures(config: ProjectConfig): string[] {
  const input: DetectInput = {
    description: config.description,
    features: config.features,
  };
  const detected: string[] = [];
  for (const template of Object.values(FEATURE_TEMPLATES)) {
    if (template.detect(input)) {
      detected.push(template.id);
    }
  }
  return detected;
}

/**
 * Derive the per-template feature name (folder slug) used to generate files.
 * - For `crud`: derived from the project description (e.g. "tasks").
 * - For `search-filter`: always `filters` (matches the file paths above).
 * - For `auth` / `dashboard`: the template id itself.
 */
export function deriveFeatureName(templateId: string, config: ProjectConfig): string {
  switch (templateId) {
    case "crud":
      return deriveCrudEntityName(config);
    case "search-filter":
      return "filters";
    case "auth":
    case "dashboard":
    default:
      return templateId;
  }
}

/**
 * Generate all files for the requested features. `featureIds` should typically
 * come from `detectFeatures(config)`, but callers can pass a custom subset.
 */
export function scaffoldFeatures(
  config: ProjectConfig,
  featureIds: string[]
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const seen = new Set<string>();

  for (const id of featureIds) {
    const template = FEATURE_TEMPLATES[id];
    if (!template) {
      // Unknown feature id - skip silently so a single bad id does not poison the whole run.
      continue;
    }
    const featureName = deriveFeatureName(id, config);
    const generated = template.generateFiles(featureName, config);
    for (const file of generated) {
      // De-duplicate: later features win if two templates target the same path.
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      files.push(file);
    }
  }

  return files;
}
