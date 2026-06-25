import { Navigate, useLocation } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'
import type { AccessBucket } from '../../domain/app'
import type { ReactNode } from 'react'

export function GuardedRoute({
  bucket,
  children,
}: {
  bucket: AccessBucket
  children: ReactNode
}) {
  const { hasAccess } = useRole()
  const location = useLocation()

  if (!hasAccess(bucket)) {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
