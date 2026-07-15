// Complete shadcn-style UI component templates for generated projects.
//
// Problem: the LLM generates code that imports NAMED exports from `./ui/*`
// (e.g. `import { Card, CardContent, CardHeader, CardTitle } from './ui/card'`),
// but the old stub generator only created a DEFAULT export, causing Rollup
// errors like: "Card" is not exported by "src/components/ui/card.tsx".
//
// Solution: when the post-processor detects a missing `./ui/<name>` import,
// it injects the COMPLETE shadcn component below — with all the named exports
// the LLM expects. These are self-contained (only depend on react + clsx +
// tailwind-merge + @radix-ui/* which the post-processor adds to package.json).
//
// Every component uses the `cn()` helper from `../../lib/utils`, which the
// post-processor also ensures exists.

// Map of ui component name → full source (TypeScript / TSX).
// Keys are the file basename (e.g. "card" → src/components/ui/card.tsx).
export const SHADCN_UI_COMPONENTS: Record<string, string> = {
  // ── card.tsx ───────────────────────────────────────────────────────────
  card: `import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-white text-slate-900 shadow-sm", className)}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
`,

  // ── button.tsx ─────────────────────────────────────────────────────────
  button: `import * as React from "react"
import { cn } from "../../lib/utils"

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type Size = "default" | "sm" | "lg" | "icon"

const variantClasses: Record<Variant, string> = {
  default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
  destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
  outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
  ghost: "hover:bg-slate-100 hover:text-slate-900",
  link: "text-slate-900 underline-offset-4 hover:underline",
}

const sizeClasses: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
`,

  // ── badge.tsx ──────────────────────────────────────────────────────────
  badge: `import * as React from "react"
import { cn } from "../../lib/utils"

type Variant = "default" | "secondary" | "destructive" | "outline"

const variantClasses: Record<Variant, string> = {
  default: "border-transparent bg-slate-900 text-slate-50",
  secondary: "border-transparent bg-slate-100 text-slate-900",
  destructive: "border-transparent bg-red-500 text-slate-50",
  outline: "text-slate-950",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
`,

  // ── input.tsx ──────────────────────────────────────────────────────────
  input: `import * as React from "react"
import { cn } from "../../lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
`,

  // ── tabs.tsx (Radix-based, matches shadcn API) ─────────────────────────
  tabs: `import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
`,

  // ── label.tsx ──────────────────────────────────────────────────────────
  label: `import * as React from "react"
import { cn } from "../../lib/utils"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
`,

  // ── textarea.tsx ───────────────────────────────────────────────────────
  textarea: `import * as React from "react"
import { cn } from "../../lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
`,
};

// Set of packages that shadcn UI components depend on (beyond react).
// The post-processor will ensure these are in package.json when any
// ui/* component is injected.
export const SHADCN_DEPENDENCIES: Record<string, string> = {
  // cn() helper deps (also added by usesCn, but listed for safety)
  clsx: "^2.1.1",
  "tailwind-merge": "^2.5.2",
  // tabs.tsx uses Radix
  "@radix-ui/react-tabs": "^1.1.1",
  // The LLM almost always imports icons alongside UI components
  "lucide-react": "^0.439.0",
};

// Returns true if a resolved import path points to a ui component we have
// a complete template for. e.g. "src/components/ui/card" → "card".
export function matchShadcnComponent(
  resolvedBase: string
): string | null {
  // Match paths like .../components/ui/<name> or .../ui/<name>
  const m = resolvedBase.match(/\/ui\/([a-z][a-z0-9-]*)$/i);
  if (!m) return null;
  const name = m[1].toLowerCase();
  return SHADCN_UI_COMPONENTS[name] ? name : null;
}
