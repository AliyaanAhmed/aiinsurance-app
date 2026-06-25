import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'
import type { HTMLAttributes } from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
  {
    variants: {
      variant: {
        new: 'border-primary/10 bg-primary/10 text-primary',
        review: 'border-secondary/10 bg-secondary/12 text-secondary',
        approved: 'border-success/10 bg-success/12 text-success',
        rejected: 'border-danger/10 bg-danger/12 text-danger',
        pending: 'border-warning/10 bg-warning/15 text-warning',
        info: 'border-info/10 bg-info/12 text-info',
        neutral: 'border-border-soft bg-surface-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
