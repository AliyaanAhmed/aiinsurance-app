import { ShieldAlert } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export function AccessDeniedPage() {
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/12 text-danger">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-[28px] font-bold">Access denied</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your current preview role does not have access to this route. Use the role switch in the header to test the brief’s route-visibility rules.
      </p>
    </Card>
  )
}
