import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRightLeft,
  CircleDollarSign,
  Mail,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getDashboardMetrics } from '../../services/dashboardService'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatCompactNumber, formatCurrency } from '../../lib/formatters'
import { Skeleton } from '../../components/ui/Skeleton'

export function DashboardPage() {
  const { data, loading, error } = useAsyncData(getDashboardMetrics, [])

  if (loading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-64 rounded-[28px]" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[360px] rounded-[26px]" />
          <Skeleton className="h-[360px] rounded-[26px]" />
          <Skeleton className="h-[360px] rounded-[26px]" />
          <Skeleton className="h-[360px] rounded-[26px]" />
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
      <Card
        variant="glass"
        className="relative overflow-hidden border-border-soft bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(240,247,255,0.95)_52%,rgba(231,241,255,0.96)_100%)] px-6 py-6 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.84)_52%,rgba(30,41,59,0.92)_100%)]"
      >
        <div className="pointer-events-none absolute inset-0">
          {[
            { Icon: Mail, className: 'left-[8%] top-[18%]', delay: 0 },
            { Icon: TrendingUp, className: 'right-[10%] top-[22%]', delay: 0.6 },
            { Icon: ShieldCheck, className: 'right-[18%] bottom-[18%]', delay: 0.3 },
            { Icon: CircleDollarSign, className: 'left-[16%] bottom-[16%]', delay: 0.9 },
          ].map(({ Icon, className, delay }, index) => (
            <motion.div
              key={index}
              className={`absolute ${className} text-primary/10 dark:text-primary/12`}
              animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay }}
            >
              <Icon className="h-20 w-20" />
            </motion.div>
          ))}
        </div>
        <div className="relative grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="new">Executive dashboard</Badge>
              {data.previewMode ? <Badge variant="info">Preview fallback</Badge> : <Badge variant="approved">Dataverse live</Badge>}
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Insurance platform</p>
              <h1 className="max-w-4xl text-[34px] font-bold leading-tight tracking-[-0.03em]">{data.greeting}</h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground">{data.heroDescription}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.heroMetrics.map((metric) => (
                <div key={metric.label} className="rounded-[24px] border border-white/60 bg-white/72 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</p>
                  <p className="mt-3 text-4xl font-bold">
                    {metric.label.includes('Reassurance') ? formatCurrency(metric.value) : formatCompactNumber(metric.value)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{metric.helper}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {data.insightCards.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Card className="rounded-[24px] bg-white/78 dark:bg-white/[0.04]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {index === 0 ? <Mail className="h-5 w-5" /> : index === 1 ? <ArrowRightLeft className="h-5 w-5" /> : <PieChartIcon className="h-5 w-5" />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">{insight.title}</h3>
                      <p className="text-sm leading-7 text-muted-foreground">{insight.text}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <MetricPanel
          title="Inquiry by Products"
          description="Current inquiry volume contribution across products."
          eyebrow="Product mix"
          stats={[
            { label: 'Products', value: formatCompactNumber(data.topProducts.length) },
            { label: 'Inquiries', value: formatCompactNumber(data.totalInquiries) },
          ]}
          contentClassName="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]"
        >
          {data.topProducts.length === 0 ? (
            <EmptyChartState
              title="No product-linked inquiries yet"
              description="Once inquiry records are linked with products, the mix will start showing here."
            />
          ) : (
            <>
              <div className="h-[220px] overflow-hidden rounded-[22px] border border-border-soft bg-surface-soft/80 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.topProducts} dataKey="value" nameKey="label" innerRadius={52} outerRadius={88} paddingAngle={4}>
                      {data.topProducts.map((_, index) => (
                        <Cell key={index} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.topProducts.map((item, index) => (
                  <LegendRow key={item.label} color={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} label={item.label} value={`${item.value} inquiries`} />
                ))}
              </div>
            </>
          )}
        </MetricPanel>

        <MetricPanel
          title="Inquiry by Brokers"
          description="Inquiry volume grouped by broker accounts linked on the inquiry record."
          eyebrow="Broker mix"
          stats={[
            { label: 'Brokers', value: formatCompactNumber(data.inquiryByBrokers.length) },
            { label: 'Inquiries', value: formatCompactNumber(data.totalInquiries) },
          ]}
          contentClassName="grid gap-5 lg:grid-cols-[1fr_1fr]"
        >
          {data.inquiryByBrokers.length === 0 ? (
            <EmptyChartState
              title="No broker-linked inquiries yet"
              description="As broker accounts are linked on inquiries, their intake share will start appearing here."
            />
          ) : (
            <>
              <div className="h-[220px] overflow-hidden rounded-[22px] border border-border-soft bg-surface-soft/80 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.inquiryByBrokers} layout="vertical" margin={{ top: 4, right: 6, bottom: 4, left: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(82,97,115,0.12)" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => [`${Number(value ?? 0)} inquiries`, 'Volume']} />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} maxBarSize={20}>
                      {data.inquiryByBrokers.map((_, index) => (
                        <Cell key={index} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.inquiryByBrokers.map((item, index) => (
                  <LegendRow key={item.label} color={PLAN_COLORS[index % PLAN_COLORS.length]} label={item.label} value={`${item.value} inquiries`} />
                ))}
              </div>
            </>
          )}
        </MetricPanel>

        <MetricPanel
          title="Conversion Flow"
          description="How many inquiries move into quotes and how many quotes convert into won outcome."
          eyebrow="Pipeline"
          stats={[
            { label: 'Inquiry -> Quote', value: `${data.inquiryToQuoteConversionRate}%` },
            { label: 'Quote -> Won', value: `${data.quoteToWonConversionRate}%` },
          ]}
          contentClassName="space-y-4"
        >
          <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[24px] border border-border-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(240,247,255,0.72)_100%)] p-5 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.82)_0%,rgba(30,41,59,0.6)_100%)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Conversion performance</p>
              <div className="mt-4 space-y-4">
                <ConversionStage
                  label="Inquiries"
                  value={data.totalInquiries}
                  width="100%"
                  tone="from-sky-500 to-blue-600"
                />
                <ConversionStage
                  label="Quotes"
                  value={data.totalQuotes}
                  width={`${Math.max(data.inquiryToQuoteConversionRate, 18)}%`}
                  tone="from-violet-500 to-indigo-600"
                />
                <ConversionStage
                  label="Won"
                  value={data.wonQuotes}
                  width={`${Math.max(data.totalQuotes === 0 ? 0 : Math.round((data.wonQuotes / Math.max(data.totalInquiries, 1)) * 100), 12)}%`}
                  tone="from-emerald-500 to-teal-600"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <MiniStatCard
                title="Inquiry to Quote"
                value={`${data.inquiryToQuoteConversionRate}%`}
                helper={`${data.totalQuotes} quotes from ${data.totalInquiries} inquiries`}
                tone="primary"
              />
              <MiniStatCard
                title="Quote to Won"
                value={`${data.quoteToWonConversionRate}%`}
                helper={`${data.wonQuotes} won outcomes from live quote records`}
                tone="success"
              />
              <MiniStatCard
                title="Reassurance"
                value={formatCurrency(data.wonPremiumTotal)}
                helper="Current won quote reassurance pool"
                tone="secondary"
              />
              <MiniStatCard
                title="Pipeline Balance"
                value={formatCompactNumber(Math.max(data.totalQuotes - data.wonQuotes, 0))}
                helper="Quotes still open or not yet won"
                tone="warning"
              />
            </div>
          </div>
        </MetricPanel>

        <MetricPanel
          title="Reassurance by Product"
          description="Total reassurance value of won quotes broken down by product."
          eyebrow="Revenue lens"
          stats={[
            { label: 'Reassurance', value: formatCurrency(data.wonPremiumTotal) },
            { label: 'Won quotes', value: formatCompactNumber(data.wonQuotes) },
          ]}
          contentClassName="grid gap-5 lg:grid-cols-[1fr_1fr]"
        >
          {data.wonPremiumByProduct.length === 0 ? (
            <EmptyChartState
              title="No reassurance by product yet"
              description="Product reassurance will appear here as quote outcomes mature into won status."
            />
          ) : (
            <>
              <div className="h-[220px] overflow-hidden rounded-[22px] border border-border-soft bg-surface-soft/80 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.wonPremiumByProduct} layout="vertical" margin={{ top: 4, right: 6, bottom: 4, left: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(82,97,115,0.12)" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" width={108} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} maxBarSize={20}>
                      {data.wonPremiumByProduct.map((_, index) => (
                        <Cell key={index} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.wonPremiumByProduct.slice(0, 5).map((item, index) => (
                  <LegendRow key={item.label} color={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} label={item.label} value={formatCurrency(item.value)} />
                ))}
              </div>
            </>
          )}
        </MetricPanel>

        <MetricPanel
          title="Reassurance by Plan"
          description="Won quote reassurance grouped by the plan selected on the quote."
          eyebrow="Plan view"
          stats={[
            { label: 'Plans tracked', value: formatCompactNumber(data.wonPremiumByPlan.length) },
            { label: 'Reassurance', value: formatCurrency(data.wonPremiumTotal) },
          ]}
          contentClassName="grid gap-5 lg:grid-cols-[1fr_1fr]"
        >
          {data.wonPremiumByPlan.length === 0 ? (
            <EmptyChartState
              title="No reassurance by plan yet"
              description="Plan-linked reassurance will appear here once quotes with plans are marked won."
            />
          ) : (
            <>
              <div className="h-[220px] overflow-hidden rounded-[22px] border border-border-soft bg-surface-soft/80 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.wonPremiumByPlan} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="planPremiumFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.12)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Area type="monotone" dataKey="value" stroke="#6366F1" fill="url(#planPremiumFill)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.wonPremiumByPlan.slice(0, 5).map((item, index) => (
                  <LegendRow key={item.label} color={PLAN_COLORS[index % PLAN_COLORS.length]} label={item.label} value={formatCurrency(item.value)} />
                ))}
              </div>
            </>
          )}
        </MetricPanel>

        <MetricPanel
          title="Inquiry Type Mix"
          description="Live inquiry distribution across New, Renewal, Endorsement, and Claims."
          eyebrow="Intake mix"
          stats={[
            { label: 'Renewals', value: formatCompactNumber(data.renewalKpis[0]?.value ?? 0) },
            { label: 'Average risk', value: formatCompactNumber(data.inquiryKpis[2]?.value ?? 0) },
          ]}
          contentClassName="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="h-[220px] overflow-hidden rounded-[22px] border border-border-soft bg-surface-soft/80 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.inquiryMix} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(82,97,115,0.12)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={42}>
                  {data.inquiryMix.map((_, index) => (
                    <Cell key={index} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.inquiryMix.map((item, index) => (
              <LegendRow key={item.label} color={MIX_COLORS[index % MIX_COLORS.length]} label={item.label} value={`${item.value} inquiries`} />
            ))}
          </div>
        </MetricPanel>
      </div>
    </div>
  )
}

