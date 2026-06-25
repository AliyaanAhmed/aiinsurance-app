import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white shadow-glow hover:bg-primary-dark',
        secondary:
          'bg-surface-muted text-foreground border border-border-soft hover:bg-surface-soft',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-surface-muted',
        ghost: 'text-muted-foreground hover:bg-surface-muted',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        ai: 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow',
      },
      size: {
        sm: 'h-[34px] px-3 text-xs font-semibold',
        md: 'h-10 px-4 text-[13px] font-semibold',
        lg: 'h-12 px-5 text-sm font-bold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  children: ReactNode
}

export function Button({
  className,
  variant,
  size,
  asChild,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Comp>
  )
}
