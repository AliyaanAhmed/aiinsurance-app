import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from '../hooks/useTheme'
import { RoleContext } from '../hooks/useRole'
import { ACCESS_BY_ROLE, ROLE_LABELS } from '../lib/constants'
import type { AppRole, AppUser } from '../domain/app'

const THEME_STORAGE_KEY = 'insureai-theme'
const ROLE_STORAGE_KEY = 'insureai-role'

function buildUser(role: AppRole): AppUser {
  return {
    name: 'Anees Ur Rehman',
    initials: 'AU',
    role,
    roleLabel: ROLE_LABELS[role],
    email: 'anees.ur.rehman@insureai.com',
    phone: '+971 4 000 0000',
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })
  const [role, setRole] = useState<AppRole>(() => {
    const stored = window.localStorage.getItem(ROLE_STORAGE_KEY) as AppRole | null
    return stored ?? 'administrator'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, role)
  }, [role])

  const roleValue = useMemo(
    () => ({
      user: buildUser(role),
      role,
      setRole,
      hasAccess: (bucket?: 'leads' | 'products' | 'admin') =>
        bucket == null ? true : ACCESS_BY_ROLE[role].includes(bucket),
    }),
    [role],
  )

  const themeValue = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return (
    <ThemeContext.Provider value={themeValue}>
      <RoleContext.Provider value={roleValue}>{children}</RoleContext.Provider>
    </ThemeContext.Provider>
  )
}
