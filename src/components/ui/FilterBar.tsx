import { Search } from 'lucide-react'
import { Card } from './Card'
import { Input } from './Input'
import type { ReactNode } from 'react'

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  children?: ReactNode
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
}: FilterBarProps) {
  return (
    <Card className="flex flex-col gap-3 border-border-soft bg-surface/95 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-[460px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 rounded-full border-border-soft bg-surface-soft pl-9"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </Card>
  )
}
