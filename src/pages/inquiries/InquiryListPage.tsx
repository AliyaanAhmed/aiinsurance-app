import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ClipboardList } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { listInquiries } from '../../services/inquiriesService'
import type { InquirySummary } from '../../domain/app'
import { PageHeader } from '../../components/layout/PageHeader'
import { FilterBar } from '../../components/ui/FilterBar'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../lib/formatters'

const columns: ColumnDef<InquirySummary>[] = [
  {
    header: 'Inquiry',
    cell: ({ row }) => (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-info/10 bg-info/10 px-2 py-1 text-[12px] font-semibold text-info">
            {row.original.inquiryNumber}
          </span>
          <Link to={`/inquiries/${row.original.id}`} className="font-semibold text-primary transition hover:text-primary/80 hover:underline">
            {row.original.name}
          </Link>
        </div>
        <p className="line-clamp-2 max-w-[340px] text-[12px] text-muted-foreground">{row.original.summary}</p>
      </div>
    ),
  },
  {
    header: 'Broker',
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="font-medium">{row.original.brokerName}</p>
        <p className="text-[12px] text-muted-foreground">{row.original.accountName}</p>
      </div>
    ),
  },
  {
    header: 'Product',
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="font-medium">{row.original.productName}</p>
        <p className="text-[12px] text-muted-foreground">{row.original.planName}</p>
      </div>
    ),
  },
  {
    header: 'Status',
    cell: ({ row }) => <Badge variant={badgeForStatus(row.original.status)}>{row.original.status}</Badge>,
  },
  {
    header: 'Risk Score',
    cell: ({ row }) => (
      <div className="min-w-[84px]">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{row.original.riskScore}</span>
          <span className="text-[12px] text-muted-foreground">{riskLabel(row.original.riskScore)}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-muted">
          <div
            className={`h-1.5 rounded-full ${riskBarClass(row.original.riskScore)}`}
            style={{ width: `${Math.max(8, Math.min(row.original.riskScore, 100))}%` }}
          />
        </div>
      </div>
    ),
  },
  {
    header: 'Premium',
    cell: ({ row }) => formatCurrency(row.original.grossPremium),
  },
  {
    header: 'Updated',
    cell: ({ row }) => formatDate(row.original.createdOn),
  },
]

export function InquiriesPage() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const scope = params.get('type') ?? undefined
  const { data, loading, error } = useAsyncData(() => listInquiries(), [])

  const scopeFiltered = useMemo(() => {
    const records = data ?? []
    if (!scope) return records
    return records.filter((record) => record.inquiryType.toLowerCase() === scope.toLowerCase())
  }, [data, scope])

  const filtered = useMemo(() => {
    const records = scopeFiltered
    if (!search.trim()) return records
    const query = search.toLowerCase()
    return records.filter((record) =>
      [
        record.name,
        record.inquiryNumber,
        record.accountName,
        record.contactName,
        record.productName,
        record.planName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [scopeFiltered, search])

  const counts = useMemo(() => {
    const records = data ?? []
    return {
      all: records.length,
      new: records.filter((record) => record.inquiryType === 'New').length,
      renewal: records.filter((record) => record.inquiryType === 'Renewal').length,
      endorsement: records.filter((record) => record.inquiryType === 'Endorsement').length,
    }
  }, [data])

  const premiumTotal = filtered.reduce((sum, item) => sum + item.grossPremium, 0)
  const averageRiskScore =
    filtered.length === 0
      ? 0
      : Math.round(filtered.reduce((sum, item) => sum + item.riskScore, 0) / filtered.length)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        title={scope ? `${scope} Inquiries` : 'All Inquiries'}
        description="Operational queue for browsing intake records and drilling into the underwriting workspace."
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search inquiries by number, broker, or product"
      />
      <div className="flex flex-wrap items-center gap-2">
        <ScopeChip label="All Inquiries" count={counts.all} active={!scope} to="/inquiries" />
        <ScopeChip label="New Business" count={counts.new} active={scope === 'New'} to="/inquiries?type=New" />
        <ScopeChip label="Renewals" count={counts.renewal} active={scope === 'Renewal'} to="/inquiries?type=Renewal" />
        <ScopeChip label="Endorsements" count={counts.endorsement} active={scope === 'Endorsement'} to="/inquiries?type=Endorsement" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MiniMetric label="Visible Records" value={String(filtered.length)} helper="Current queue after scope and search." />
        <MiniMetric label="Premium Total" value={formatCurrency(premiumTotal)} helper="Gross premium from the visible queue." />
        <MiniMetric label="Avg Risk Score" value={String(averageRiskScore)} helper="Average underwriting risk across visible records." />
      </div>
      {loading ? (
        <div className="rounded-[22px] border border-border-soft bg-surface p-6 text-sm text-muted-foreground">
          Loading inquiry queue from Dataverse...
        </div>
      ) : error ? (
        <div className="rounded-[22px] border border-danger/25 bg-danger/5 p-6 text-sm text-danger">
          {error}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyTitle="No inquiries found"
          emptyDescription="Try adjusting the scope or search criteria."
        />
      )}
    </div>
  )
}

function ScopeChip({
  label,
  count,
  active,
  to,
}: {
  label: string
  count: number
  active: boolean
  to: string
}) {
  return (
    <Button asChild variant={active ? 'primary' : 'secondary'} size="sm" className="rounded-full">
      <Link to={to}>
        {label}
        <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${active ? 'bg-white/20 text-white' : 'bg-surface text-muted-foreground'}`}>
          {count}
        </span>
      </Link>
    </Button>
  )
}

function MiniMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-surface-soft p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  )
}

function badgeForStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('approve') || normalized.includes('won')) return 'approved'
  if (normalized.includes('review')) return 'review'
  if (normalized.includes('declin') || normalized.includes('reject') || normalized.includes('lost')) return 'rejected'
  if (normalized.includes('pending') || normalized.includes('await')) return 'pending'
  return 'new'
}

function riskLabel(score: number) {
  if (score >= 80) return 'High'
  if (score >= 60) return 'Watch'
  return 'Open'
}

function riskBarClass(score: number) {
  if (score >= 80) return 'bg-danger'
  if (score >= 60) return 'bg-warning'
  return 'bg-primary'
}
