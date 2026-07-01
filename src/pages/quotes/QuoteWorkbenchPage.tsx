import { useState, type ReactNode, type FormEvent } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CheckCircle2, ChevronDown, ChevronUp, Download, FileText, FileWarning, Gem, Layers3, Pencil, Save, ShieldAlert, ShieldCheck, TicketSlash, Trash2, XCircle } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  deleteQuotePlanLinkedRecord,
  getQuoteDetail,
  getQuoteEditorOptions,
  getQuotePlanLinkedSections,
  renameQuotePlanLinkedRecord,
  saveQuoteDetail,
  updateQuoteStatus,
  type QuotePlanLinkedEntityKey,
} from '../../services/quotesService'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { formatCurrency } from '../../lib/formatters'
import { generateQuotePdf } from '../../lib/quotePdf'
import takafulHeaderSrc from '../../assets/takaful-header.png?inline'

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
}

export function QuoteWorkbenchPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const fromInquiryId =
    (location.state as { fromInquiryId?: string } | null)?.fromInquiryId ?? ''
  const backTarget = fromInquiryId ? `/inquiries/${fromInquiryId}` : '/quotes'
  const backLabel = fromInquiryId ? 'Back to Inquiry' : 'Back to Quotes'
  const [refreshKey, setRefreshKey] = useState(0)
  const [form, setForm] = useState<QuoteFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [expandedPlanSections, setExpandedPlanSections] = useState<Record<string, boolean>>({
    benefits: false,
    inclusions: false,
    exclusions: false,
    deductibles: false,
    warranties: false,
    coverages: false,
  })
  const [editingPlanRecordKey, setEditingPlanRecordKey] = useState<string | null>(null)
  const [editingPlanRecordName, setEditingPlanRecordName] = useState('')
  const [planActionBusyKey, setPlanActionBusyKey] = useState<string | null>(null)
  const [planActionError, setPlanActionError] = useState<string | null>(null)
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
      quoteStatus:
        detail.quoteStatusValue === 751820000
          ? 'QuoteWon'
          : detail.quoteStatusValue === 751820001
            ? 'QuoteLost'
            : normalizeQuoteStatus(detail.status),
    })
    return { detail, options }
  }, [id, refreshKey])
  const {
    data: planSections,
    loading: planSectionsLoading,
  } = useAsyncData(
    () => getQuotePlanLinkedSections(form?.planId ?? ''),
    [form?.planId, refreshKey],
  )

  if (loading) return <Card>Loading quote workbench...</Card>
  if (error || !data || !form) return <Card>{error ?? 'Quote not found.'}</Card>
  const currentForm = form
  const currentDetail = data.detail

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

  async function handleRenamePlanRecord(entity: QuotePlanLinkedEntityKey, recordId: string) {
    if (!editingPlanRecordName.trim()) return
    const busyKey = `rename:${entity}:${recordId}`
    try {
      setPlanActionBusyKey(busyKey)
      setPlanActionError(null)
      await renameQuotePlanLinkedRecord(entity, recordId, editingPlanRecordName.trim())
      setEditingPlanRecordKey(null)
      setEditingPlanRecordName('')
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setPlanActionError(cause instanceof Error ? cause.message : 'Unable to update the record name.')
    } finally {
      setPlanActionBusyKey(null)
    }
  }

  async function handleQuoteStatusChange(nextStatus: 'QuoteWon' | 'QuoteLost') {
    try {
      setStatusBusy(true)
      setSaveError(null)
      setForm((current) => (current ? { ...current, quoteStatus: nextStatus } : current))
      await updateQuoteStatus(id, nextStatus)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to update quote status.')
    } finally {
      setStatusBusy(false)
    }
  }

  async function handleDeletePlanRecord(entity: QuotePlanLinkedEntityKey, recordId: string) {
    const busyKey = `delete:${entity}:${recordId}`
    try {
      setPlanActionBusyKey(busyKey)
      setPlanActionError(null)
      await deleteQuotePlanLinkedRecord(entity, recordId)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setPlanActionError(cause instanceof Error ? cause.message : 'Unable to delete the record.')
    } finally {
      setPlanActionBusyKey(null)
    }
  }

  async function handleExportPdf() {
    try {
      setIsExporting(true)
      setSaveError(null)
      await generateQuotePdf({
        detail: currentDetail,
        form: currentForm,
        planSections: planSections ?? [],
        headerImageSrc: takafulHeaderSrc,
      })
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Failed to generate PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to={backTarget}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </Button>
      <Card variant="premium" className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="approved">{data.detail.status}</Badge>
              <Badge variant="info">{currentDetail.productName}</Badge>
            </div>
            <h1 className="mt-2 text-[24px] font-bold tracking-[-0.02em]">{data.detail.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Linked inquiry: {currentDetail.inquiry?.name ?? 'No inquiry linked'} - Plan: {currentDetail.planName}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <QuoteStatusChip
                active={form.quoteStatus === 'QuoteWon'}
                disabled={statusBusy}
                icon={CheckCircle2}
                label="Quote Won"
                onClick={() => void handleQuoteStatusChange('QuoteWon')}
              />
              <QuoteStatusChip
                active={form.quoteStatus === 'QuoteLost'}
                disabled={statusBusy}
                icon={XCircle}
                label="Quote Lost"
                tone="danger"
                onClick={() => void handleQuoteStatusChange('QuoteLost')}
              />
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Total Premium" value={formatCurrency(currentDetail.totalPremium)} />
            <Metric label="Gross Premium" value={formatCurrency(currentDetail.grossPremium)} />
            <Metric label="VAT" value={formatCurrency(currentDetail.vat)} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" className="bg-white hover:bg-surface" disabled={isExporting} onClick={() => void handleExportPdf()}>
                <Download className="h-4 w-4" />
                {isExporting ? 'Generating...' : 'Generate Quote'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="quote-details">
          <TabsList>
            <TabsTrigger value="quote-details" icon={FileText}>Quote Details</TabsTrigger>
            <TabsTrigger value="plan-details" icon={Layers3}>Plan Details</TabsTrigger>
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
                    className="form-field-surface min-h-24 w-full rounded-[16px] border border-border px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.reason}
                    onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  />
                </Field>
                <Field label="AI Summary">
                  <textarea
                    className="form-field-surface min-h-32 w-full rounded-[16px] border border-border px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
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
            <div className="space-y-6">
              <Card className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">Plan-linked Catalog</h3>
                    <p className="text-sm text-muted-foreground">
                      Each accordion shows records whose `aur_plan` matches the plan selected on this quote.
                    </p>
                  </div>
                  {form.planId ? <Badge variant="info">Plan linked</Badge> : <Badge variant="neutral">No plan selected</Badge>}
                </div>
                {planActionError ? <p className="text-sm text-danger">{planActionError}</p> : null}
                {!form.planId ? (
                  <p className="text-sm text-muted-foreground">Select a plan on the quote first to load related records.</p>
                ) : planSectionsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading plan-linked records...</p>
                ) : (
                  <div className="space-y-3">
                    {(planSections ?? []).map((section) => {
                      const isExpanded = expandedPlanSections[section.key] ?? false
                      const SectionIcon = planSectionIcon(section.key)
                      return (
                        <div key={section.key} className="overflow-hidden rounded-[24px] border border-border-soft bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:bg-slate-950/95 dark:shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface-soft/70"
                            onClick={() =>
                              setExpandedPlanSections((current) => ({
                                ...current,
                                [section.key]: !isExpanded,
                              }))
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <SectionIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-base font-semibold">{section.title}</p>
                                <p className="text-sm text-muted-foreground">Plan-linked records</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="review">{section.records.length}</Badge>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </button>
                          {isExpanded ? (
                            <div className="border-t border-border-soft px-5 py-5">
                              {section.records.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No {section.title.toLowerCase()} records are linked to this plan yet.</p>
                              ) : (
                                <div className="grid gap-3 xl:grid-cols-4">
                                  {section.records.map((record) => {
                                    const recordKey = `${section.key}:${record.id}`
                                    const isEditing = editingPlanRecordKey === recordKey
                                    const renameBusy = planActionBusyKey === `rename:${section.key}:${record.id}`
                                    const deleteBusy = planActionBusyKey === `delete:${section.key}:${record.id}`
                                    return (
                                      <Card key={record.id} variant="interactive" className="space-y-3 rounded-[20px] border border-border-soft bg-surface px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0 flex-1">
                                            {isEditing ? (
                                              <Input value={editingPlanRecordName} onChange={(event) => setEditingPlanRecordName(event.target.value)} />
                                            ) : (
                                              <h4 className="truncate text-sm font-semibold leading-6">{record.name}</h4>
                                            )}
                                          </div>
                                          {!isEditing ? (
                                            <div className="flex items-center gap-1">
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white text-muted-foreground hover:bg-surface-soft hover:text-primary"
                                                onClick={() => {
                                                  setEditingPlanRecordKey(recordKey)
                                                  setEditingPlanRecordName(record.name)
                                                }}
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-white text-muted-foreground hover:bg-danger/10 hover:text-danger"
                                                disabled={deleteBusy}
                                                onClick={() => void handleDeletePlanRecord(section.key, record.id)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2">
                                          {isEditing ? (
                                            <>
                                              <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="bg-white hover:bg-surface"
                                                onClick={() => {
                                                  setEditingPlanRecordKey(null)
                                                  setEditingPlanRecordName('')
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                type="button"
                                                size="sm"
                                                disabled={renameBusy}
                                                onClick={() => void handleRenamePlanRecord(section.key, record.id)}
                                              >
                                                <Save className="h-4 w-4" />
                                                {renameBusy ? 'Saving...' : 'Save'}
                                              </Button>
                                            </>
                                          ) : null}
                                        </div>
                                      </Card>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
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

function planSectionIcon(key: QuotePlanLinkedEntityKey) {
  if (key === 'benefits') return Gem
  if (key === 'inclusions') return BadgeCheck
  if (key === 'exclusions') return TicketSlash
  if (key === 'deductibles') return FileWarning
  if (key === 'warranties') return ShieldCheck
  return ShieldAlert
}

function QuoteStatusChip({
  active,
  disabled,
  icon: Icon,
  label,
  onClick,
  tone = 'primary',
}: {
  active: boolean
  disabled?: boolean
  icon: typeof CheckCircle2
  label: string
  onClick: () => void
  tone?: 'primary' | 'danger'
}) {
  const activeClass =
    tone === 'danger'
      ? 'border-danger/30 bg-danger/10 text-danger'
      : 'border-primary/30 bg-primary/10 text-primary'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? activeClass : 'border-border-soft bg-white text-muted-foreground hover:bg-surface-soft'} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? (tone === 'danger' ? 'bg-danger/15' : 'bg-primary/15') : 'bg-surface-soft'}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      {label}
    </button>
  )
}

function normalizeQuoteStatus(value: string) {
  const normalized = value.replace(/\s+/g, '').trim().toLowerCase()
  if (normalized === 'quotewon') return 'QuoteWon'
  if (normalized === 'quotelost') return 'QuoteLost'
  return ''
}
