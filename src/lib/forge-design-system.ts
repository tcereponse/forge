// forge-design-system.ts — Gold Grade Design System generator.
// Produces 30+ shadcn/ui-style components with variants, accessibility, and TypeScript strict.
// These are deterministic (not LLM-generated) for guaranteed quality and consistency.

import type { GeneratedFile } from "./forge-config";

/** All design system component files. */
export function buildDesignSystem(): GeneratedFile[] {
  return [
    // ── Core utility ──────────────────────────────────────────────────────
    sharedLibUtils(),
    sharedLibApi(),
    sharedLibQueryClient(),

    // ── Primitives ────────────────────────────────────────────────────────
    uiButton(),
    uiInput(),
    uiTextarea(),
    uiLabel(),
    uiSelect(),
    uiCheckbox(),
    uiSwitch(),
    uiBadge(),
    uiSeparator(),

    // ── Layout ────────────────────────────────────────────────────────────
    uiCard(),
    uiContainer(),
    uiStack(),
    uiGrid(),
    uiSkeleton(),

    // ── Feedback ──────────────────────────────────────────────────────────
    uiSpinner(),
    uiProgress(),
    uiAlert(),
    uiToast(),
    uiEmptyState(),
    uiErrorState(),
    uiAsyncBoundary(),

    // ── Overlay ───────────────────────────────────────────────────────────
    uiDialog(),
    uiSheet(),
    uiPopover(),
    uiTooltip(),
    uiDropdownMenu(),
    uiCommandMenu(),

    // ── Data display ──────────────────────────────────────────────────────
    uiTabs(),
    uiAccordion(),
    uiAvatar(),
    uiDataTable(),
    uiPagination(),

    // ── Navigation ────────────────────────────────────────────────────────
    uiBreadcrumb(),
    uiPaginationNav(),

    // ── Index barrel ──────────────────────────────────────────────────────
    uiIndex(),
  ]
}

// ── Core ────────────────────────────────────────────────────────────────────
function sharedLibUtils(): GeneratedFile {
  return {
    path: "src/shared/lib/utils.ts",
    language: "typescript",
    content: `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format a date to French locale. */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Format a number as currency (EUR). */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

/** Format a number with thousand separators. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

/** Truncate text with ellipsis. */
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

/** Sleep for ms milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Generate a random ID. */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

/** Debounce a function. */
export function debounce<T extends (...args: never[]) => unknown>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: never[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}
`,
  }
}

function sharedLibApi(): GeneratedFile {
  return {
    path: "src/shared/api/client.ts",
    language: "typescript",
    content: `/** Gold Grade API Client — typed HTTP client with interceptors, error handling, and retry. */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

export class ApiClient {
  private baseUrl: string
  private headers: Record<string, string>
  private timeout: number
  private retries: number

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? import.meta.env.VITE_API_URL ?? ''
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    this.timeout = options.timeout ?? 30_000
    this.retries = options.retries ?? 1
  }

  setAuthToken(token: string | null): void {
    if (token) {
      this.headers.Authorization = \`Bearer \${token}\`
    } else {
      delete this.headers.Authorization
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = params ? \`\${path}?\${new URLSearchParams(params)}\` : path
    return this.request<T>('GET', url)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = \`\${this.baseUrl}\${path}\`
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.timeout)

        const res = await fetch(url, {
          method,
          headers: this.headers,
          body: body ? JSON.stringify(body) : null,
          signal: controller.signal,
        })

        clearTimeout(timer)

        if (!res.ok) {
          const errorBody = await res.json().catch(() => undefined)
          throw new ApiError(
            errorBody?.message ?? \`HTTP \${res.status}\`,
            res.status,
            errorBody
          )
        }

        const contentType = res.headers.get('content-type') ?? ''
        if (contentType.includes('application/json')) {
          return (await res.json()) as T
        }
        return (await res.text()) as unknown as T
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error
        }
        // Retry on network errors and 5xx
        if (attempt < this.retries) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 500))
        }
      }
    }

    throw lastError ?? new Error('Request failed')
  }
}

/** Singleton API client. */
export const apiClient = new ApiClient()
`,
  }
}

