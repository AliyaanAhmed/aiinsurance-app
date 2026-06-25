import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { ArrowUpRight, BarChart3, ShieldCheck, Target } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getAnalyticsSnapshot } from '../../services/analyticsService'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { formatCompactNumber, formatCurrency, formatPercent } from '../../lib/formatters'

export function AnalyticsPage() {
  const { data, loading, error } = useAsyncData(getAnalyticsSnapshot, [])

  if (loading) return <Card>Loading analytics snapshot...</Card>
  if (error || !data) return <Card>{error ?? 'Analytics not available.'}</Card>

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="AI Analytics"
        description="Premium operational intelligence across inquiries, quote conversion, premium movement, and product concentration."
      />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card variant="premium" className="overflow-hidden p-0">
          <div className="border-b border-border-soft bg-gradient-to-r from-primary/[0.08] via-white to-info/[0.10] px-6 py-6 dark:from-primary/20 dark:via-slate-950 dark:to-info/20">
            <Badge variant="info">Live performance intelligence</Badge>
            <h2 className="mt-4 text-[30px] font-bold tracking-[-0.02em]">Command center analytics</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Underwriting, quote conversion, and product concentration are stitched into one premium monitoring surface.
            </p>
          </div>
          <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total Premium" value={formatCurrency(data.totalPremium)} helper="Premium captured across generated quotes." tone="primary" />
            <Metric label="Average Risk Score" value={String(data.averageRiskScore)} helper="Portfolio average risk quality from intake." tone="warning" />
            <Metric label="Renewal Load" value={formatCompactNumber(data.renewalLoad)} helper="Renewal-related inquiry workload in motion." tone="info" />
            <Metric label="Quote Win Rate" value={formatPercent(data.quoteWinRate)} helper="Won quotes against the current quote inventory." tone="success" />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Conversion funnel</p>
              <h3 className="mt-2 text-xl font-semibold">Operational flow</h3>
            </div>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            {data.conversionFunnel.map((item) => {
              const max = Math.max(...data.conversionFunnel.map((entry) => entry.value), 1)
              const percent = Math.max(10, Math.round((item.value / max) * 100))
              return (
                <div key={item.label} className="rounded-[18px] border border-border-soft bg-surface-soft p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCompactNumber(item.value)}</p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={barTone(item.tone)}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="h-[360px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Inquiry Trend</h3>
              <p className="text-sm text-muted-foreground">Volume shape across the currently available inquiry timeline.</p>
            </div>
            <Badge variant="review">Trend</Badge>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={data.inquiryTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.15)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Area dataKey="value" fill="#2563EB" fillOpacity={0.22} stroke="#2563EB" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-[360px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Premium Momentum</h3>
              <p className="text-sm text-muted-foreground">Total premium carried by quote creation activity.</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-success" />
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={data.premiumTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.15)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Area dataKey="value" fill="#14B8A6" fillOpacity={0.25} stroke="#14B8A6" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="h-[360px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Product Distribution</h3>
              <p className="text-sm text-muted-foreground">Inquiry mix by product family.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-secondary" />
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={data.productDistribution} dataKey="value" nameKey="label" innerRadius={68} outerRadius={112}>
                {data.productDistribution.map((entry, index) => (
                  <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-[360px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">Status and Risk Profile</h3>
              <p className="text-sm text-muted-foreground">Operational stage counts next to current risk concentration.</p>
            </div>
            <Badge variant="approved">Live profile</Badge>
          </div>
          <div className="grid h-[88%] gap-4 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.statusDistribution} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(82,97,115,0.15)" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={95} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {data.riskDistribution.map((item) => {
                const total = Math.max(data.riskDistribution.reduce((sum, entry) => sum + entry.value, 0), 1)
                const percent = Math.round((item.value / total) * 100)
                return (
                  <div key={item.label} className="rounded-[18px] border border-border-soft bg-surface-soft p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-lg font-bold">{item.value}</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={riskTone(item.label)}
                        style={{ width: `${Math.max(percent, 10)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{percent}% of current inquiry volume</p>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">Product Performance Drill-down</h3>
            <p className="text-sm text-muted-foreground">Cross-compare inquiry volume, quote throughput, and premium concentration.</p>
          </div>
          <Badge variant="neutral">{formatCompactNumber(data.drilldown.length)} segments</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.03em] text-muted-foreground">Segment</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.03em] text-muted-foreground">Inquiries</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.03em] text-muted-foreground">Quotes</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.03em] text-muted-foreground">Premium</th>
                <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.03em] text-muted-foreground">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.drilldown.map((row) => {
                const share = data.totalPremium > 0 ? Math.round((row.premium / data.totalPremium) * 100) : 0
                return (
                  <tr key={row.label} className="border-b border-border-soft">
                    <td className="px-4 py-4 text-sm font-medium">{row.label}</td>
                    <td className="px-4 py-4 text-sm">{row.inquiries}</td>
                    <td className="px-4 py-4 text-sm">{row.quotes}</td>
                    <td className="px-4 py-4 text-sm">{formatCurrency(row.premium)}</td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-[180px] items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-info" style={{ width: `${Math.max(share, 4)}%` }} />
                        </div>
                        <span className="text-sm font-semibold">{share}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Metric({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone: 'primary' | 'success' | 'warning' | 'info'
}) {
  return (
    <div className="rounded-[20px] border border-border-soft bg-white/80 p-4 shadow-soft dark:bg-slate-950/40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${dotTone(tone)}`} />
      </div>
      <p className="mt-5 text-4xl font-bold tracking-[-0.03em]">{value}</p>
      <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
    </div>
  )
}

function dotTone(tone: 'primary' | 'success' | 'warning' | 'info') {
  if (tone === 'success') return 'bg-success'
  if (tone === 'warning') return 'bg-warning'
  if (tone === 'info') return 'bg-info'
  return 'bg-primary'
}

function barTone(tone: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info') {
  if (tone === 'success') return 'h-full rounded-full bg-success'
  if (tone === 'warning') return 'h-full rounded-full bg-warning'
  if (tone === 'danger') return 'h-full rounded-full bg-danger'
  if (tone === 'secondary') return 'h-full rounded-full bg-secondary'
  if (tone === 'info') return 'h-full rounded-full bg-info'
  return 'h-full rounded-full bg-primary'
}

function riskTone(label: string) {
  if (label === 'Low Risk') return 'h-full rounded-full bg-success'
  if (label === 'Medium Risk') return 'h-full rounded-full bg-warning'
  return 'h-full rounded-full bg-danger'
}

const PIE_COLORS = [
  '#2563EB',
  '#14B8A6',
  '#7C3AED',
  '#F59E0B',
  '#06B6D4',
  '#64748B',
  '#EF4444',
]
