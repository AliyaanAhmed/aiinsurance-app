import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Inbox, LayoutGrid, Mail, Rows3 } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { listEmailQueues } from '../../services/emailQueuesService'
import type { EmailQueueSummary } from '../../domain/app'
import { PageHeader } from '../../components/layout/PageHeader'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { formatDate } from '../../lib/formatters'

export function EmailQueuesPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'card' | 'table'>('card')
  const { data, loading, error } = useAsyncData(listEmailQueues, [])

  const filtered = useMemo(() => {
    const records = data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return records

    return records.filter((record) =>
      [record.name, record.mailbox, record.inquiryName, record.bodyPreview, record.status]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [data, search])

  const columns = useMemo<ColumnDef<EmailQueueSummary>[]>(
    () => [
      {
        header: 'Email Queue',
        cell: ({ row }) => (
          <div className="space-y-1">
            <Link
              to={`/email-queues/${row.original.id}`}
              className="font-semibold text-primary transition hover:text-primary/80 hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="line-clamp-2 max-w-[420px] text-[12px] leading-5 text-muted-foreground">
              {row.original.bodyPreview}
            </p>
          </div>
        ),
      },
      {
        header: 'Mailbox',
        cell: ({ row }) => <span className="font-medium">{row.original.mailbox}</span>,
      },
      {
        header: 'Inquiry',
        cell: ({ row }) =>
          row.original.inquiryId ? (
            <Link
              to={`/inquiries/${row.original.inquiryId}`}
              className="font-semibold text-primary transition hover:text-primary/80 hover:underline"
            >
              {row.original.inquiryName}
            </Link>
          ) : (
            <span className="text-muted-foreground">{row.original.inquiryName}</span>
          ),
      },
      { header: 'Status', cell: ({ row }) => <Badge variant="info">{row.original.status}</Badge> },
      { header: 'Created', cell: ({ row }) => formatDate(row.original.createdOn) },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Inbox}
        title="Email Queues"
        description="Review incoming queue emails and open the linked inquiry context from one premium workspace."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Queued Emails" value={filtered.length} helper="Records in the current view" />
        <MetricCard
          label="Linked Inquiries"
          value={filtered.filter((record) => record.inquiryId).length}
          helper="Queue items already matched to an inquiry"
        />
        <MetricCard
          label="Mailboxes"
          value={new Set(filtered.map((record) => record.mailbox).filter(Boolean)).size}
          helper="Distinct source mailboxes"
        />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search email queues by name, mailbox, inquiry, or body"
      >
        <div className="inline-flex rounded-full border border-border-soft bg-surface-muted p-1">
          <Button
            type="button"
            variant={view === 'card' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => setView('card')}
          >
            <LayoutGrid className="h-4 w-4" />
            Card View
          </Button>
          <Button
            type="button"
            variant={view === 'table' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-full"
            onClick={() => setView('table')}
          >
            <Rows3 className="h-4 w-4" />
            Table View
          </Button>
        </div>
      </FilterBar>

      {loading ? (
        <div className="rounded-[22px] border border-border-soft bg-surface p-6 text-sm text-muted-foreground">
          Loading email queue records...
        </div>
      ) : error ? (
        <div className="rounded-[22px] border border-danger/25 bg-danger/5 p-6 text-sm text-danger">
          {error}
        </div>
      ) : view === 'table' ? (
        <DataTable
          columns={columns}
          data={filtered}
          emptyTitle="No email queue records found"
          emptyDescription="Incoming email queue records will appear here once they are captured."
        />
      ) : filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
          {filtered.map((record) => (
            <Link key={record.id} to={`/email-queues/${record.id}`} className="group block">
              <Card className="flex h-full flex-col justify-between overflow-hidden rounded-[26px] border-border-soft bg-white/95 transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-premium dark:bg-surface">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-base font-bold tracking-[-0.01em] group-hover:text-primary">
                          {record.name}
                        </h3>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{record.mailbox}</p>
                      </div>
                    </div>
                    <Badge variant="info">{record.status}</Badge>
                  </div>

                  <p className="line-clamp-4 min-h-[84px] rounded-[18px] border border-border-soft bg-surface-soft/80 px-4 py-3 text-sm leading-7 text-foreground/80">
                    {record.bodyPreview}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
                  <span className="text-xs text-muted-foreground">{formatDate(record.createdOn)}</span>
                  <span className="rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {record.inquiryName}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="py-12 text-center">
          <p className="text-base font-semibold">No email queue records found</p>
          <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search criteria.</p>
        </Card>
      )}
    </div>
  )
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <Card className="overflow-hidden rounded-[24px] bg-white/95 dark:bg-surface">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.03em]">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Inbox className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
