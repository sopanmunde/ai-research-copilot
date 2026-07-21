import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md border border-primary/20",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-destructive/20 border border-destructive/20 dark:bg-rose-600 dark:hover:bg-rose-500",
        outline:
          "border border-border/80 bg-background text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary/50 shadow-2xs",
        ghost:
          "hover:bg-accent/80 hover:text-accent-foreground text-muted-foreground dark:hover:bg-zinc-800/80",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
        transparent:
          "bg-transparent border border-transparent text-foreground hover:bg-accent/50 hover:border-border/50 shadow-none active:scale-[0.98]",

        // Custom Premium Variants
        purple:
          "bg-purple-600 text-white shadow-sm hover:bg-purple-500 hover:shadow-purple-500/25 dark:bg-purple-600 dark:hover:bg-purple-500 border border-purple-500/30",
        emerald:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 hover:shadow-emerald-500/25 dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-emerald-500/30",
        gradient:
          "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 hover:shadow-purple-500/20 border border-white/10",
        glass:
          "bg-background/60 backdrop-blur-md border border-border/80 text-foreground hover:bg-accent hover:text-accent-foreground shadow-2xs hover:border-border",
        amber:
          "bg-amber-600 text-white shadow-sm hover:bg-amber-500 hover:shadow-amber-500/25 border border-amber-500/30",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 text-sm",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-6 text-sm font-semibold has-[>svg]:px-4",
        xl: "h-11 rounded-xl px-7 text-base font-bold has-[>svg]:px-5",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
