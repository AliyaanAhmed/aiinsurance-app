import { NavLink, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '../../lib/constants'
import { cn } from '../../lib/cn'
import { Shield } from 'lucide-react'
import { useRole } from '../../hooks/useRole'

export function Sidebar() {
  const { hasAccess, user } = useRole()
  const location = useLocation()
  const grouped = APP_ROUTES.filter((route) => !route.disabled || hasAccess(route.bucket)).reduce<
    Record<string, typeof APP_ROUTES>
  >((accumulator, route) => {
    if (route.bucket && !hasAccess(route.bucket)) return accumulator
    accumulator[route.group] ??= []
    accumulator[route.group].push(route)
    return accumulator
  }, {})

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[280px] lg:flex-col lg:border-r lg:border-white/8 lg:bg-[linear-gradient(180deg,#071421_0%,#0A1A2B_55%,#091522_100%)] lg:text-white">
      <div className="border-b border-white/8 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(59,130,246,0.12)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[22px] font-bold leading-none">InsureAI</h2>
            <p className="mt-1 text-[12px] text-slate-300">Insurance Platform</p>
          </div>
        </div>
      </div>
      <nav className="scrollbar-hidden flex-1 space-y-7 overflow-y-auto px-3 py-5">
        {Object.entries(grouped).map(([group, routes]) => (
          <div key={group} className="space-y-3">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {group}
            </p>
            <div className="space-y-1.5">
              {routes.map((route) => (
                <NavLink
                  key={route.path}
                  to={route.path}
                  className={() =>
                    cn(
                      'group flex h-11 items-center gap-3 rounded-xl border border-transparent px-4 text-[13px] font-semibold transition duration-150',
                      isRouteActive(location.pathname, location.search, route.path)
                        ? 'border-primary/40 bg-primary text-white shadow-[0_12px_30px_rgba(33,92,190,0.28)]'
                        : 'text-slate-200 hover:translate-x-0.5 hover:border-white/5 hover:bg-white/6',
                      route.disabled && 'opacity-55',
                    )
                  }
                >
                  <route.icon className="h-[17px] w-[17px] text-current" />
                  <span>{route.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 pt-2">
        <div className="rounded-[18px] border border-white/10 bg-[rgba(20,43,82,0.78)] p-4 shadow-[0_20px_40px_rgba(2,6,23,0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold">
              {user.initials}
            </div>
            <div>
              <p className="text-[13px] font-bold">{user.name}</p>
              <p className="text-[12px] text-slate-300">{user.roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function isRouteActive(pathname: string, search: string, target: string) {
  const [targetPath, targetQuery = ''] = target.split('?')
  if (pathname !== targetPath) return false
  const current = search.startsWith('?') ? search.slice(1) : search
  return current === targetQuery
}
