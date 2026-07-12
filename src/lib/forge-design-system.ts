// forge-design-system.ts — Phase 3: 30+ shadcn/ui-style component generator.
//
// Exports buildDesignSystem(): GeneratedFile[] which returns 33 production-quality
// component files for the generated project's src/shared/ui/ folder (plus utils.ts
// in src/shared/lib/).
//
// Component categories:
//   - Layout (5):     container, stack, grid, sidebar, header
//   - Form (6):       button, input, textarea, select, checkbox, switch
//   - Feedback (6):   badge, skeleton, progress, spinner, empty-state, error-state
//   - Overlay (6):    dialog, sheet, popover, tooltip, dropdown-menu, alert
//   - Data (5):       card, tabs, accordion, table, pagination
//   - Navigation (4): breadcrumb, nav, async-boundary, separator
//   - Lib (1):        utils (cn + formatters)
//
// All components:
//   - Are TypeScript strict (compatible with noUncheckedIndexedAccess +
//     exactOptionalPropertyTypes + noUnusedLocals)
//   - Use Tailwind classes with CSS variables (bg-primary, text-foreground, etc.)
//   - Use class-variance-authority (cva) for variants where applicable
//   - Are accessible (aria-* attributes, semantic roles, keyboard navigation)
//   - Use React.forwardRef for DOM-rendering components
//   - Export both default + named exports
//   - Use cn() from @/shared/lib/utils for class merging
//
// No Radix UI dependencies. Overlays use simple useState + fixed positioning
// (no portals). No test files.

import type { GeneratedFile } from "./forge-config";
import { inferLanguage } from "./forge-config";

// ─── Helper: wrap source content as a GeneratedFile ─────────────────────────
function file(path: string, content: string): GeneratedFile {
  return { path, content, language: inferLanguage(path) };
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED LIB
// ═══════════════════════════════════════════════════════════════════════════

const utilsSource = `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names with conflict resolution.
 * Combines clsx (conditional classes) + tailwind-merge (dedupe conflicts).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a numeric amount as a localized currency string.
 *
 * @example formatPrice(42.5) // '$42.50'
 * @example formatPrice(42.5, 'EUR', 'fr-FR') // '42,50 \u20AC'
 */
export function formatPrice(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  if (!Number.isFinite(amount)) return ''
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format a date (Date | string | number) as a localized short date string.
 *
 * @example formatDate(new Date(2024, 0, 15)) // 'Jan 15, 2024'
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'en-US',
): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/**
 * Format a date as a relative time string (e.g. "3 days ago", "in 2 hours").
 *
 * @example formatRelativeTime(Date.now() - 86400000) // 'yesterday'
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en-US',
): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const diff = d.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ]
  for (const [unit, ms] of units) {
    const value = Math.round(diff / ms)
    if (Math.abs(value) >= 1) {
      return rtf.format(value, unit)
    }
  }
  return rtf.format(0, 'second')
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT (5)
// ═══════════════════════════════════════════════════════════════════════════

const containerSource = `import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const containerVariants = cva(
  'mx-auto w-full px-4 sm:px-6 lg:px-8',
  {
    variants: {
      maxWidth: {
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
        full: 'max-w-none',
      },
    },
    defaultVariants: { maxWidth: 'lg' },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxWidth, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(containerVariants({ maxWidth }), className)}
      {...props}
    />
  )
)
Container.displayName = 'Container'

export { containerVariants }
export default Container
`;

const stackSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

const gapMap: Record<NonNullable<StackProps['gap']>, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

const alignMap: Record<NonNullable<StackProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyMap: Record<NonNullable<StackProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction = 'vertical', gap = 'md', align, justify, wrap = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        gapMap[gap],
        align !== undefined && alignMap[align],
        justify !== undefined && justifyMap[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  )
)
Stack.displayName = 'Stack'

export const VStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="vertical" {...props} />
)
VStack.displayName = 'VStack'

export const HStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="horizontal" {...props} />
)
HStack.displayName = 'HStack'

export default Stack
`;

const gridSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  smCols?: 1 | 2 | 3 | 4 | 6 | 12
  mdCols?: 1 | 2 | 3 | 4 | 6 | 12
  lgCols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const gapMap: Record<NonNullable<GridProps['gap']>, string> = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

const colsMap: Record<NonNullable<GridProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
}

const smColsMap: Record<NonNullable<GridProps['smCols']>, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  6: 'sm:grid-cols-6',
  12: 'sm:grid-cols-12',
}

const mdColsMap: Record<NonNullable<GridProps['mdCols']>, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  6: 'md:grid-cols-6',
  12: 'md:grid-cols-12',
}

