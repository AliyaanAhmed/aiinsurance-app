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
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  BrainCircuit,
  Mail,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getDashboardMetrics } from '../../services/dashboardService'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { formatCompactNumber, formatCurrency, formatPercent } from '../../lib/formatters'

export function AnalyticsPage() {
  const { data, loading, error } = useAsyncData(getDashboardMetrics, [])

  if (loading) return <Card>Loading analytics workspace...</Card>
  if (error || !data) return <Card>{error ?? 'Analytics not available.'}</Card>

  const topBroker = data.inquiryByBrokers[0]
  const topProduct = data.wonPremiumByProduct[0]
  const averageRisk = data.inquiryKpis.find((item) => item.label === 'Average Risk Score')?.value ?? 0
  const conversionFunnel = [
    {
      label: 'Inquiries',
      value: data.totalInquiries,
      helper: 'Total intake records received into the command center.',
      tone: 'primary' as const,
    },
    {
      label: 'Quoted',
      value: data.totalQuotes,
      helper: 'Quotes currently assembled from inquiry demand.',
      tone: 'info' as const,
    },
    {
      label: 'Won',
      value: data.wonQuotes,
      helper: 'Commercially won quotes ready for servicing follow-through.',
      tone: 'success' as const,
    },
    {
      label: 'Renewals',
      value: data.renewalKpis[0]?.value ?? 0,
      helper: 'Renewal-driven operational volume requiring follow-up.',
      tone: 'warning' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="AI Analytics"
        description="Executive underwriting analytics across broker emails, inquiry conversion, reassurance performance, and product-plan concentration."
        actions={<Badge variant="info">Live Dataverse analytics</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card variant="premium" className="overflow-hidden p-0">
          <div className="relative overflow-hidden rounded-[22px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.14),transparent_36%)]" />
            <div className="relative space-y-6 px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <Badge variant="review">Executive intelligence</Badge>
                  <h2 className="mt-4 text-[30px] font-bold tracking-[-0.03em]">Underwriting performance cockpit</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Track broker-driven intake, inquiry-to-quote conversion, won premium movement, and live product concentration from one premium analytics surface.
                  </p>
                </div>
                <div className="hidden h-16 w-16 items-center justify-center rounded-[20px] border border-white/50 bg-white/70 text-primary shadow-soft backdrop-blur md:flex dark:border-white/10 dark:bg-slate-950/30">
                  <BrainCircuit className="h-8 w-8" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <HeroMetric
                  icon={Mail}
                  label="Broker Emails"
                  value={formatCompactNumber(data.brokerEmailCount)}
                  helper="Emails linked to live inquiry records."
                  tone="primary"
                />
                <HeroMetric
                  icon={Target}
                  label="Inquiry to Quote"
                  value={formatPercent(data.inquiryToQuoteConversionRate)}
                  helper={`${formatCompactNumber(data.totalQuotes)} quotes from ${formatCompactNumber(data.totalInquiries)} inquiries.`}
                  tone="success"
                />
                <HeroMetric
                  icon={TrendingUp}
                  label="Quote to Won"
                  value={formatPercent(data.quoteToWonConversionRate)}
                  helper={`${formatCompactNumber(data.wonQuotes)} won quotes in current portfolio.`}
                  tone="secondary"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Conversion matrix</p>
              <h3 className="mt-2 text-xl font-semibold">Flow health</h3>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CompactInsight
              label="Total Inquiries"
              value={formatCompactNumber(data.totalInquiries)}
              helper="All command-center intake records."
            />
            <CompactInsight
              label="Quotes Generated"
              value={formatCompactNumber(data.totalQuotes)}
              helper="Pricing workbench records created."
            />
            <CompactInsight
              label="Reassurance"
              value={formatCurrency(data.wonPremiumTotal)}
              helper="Won premium across active commercial outcomes."
            />
            <CompactInsight
              label="Average Risk Score"
              value={String(averageRisk)}
              helper="Live average across the inquiry portfolio."
            />
          </div>
          <div className="space-y-3">
            {[
              {
                label: 'Inquiry to Quote',
                value: data.inquiryToQuoteConversionRate,
                tone: 'bg-primary',
              },
              {
                label: 'Quote to Won',
                value: data.quoteToWonConversionRate,
                tone: 'bg-secondary',
              },
              {
                label: 'Renewal load',
                value: Math.min(100, data.renewalKpis[0]?.value ?? 0),
                tone: 'bg-warning',
                suffix: ' live',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-border-soft bg-surface-soft/70 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-sm font-bold">
                    {item.suffix ? `${item.value}${item.suffix}` : formatPercent(item.value)}
                  </p>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-muted">
                  <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${Math.max(item.value, 8)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <AnalyticsChartCard
          title="Broker Email Intake"
          description="Daily email activity linked against inquiry records."
          badge="Email flow"
        >
          {data.brokerEmailTrend.length === 0 ? (
            <ChartEmptyState title="No broker email activity yet" text="Email-linked inquiry activity will appear here once Dataverse email records are connected." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.brokerEmailTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="emailTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.14)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCompactNumber(Number(value))} />} />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} fill="url(#emailTrendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Inquiry to Won Flow"
          description="Operational pipeline progression from intake through commercial success."
          badge="Conversion"
        >
          <div className="grid h-full gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              {conversionFunnel.map((item) => (
                <div key={item.label} className="rounded-[20px] border border-border-soft bg-white px-4 py-4 shadow-soft dark:bg-slate-950/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.helper}</p>
                    </div>
                    <p className="text-xl font-bold">{formatCompactNumber(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionFunnel} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.14)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCompactNumber(Number(value))} />} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {conversionFunnel.map((item) => (
                    <Cell key={item.label} fill={toneColor(item.tone)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Reassurance by Product"
          description="Won premium concentration across product lines."
          badge="Product mix"
        >
          <div className="grid h-full gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            {data.wonPremiumByProduct.length === 0 ? (
              <ChartEmptyState title="No won premium by product yet" text="This chart will populate once quote outcomes move into won status." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.wonPremiumByProduct} layout="vertical" margin={{ top: 8, right: 12, left: 14, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(82,97,115,0.14)" />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                    <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={112} />
                    <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCurrency(Number(value))} />} />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                      {data.wonPremiumByProduct.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {data.wonPremiumByProduct.slice(0, 5).map((item, index) => (
                    <RankedRow
                      key={item.label}
                      index={index}
                      label={item.label}
                      value={formatCurrency(item.value)}
                      tone={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Reassurance by Plan"
          description="Won premium stacked against plan-level packaging."
          badge="Plan mix"
        >
          {data.wonPremiumByPlan.length === 0 ? (
            <ChartEmptyState title="No won premium by plan yet" text="Plan concentration appears as soon as won quotes carry linked plan records." />
          ) : (
            <div className="grid h-full gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.wonPremiumByPlan} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="planPremiumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.14)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                  <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCurrency(Number(value))} />} />
                  <Area type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={3} fill="url(#planPremiumFill)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {data.wonPremiumByPlan.slice(0, 5).map((item, index) => (
                  <RankedRow
                    key={item.label}
                    index={index}
                    label={item.label}
                    value={formatCurrency(item.value)}
                    tone={PLAN_COLORS[index % PLAN_COLORS.length]}
                  />
                ))}
              </div>
            </div>
          )}
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Inquiry by Products"
          description="Live inquiry concentration by product family."
          badge="Product demand"
        >
          {data.topProducts.length === 0 ? (
            <ChartEmptyState title="No product-linked inquiries yet" text="As inquiries are linked to products, product demand will appear here." />
          ) : (
            <div className="grid h-full gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.topProducts} dataKey="value" nameKey="label" innerRadius={58} outerRadius={104} paddingAngle={2}>
                    {data.topProducts.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCompactNumber(Number(value))} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {data.topProducts.map((item, index) => (
                  <RankedRow
                    key={item.label}
                    index={index}
                    label={item.label}
                    value={`${formatCompactNumber(item.value)} inquiries`}
                    tone={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </div>
            </div>
          )}
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Inquiry by Brokers"
          description="Broker contribution based on inquiry-linked account relationships."
          badge="Broker mix"
        >
          {data.inquiryByBrokers.length === 0 ? (
            <ChartEmptyState title="No broker-linked inquiries yet" text="Broker concentration will show here once inquiries are linked to broker accounts." />
          ) : (
            <div className="grid h-full gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.inquiryByBrokers} layout="vertical" margin={{ top: 8, right: 12, left: 22, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(82,97,115,0.14)" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={128} />
                  <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCompactNumber(Number(value))} />} />
                  <Bar dataKey="value" fill="#7C3AED" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {data.inquiryByBrokers.map((item, index) => (
                  <RankedRow
                    key={item.label}
                    index={index}
                    label={item.label}
                    value={`${formatCompactNumber(item.value)} inquiries`}
                    tone={BROKER_COLORS[index % BROKER_COLORS.length]}
                  />
                ))}
              </div>
            </div>
          )}
        </AnalyticsChartCard>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border-soft px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Operational highlights</p>
                <h3 className="mt-2 text-xl font-semibold">What needs attention</h3>
              </div>
              <Badge variant="approved">AI signal</Badge>
            </div>
          </div>
          <div className="grid gap-4 p-6">
            {[
              {
                icon: Mail,
                title: 'Top broker email source',
                text: topBroker
                  ? `${topBroker.label} currently leads inquiry intake with ${formatCompactNumber(topBroker.value)} linked inquiries.`
                  : 'No broker-linked intake has been identified yet.',
              },
              {
                icon: BriefcaseBusiness,
                title: 'Top reassurance product',
                text: topProduct
                  ? `${topProduct.label} holds the strongest won premium concentration at ${formatCurrency(topProduct.value)}.`
                  : 'No won premium has been attributed to any product yet.',
              },
              {
                icon: ShieldCheck,
                title: 'Risk posture',
                text: `The current inquiry portfolio is averaging a risk score of ${averageRisk}, giving operations a quick signal on underwriting complexity.`,
              },
              {
                icon: TrendingUp,
                title: 'Commercial outcome',
                text: `${formatPercent(data.quoteToWonConversionRate)} of quote inventory has already converted into won business.`,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[20px] border border-border-soft bg-white px-4 py-4 shadow-soft dark:bg-slate-950/45">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border-soft px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Recent activity</p>
                <h3 className="mt-2 text-xl font-semibold">Live operational feed</h3>
              </div>
              <Badge variant="neutral">{formatCompactNumber(data.recentInquiries.length + data.recentQuotes.length)} events</Badge>
            </div>
          </div>
          <div className="grid gap-4 p-6">
            <div className="rounded-[20px] border border-border-soft bg-surface-soft/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Recent inquiries</p>
                <Badge variant="new">{formatCompactNumber(data.recentInquiries.length)}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentInquiries.slice(0, 4).map((item) => (
                  <ActivityRow
                    key={item.id}
                    title={item.name}
                    meta={`${item.productName} · ${item.status}`}
                    aside={formatCurrency(item.grossPremium)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-border-soft bg-surface-soft/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Recent quotes</p>
                <Badge variant="review">{formatCompactNumber(data.recentQuotes.length)}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {data.recentQuotes.slice(0, 4).map((item) => (
                  <ActivityRow
                    key={item.id}
                    title={item.name}
                    meta={`${item.productName} · ${item.status}`}
                    aside={formatCurrency(item.totalPremium)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof Mail
  label: string
  value: string
  helper: string
  tone: 'primary' | 'success' | 'secondary'
}) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/88 px-4 py-4 shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-950/45">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-[28px] font-bold tracking-[-0.03em]">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${heroTone(tone)}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  )
}

function CompactInsight({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-surface-soft/70 px-4 py-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold tracking-[-0.03em]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  )
}

function AnalyticsChartCard({
  title,
  description,
  badge,
  children,
}: {
  title: string
  description: string
  badge: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border-soft px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <Badge variant="neutral">{badge}</Badge>
        </div>
      </div>
      <div className="h-[360px] px-6 py-5">{children}</div>
    </Card>
  )
}

function RankedRow({
  index,
  label,
  value,
  tone,
}: {
  index: number
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-white px-4 py-3 shadow-soft dark:bg-slate-950/45">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: tone }}
          >
            {index + 1}
          </span>
          <p className="truncate text-sm font-semibold">{label}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

function ActivityRow({
  title,
  meta,
  aside,
}: {
  title: string
  meta: string
  aside: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[16px] border border-border-soft bg-white px-4 py-3 shadow-soft dark:bg-slate-950/45">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold">{aside}</p>
    </div>
  )
}

function ChartEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h4 className="mt-4 text-lg font-semibold">{title}</h4>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

function AnalyticsTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ value?: number; color?: string }>
  label?: string
  formatter?: (value: number) => string
}) {
  if (!active || !payload?.length) return null

  const value = Number(payload[0]?.value ?? 0)
  return (
    <div className="rounded-[18px] border border-border-soft bg-white px-3 py-2.5 shadow-[0_18px_35px_rgba(15,23,42,0.12)] dark:bg-slate-950">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{formatter ? formatter(value) : formatCompactNumber(value)}</p>
    </div>
  )
}

function heroTone(tone: 'primary' | 'success' | 'secondary') {
  if (tone === 'success') return 'bg-success/12 text-success'
  if (tone === 'secondary') return 'bg-secondary/12 text-secondary'
  return 'bg-primary/10 text-primary'
}

function toneColor(tone: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info') {
  if (tone === 'success') return '#10B981'
  if (tone === 'warning') return '#F59E0B'
  if (tone === 'danger') return '#EF4444'
  if (tone === 'secondary') return '#7C3AED'
  if (tone === 'info') return '#06B6D4'
  return '#2563EB'
}

const PIE_COLORS = ['#2563EB', '#14B8A6', '#7C3AED', '#F59E0B', '#06B6D4', '#64748B']
const PLAN_COLORS = ['#14B8A6', '#2563EB', '#0891B2', '#0F766E', '#38BDF8']
const BROKER_COLORS = ['#7C3AED', '#2563EB', '#14B8A6', '#F59E0B', '#EC4899', '#64748B']
