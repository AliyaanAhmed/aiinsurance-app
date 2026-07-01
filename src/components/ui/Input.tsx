import { cn } from '../../lib/cn'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'form-field-surface h-[42px] w-full rounded-[14px] border border-border px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10',
        className,
      )}
      {...props}
    />
  )
}