const lgColsMap: Record<NonNullable<GridProps['lgCols']>, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  6: 'lg:grid-cols-6',
  12: 'lg:grid-cols-12',
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, smCols, mdCols, lgCols, gap = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid',
        colsMap[cols],
        smCols !== undefined && smColsMap[smCols],
        mdCols !== undefined && mdColsMap[mdCols],
        lgCols !== undefined && lgColsMap[lgCols],
        gapMap[gap],
        className
      )}
      {...props}
    />
  )
)
Grid.displayName = 'Grid'

export default Grid
`;

const sidebarSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarItem[]
  collapsible?: boolean
  defaultCollapsed?: boolean
  title?: string
}

export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, items, collapsible = false, defaultCollapsed = false, title, ...props }, ref) => {
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

    return (
      <aside
        ref={ref}
        className={cn(
          'flex h-full flex-col border-r border-border bg-background transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
        aria-label="Sidebar navigation"
        {...props}
      >
        {title !== undefined && !collapsed && (
          <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
            <span className="truncate text-sm font-semibold text-foreground">{title}</span>
          </div>
        )}
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-10 shrink-0 w-full items-center justify-center border-b border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <span aria-hidden="true">{collapsed ? '\u2192' : '\u2190'}</span>
          </button>
        )}
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Sidebar items">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={item.onClick}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    collapsed && 'justify-center px-0',
                    item.active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    item.disabled && 'cursor-not-allowed opacity-50'
                  )}
                  aria-current={item.active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon !== undefined && (
                    <span className="shrink-0" aria-hidden="true">{item.icon}</span>
                  )}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    )
  }
)
Sidebar.displayName = 'Sidebar'

export default Sidebar
`;

const headerSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface HeaderNavItem {
  id: string
  label: string
  href?: string
  active?: boolean
  onClick?: () => void
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  title?: string
  nav?: HeaderNavItem[]
  actions?: React.ReactNode
  sticky?: boolean
}

export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, logo, title, nav, actions, sticky = true, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        'flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6',
        sticky && 'sticky top-0 z-40',
        className
      )}
      role="banner"
      {...props}
    >
      <div className="flex items-center gap-3">
        {logo !== undefined && (
          <span className="flex items-center" aria-hidden="true">{logo}</span>
        )}
        {title !== undefined && (
          <span className="text-lg font-semibold text-foreground">{title}</span>
        )}
      </div>
      {nav !== undefined && nav.length > 0 && (
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
      {actions !== undefined && (
        <div className="flex items-center gap-2" role="toolbar" aria-label="Header actions">
          {actions}
        </div>
      )}
    </header>
  )
)
Header.displayName = 'Header'

export default Header
`;

// ═══════════════════════════════════════════════════════════════════════════
// FORM (6)
// ═══════════════════════════════════════════════════════════════════════════

const buttonSource = `import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { buttonVariants }
export default Button
`;

const inputSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const reactId = React.useId()
    const inputId = id ?? reactId
    const errorId = inputId + '-error'
    const hintId = inputId + '-hint'
    const describedBy = cn(error && errorId, hint && hintId, ariaDescribedBy) || undefined

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label !== undefined && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error !== undefined && (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        {hint !== undefined && error === undefined && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input
`;

const textareaSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, required, rows = 4, ...props }, ref) => {
    const reactId = React.useId()
    const textareaId = id ?? reactId
    const errorId = textareaId + '-error'
    const hintId = textareaId + '-hint'
    const describedBy = cn(error && errorId, hint && hintId) || undefined

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label !== undefined && (
          <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error !== undefined && (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        {hint !== undefined && error === undefined && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export default Textarea
`;

const selectSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, required, options, placeholder, ...props }, ref) => {
    const reactId = React.useId()
    const selectId = id ?? reactId
    const errorId = selectId + '-error'
    const hintId = selectId + '-hint'
    const describedBy = cn(error && errorId, hint && hintId) || undefined

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label !== undefined && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error !== undefined && (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        {hint !== undefined && error === undefined && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export default Select
`;

const checkboxSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode
  description?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const reactId = React.useId()
    const checkboxId = id ?? reactId
    const errorId = checkboxId + '-error'

    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 rounded border border-input bg-background accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive',
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error !== undefined ? errorId : undefined}
            {...props}
          />
          {(label !== undefined || description !== undefined) && (
            <div className="flex flex-col">
              {label !== undefined && (
                <label htmlFor={checkboxId} className="cursor-pointer text-sm font-medium text-foreground">
                  {label}
                </label>
              )}
              {description !== undefined && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
        {error !== undefined && (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export default Checkbox
`;

const switchSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  description?: string
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, label, description, disabled, id, ...props }, ref) => {
    const reactId = React.useId()
    const switchId = id ?? reactId

    return (
      <div className="flex items-start gap-3">
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label ?? 'Toggle'}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-muted',
            className
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {(label !== undefined || description !== undefined) && (
          <div className="flex flex-col">
            {label !== undefined && (
              <label htmlFor={switchId} className="cursor-pointer text-sm font-medium text-foreground">
                {label}
              </label>
            )}
            {description !== undefined && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Switch.displayName = 'Switch'

export default Switch
`;

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK (6)
// ═══════════════════════════════════════════════════════════════════════════

const badgeSource = `import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        success: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80',
        warning: 'border-transparent bg-amber-500 text-white hover:bg-amber-500/80',
        error: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        info: 'border-transparent bg-blue-500 text-white hover:bg-blue-500/80',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
)
Badge.displayName = 'Badge'

export { badgeVariants }
export default Badge
`;

const skeletonSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'rect' | 'circle' | 'text'
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape = 'rect', ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-muted',
        shape === 'circle' && 'rounded-full',
        shape === 'rect' && 'rounded-md',
        shape === 'text' && 'h-4 rounded',
        className
      )}
      {...props}
    />
  )
)
Skeleton.displayName = 'Skeleton'

export default Skeleton
`;

const progressSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  showValue?: boolean
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, label, showValue = false, ...props }, ref) => {
    const clamped = Math.min(Math.max(value, 0), max)
    const pct = max > 0 ? Math.round((clamped / max) * 100) : 0
    const reactId = React.useId()
    const labelId = reactId + '-label'

    return (
      <div className="flex w-full flex-col gap-1.5">
        {(label !== undefined || showValue) && (
          <div className="flex items-center justify-between text-sm">
            {label !== undefined && (
              <span id={labelId} className="font-medium text-foreground">
                {label}
              </span>
            )}
            {showValue && (
              <span className="text-muted-foreground" aria-hidden="true">
                {pct}%
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={clamped}
          aria-labelledby={label !== undefined ? labelId : undefined}
          className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
          {...props}
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: pct + '%' }}
          />
        </div>
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export default Progress
`;

const spinnerSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = 'md', label = 'Loading', ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent text-muted-foreground',
        sizeMap[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
)
Spinner.displayName = 'Spinner'

export default Spinner
`;

const emptyStateSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-background p-8 text-center',
        className
      )}
      {...props}
    >
      {icon !== undefined && (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description !== undefined && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  )
)
EmptyState.displayName = 'EmptyState'

export default EmptyState
`;

const errorStateSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message: string
  retryLabel?: string
  onRetry?: () => void
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    { className, title = 'Something went wrong', message, retryLabel = 'Try again', onRetry, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center',
        className
      )}
      {...props}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        aria-hidden="true"
      >
        <span className="text-2xl font-bold" aria-hidden="true">!</span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
)
ErrorState.displayName = 'ErrorState'

export default ErrorState
`;

// ═══════════════════════════════════════════════════════════════════════════
// OVERLAY (6)
// ═══════════════════════════════════════════════════════════════════════════

const dialogSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

/**
 * Dialog orchestrator. Renders a modal overlay (fixed inset + backdrop) when open.
 * Children should typically include a <DialogContent />.
 *
 * Accessibility: closes on Escape, traps focus visually via role="dialog" aria-modal.
 */
export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, className }) => {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 mx-4 w-full max-w-lg"
      >
        {children}
      </div>
    </div>
  )
}
Dialog.displayName = 'Dialog'

export const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-lg',
        className
      )}
      {...props}
    />
  )
)
DialogContent.displayName = 'DialogContent'

export const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />
  )
)
DialogHeader.displayName = 'DialogHeader'

export const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
)
DialogFooter.displayName = 'DialogFooter'

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  )
)
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
DialogDescription.displayName = 'DialogDescription'

export const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="Close"
      className={cn(
        'absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="text-xl leading-none">&times;</span>
    </button>
  )
)
DialogClose.displayName = 'DialogClose'

export default Dialog
`;

const sheetSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: 'left' | 'right' | 'top' | 'bottom'
  children: React.ReactNode
  className?: string
}

const sideClassMap: Record<NonNullable<SheetProps['side']>, string> = {
  left: 'inset-y-0 left-0 h-full w-full max-w-sm border-r',
  right: 'inset-y-0 right-0 h-full w-full max-w-sm border-l',
  top: 'inset-x-0 top-0 max-h-[85vh] w-full border-b',
  bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full border-t',
}

/**
 * Sheet (slide-over panel). Renders a fixed overlay with a panel anchored to
 * one side of the viewport. Closes on Escape and backdrop click.
 */
export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, side = 'right', children, className }) => {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className={cn('fixed inset-0 z-50', className)} role="presentation">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn('absolute flex flex-col bg-background shadow-lg', sideClassMap[side])}
      >
        {children}
      </div>
    </div>
  )
}
Sheet.displayName = 'Sheet'