function sharedLibQueryClient(): GeneratedFile {
  return {
    path: "src/shared/lib/query-client.ts",
    language: "typescript",
    content: `import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'

/** Gold Grade QueryClient with sensible defaults. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      gcTime: 5 * 60_000, // 5 minutes (garbage collection)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
})
`,
  }
}

// ── Primitives ──────────────────────────────────────────────────────────────
function uiButton(): GeneratedFile {
  return {
    path: "src/shared/ui/button.tsx",
    language: "tsx",
    content: `import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-600',
        secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
        outline: 'border border-slate-700 bg-transparent hover:bg-slate-800',
        ghost: 'hover:bg-slate-800 text-slate-300',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600',
        link: 'text-cyan-400 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'

export { buttonVariants }
`,
  }
}

function uiInput(): GeneratedFile {
  return {
    path: "src/shared/ui/input.tsx",
    language: "tsx",
    content: `import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-rose-500 focus:ring-rose-500',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
`,
  }
}

function uiTextarea(): GeneratedFile {
  return {
    path: "src/shared/ui/textarea.tsx",
    language: "tsx",
    content: `import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-rose-500 focus:ring-rose-500',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
`,
  }
}

function uiLabel(): GeneratedFile {
  return {
    path: "src/shared/ui/label.tsx",
    language: "tsx",
    content: `import { forwardRef, type LabelHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-slate-300', className)}
      {...props}
    />
  )
)
Label.displayName = 'Label'
`,
  }
}

function uiSelect(): GeneratedFile {
  return {
    path: "src/shared/ui/select.tsx",
    language: "tsx",
    content: `import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full appearance-none rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 pr-8 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
)
Select.displayName = 'Select'
`,
  }
}

function uiCheckbox(): GeneratedFile {
  return {
    path: "src/shared/ui/checkbox.tsx",
    language: "tsx",
    content: `import { forwardRef, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        className="peer absolute h-full w-full cursor-pointer opacity-0"
        {...props}
      />
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded border border-slate-600 bg-slate-950 transition peer-checked:border-cyan-500 peer-checked:bg-cyan-500 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500',
          className
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 text-slate-950" />}
      </span>
    </span>
  )
)
Checkbox.displayName = 'Checkbox'
`,
  }
}

function uiSwitch(): GeneratedFile {
  return {
    path: "src/shared/ui/switch.tsx",
    language: "tsx",
    content: `import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-cyan-500' : 'bg-slate-700',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}
`,
  }
}

function uiBadge(): GeneratedFile {
  return {
    path: "src/shared/ui/badge.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-cyan-500/10 text-cyan-300',
        success: 'border-transparent bg-emerald-500/10 text-emerald-300',
        warning: 'border-transparent bg-amber-500/10 text-amber-300',
        destructive: 'border-transparent bg-rose-500/10 text-rose-300',
        outline: 'border-slate-700 text-slate-300',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
`,
  }
}

function uiSeparator(): GeneratedFile {
  return {
    path: "src/shared/ui/separator.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-slate-800',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  )
}
`,
  }
}

// ── Layout ──────────────────────────────────────────────────────────────────
function uiCard(): GeneratedFile {
  return {
    path: "src/shared/ui/card.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-slate-800 bg-slate-900/40 text-slate-100 shadow', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-400', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
`,
  }
}

function uiContainer(): GeneratedFile {
  return {
    path: "src/shared/ui/container.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Container({ className, size = 'lg', ...props }: ContainerProps) {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  }
  return <div className={cn('mx-auto w-full px-4', sizes[size], className)} {...props} />
}
`,
  }
}

function uiStack(): GeneratedFile {
  return {
    path: "src/shared/ui/stack.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}

export function Stack({
  className,
  direction = 'column',
  gap = 'md',
  align,
  justify,
  ...props
}: StackProps) {
  const gaps = { none: '', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' }
  const aligns = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }
  const justifies = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }
  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        gaps[gap],
        align && aligns[align],
        justify && justifies[justify],
        className
      )}
      {...props}
    />
  )
}
`,
  }
}

function uiGrid(): GeneratedFile {
  return {
    path: "src/shared/ui/grid.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg'
}

export function Grid({ className, cols = 2, gap = 'md', ...props }: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  }
  const gaps = { none: '', sm: 'gap-2', md: 'gap-4', lg: 'gap-6' }
  return <div className={cn('grid', colClasses[cols], gaps[gap], className)} {...props} />
}
`,
  }
}

