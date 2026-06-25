import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'
import type { HTMLAttributes } from 'react'

const cardVariants = cva('rounded-[22px] border border-border-soft bg-surface', {
  variants: {
    variant: {
      default: 'shadow-soft',
      premium: 'shadow-card',
      glass: 'bg-surface/85 shadow-card backdrop-blur-xl',
      interactive:
        'shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-premium',
    },
    padding: {
      md: 'p-5',
      lg: 'p-6',
      none: 'p-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />
}