export const SheetContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-1 flex-col gap-4 overflow-y-auto p-6', className)} {...props} />
  )
)
SheetContent.displayName = 'SheetContent'

export const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />
  )
)
SheetHeader.displayName = 'SheetHeader'

export const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  )
)
SheetTitle.displayName = 'SheetTitle'

export const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
SheetDescription.displayName = 'SheetDescription'

export const SheetFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
)
SheetFooter.displayName = 'SheetFooter'

export const SheetClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="Close"
      className={cn(
        'absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="text-xl leading-none">&times;</span>
    </button>
  )
)
SheetClose.displayName = 'SheetClose'

export default Sheet
`;

const popoverSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface PopoverContextValue {
  open: boolean
  setOpen: (v: boolean) => void
  align: 'start' | 'center' | 'end'
  side: 'top' | 'bottom'
}
const PopoverContext = React.createContext<PopoverContextValue | null>(null)

export interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
  children: React.ReactNode
}

/**
 * Popover orchestrator. Provides open state to <PopoverTrigger /> and
 * <PopoverContent />. Closes on outside click and Escape.
 */
export const Popover: React.FC<PopoverProps> = ({
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  align = 'center',
  side = 'bottom',
  children,
}) => {
  const [internal, setInternal] = React.useState(defaultOpen)
  const open = controlled ?? internal
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (controlled === undefined) setInternal(v)
      onOpenChange?.(v)
    },
    [controlled, onOpenChange],
  )
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <PopoverContext.Provider value={{ open, setOpen, align, side }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}
Popover.displayName = 'Popover'

export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) throw new Error('PopoverTrigger must be used within Popover')
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={ctx.open}
      onClick={(e) => {
        ctx.setOpen(!ctx.open)
        onClick?.(e)
      }}
      className={cn('inline-flex', className)}
      {...props}
    />
  )
})
PopoverTrigger.displayName = 'PopoverTrigger'

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) throw new Error('PopoverContent must be used within Popover')
  if (!ctx.open) return null
  const alignClass =
    ctx.align === 'start' ? 'left-0' : ctx.align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'
  const sideClass = ctx.side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
  return (
    <div
      ref={ref}
      role="dialog"
      className={cn(
        'absolute z-50 w-72 rounded-md border border-border bg-background p-4 shadow-md',
        alignClass,
        sideClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = 'PopoverContent'

export default Popover
`;

const tooltipSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface TooltipProps {
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
  children: React.ReactNode
}

const sideClassMap: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
}

/**
 * Tooltip. Shows content on hover/focus of its children, after a delay.
 * Keyboard-accessible via focus bubbling.
 */
export const Tooltip = React.forwardRef<HTMLSpanElement, TooltipProps>(
  ({ content, side = 'top', delay = 300, children }, ref) => {
    const [open, setOpen] = React.useState(false)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const tooltipId = React.useId()

    const show = React.useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setOpen(true), delay)
    }, [delay])
    const hide = React.useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setOpen(false)
    }, [])

    React.useEffect(
      () => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      },
      [],
    )

    return (
      <span
        ref={ref}
        className="relative inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
        {open && (
          <span
            id={tooltipId}
            role="tooltip"
            className={cn(
              'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md',
              sideClassMap[side]
            )}
          >
            {content}
          </span>
        )}
      </span>
    )
  }
)
Tooltip.displayName = 'Tooltip'