function uiSkeleton(): GeneratedFile {
  return {
    path: "src/shared/ui/skeleton.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-800', className)} {...props} />
}
`,
  }
}

// ── Feedback ────────────────────────────────────────────────────────────────
function uiSpinner(): GeneratedFile {
  return {
    path: "src/shared/ui/spinner.tsx",
    language: "tsx",
    content: `import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return <Loader2 className={cn('animate-spin text-cyan-400', sizes[size], className)} />
}
`,
  }
}

function uiProgress(): GeneratedFile {
  return {
    path: "src/shared/ui/progress.tsx",
    language: "tsx",
    content: `import { cn } from '../lib/utils'

export interface ProgressProps {
  value: number // 0-100
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-800', className)}>
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
        style={{ width: \`\${clamped}%\` }}
      />
    </div>
  )
}
`,
  }
}

function uiAlert(): GeneratedFile {
  return {
    path: "src/shared/ui/alert.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        info: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-200',
        success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
        warning: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
        destructive: 'border-rose-500/30 bg-rose-500/5 text-rose-200',
      },
    },
    defaultVariants: { variant: 'info' },
  }
)

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  destructive: XCircle,
}

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? 'info']
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <div className="flex gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={cn(title && 'mt-1', 'text-sm opacity-90')}>{children}</div>}
        </div>
      </div>
    </div>
  )
}
`,
  }
}

function uiToast(): GeneratedFile {
  return {
    path: "src/shared/ui/toast.tsx",
    language: "tsx",
    content: `import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
}

