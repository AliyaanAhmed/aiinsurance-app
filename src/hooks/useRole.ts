import { createContext, useContext } from 'react'
import type { AppRole, AppUser } from '../domain/app'

export interface RoleContextValue {
  user: AppUser
  role: AppRole
  setRole: (role: AppRole) => void
  hasAccess: (bucket?: 'leads' | 'products' | 'admin') => boolean
}

export const RoleContext = createContext<RoleContextValue | null>(null)

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used inside RoleContext')
  }
  return context
}