export default Tooltip
`;

const dropdownMenuSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}
const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

export interface DropdownMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/**
 * Dropdown menu orchestrator. Provides open state to <DropdownMenuTrigger />
 * and <DropdownMenuContent />. Closes on outside click and Escape.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  children,
}) => {
  const [internal, setInternal] = React.useState(defaultOpen)
  const open = controlled ?? internal
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (controlled === undefined) setInternal(v)
      onOpenChange?.(v)
    },
    [controlled, onOpenChange],
  )
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}
DropdownMenu.displayName = 'DropdownMenu'

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) throw new Error('DropdownMenuTrigger must be used within DropdownMenu')
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      onClick={(e) => {
        ctx.setOpen(!ctx.open)
        onClick?.(e)
      }}
      className={cn('inline-flex', className)}
      {...props}
    />
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end'
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'start', ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext)
    if (!ctx) throw new Error('DropdownMenuContent must be used within DropdownMenu')
    if (!ctx.open) return null
    return (
      <div
        ref={ref}
        role="menu"
        className={cn(
          'absolute z-50 mt-2 min-w-[12rem] rounded-md border border-border bg-background p-1 shadow-md',
          align === 'end' ? 'right-0' : 'left-0',
          className
        )}
        {...props}
      />
    )
  }
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean
  variant?: 'default' | 'destructive'
}

export const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, variant = 'default', onClick, ...props }, ref) => {
    const ctx = React.useContext(DropdownMenuContext)
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        onClick={(e) => {
          onClick?.(e)
          ctx?.setOpen(false)
        }}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
          inset && 'pl-8',
          variant === 'destructive' &&
            'text-destructive focus:bg-destructive focus:text-destructive-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    />
  )
)
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export default DropdownMenu
`;

const alertSource = `import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        info: 'border-blue-500/30 bg-blue-500/5 text-foreground',
        success: 'border-emerald-500/30 bg-emerald-500/5 text-foreground',
        warning: 'border-amber-500/30 bg-amber-500/5 text-foreground',
        error: 'border-destructive/30 bg-destructive/5 text-foreground',
      },
    },
    defaultVariants: { variant: 'info' },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
)
Alert.displayName = 'Alert'

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
)
AlertTitle.displayName = 'AlertTitle'

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
)
AlertDescription.displayName = 'AlertDescription'

export { alertVariants }
export default Alert
`;

// ═══════════════════════════════════════════════════════════════════════════
// DATA (5)
// ═══════════════════════════════════════════════════════════════════════════

const cardSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-background text-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export default Card
`;

const tabsSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
  baseId: string
}
const TabsContext = React.createContext<TabsContextValue | null>(null)

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value: controlled, defaultValue, onValueChange, children, ...props }, ref) => {
    const baseId = React.useId()
    const [internal, setInternal] = React.useState(defaultValue ?? '')
    const value = controlled ?? internal
    const setValue = React.useCallback(
      (v: string) => {
        if (controlled === undefined) setInternal(v)
        onValueChange?.(v)
      },
      [controlled, onValueChange],
    )

    return (
      <TabsContext.Provider value={{ value, setValue, baseId }}>
        <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1 rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = 'TabsList'

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, id, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (!ctx) throw new Error('TabsTrigger must be used within Tabs')
    const isActive = ctx.value === value
    const triggerId = id ?? (ctx.baseId + '-trigger-' + value)
    const contentId = ctx.baseId + '-content-' + value
    return (
      <button
        ref={ref}
        id={triggerId}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={contentId}
        data-state={isActive ? 'active' : 'inactive'}
        onClick={() => ctx.setValue(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          isActive ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, id, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (!ctx) throw new Error('TabsContent must be used within Tabs')
    const isActive = ctx.value === value
    if (!isActive) return null
    const contentId = id ?? (ctx.baseId + '-content-' + value)
    const triggerId = ctx.baseId + '-trigger-' + value
    return (
      <div
        ref={ref}
        id={contentId}
        role="tabpanel"
        aria-labelledby={triggerId}
        tabIndex={0}
        className={cn(
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md',
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = 'TabsContent'

export default Tabs
`;

const accordionSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface AccordionContextValue {
  value: string[]
  toggle: (v: string) => void
  type: 'single' | 'multiple'
}
const AccordionContext = React.createContext<AccordionContextValue | null>(null)

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, type = 'single', defaultValue, children, ...props }, ref) => {
    const initial = React.useMemo<string[]>(() => {
      if (defaultValue === undefined) return []
      if (Array.isArray(defaultValue)) return defaultValue
      return [defaultValue]
    }, [])
    const [value, setValue] = React.useState<string[]>(initial)

    const toggle = React.useCallback(
      (v: string) => {
        setValue((prev) => {
          if (type === 'single') {
            return prev.includes(v) ? [] : [v]
          }
          return prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
        })
      },
      [type],
    )

    return (
      <AccordionContext.Provider value={{ value, toggle, type }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = 'Accordion'

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      data-value={value}
      className={cn('border-b border-border', className)}
      {...props}
    />
  )
)
AccordionItem.displayName = 'AccordionItem'

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = React.useContext(AccordionContext)
    if (!ctx) throw new Error('AccordionTrigger must be used within Accordion')
    const isOpen = ctx.value.includes(value)
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        onClick={() => ctx.toggle(value)}
        className={cn(
          'flex w-full flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        {...props}
      >
        {children}
        <span
          className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
          aria-hidden="true"
        >
          &#9662;
        </span>
      </button>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = React.useContext(AccordionContext)
    if (!ctx) throw new Error('AccordionContent must be used within Accordion')
    const isOpen = ctx.value.includes(value)
    if (!isOpen) return null
    return (
      <div
        ref={ref}
        role="region"
        className={cn('overflow-hidden pb-4 pt-0 text-sm', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'

export default Accordion
`;

const tableSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b border-border', className)} {...props} />
  )
)
TableHeader.displayName = 'TableHeader'

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
)
TableBody.displayName = 'TableBody'

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
)
TableFooter.displayName = 'TableFooter'

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-3 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
  )
)
TableCaption.displayName = 'TableCaption'

export default Table
`;

const paginationSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
}

type PageItem = number | 'ellipsis'

function getPageRange(current: number, total: number, siblings: number): PageItem[] {
  const totalNumbers = siblings * 2 + 5
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const leftSibling = Math.max(current - siblings, 1)
  const rightSibling = Math.min(current + siblings, total)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < total - 1
  const range: PageItem[] = [1]
  if (showLeftEllipsis) range.push('ellipsis')
  for (let i = leftSibling; i <= rightSibling; i++) range.push(i)
  if (showRightEllipsis) range.push('ellipsis')
  range.push(total)
  return range
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, currentPage, totalPages, onPageChange, siblingCount = 1, ...props }, ref) => {
    if (totalPages <= 0) return null
    const pages = getPageRange(currentPage, totalPages, siblingCount)
    const prevDisabled = currentPage <= 1
    const nextDisabled = currentPage >= totalPages

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn('flex items-center gap-1', className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => {
            if (!prevDisabled) onPageChange(currentPage - 1)
          }}
          disabled={prevDisabled}
          aria-label="Previous page"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="sr-only">Previous</span>
        </button>
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span
              key={'ellipsis-' + idx}
              className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground"
              aria-hidden="true"
            >
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              aria-label={'Page ' + p}
              className={cn(
                'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                p === currentPage
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-accent',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => {
            if (!nextDisabled) onPageChange(currentPage + 1)
          }}
          disabled={nextDisabled}
          aria-label="Next page"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <span aria-hidden="true">&rarr;</span>
          <span className="sr-only">Next</span>
        </button>
      </nav>
    )
  }
)
Pagination.displayName = 'Pagination'

export default Pagination
`;

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION (4)
// ═══════════════════════════════════════════════════════════════════════════

const breadcrumbSource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface BreadcrumbContextValue {
  separator: React.ReactNode
}
const BreadcrumbContext = React.createContext<BreadcrumbContextValue>({ separator: '/' })

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode
}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, separator = '/', children, ...props }, ref) => (
    <BreadcrumbContext.Provider value={{ separator }}>
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn('flex', className)}
        {...props}
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {children}
        </ol>
      </nav>
    </BreadcrumbContext.Provider>
  )
)
Breadcrumb.displayName = 'Breadcrumb'

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  )
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      className={cn('text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded', className)}
      {...props}
    />
  )
)
BreadcrumbLink.displayName = 'BreadcrumbLink'

export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  )
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

export const BreadcrumbSeparator = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(BreadcrumbContext)
    return (
      <span
        ref={ref}
        role="presentation"
        aria-hidden="true"
        className={cn('text-muted-foreground', className)}
        {...props}
      >
        {children ?? ctx.separator}
      </span>
    )
  }
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

export default Breadcrumb
`;

const navSource = `import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

export interface NavItem {
  id: string
  label: string
  href?: string
  icon?: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

const navVariants = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center gap-1',
      vertical: 'flex-col gap-1',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export interface NavProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navVariants> {
  items: NavItem[]
  label?: string
}

export const Nav = React.forwardRef<HTMLElement, NavProps>(
  ({ className, items, orientation = 'horizontal', label = 'Navigation', ...props }, ref) => (
    <nav
      ref={ref}
      aria-label={label}
      className={cn(navVariants({ orientation }), className)}
      {...props}
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={item.disabled ? undefined : (item.href ?? '#')}
          onClick={(e) => {
            if (item.disabled) {
              e.preventDefault()
              return
            }
            item.onClick?.()
          }}
          aria-current={item.active ? 'page' : undefined}
          aria-disabled={item.disabled || undefined}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            orientation === 'vertical' && 'w-full justify-start',
            item.active
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            item.disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {item.icon !== undefined && (
            <span className="shrink-0" aria-hidden="true">{item.icon}</span>
          )}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  )
)
Nav.displayName = 'Nav'

export { navVariants }
export default Nav
`;

const asyncBoundarySource = `import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { Spinner } from './spinner'
import { ErrorState } from './error-state'
import { EmptyState } from './empty-state'

export interface AsyncBoundaryProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean
  isError: boolean
  isEmpty?: boolean
  error?: string
  loadingLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  errorTitle?: string
  retryLabel?: string
  onRetry?: () => void
  children: React.ReactNode
}

/**
 * AsyncBoundary: declaratively handles the four async UI states
 * (loading / error / empty / success) in one place.
 *
 * @example
 * <AsyncBoundary isLoading={isLoading} isError={isError} error={error?.message} onRetry={refetch} isEmpty={items.length === 0} emptyTitle="No items">
 *   <ItemsList items={items} />
 * </AsyncBoundary>
 */
export const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  className,
  isLoading,
  isError,
  isEmpty = false,
  error = 'An unexpected error occurred. Please try again.',
  loadingLabel = 'Loading',
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  errorTitle = 'Something went wrong',
  retryLabel = 'Try again',
  onRetry,
  children,
  ...props
}) => {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className={cn(
          'flex w-full items-center justify-center gap-3 p-8 text-muted-foreground',
          className,
        )}
        {...props}
      >
        <Spinner size="md" label={loadingLabel} />
        <span className="text-sm">{loadingLabel}...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        className={className}
        title={errorTitle}
        message={error}
        retryLabel={retryLabel}
        {...(onRetry !== undefined ? { onRetry } : {})}
      />
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        className={className}
        title={emptyTitle}
        {...(emptyDescription !== undefined ? { description: emptyDescription } : {})}
        {...(emptyAction !== undefined ? { action: emptyAction } : {})}
      />
    )
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}
AsyncBoundary.displayName = 'AsyncBoundary'

export default AsyncBoundary
`;

const separatorSource = `import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const separatorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export interface SeparatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {
  decorative?: boolean
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation, decorative = true, ...props }, ref) => {
    const effectiveOrientation: 'horizontal' | 'vertical' =
      orientation === 'vertical' ? 'vertical' : 'horizontal'
    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : effectiveOrientation}
        className={cn(separatorVariants({ orientation: effectiveOrientation }), className)}
        {...props}
      />
    )
  }
)
Separator.displayName = 'Separator'

export { separatorVariants }
export default Separator
`;

// ═══════════════════════════════════════════════════════════════════════════
// MANIFEST
// ═══════════════════════════════════════════════════════════════════════════

export type DesignSystemCategory =
  | 'lib'
  | 'layout'
  | 'form'
  | 'feedback'
  | 'overlay'
  | 'data'
  | 'navigation';

export interface DesignSystemEntry {
  name: string;
  category: DesignSystemCategory;
  path: string;
}

/**
 * Static manifest of all design system files. Useful for documentation,
 * tree-shaking-aware imports, or scaffolding tools.
 */
export const DESIGN_SYSTEM_MANIFEST: readonly DesignSystemEntry[] = [
  { name: 'utils', category: 'lib', path: 'src/shared/lib/utils.ts' },

  { name: 'Container', category: 'layout', path: 'src/shared/ui/container.tsx' },
  { name: 'Stack', category: 'layout', path: 'src/shared/ui/stack.tsx' },
  { name: 'Grid', category: 'layout', path: 'src/shared/ui/grid.tsx' },
  { name: 'Sidebar', category: 'layout', path: 'src/shared/ui/sidebar.tsx' },
  { name: 'Header', category: 'layout', path: 'src/shared/ui/header.tsx' },

  { name: 'Button', category: 'form', path: 'src/shared/ui/button.tsx' },
  { name: 'Input', category: 'form', path: 'src/shared/ui/input.tsx' },
  { name: 'Textarea', category: 'form', path: 'src/shared/ui/textarea.tsx' },
  { name: 'Select', category: 'form', path: 'src/shared/ui/select.tsx' },
  { name: 'Checkbox', category: 'form', path: 'src/shared/ui/checkbox.tsx' },
  { name: 'Switch', category: 'form', path: 'src/shared/ui/switch.tsx' },

  { name: 'Badge', category: 'feedback', path: 'src/shared/ui/badge.tsx' },
  { name: 'Skeleton', category: 'feedback', path: 'src/shared/ui/skeleton.tsx' },
  { name: 'Progress', category: 'feedback', path: 'src/shared/ui/progress.tsx' },
  { name: 'Spinner', category: 'feedback', path: 'src/shared/ui/spinner.tsx' },
  { name: 'EmptyState', category: 'feedback', path: 'src/shared/ui/empty-state.tsx' },
  { name: 'ErrorState', category: 'feedback', path: 'src/shared/ui/error-state.tsx' },

  { name: 'Dialog', category: 'overlay', path: 'src/shared/ui/dialog.tsx' },
  { name: 'Sheet', category: 'overlay', path: 'src/shared/ui/sheet.tsx' },
  { name: 'Popover', category: 'overlay', path: 'src/shared/ui/popover.tsx' },
  { name: 'Tooltip', category: 'overlay', path: 'src/shared/ui/tooltip.tsx' },
  { name: 'DropdownMenu', category: 'overlay', path: 'src/shared/ui/dropdown-menu.tsx' },
  { name: 'Alert', category: 'overlay', path: 'src/shared/ui/alert.tsx' },

  { name: 'Card', category: 'data', path: 'src/shared/ui/card.tsx' },
  { name: 'Tabs', category: 'data', path: 'src/shared/ui/tabs.tsx' },
  { name: 'Accordion', category: 'data', path: 'src/shared/ui/accordion.tsx' },
  { name: 'Table', category: 'data', path: 'src/shared/ui/table.tsx' },
  { name: 'Pagination', category: 'data', path: 'src/shared/ui/pagination.tsx' },

  { name: 'Breadcrumb', category: 'navigation', path: 'src/shared/ui/breadcrumb.tsx' },
  { name: 'Nav', category: 'navigation', path: 'src/shared/ui/nav.tsx' },
  { name: 'AsyncBoundary', category: 'navigation', path: 'src/shared/ui/async-boundary.tsx' },
  { name: 'Separator', category: 'navigation', path: 'src/shared/ui/separator.tsx' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the complete design system (33 files: 32 components + 1 utils).
 * Returns GeneratedFile[] ready to be merged into a project's file set.
 *
 * Files are organized in src/shared/ui/ (components) and src/shared/lib/ (utils).
 * Each component is production-quality: TypeScript strict, cva variants,
 * forwardRef, a11y attributes, Tailwind + CSS variables, no Radix deps.
 */
export function buildDesignSystem(): GeneratedFile[] {
  return [
    // ── Lib ───────────────────────────────────────────────────────────
    file('src/shared/lib/utils.ts', utilsSource),

    // ── Layout ────────────────────────────────────────────────────────
    file('src/shared/ui/container.tsx', containerSource),
    file('src/shared/ui/stack.tsx', stackSource),
    file('src/shared/ui/grid.tsx', gridSource),
    file('src/shared/ui/sidebar.tsx', sidebarSource),
    file('src/shared/ui/header.tsx', headerSource),

    // ── Form ──────────────────────────────────────────────────────────
    file('src/shared/ui/button.tsx', buttonSource),
    file('src/shared/ui/input.tsx', inputSource),
    file('src/shared/ui/textarea.tsx', textareaSource),
    file('src/shared/ui/select.tsx', selectSource),
    file('src/shared/ui/checkbox.tsx', checkboxSource),
    file('src/shared/ui/switch.tsx', switchSource),

    // ── Feedback ──────────────────────────────────────────────────────
    file('src/shared/ui/badge.tsx', badgeSource),
    file('src/shared/ui/skeleton.tsx', skeletonSource),
    file('src/shared/ui/progress.tsx', progressSource),
    file('src/shared/ui/spinner.tsx', spinnerSource),
    file('src/shared/ui/empty-state.tsx', emptyStateSource),
    file('src/shared/ui/error-state.tsx', errorStateSource),

    // ── Overlay ───────────────────────────────────────────────────────
    file('src/shared/ui/dialog.tsx', dialogSource),
    file('src/shared/ui/sheet.tsx', sheetSource),
    file('src/shared/ui/popover.tsx', popoverSource),
    file('src/shared/ui/tooltip.tsx', tooltipSource),
    file('src/shared/ui/dropdown-menu.tsx', dropdownMenuSource),
    file('src/shared/ui/alert.tsx', alertSource),

    // ── Data ──────────────────────────────────────────────────────────
    file('src/shared/ui/card.tsx', cardSource),
    file('src/shared/ui/tabs.tsx', tabsSource),
    file('src/shared/ui/accordion.tsx', accordionSource),
    file('src/shared/ui/table.tsx', tableSource),
    file('src/shared/ui/pagination.tsx', paginationSource),

    // ── Navigation ────────────────────────────────────────────────────
    file('src/shared/ui/breadcrumb.tsx', breadcrumbSource),
    file('src/shared/ui/nav.tsx', navSource),
    file('src/shared/ui/async-boundary.tsx', asyncBoundarySource),
    file('src/shared/ui/separator.tsx', separatorSource),
  ];
}
