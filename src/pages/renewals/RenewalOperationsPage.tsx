import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { createRenewalReminder, listRenewals } from '../../services/renewalsService'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { FilterBar } from '../../components/ui/FilterBar'
import type { RenewalSummary } from '../../domain/app'
import type { ColumnDef } from '@tanstack/react-table'
import { formatCurrency, formatDate, formatRelativeDays } from '../../lib/formatters'
import { Link } from 'react-router-dom'

export function RenewalOperationsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Due Soon' | 'Due in 30 Days' | 'Overdue' | 'Reminder Sent'>('all')
  const [selected, setSelected] = useState<RenewalSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data, loading, error } = useAsyncData(listRenewals, [refreshKey])

  const renewals = data ?? []
  const dueSoon = renewals.filter((item) => item.status === 'Due Soon').length
  const overdue = renewals.filter((item) => item.status === 'Overdue').length
  const reminderSent = renewals.filter((item) => item.reminderCount > 0 || item.reminderSent).length

  const filteredRenewals = useMemo(() => {
    let items = renewals
    if (statusFilter === 'Reminder Sent') items = items.filter((item) => item.reminderCount > 0)
    else if (statusFilter !== 'all') items = items.filter((item) => item.status === statusFilter)

    if (!search.trim()) return items
    const query = search.toLowerCase()
    return items.filter((item) =>
      [item.policyNumber, item.client, item.product, item.status].join(' ').toLowerCase().includes(query),
    )
  }, [renewals, search, statusFilter])

  const columns: ColumnDef<RenewalSummary>[] = [
    { header: 'Policy Number', accessorKey: 'policyNumber' },
    { header: 'Client', accessorKey: 'client' },
    { header: 'Product', accessorKey: 'product' },
    { header: 'Expiry Date', cell: ({ row }) => formatDate(row.original.expiryDate) },
    { header: 'Days Remaining', cell: ({ row }) => formatRelativeDays(row.original.daysRemaining) },
    {
      header: 'Renewal Status',
      cell: ({ row }) => (
        <Badge variant={badgeForRenewal(row.original)}>
          {row.original.reminderCount > 0 || row.original.reminderSent ? 'Reminder Sent' : row.original.status}
        </Badge>
      ),
    },
    { header: 'Reminder Count', accessorKey: 'reminderCount' },
    { header: 'Premium', cell: ({ row }) => formatCurrency(row.original.premiumTotal) },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setSelected(row.original)}>
            Open Policy Action
          </Button>
        </div>
      ),
    },
  ]

  async function handleReminderSend() {
    if (!selected?.inquiryId) return
    try {
      setActionError(null)
      await createRenewalReminder(selected.id, selected.inquiryId, selected.policyNumber)
      setSelected(null)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to create renewal reminder.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Renewal Watchlist"
        description="Dedicated operational renewal workspace with urgency states, live queue slicing, and Dataverse-backed reminder actions."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <RenewalCard label="Total Renewals" value={renewals.length} helper="Live Dataverse policy records" />
        <RenewalCard label="Due Soon" value={dueSoon} helper="Records approaching the next operational step" />
        <RenewalCard label="Overdue" value={overdue} helper="Items needing immediate follow-up" />
        <RenewalCard label="Reminder Sent" value={reminderSent} helper="Renewals with recorded email reminder results" />
      </div>
      <div className="flex flex-wrap gap-2">
        {(['all', 'Due Soon', 'Due in 30 Days', 'Overdue', 'Reminder Sent'] as const).map((filter) => (
          <Button
            key={filter}
            variant={statusFilter === filter ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(filter)}
          >
            {filter === 'all' ? 'All Renewals' : filter}
          </Button>
        ))}
      </div>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search renewals"
      />
      {loading ? (
        <Card>Loading renewals...</Card>
      ) : error ? (
        <Card>{error}</Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRenewals}
          emptyTitle="No renewal records found"
          emptyDescription="Policy records with expiry dates will populate the watchlist automatically."
        />
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/55 p-4 backdrop-blur-sm">
          <Card variant="premium" className="h-full w-full max-w-xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Renewal Action</p>
                  <h2 className="mt-1 text-2xl font-bold">{selected.policyNumber}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Quick action drawer aligned to the renewal watchlist workflow.
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Client" value={selected.client} />
                <InfoCard label="Product" value={selected.product} />
                <InfoCard label="Expiry Date" value={formatDate(selected.expiryDate)} />
                <InfoCard label="Premium" value={formatCurrency(selected.premiumTotal)} />
              </div>
              <Card className="space-y-4 bg-surface-soft">
                <h3 className="text-lg font-semibold">Recommended Queue Actions</h3>
                <p className="text-sm text-muted-foreground">
                  This action writes a real Dataverse reminder result against the linked renewal inquiry.
                </p>
                {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void handleReminderSend()}>Record Reminder Sent</Button>
                  <Button variant="secondary" asChild>
                    <Link to={`/policies/${selected.id}`}>Open Policy Workspace</Link>
                  </Button>
                  {selected.inquiryId ? (
                    <Button variant="outline" asChild>
                      <Link to={`/inquiries/${selected.inquiryId}`}>Open Inquiry</Link>
                    </Button>
                  ) : null}
                  {selected.quoteId ? (
                    <Button variant="ghost" asChild>
                      <Link to={`/quotes/${selected.quoteId}/edit`}>Open Quote</Link>
                    </Button>
                  ) : null}
                </div>
              </Card>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function RenewalCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <Card variant="premium">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-6 text-4xl font-bold">{value}</p>
      <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
    </Card>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  )
}

function badgeForRenewal(item: RenewalSummary) {
  if (item.reminderCount > 0 || item.reminderSent) return 'info'
  if (item.status === 'Overdue') return 'rejected'
  if (item.status === 'Due Soon') return 'pending'
  return 'approved'
}
