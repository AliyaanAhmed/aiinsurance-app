import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { ScrollToTop } from '../system/ScrollToTop'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopHeader />
          <main className="flex-1 p-4 lg:p-6">
            <div className="space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
