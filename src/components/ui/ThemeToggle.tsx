import { MoonStar, SunMedium } from 'lucide-react'
import { Button } from './Button'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className={
        theme === 'light'
          ? 'border border-border-soft bg-white text-foreground shadow-soft hover:bg-surface-muted'
          : 'border border-white/10 bg-surface text-foreground shadow-soft hover:bg-surface-soft'
      }
    >
      {theme === 'dark' ? (
        <SunMedium className="h-4 w-4" />
      ) : (
        <MoonStar className="h-4 w-4" />
      )}
    </Button>
  )
}
