import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getContext } from '@microsoft/power-apps/app'
import { ThemeContext } from '../hooks/useTheme'
import { RoleContext } from '../hooks/useRole'
import { ACCESS_BY_ROLE, ROLE_LABELS } from '../lib/constants'
import type { AppRole, AppUser } from '../domain/app'

const THEME_STORAGE_KEY = 'insureai-theme'
const ROLE_STORAGE_KEY = 'insureai-role'

function buildUser(role: AppRole, name: string, email?: string): AppUser {
  const nameParts = name.trim().split(/\s+/).filter(Boolean)
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
    : nameParts[0]?.slice(0, 2) || 'U'

  return {
    name,
    initials: initials.toUpperCase(),
    role,
    roleLabel: ROLE_LABELS[role],
    email,
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState({ name: 'User', email: undefined as string | undefined })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })
  const [role, setRole] = useState<AppRole>(() => {
    const stored = window.localStorage.getItem(ROLE_STORAGE_KEY) as AppRole | null
    return stored ?? 'administrator'
  })

  useEffect(() => {
    let active = true

    getContext()
      .then(({ user }) => {
        if (!active) return
        const email = user.userPrincipalName?.trim()
        setIdentity({
          name: user.fullName?.trim() || email || 'User',
          email,
        })
      })
      .catch(() => {
        if (active) setIdentity({ name: 'User', email: undefined })
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, role)
  }, [role])

  const roleValue = useMemo(
    () => ({
      user: buildUser(role, identity.name, identity.email),
      role,
      setRole,
      hasAccess: (bucket?: 'leads' | 'products' | 'admin') =>
        bucket == null ? true : ACCESS_BY_ROLE[role].includes(bucket),
    }),
    [identity, role],
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
