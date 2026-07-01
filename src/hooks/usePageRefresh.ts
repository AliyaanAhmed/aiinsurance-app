import { useCallback, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'

type RefreshListener = () => void

const routeRefreshVersions = new Map<string, number>()
const listeners = new Set<RefreshListener>()

function subscribe(listener: RefreshListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function getRouteKey(pathname: string) {
  return pathname || '/'
}

function getSnapshotForPath(pathname: string) {
  return routeRefreshVersions.get(getRouteKey(pathname)) ?? 0
}

export function triggerPageRefresh(pathname: string) {
  const key = getRouteKey(pathname)
  const nextVersion = (routeRefreshVersions.get(key) ?? 0) + 1
  routeRefreshVersions.set(key, nextVersion)
  emitChange()
}

export function usePageRefreshVersion() {
  const location = useLocation()
  const pathname = getRouteKey(location.pathname)

  return useSyncExternalStore(
    subscribe,
    () => getSnapshotForPath(pathname),
    () => getSnapshotForPath(pathname),
  )
}

export function usePageRefreshAction() {
  const location = useLocation()

  return useCallback(() => {
    triggerPageRefresh(location.pathname)
  }, [location.pathname])
}
