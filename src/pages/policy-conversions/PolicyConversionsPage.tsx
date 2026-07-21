import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, CreditCard, ShieldCheck } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { listPolicyConversions } from '../../services/policyConversionsService'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../lib/formatters'

export function PolicyConversionsPage() {
  const { data, loading, error } = useAsyncData(listPolicyConversions, [])

  if (loading) {
    return <Card>Loading policy conversions...</Card>
  }

  if (error) {
    return <Card className="text-danger">{error}</Card>
  }

  const records = data ?? []

  return (
    <div className="space-y-6">
      <Card variant="premium" className="overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Policy Management
              </p>
              <h1 className="text-[24px] font-bold tracking-[-0.02em]">Policy Conversion</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Convert won quotes into payment, customer, AML, and policy booking workflows.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric icon={CreditCard} label="Conversions" value={String(records.length)} />
            <Metric icon={ShieldCheck} label="In Progress" value={String(records.filter((item) => item.stageStatus !== 'Complete').length)} />
            <Metric icon={ClipboardCheck} label="Premium" value={formatCurrency(records.reduce((total, item) => total + item.paymentAmount, 0))} />
          </div>
        </div>
      </Card>

      <Card padding="none" variant="premium" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-surface-muted/90">
              <tr>
                <TableHeader>Policy Conversion</TableHeader>
                <TableHeader>Payment Amount</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Current Stage</TableHeader>
                <TableHeader>Created On</TableHeader>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr className="bg-surface">
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-base font-semibold">No policy conversions found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Won quotes will appear here once they are ready for conversion.
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-b border-border-soft/80 bg-surface transition hover:bg-primary/5">
                    <td className="px-4 py-4">
                      <Link
                        to={`/policy-conversions/${record.id}`}
                        className="group inline-flex items-center gap-2 font-semibold text-primary"
                      >
                        {record.name}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold">{formatCurrency(record.paymentAmount)}</td>
                    <td className="px-4 py-4 text-sm">{record.customerName}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="info">{record.stage}</Badge>
                        <Badge variant={record.stageStatus === 'Complete' ? 'approved' : 'pending'}>{record.stageStatus}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(record.createdOn)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function TableHeader({ children }: { children: string }) {
  return (
    <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </th>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard
  label: string
  value: string
}) {
  return (
    <div className="min-w-[140px] rounded-[18px] border border-border-soft bg-surface-soft px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 text-base font-bold">{value}</p>
    </div>
  )
}
