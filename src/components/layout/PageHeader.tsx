import { Card } from '../ui/Card'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  actions?: ReactNode
  eyebrow?: string
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  eyebrow = 'Insurance Platform',
}: PageHeaderProps) {
  return (
    <Card className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </Card>
  )
}
