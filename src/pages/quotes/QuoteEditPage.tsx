import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Layers3 } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getQuoteDetail } from '../../services/quotesService'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../lib/formatters'

export function QuoteEditPage() {
  const { id = '' } = useParams()
  const { data, loading, error } = useAsyncData(() => getQuoteDetail(id), [id])

  if (loading) return <Card>Loading quote workbench...</Card>
  if (error || !data) return <Card>{error ?? 'Quote not found.'}</Card>

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/quotes">
          <ArrowLeft className="h-4 w-4" />
          Back to quotes
        </Link>
      </Button>
      <Card variant="premium" className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="approved">{data.status}</Badge>
              <Badge variant="info">{data.productName}</Badge>
            </div>
            <h1 className="mt-2 text-[24px] font-bold tracking-[-0.02em]">{data.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Linked inquiry: {data.inquiry?.name ?? 'No inquiry linked'} · Plan: {data.planName}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Total Premium" value={formatCurrency(data.totalPremium)} />
            <Metric label="Gross Premium" value={formatCurrency(data.grossPremium)} />
            <Metric label="VAT" value={formatCurrency(data.vat)} />
          </div>
        </div>
      </Card>
      <Tabs defaultValue="quote-details">
        <TabsList>
          <TabsTrigger value="quote-details" icon={FileText}>Quote Details</TabsTrigger>
          <TabsTrigger value="plan-details" icon={Layers3}>Plan Details</TabsTrigger>
        </TabsList>
        <TabsContent value="quote-details" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-4">
              <h3 className="text-xl font-semibold">Quote Summary</h3>
              <p className="text-sm text-muted-foreground">{data.aiSummary}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Metric label="Loading Premium" value={formatCurrency(data.loadingPremium)} />
                <Metric label="Reason" value={data.reason} />
                <Metric label="Coverage" value={data.coverageName} />
                <Metric label="Benefits" value={data.benefitsName} />
                <Metric label="Exclusions" value={data.exclusionName} />
                <Metric label="Inclusions" value={data.inclusionName} />
              </div>
            </Card>
            <Card className="space-y-4">
              <h3 className="text-xl font-semibold">Captured Responses</h3>
              {data.responses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No quote rule responses are stored yet for this quote.
                </p>
              ) : (
                data.responses.map((response) => (
                  <Card key={response.id} className="bg-surface-soft">
                    <p className="font-semibold">{response.businessRuleName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{response.response}</p>
                    <Badge className="mt-3" variant="review">
                      {response.conditionMet}
                    </Badge>
                  </Card>
                ))
              )}
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="plan-details" className="mt-4">
          <Card>
            <h3 className="text-xl font-semibold">Plan and product-linked content</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              This first phase keeps the quote workbench read-first. Full plan/product-linked editing and save workflows are deferred to the next implementation wave.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface-soft p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  )
}
