import { ChevronDown, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ROLE_LABELS, ROLE_OPTIONS } from '../../lib/constants'
import { useRole } from '../../hooks/useRole'
import { Select } from '../ui/Select'

export function TopHeader() {
  const { user, role, setRole } = useRole()

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.88)_100%)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.92)_0%,rgba(15,23,42,0.9)_100%)]">
      <div className="flex min-h-[76px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Insurance Platform
          </p>
          <h1 className="text-[17px] font-semibold tracking-[-0.02em] lg:text-[20px]">
            Executive operations workspace
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 self-end lg:self-auto">
          <Button variant="outline" size="md" className="rounded-full border-border-soft bg-surface shadow-soft">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <ThemeToggle />
          <div className="min-w-[210px]">
            <Select
              value={role}
              onValueChange={(value) => setRole(value as typeof role)}
              options={ROLE_OPTIONS.map((option) => ({
                value: option,
                label: ROLE_LABELS[option],
              }))}
              className="h-11 rounded-full border-border-soft bg-surface px-4 font-semibold shadow-soft"
            />
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border-soft bg-surface px-3 py-2 shadow-soft transition hover:border-primary/20 hover:shadow-[0_10px_26px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_14px_30px_rgba(2,6,23,0.28)]">
            <div className="text-right">
              <p className="text-[13px] font-semibold">{user.name}</p>
              <p className="text-[12px] text-muted-foreground">{user.roleLabel}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {user.initials}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  )
}