function MetricPanel({
  eyebrow,
  title,
  description,
  stats,
  children,
  contentClassName,
}: {
  eyebrow: string
  title: string
  description: string
  stats: Array<{ label: string; value: string }>
  children: ReactNode
  contentClassName?: string
}) {
  return (
    <Card variant="premium" className="rounded-[28px] overflow-hidden">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-full border border-border-soft bg-surface-soft px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={contentClassName ?? 'h-[280px]'}>
        {children}
      </div>
    </Card>
  )
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border-soft bg-surface-soft/70 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold">{value}</span>
    </div>
  )
}

function ConversionStage({
  label,
  value,
  width,
  tone,
}: {
  label: string
  value: number
  width: string
  tone: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-sm font-semibold">{formatCompactNumber(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width }} />
      </div>
    </div>
  )
}

function MiniStatCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string
  value: string
  helper: string
  tone: 'primary' | 'success' | 'secondary' | 'warning'
}) {
  const toneClass =
    tone === 'success'
      ? 'from-emerald-500/14 to-teal-500/10 text-emerald-700 dark:text-emerald-300'
      : tone === 'secondary'
        ? 'from-violet-500/14 to-indigo-500/10 text-violet-700 dark:text-violet-300'
        : tone === 'warning'
          ? 'from-amber-500/14 to-orange-500/10 text-amber-700 dark:text-amber-300'
          : 'from-blue-500/14 to-sky-500/10 text-blue-700 dark:text-blue-300'

  return (
    <div className={`rounded-[22px] border border-border-soft bg-gradient-to-br ${toneClass} p-5`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  )
}

function EmptyChartState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-dashed border-border-soft bg-surface-soft/70 px-6 text-center">
      <div className="max-w-sm space-y-2">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

const PRODUCT_COLORS = ['#2563EB', '#14B8A6', '#7C3AED', '#F59E0B', '#EF4444', '#0EA5E9']
const PLAN_COLORS = ['#1D4ED8', '#6366F1', '#0F766E', '#EA580C', '#BE185D', '#0891B2']
const MIX_COLORS = ['#2563EB', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444']
