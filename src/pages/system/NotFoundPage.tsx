import { SearchX } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-info/12 text-info">
        <SearchX className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-[28px] font-bold">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This route is not part of the first-wave InsureAI implementation yet.
      </p>
    </Card>
  )
}
