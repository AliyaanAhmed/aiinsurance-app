import { CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, Bot, Clock3, FileText, ShieldAlert, Sparkles } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getDashboardMetrics } from '../../services/dashboardService'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/layout/PageHeader'
import { formatCompactNumber, formatCurrency } from '../../lib/formatters'
import type { InquirySummary } from '../../domain/app'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { data, loading, error } = useAsyncData(getDashboardMetrics, [])

  if (loading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-40 rounded-[22px]" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-36 rounded-[22px]" />
          <Skeleton className="h-36 rounded-[22px]" />
          <Skeleton className="h-36 rounded-[22px]" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Dashboard failed to load</h2>
        <p className="text-sm text-muted-foreground">
          {error ?? 'Unable to load executive metrics from Dataverse.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="Executive operations workspace"
        description="Premium underwriting command center with real Dataverse-backed operational signals."
        actions={
          data.previewMode ? (
            <Badge variant="info">Preview Fallback Active</Badge>
          ) : (
            <Badge variant="approved">Hosted Runtime Connected</Badge>
          )
        }
      />

      <Card variant="glass" className="overflow-hidden border-border-soft bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.10),transparent_28%)]">
        <div className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-5">
            <Badge variant="new">Executive operations workspace</Badge>
            <div className="space-y-3">
              <h2 className="text-[32px] font-bold leading-tight">{data.greeting}</h2>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground">
                {data.heroDescription}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.heroMetrics.map((metric) => (
                <Card key={metric.label} className="bg-surface/80">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold">{formatCompactNumber(metric.value)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{metric.helper}</p>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {data.insightCards.map((insight, index) => (
              <Card key={insight.title} className="flex items-start gap-4 bg-surface/90">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {index === 0 ? <Bot className="h-5 w-5" /> : index === 1 ? <ShieldAlert className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground">{insight.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        {[...data.inquiryKpis, ...data.quoteKpis, ...data.renewalKpis].map((metric) => (
          <Card key={metric.label} variant="premium" className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-info opacity-70" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</p>
                <p className="mt-5 text-[30px] font-bold leading-none">
                  {metric.label.includes('Premium') ? formatCompactNumber(metric.value) : formatCompactNumber(metric.value)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{metric.helper}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card variant="premium" className="h-[360px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Inquiry Trend</h3>
              <p className="text-sm text-muted-foreground">Operational trend view built from the current inquiry mix.</p>
            </div>
            <Badge variant="neutral">Last active dataset</Badge>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={data.inquiryMix}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.15)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card variant="premium" className="h-[360px]">
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Inquiries by Product</h3>
            <p className="text-sm text-muted-foreground">Current product contribution across inquiry volume.</p>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie
                data={data.topProducts}
                dataKey="value"
                nameKey="label"
                innerRadius={65}
                outerRadius={110}
                fill="#8B5CF6"
                paddingAngle={4}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card variant="premium" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Recent Inquiries</h3>
              <p className="text-sm text-muted-foreground">Fresh intake records and their underwriting posture.</p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/inquiries">View All</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-[18px] border border-border-soft">
            <div className="grid grid-cols-[1.1fr_1.1fr_0.7fr_0.5fr_0.8fr_0.55fr] bg-surface-muted px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              <span>Inquiry #</span>
              <span>Client</span>
              <span>Status</span>
              <span>AI Score</span>
              <span>Premium</span>
              <span>Updated</span>
            </div>
            <div className="divide-y divide-border-soft">
              {data.recentInquiries.map((item) => (
                <RecentInquiryRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        </Card>
        <div className="space-y-6">
          <Card variant="premium" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Quotes by Status</h3>
                <p className="text-sm text-muted-foreground">Distribution of quote outcomes and active pipeline.</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/quotes">Open quotes</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {data.quoteStatusMix.map((item) => (
                <StatusBar key={item.label} label={item.label} value={item.value} total={Math.max(1, data.recentQuotes.length || data.quoteStatusMix.reduce((sum, current) => sum + current.value, 0))} />
              ))}
            </div>
          </Card>
          <Card variant="premium" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/12 text-warning">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Operational Overview</h3>
                <p className="text-sm text-muted-foreground">Executive summary across in-progress underwriting activity.</p>
              </div>
            </div>
            <div className="grid gap-4">
              {[...data.inquiryKpis.slice(0, 2), ...data.quoteKpis.slice(0, 2)].map((metric) => (
                <OperationalCard key={metric.label} title={metric.label} value={String(metric.value)} helper={metric.helper} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function RecentInquiryRow({ item }: { item: InquirySummary }) {
  return (
    <Link
      to={`/inquiries/${item.id}`}
      className="grid grid-cols-[1.1fr_1.1fr_0.7fr_0.5fr_0.8fr_0.55fr] items-center gap-3 px-4 py-4 transition hover:bg-primary/5"
    >
      <div className="space-y-1">
        <p className="font-semibold text-primary">{item.inquiryNumber}</p>
        <p className="text-[12px] text-muted-foreground">{item.productName}</p>
      </div>
      <div className="space-y-1">
        <p className="font-medium">{item.accountName}</p>
        <p className="text-[12px] text-muted-foreground">{item.contactName}</p>
      </div>
      <div>
        <Badge variant={item.status.toLowerCase().includes('review') ? 'review' : 'new'}>{item.status}</Badge>
      </div>
      <p className="font-semibold">{item.riskScore}</p>
      <p className="font-medium">{formatCurrency(item.grossPremium)}</p>
      <p className="text-[12px] text-muted-foreground">{formatRelativeTime(item.createdOn)}</p>
    </Link>
  )
}

function StatusBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = Math.max(8, Math.round((value / total) * 100))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-muted">
        <div className="h-2 rounded-full bg-gradient-to-r from-primary to-info" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function OperationalCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-surface-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  )
}

function formatRelativeTime(value: string) {
  if (!value) return 'Now'
  const current = new Date()
  const date = new Date(value)
  const diff = Math.round((current.getTime() - date.getTime()) / 3600000)
  if (Number.isNaN(diff)) return 'Now'
  if (diff <= 1) return '1h ago'
  if (diff < 24) return `${diff}h ago`
  const days = Math.round(diff / 24)
  return `${days}d ago`
}
