import { useMemo, useState, type ReactNode, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Copy, Eye, FileText, Printer, Save, Send, Sparkles } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getQuoteDetail, getQuoteEditorOptions, saveQuoteDetail } from '../../services/quotesService'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { formatCurrency } from '../../lib/formatters'

interface QuoteFormState {
  name: string
  totalPremium: string
  grossPremium: string
  vat: string
  loadingPremium: string
  reason: string
  aiSummary: string
  productId: string
  planId: string
  coverageId: string
  benefitsId: string
  inclusionsId: string
  exclusionsId: string
  deductiblesId: string
  warrantiesId: string
  quoteStatus: 'QuoteWon' | 'QuoteLost' | ''
  emailTo: string
  emailSubject: string
  emailBody: string
}

export function QuoteWorkbenchPage() {
  const { id = '' } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [form, setForm] = useState<QuoteFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('')
  const [selectedDocumentTemplateId, setSelectedDocumentTemplateId] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const { data, loading, error } = useAsyncData(async () => {
    const [detail, options] = await Promise.all([getQuoteDetail(id), getQuoteEditorOptions()])
    setForm({
      name: detail.name,
      totalPremium: String(detail.totalPremium || 0),
      grossPremium: String(detail.grossPremium || 0),
      vat: String(detail.vat || 0),
      loadingPremium: String(detail.loadingPremium || 0),
      reason: detail.reason,
      aiSummary: detail.aiSummary,
      productId: options.products.find((item) => item.name === detail.productName)?.id ?? '',
      planId: options.plans.find((item) => item.name === detail.planName)?.id ?? '',
      coverageId: options.coverages.find((item) => item.name === detail.coverageName)?.id ?? '',
      benefitsId: options.benefits.find((item) => item.name === detail.benefitsName)?.id ?? '',
      inclusionsId: options.inclusions.find((item) => item.name === detail.inclusionName)?.id ?? '',
      exclusionsId: options.exclusions.find((item) => item.name === detail.exclusionName)?.id ?? '',
      deductiblesId: options.deductibles.find((item) => item.name === detail.deductibleName)?.id ?? '',
      warrantiesId: options.warranties.find((item) => item.name === detail.warrantyName)?.id ?? '',
      quoteStatus: detail.status === 'QuoteWon' || detail.status === 'QuoteLost' ? detail.status : '',
      emailTo: '',
      emailSubject: `${detail.name} - Quote Proposal`,
      emailBody: detail.aiSummary,
    })
    return { detail, options }
  }, [id, refreshKey])

  const activeEmailTemplates = useMemo(
    () => (data?.detail.emailTemplates ?? []).filter((template) => template.isActive),
    [data?.detail.emailTemplates],
  )
  const selectedEmailTemplate = useMemo(
    () => activeEmailTemplates.find((template) => template.id === selectedEmailTemplateId) ?? activeEmailTemplates[0],
    [activeEmailTemplates, selectedEmailTemplateId],
  )
  const selectedDocumentTemplate = useMemo(
    () =>
      data?.detail.documentTemplates.find((template) => template.id === selectedDocumentTemplateId) ??
      data?.detail.documentTemplates[0],
    [data?.detail.documentTemplates, selectedDocumentTemplateId],
  )

  if (loading) return <Card>Loading quote workbench...</Card>
  if (error || !data || !form) return <Card>{error ?? 'Quote not found.'}</Card>

  const mergeContext = {
    QuoteName: form.name,
    QuotePremium: formatCurrency(Number(form.totalPremium) || 0),
    ProductName: data.detail.productName,
    PlanName: data.detail.planName,
    ClientName: data.detail.inquiry?.accountName ?? 'Valued Client',
    InquiryNumber: data.detail.inquiry?.inquiryNumber ?? 'N/A',
    AiSummary: form.aiSummary,
    OutcomeReason: form.reason || 'No outcome reason has been captured yet.',
  }
  const mergeTokens = Object.keys(mergeContext)
  const renderedEmailSubject = renderTemplate(form.emailSubject, mergeContext)
  const renderedEmailBody = renderTemplate(form.emailBody, mergeContext)
  const renderedDocument = renderTemplate(selectedDocumentTemplate?.content ?? '', mergeContext)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form) return
    const currentForm = form
    try {
      setSaving(true)
      setSaveError(null)
      await saveQuoteDetail(id, {
        name: currentForm.name,
        totalPremium: Number(currentForm.totalPremium) || 0,
        grossPremium: Number(currentForm.grossPremium) || 0,
        vat: Number(currentForm.vat) || 0,
        loadingPremium: Number(currentForm.loadingPremium) || 0,
        reason: currentForm.reason,
        aiSummary: currentForm.aiSummary,
        productId: currentForm.productId || undefined,
        planId: currentForm.planId || undefined,
        coverageId: currentForm.coverageId || undefined,
        benefitsId: currentForm.benefitsId || undefined,
        inclusionsId: currentForm.inclusionsId || undefined,
        exclusionsId: currentForm.exclusionsId || undefined,
        deductiblesId: currentForm.deductiblesId || undefined,
        warrantiesId: currentForm.warrantiesId || undefined,
        quoteStatus: currentForm.quoteStatus || undefined,
      })
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save quote.')
    } finally {
      setSaving(false)
    }
  }

  function applyEmailTemplate() {
    if (!selectedEmailTemplate) return
    setForm((current) =>
      current
        ? {
            ...current,
            emailSubject: selectedEmailTemplate.subject,
            emailBody: selectedEmailTemplate.body,
          }
        : current,
    )
  }

  async function copyEmailPreview() {
    try {
      await navigator.clipboard.writeText(renderedEmailBody)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('idle')
    }
  }

  function printDocumentPreview() {
    if (!form || !data) return
    const currentForm = form
    const currentDetail = data.detail
    const printWindow = window.open('', '_blank', 'width=1024,height=768')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentForm.name} - Quote Document</title>
          <style>
            body { font-family: Segoe UI, Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin-bottom: 8px; }
            .meta { color: #475569; margin-bottom: 24px; }
            .card { border: 1px solid #cbd5e1; border-radius: 18px; padding: 24px; white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(currentForm.name)}</h1>
          <p class="meta">${escapeHtml(`${currentDetail.productName} | ${currentDetail.planName} | ${formatCurrency(Number(currentForm.totalPremium) || 0)}`)}</p>
          <div class="card">${escapeHtml(renderedDocument || 'No document template content available.')}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/quotes">
          <ArrowLeft className="h-4 w-4" />
          Back to quotes
        </Link>
      </Button>
      <Card variant="premium" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="approved">{data.detail.status}</Badge>
              <Badge variant="info">{data.detail.productName}</Badge>
              {form.quoteStatus ? <Badge variant="review">{form.quoteStatus}</Badge> : null}
            </div>
            <h1 className="mt-3 text-[30px] font-bold">{data.detail.name}</h1>
            <p className="text-sm text-muted-foreground">
              Linked inquiry: {data.detail.inquiry?.name ?? 'No inquiry linked'} - Plan: {data.detail.planName}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Total Premium" value={formatCurrency(data.detail.totalPremium)} />
            <Metric label="Gross Premium" value={formatCurrency(data.detail.grossPremium)} />
            <Metric label="VAT" value={formatCurrency(data.detail.vat)} />
          </div>
        </div>
      </Card>
      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="quote-details">
          <TabsList>
            <TabsTrigger value="quote-details">Quote Details</TabsTrigger>
            <TabsTrigger value="plan-details">Plan Details</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="quote-details" className="mt-4">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">Quote Summary</h3>
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Quote'}
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Quote Name">
                    <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                  </Field>
                  <Field label="Quote Status">
                    <Select
                      value={form.quoteStatus}
                      onValueChange={(value) =>
                        setForm({ ...form, quoteStatus: value as QuoteFormState['quoteStatus'] })
                      }
                      options={[
                        { value: '', label: 'No final outcome' },
                        { value: 'QuoteWon', label: 'Quote Won' },
                        { value: 'QuoteLost', label: 'Quote Lost' },
                      ]}
                    >
                    </Select>
                  </Field>
                  <Field label="Total Premium">
                    <Input value={form.totalPremium} onChange={(event) => setForm({ ...form, totalPremium: event.target.value })} />
                  </Field>
                  <Field label="Gross Premium">
                    <Input value={form.grossPremium} onChange={(event) => setForm({ ...form, grossPremium: event.target.value })} />
                  </Field>
                  <Field label="VAT">
                    <Input value={form.vat} onChange={(event) => setForm({ ...form, vat: event.target.value })} />
                  </Field>
                  <Field label="Loading Premium">
                    <Input value={form.loadingPremium} onChange={(event) => setForm({ ...form, loadingPremium: event.target.value })} />
                  </Field>
                </div>
                <Field label="Outcome Reason">
                  <textarea
                    className="min-h-24 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.reason}
                    onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  />
                </Field>
                <Field label="AI Summary">
                  <textarea
                    className="min-h-32 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.aiSummary}
                    onChange={(event) => setForm({ ...form, aiSummary: event.target.value })}
                  />
                </Field>
                {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
              </Card>
              <Card className="space-y-4">
                <h3 className="text-xl font-semibold">Captured Responses</h3>
                {data.detail.responses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No quote rule responses are stored yet for this quote.
                  </p>
                ) : (
                  data.detail.responses.map((response) => (
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
            <Card className="space-y-4">
              <h3 className="text-xl font-semibold">Plan and Product-linked Content</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Product">
                  <SelectField value={form.productId} onChange={(value) => setForm({ ...form, productId: value })} options={data.options.products} />
                </Field>
                <Field label="Plan">
                  <SelectField value={form.planId} onChange={(value) => setForm({ ...form, planId: value })} options={data.options.plans} />
                </Field>
                <Field label="Coverage">
                  <SelectField value={form.coverageId} onChange={(value) => setForm({ ...form, coverageId: value })} options={data.options.coverages} />
                </Field>
                <Field label="Benefits">
                  <SelectField value={form.benefitsId} onChange={(value) => setForm({ ...form, benefitsId: value })} options={data.options.benefits} />
                </Field>
                <Field label="Inclusions">
                  <SelectField value={form.inclusionsId} onChange={(value) => setForm({ ...form, inclusionsId: value })} options={data.options.inclusions} />
                </Field>
                <Field label="Exclusions">
                  <SelectField value={form.exclusionsId} onChange={(value) => setForm({ ...form, exclusionsId: value })} options={data.options.exclusions} />
                </Field>
                <Field label="Deductibles">
                  <SelectField value={form.deductiblesId} onChange={(value) => setForm({ ...form, deductiblesId: value })} options={data.options.deductibles} />
                </Field>
                <Field label="Warranties">
                  <SelectField value={form.warrantiesId} onChange={(value) => setForm({ ...form, warrantiesId: value })} options={data.options.warranties} />
                </Field>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="email" className="mt-4">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold">Email Draft Area</h3>
                      <p className="text-sm text-muted-foreground">
                        Reusable Dataverse-backed templates are available here for quote communications.
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={copyEmailPreview}>
                    <Copy className="h-4 w-4" />
                    {copyState === 'copied' ? 'Copied' : 'Copy Preview'}
                  </Button>
                </div>
                <div className="rounded-[18px] border border-border-soft bg-surface-soft p-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Merge fields</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mergeTokens.map((token) => (
                      <button
                        key={token}
                        type="button"
                        className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
                        onClick={() =>
                          setForm((current) =>
                            current ? { ...current, emailBody: `${current.emailBody} {{${token}}}`.trim() } : current,
                          )
                        }
                      >
                        {`{{${token}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4">
                  <Field label="Recipient Email">
                    <Input value={form.emailTo} onChange={(event) => setForm({ ...form, emailTo: event.target.value })} />
                  </Field>
                  <Field label="Subject">
                    <Input value={form.emailSubject} onChange={(event) => setForm({ ...form, emailSubject: event.target.value })} />
                  </Field>
                  <Field label="Body">
                    <textarea
                      className="min-h-48 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      value={form.emailBody}
                      onChange={(event) => setForm({ ...form, emailBody: event.target.value })}
                    />
                  </Field>
                </div>
              </Card>
              <div className="space-y-6">
                <Card className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">Template Library</h3>
                      <p className="text-sm text-muted-foreground">Choose a live Dataverse template and apply it to the draft.</p>
                    </div>
                    <Button type="button" variant="outline" onClick={applyEmailTemplate} disabled={!selectedEmailTemplate}>
                      <Sparkles className="h-4 w-4" />
                      Apply Template
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {activeEmailTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`w-full rounded-[18px] border p-4 text-left transition ${
                          template.id === selectedEmailTemplate?.id
                            ? 'border-primary bg-primary/5 shadow-soft'
                            : 'border-border-soft bg-surface-soft hover:border-primary/40'
                        }`}
                        onClick={() => setSelectedEmailTemplateId(template.id)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{template.name}</p>
                          <Badge variant="info">{template.category}</Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium">{template.subject}</p>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{template.body}</p>
                      </button>
                    ))}
                  </div>
                </Card>
                <Card className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-info" />
                    <div>
                      <h3 className="text-xl font-semibold">Rendered Preview</h3>
                      <p className="text-sm text-muted-foreground">Live merged output using the current quote context.</p>
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-border-soft bg-surface-soft p-5">
                    <p className="text-sm font-semibold">{renderedEmailSubject}</p>
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{renderedEmailBody}</div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Send className="h-4 w-4 text-success" />
                    Delivery integration can now be layered later without rebuilding the composition workspace.
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">Document Templates</h3>
                    <p className="text-sm text-muted-foreground">
                      Live document templates connected from Dataverse for quote-ready output preparation.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={printDocumentPreview}>
                    <Printer className="h-4 w-4" />
                    Open Print View
                  </Button>
                </div>
                <div className="grid gap-4">
                  {data.detail.documentTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`rounded-[18px] border p-4 text-left transition ${
                        template.id === selectedDocumentTemplate?.id
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'border-border-soft bg-surface-soft hover:border-primary/40'
                      }`}
                      onClick={() => setSelectedDocumentTemplateId(template.id)}
                    >
                      <p className="font-semibold">{template.name}</p>
                      <p className="line-clamp-5 text-sm text-muted-foreground">
                        {template.content || 'No template content captured yet.'}
                      </p>
                    </button>
                  ))}
                </div>
              </Card>
              <Card className="space-y-4">
                <h3 className="text-xl font-semibold">PDF Export Area</h3>
                <p className="text-sm text-muted-foreground">
                  The export workflow surface now renders merged template output for quote packaging and downstream communication handoff.
                </p>
                <div className="rounded-[18px] border border-border-soft bg-surface-soft p-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Export Summary</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Metric label="Quote Name" value={data.detail.name} />
                    <Metric label="Total Premium" value={formatCurrency(Number(form.totalPremium))} />
                    <Metric label="Client" value={data.detail.inquiry?.accountName ?? 'No client linked'} />
                    <Metric label="Plan" value={data.detail.planName} />
                  </div>
                </div>
                <div className="rounded-[18px] border border-border-soft bg-surface-soft p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Rendered document preview</p>
                      <p className="mt-2 font-semibold">{selectedDocumentTemplate?.name ?? 'No template selected'}</p>
                    </div>
                    <Badge variant="review">Merged</Badge>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {renderedDocument || 'No template content is available yet for preview.'}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface-soft p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; name: string }>
}) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      options={[
        { value: '', label: 'None selected' },
        ...options.map((option) => ({ value: option.id, label: option.name })),
      ]}
    >
    </Select>
  )
}

function renderTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((output, [key, value]) => output.replaceAll(`{{${key}}}`, value), template)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('\n', '<br />')
}
