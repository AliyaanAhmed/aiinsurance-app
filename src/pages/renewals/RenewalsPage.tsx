import { ShieldCheck } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { listRenewals } from '../../services/renewalsService'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { DataTable } from '../../components/ui/DataTable'
import type { RenewalSummary } from '../../domain/app'
import type { ColumnDef } from '@tanstack/react-table'
import { formatCurrency, formatDate, formatRelativeDays } from '../../lib/formatters'

const columns: ColumnDef<RenewalSummary>[] = [
  { header: 'Policy Number', accessorKey: 'policyNumber' },
  { header: 'Client', accessorKey: 'client' },
  { header: 'Product', accessorKey: 'product' },
  { header: 'Expiry Date', cell: ({ row }) => formatDate(row.original.expiryDate) },
  { header: 'Days Remaining', cell: ({ row }) => formatRelativeDays(row.original.daysRemaining) },
  { header: 'Renewal Status', cell: ({ row }) => <Badge variant="pending">{row.original.status}</Badge> },
  { header: 'Reminder Count', accessorKey: 'reminderCount' },
  { header: 'Premium', cell: ({ row }) => formatCurrency(row.original.premiumTotal) },
]

export function RenewalsPage() {
  const { data, loading, error } = useAsyncData(listRenewals, [])

  const renewals = data ?? []
  const dueSoon = renewals.filter((item) => item.status === 'Due Soon').length
  const overdue = renewals.filter((item) => item.status === 'Overdue').length

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Renewal Watchlist"
        description="Dedicated operational renewal workspace with urgency states and live Dataverse-backed watch records."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <RenewalCard label="Total Renewals" value={renewals.length} helper="All renewal-type inquiry records" />
        <RenewalCard label="Due Soon" value={dueSoon} helper="Records approaching the next operational step" />
        <RenewalCard label="Overdue" value={overdue} helper="Items needing immediate follow-up" />
      </div>
      {loading ? (
        <Card>Loading renewals...</Card>
      ) : error ? (
        <Card>{error}</Card>
      ) : (
        <DataTable
          columns={columns}
          data={renewals}
          emptyTitle="No renewal records found"
          emptyDescription="Renewal-type inquiries will populate the watchlist automatically."
        />
      )}
    </div>
  )
}

function RenewalCard({
  label,
  value,
  helper,
}: {
  label: string
  value: number
  helper: string
}) {
  return (
    <Card variant="premium">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-6 text-4xl font-bold">{value}</p>
      <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
    </Card>
  )
}
