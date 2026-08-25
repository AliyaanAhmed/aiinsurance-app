import { Handshake } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'

interface ReinsurancePlaceholderPageProps {
  title: string
}

export function ReinsurancePlaceholderPage({ title }: ReinsurancePlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Handshake}
        eyebrow="Reinsurance"
        title={title}
        description={`${title} workspace is ready for build-out.`}
      />

      <Card className="max-w-3xl">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        <h2 className="mt-2 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This Reinsurance module has a working route and sidebar entry. Full
          records, tables, forms, and actions can be added here when the
          Dataverse schema is connected.
        </p>
      </Card>
    </div>
  )
}
