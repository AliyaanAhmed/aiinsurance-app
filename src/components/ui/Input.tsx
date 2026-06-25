import { cn } from '../../lib/cn'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-[42px] w-full rounded-[14px] border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10',
        className,
      )}
      {...props}
    />
  )
}