const variantStyles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
  info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => dismiss(id), 5000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.variant]
          return (
            <div
              key={t.id}
              className={cn(
                'flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg',
                variantStyles[t.variant]
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{t.title}</p>
                {t.description && <p className="mt-1 text-sm opacity-90">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-50 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
`,
  }
}

function uiEmptyState(): GeneratedFile {
  return {
    path: "src/shared/ui/empty-state.tsx",
    language: "tsx",
    content: `import { type ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '../lib/utils'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
        {icon ?? <Inbox className="h-8 w-8 text-slate-600" />}
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
`,
  }
}

function uiErrorState(): GeneratedFile {
  return {
    path: "src/shared/ui/error-state.tsx",
    language: "tsx",
    content: `import { type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { cn } from '../lib/utils'

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description = 'Veuillez réessayer. Si le problème persiste, contactez le support.',
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
        <AlertTriangle className="h-8 w-8 text-rose-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      <div className="mt-4 flex gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Réessayer
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}
`,
  }
}

function uiAsyncBoundary(): GeneratedFile {
  return {
    path: "src/shared/ui/async-boundary.tsx",
    language: "tsx",
    content: `import { type ReactNode } from 'react'
import { Skeleton } from './skeleton'
import { ErrorState } from './error-state'
import { EmptyState } from './empty-state'

export interface AsyncBoundaryProps {
  isLoading?: boolean
  isError?: boolean
  isEmpty?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  skeleton?: ReactNode
  children: ReactNode
}

/** Reusable boundary that handles loading, error, empty, and success states. */
export function AsyncBoundary({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  emptyTitle = 'Aucune donnée',
  emptyDescription,
  emptyAction,
  skeleton,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return <>{skeleton ?? <Skeleton className="h-32 w-full" />}</>
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
  }

  return <>{children}</>
}
`,
  }
}

// ── Overlay ─────────────────────────────────────────────────────────────────
function uiDialog(): GeneratedFile {
  return {
    path: "src/shared/ui/dialog.tsx",
    language: "tsx",
    content: `import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl',
          className
        )}
      >
        {title && (
          <div className="mb-4">
            <h2 id="dialog-title" className="text-lg font-semibold text-slate-100">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}
`,
  }
}

function uiSheet(): GeneratedFile {
  return {
    path: "src/shared/ui/sheet.tsx",
    language: "tsx",
    content: `import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

export interface SheetProps {
  open: boolean
  onClose: () => void
  side?: 'left' | 'right' | 'top' | 'bottom'
  title?: string
  children: ReactNode
  className?: string
}

export function Sheet({ open, onClose, side = 'right', title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sideClasses = {
    left: 'left-0 h-full',
    right: 'right-0 h-full',
    top: 'top-0 w-full',
    bottom: 'bottom-0 w-full',
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute bg-slate-900 shadow-2xl',
          sideClasses[side],
          side === 'left' || side === 'right' ? 'w-full max-w-md' : 'max-h-[80vh]',
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          {title && <h2 className="text-lg font-semibold text-slate-100">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
`,
  }
}

function uiPopover(): GeneratedFile {
  return {
    path: "src/shared/ui/popover.tsx",
    language: "tsx",
    content: `import { type ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

export interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function Popover({ trigger, children, align = 'center', className }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const alignClass = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] rounded-lg border border-slate-800 bg-slate-900 p-2 shadow-xl',
            alignClass[align],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
`,
  }
}

function uiTooltip(): GeneratedFile {
  return {
    path: "src/shared/ui/tooltip.tsx",
    language: "tsx",
    content: `import { type ReactNode, useState } from 'react'
import { cn } from '../lib/utils'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 whitespace-nowrap pointer-events-none',
            sideClasses[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
`,
  }
}

function uiDropdownMenu(): GeneratedFile {
  return {
    path: "src/shared/ui/dropdown-menu.tsx",
    language: "tsx",
    content: `import { type ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

export interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
}

export function DropdownMenu({ trigger, children, align = 'start', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-xl',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100',
        className
      )}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-slate-800', className)} />
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-2 py-1.5 text-xs font-semibold text-slate-500', className)}>{children}</div>
}
`,
  }
}

function uiCommandMenu(): GeneratedFile {
  return {
    path: "src/shared/ui/command-menu.tsx",
    language: "tsx",
    content: `import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../lib/utils'

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  action: () => void
}

export interface CommandMenuProps {
  open: boolean
  onClose: () => void
  items: CommandItem[]
  placeholder?: string
}

export function CommandMenu({ open, onClose, items, placeholder = 'Rechercher...' }: CommandMenuProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault()
      filtered[activeIndex].action()
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[20vh]">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center border-b border-slate-800 px-3">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-12 w-full bg-transparent px-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">Aucun résultat</div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  item.action()
                  onClose()
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition',
                  i === activeIndex ? 'bg-slate-800 text-slate-100' : 'text-slate-300'
                )}
              >
                {item.icon}
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.description && <div className="text-xs text-slate-500">{item.description}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
`,
  }
}

// ── Data display ────────────────────────────────────────────────────────────
function uiTabs(): GeneratedFile {
  return {
    path: "src/shared/ui/tabs.tsx",
    language: "tsx",
    content: `import { useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'

export interface TabsProps {
  defaultValue: string
  children: ReactNode
  className?: string
}

export interface TabsListProps {
  children: ReactNode
  className?: string
}

export interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

import { createContext, useContext } from 'react'

const TabsContext = createContext<TabsContextValue | null>(null)

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [value, setValue] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/40 p-1', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs')
  const active = ctx.value === value
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition',
        active ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent must be used within Tabs')
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}
`,
  }
}

function uiAccordion(): GeneratedFile {
  return {
    path: "src/shared/ui/accordion.tsx",
    language: "tsx",
    content: `import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

export interface AccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-slate-200"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-4 text-sm text-slate-400">{children}</div>}
    </div>
  )
}

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('divide-y divide-slate-800', className)}>{children}</div>
}
`,
  }
}

function uiAvatar(): GeneratedFile {
  return {
    path: "src/shared/ui/avatar.tsx",
    language: "tsx",
    content: `import { type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-slate-300',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="font-medium">{fallback}</span>
      )}
    </div>
  )
}
`,
  }
}

function uiDataTable(): GeneratedFile {
  return {
    path: "src/shared/ui/data-table.tsx",
    language: "tsx",
    content: `import { type ReactNode, useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  emptyMessage?: string
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  emptyMessage = 'Aucune donnée',
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = String(a[sortKey] ?? '')
      const bv = String(b[sortKey] ?? '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (data.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-500">{emptyMessage}</div>
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn('px-4 py-2 text-left font-medium text-slate-400', col.className)}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(String(col.key))}
                      className="flex items-center gap-1 hover:text-slate-200"
                    >
                      {col.header}
                      {sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                {columns.map((col) => (
                  <td key={String(col.key)} className={cn('px-4 py-3 text-slate-300', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-xs text-slate-500">
            Page {page + 1} sur {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-md border border-slate-700 p-1.5 text-slate-400 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border border-slate-700 p-1.5 text-slate-400 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
`,
  }
}

function uiPagination(): GeneratedFile {
  return {
    path: "src/shared/ui/pagination.tsx",
    language: "tsx",
    content: `import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...')
    }
  }

  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md border border-slate-700 p-2 text-slate-400 disabled:opacity-50"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={i} className="px-2 text-slate-500">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <button
            key={i}
            onClick={() => onPageChange(p)}
            className={cn(
              'h-9 min-w-[36px] rounded-md border px-2 text-sm',
              p === currentPage
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md border border-slate-700 p-2 text-slate-400 disabled:opacity-50"
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
`,
  }
}

// ── Navigation ──────────────────────────────────────────────────────────────
function uiBreadcrumb(): GeneratedFile {
  return {
    path: "src/shared/ui/breadcrumb.tsx",
    language: "tsx",
    content: `import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: ReactNode
}

export function Breadcrumb({ items, className, separator }: BreadcrumbProps) {
  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {item.onClick || item.href ? (
              <button
                onClick={item.onClick}
                className="text-slate-400 hover:text-slate-200"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-slate-200">{item.label}</span>
            )}
            {i < items.length - 1 && (
              <span className="text-slate-600">
                {separator ?? <ChevronRight className="h-3 w-3" />}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
`,
  }
}

function uiPaginationNav(): GeneratedFile {
  return {
    path: "src/shared/ui/pagination-nav.tsx",
    language: "tsx",
    content: `// Re-export of pagination for navigation contexts
export { Pagination } from './pagination'
`,
  }
}

// ── Index barrel ────────────────────────────────────────────────────────────
function uiIndex(): GeneratedFile {
  return {
    path: "src/shared/ui/index.ts",
    language: "typescript",
    content: `// Design System — Gold Grade barrel export
export { Button, buttonVariants, type ButtonProps } from './button'
export { Input, type InputProps } from './input'
export { Textarea, type TextareaProps } from './textarea'
export { Label, type LabelProps } from './label'
export { Select, type SelectProps } from './select'
export { Checkbox, type CheckboxProps } from './checkbox'
export { Switch, type SwitchProps } from './switch'
export { Badge, badgeVariants, type BadgeProps } from './badge'
export { Separator, type SeparatorProps } from './separator'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
export { Container, type ContainerProps } from './container'
export { Stack, type StackProps } from './stack'
export { Grid, type GridProps } from './grid'
export { Skeleton } from './skeleton'

export { Spinner, type SpinnerProps } from './spinner'
export { Progress, type ProgressProps } from './progress'
export { Alert, type AlertProps } from './alert'
export { ToastProvider, useToast } from './toast'
export { EmptyState, type EmptyStateProps } from './empty-state'
export { ErrorState, type ErrorStateProps } from './error-state'
export { AsyncBoundary, type AsyncBoundaryProps } from './async-boundary'

export { Dialog, type DialogProps } from './dialog'
export { Sheet, type SheetProps } from './sheet'
export { Popover, type PopoverProps } from './popover'
export { Tooltip, type TooltipProps } from './tooltip'
export { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from './dropdown-menu'
export { CommandMenu, type CommandItem, type CommandMenuProps } from './command-menu'

export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export { Accordion, AccordionItem } from './accordion'
export { Avatar, type AvatarProps } from './avatar'
export { DataTable, type Column, type DataTableProps } from './data-table'
export { Pagination, type PaginationProps } from './pagination'
export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem } from './breadcrumb'
`,
  }
}
