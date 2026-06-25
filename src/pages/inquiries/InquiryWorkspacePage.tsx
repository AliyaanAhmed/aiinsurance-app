import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Archive, ArrowLeft, Bold, ChevronDown, ChevronUp, FileImage, FileSpreadsheet, FileStack, FileText, FolderOpen, GitBranch, Italic, LayoutGrid, List, Mail, MailCheck, MailPlus, Paperclip, Rows3, Save, SendHorizontal, ShieldAlert, Sparkles, Underline } from 'lucide-react'
import type { InquiryDetail } from '../../domain/app'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useRole } from '../../hooks/useRole'
import {
  createQuoteFromInquiry,
  createInquiryEmail,
  getInquiryDetail,
  getInquiryEditorOptions,
  saveInquiryDetail,
  updateInquiryDisposition,
} from '../../services/inquiriesService'
import { Card } from '../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { formatCurrency, formatDate, formatPercent } from '../../lib/formatters'

interface InquiryFormState {
  name: string
  productId: string
  inquiryType: string
  inquiryStatus: string
  planId: string
  brokerId: string
  brokerAgentName: string
  coverType: string
  riskScore: string
  riskDescription: string
  totalSumInsured: string
  territorialScope: string
  noOfItems: string
  premiumToBeCharged: string
  brokerage: string
  grossPremium: string
  paymentTerm: string
  fee: string
  totalDeduction: string
}

interface EmailComposerState {
  sender: string
  toRecipients: string
  subject: string
  description: string
}

export function InquiryWorkspacePage() {
  const composerEditorRef = useRef<HTMLDivElement | null>(null)
  const { user } = useRole()
  const { id = '' } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [inquiryState, setInquiryState] = useState<InquiryDetail | null>(null)
  const [form, setForm] = useState<InquiryFormState | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [emailSearch, setEmailSearch] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [composerEditorVersion, setComposerEditorVersion] = useState(0)
  const [composeBusy, setComposeBusy] = useState(false)
  const [composeError, setComposeError] = useState<string | null>(null)
  const [expandedEmailIds, setExpandedEmailIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('details')
  const [aiView, setAiView] = useState<'card' | 'table'>('card')
  const [aiCategory, setAiCategory] = useState('All')
  const [riskView, setRiskView] = useState<'card' | 'table'>('card')
  const [quoteView, setQuoteView] = useState<'card' | 'table'>('table')
  const [appliedConsequenceIds, setAppliedConsequenceIds] = useState<string[]>([])
  const [composer, setComposer] = useState<EmailComposerState>({
    sender: 'underwriting@insureai.com',
    toRecipients: '',
    subject: '',
    description: '',
  })
  const { data, loading, error } = useAsyncData(async () => {
    const [detail, options] = await Promise.all([getInquiryDetail(id), getInquiryEditorOptions()])
    return { detail, options }
  }, [id, refreshKey])

  useEffect(() => {
    if (!data) return
    const inquiry = data.detail
    setInquiryState(inquiry)
    setIsEditing(false)
    setActionSuccess(null)
    const nextForm = buildFormState(inquiry, data.options)
    nextForm.brokerAgentName = inquiry.contact?.name || inquiry.contactName || 'No broker agent linked'
    setForm(nextForm)
    setComposeError(null)
    setIsComposerOpen(false)
    setComposerEditorVersion((value) => value + 1)
    setEmailSearch('')
    setAiCategory('All')
    setExpandedEmailIds([])
    setComposer({
      sender: user.email ?? 'underwriting@insureai.com',
      toRecipients: inquiry.contact?.email ?? inquiry.account?.email ?? '',
      subject: `Regarding ${inquiry.inquiryNumber}`,
      description: '',
    })
  }, [data, user.email])

  useEffect(() => {
    if (!isComposerOpen || !composerEditorRef.current) return
    if (composerEditorRef.current.innerHTML !== composer.description) {
      composerEditorRef.current.innerHTML = composer.description
    }
  }, [composer.description, isComposerOpen])

  const filteredEmails = useMemo(() => {
    const emails = data?.detail.emailTimeline ?? []
    if (!emailSearch.trim()) return emails
    const query = emailSearch.toLowerCase()
    return emails.filter((email) =>
      [email.subject, email.body, email.sender, email.toRecipients, email.status]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [data?.detail.emailTimeline, emailSearch])

  const groupedQuoteDetails = useMemo(() => {
    const details = data?.detail.quoteDetails ?? []
    const grouped = new Map<string, typeof details>()
    for (const detail of details) {
      const category = detail.businessRuleCategory || 'Uncategorized'
      const bucket = grouped.get(category) ?? []
      bucket.push(detail)
      grouped.set(category, bucket)
    }
    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      items,
    }))
  }, [data?.detail.quoteDetails])

  const aiCategoryFilters = useMemo(
    () => [
      { label: 'All', count: data?.detail.quoteDetails.length ?? 0 },
      ...groupedQuoteDetails.map((group) => ({
        label: group.category,
        count: group.items.length,
      })),
    ],
    [data?.detail.quoteDetails.length, groupedQuoteDetails],
  )

  const visibleQuoteDetailGroups = useMemo(() => {
    if (aiCategory === 'All') return groupedQuoteDetails
    return groupedQuoteDetails.filter((group) => group.category === aiCategory)
  }, [aiCategory, groupedQuoteDetails])

  const missingQuoteDetails = useMemo(
    () =>
      (data?.detail.quoteDetails ?? []).filter((detail) =>
        detail.response.replace(/\s+/g, ' ').trim().toLowerCase() === 'no information provided',
      ),
    [data?.detail.quoteDetails],
  )

  function triggerWorkspaceRefresh() {
    setForm(null)
    setRefreshKey((value) => value + 1)
  }

  if (error) return <Card>{error}</Card>
  if (loading || !data || !form) return <InquiryWorkspaceSkeleton />

  const inquiry = inquiryState ?? data.detail
  const inquiryRecordId = inquiry.id || id
  const options = data.options
  const resetForm = () => {
    setIsEditing(false)
    setSaveError(null)
    const nextForm = buildFormState(inquiry, options)
    nextForm.brokerAgentName = inquiry.contact?.name || inquiry.contactName || 'No broker agent linked'
    setForm(nextForm)
  }

  async function handleDisposition(
    disposition: 'Decline' | 'RefertoUnderwriter' | 'EscalatetoHeadofAviation' | 'PropertyorReinsuranceTeam',
    key: string,
  ) {
    if (!form) return
    try {
      setPendingAction(key)
      setActionError(null)
      setActionSuccess(null)
      await saveInquiryDetail(inquiryRecordId, buildInquirySavePayload(form, {
        inquiryStatus: inquiryStatusValueForDisposition(disposition),
      }))
      const nextStatus = inquiryStatusLabelForDisposition(disposition)
      setInquiryState((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
              inquiryStatusValue: inquiryStatusValueForDisposition(disposition),
            }
          : current,
      )
      setForm((current) =>
        current
          ? {
              ...current,
              inquiryStatus: String(inquiryStatusValueForDisposition(disposition)),
            }
          : current,
      )
      setActionSuccess(`Inquiry status updated to ${nextStatus}.`)
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to update inquiry disposition.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleCreateQuote() {
    if (!form) return
    try {
      setPendingAction('quote')
      setActionError(null)
      setActionSuccess(null)
      await createQuoteFromInquiry(inquiryRecordId, {
        productId: form.productId || undefined,
        planId: form.planId || undefined,
        premiumToBeCharged: Number(form.premiumToBeCharged) || 0,
      })
      setActionSuccess('Quote created and linked to this inquiry.')
      triggerWorkspaceRefresh()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to create quote from inquiry.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSaveDetails() {
    if (!form) return
    try {
      setSaveBusy(true)
      setSaveError(null)
      setActionSuccess(null)
      await saveInquiryDetail(inquiryRecordId, {
        name: form.name,
        productId: form.productId || undefined,
        inquiryType: form.inquiryType ? Number(form.inquiryType) : undefined,
        inquiryStatus: form.inquiryStatus ? Number(form.inquiryStatus) : undefined,
        planId: form.planId || undefined,
        brokerId: form.brokerId || undefined,
        coverType: form.coverType ? Number(form.coverType) : undefined,
        riskScore: Number(form.riskScore) || 0,
        riskDescription: form.riskDescription,
        totalSumInsured: Number(form.totalSumInsured) || 0,
        territorialScope: form.territorialScope,
        noOfItems: form.noOfItems,
        premiumToBeCharged: Number(form.premiumToBeCharged) || 0,
        brokerage: Number(form.brokerage) || 0,
        grossPremium: Number(form.grossPremium) || 0,
        paymentTerm: form.paymentTerm ? Number(form.paymentTerm) : undefined,
        fee: Number(form.fee) || 0,
        totalDeduction: Number(form.totalDeduction) || 0,
      })
      const selectedDisposition = dispositionForInquiryStatusValue(Number(form.inquiryStatus))
      if (selectedDisposition) {
        await updateInquiryDisposition(inquiryRecordId, selectedDisposition)
      }
      setIsEditing(false)
      setInquiryState((current) =>
        current
          ? {
              ...current,
              name: form.name,
              productId: form.productId || undefined,
              productName: findOptionName(options.products, form.productId, current.productName),
              inquiryType: findOptionLabel(options.inquiryTypes, form.inquiryType, current.inquiryType),
              status: findOptionLabel(options.inquiryStatuses, form.inquiryStatus, current.status),
              inquiryStatusValue: form.inquiryStatus ? Number(form.inquiryStatus) : current.inquiryStatusValue,
              planId: form.planId || undefined,
              planName: findOptionName(options.plans.map((item) => ({ id: item.id, name: item.name })), form.planId, current.planName),
              brokerId: form.brokerId || undefined,
              brokerName: findOptionName(options.brokers, form.brokerId, current.brokerName),
              coverType: findOptionLabel(options.coverTypes, form.coverType, current.coverType),
              riskScore: Number(form.riskScore) || 0,
              riskDescription: form.riskDescription,
              totalInsured: Number(form.totalSumInsured) || 0,
              territorialScope: form.territorialScope,
              totalCharge: Number(form.premiumToBeCharged) || 0,
              grossPremium: Number(form.grossPremium) || 0,
              paymentTerm: findOptionLabel(options.paymentTerms, form.paymentTerm, current.paymentTerm),
              fee: Number(form.fee) || 0,
            }
          : current,
      )
      setActionSuccess('Inquiry details updated successfully.')
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save inquiry details.')
    } finally {
      setSaveBusy(false)
    }
  }

  async function handleApplyConsequence(consequenceId: string) {
    if (!form) return
    const record = inquiry.consequenceResults.find((item) => item.id === consequenceId)
    if (!record || appliedConsequenceIds.includes(consequenceId)) return

    try {
      setPendingAction(consequenceId)
      setActionError(null)
      setActionSuccess(null)

      if (record.type === 'Case Control') {
        const disposition = toDisposition(record.action)
        if (!disposition) {
          throw new Error('This case control consequence cannot be applied to inquiry status.')
        }

        await saveInquiryDetail(inquiryRecordId, buildInquirySavePayload(form, {
          inquiryStatus: inquiryStatusValueForDisposition(disposition),
        }))
        const nextStatusLabel = inquiryStatusLabelForDisposition(disposition)
        setForm((current) =>
          current
            ? {
                ...current,
                inquiryStatus: String(inquiryStatusValueForAction(record.action)),
              }
            : current,
        )
        setInquiryState((current) =>
          current
            ? {
                ...current,
                status: nextStatusLabel,
                inquiryStatusValue: inquiryStatusValueForDisposition(disposition),
              }
            : current,
        )
        setActionSuccess(`Applied ${record.action} to inquiry status.`)
      } else if (record.type === 'Risk') {
        const nextRiskScore = (Number(form.riskScore) || 0) + 10
        await saveInquiryDetail(inquiryRecordId, buildInquirySavePayload(form, {
          riskScore: nextRiskScore,
        }))
        setForm((current) =>
          current
            ? {
                ...current,
                riskScore: String(nextRiskScore),
              }
            : current,
        )
        setInquiryState((current) =>
          current
            ? {
                ...current,
                riskScore: nextRiskScore,
              }
            : current,
        )
        setActionSuccess(`Applied risk consequence. Risk Score updated to ${nextRiskScore}.`)
      }

      setAppliedConsequenceIds((current) => [...new Set([...current, consequenceId])])
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to apply consequence.')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleComposeEmail() {
    try {
      const descriptionHtml = composerEditorRef.current?.innerHTML?.trim() || composer.description.trim()
      if (!composer.subject.trim() || !composer.toRecipients.trim()) {
        throw new Error('Recipient and subject are required before composing the email.')
      }
      setComposeBusy(true)
      setComposeError(null)
      setActionSuccess(null)
      await createInquiryEmail(inquiryRecordId, {
        sender: composer.sender.trim(),
        toRecipients: composer.toRecipients.trim(),
        subject: composer.subject.trim(),
        description: descriptionHtml,
      })
      setActionSuccess('Email activity created and linked to this inquiry.')
      setIsComposerOpen(false)
      setComposer((current) => ({
        ...current,
        subject: `Regarding ${inquiry.inquiryNumber}`,
        description: '',
      }))
      if (composerEditorRef.current) composerEditorRef.current.innerHTML = ''
      triggerWorkspaceRefresh()
    } catch (cause) {
      setComposeError(cause instanceof Error ? cause.message : 'Unable to compose the inquiry email.')
    } finally {
      setComposeBusy(false)
    }
  }

  function toggleEmail(emailId: string) {
    setExpandedEmailIds((current) =>
      current.includes(emailId) ? current.filter((id) => id !== emailId) : [...current, emailId],
    )
  }

  function applyComposerFormat(command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList') {
    if (!composerEditorRef.current) return
    composerEditorRef.current.focus()
    document.execCommand(command)
    setComposer((current) => ({
      ...current,
      description: composerEditorRef.current?.innerHTML ?? current.description,
    }))
  }

  function handleMakeDraft() {
    const missingRuleNames = Array.from(
      new Set(
        missingQuoteDetails.map((detail) => detail.businessRuleName).filter(Boolean),
      ),
    )
    if (missingRuleNames.length === 0) return

    const brokerContactName = form?.brokerAgentName && form.brokerAgentName !== 'No broker agent linked'
      ? form.brokerAgentName
      : 'Broker'
    const extractedEmail = extractEmailAddress(inquiry.name)
    const recipientEmail = extractedEmail || inquiry.contact?.email || inquiry.account?.email || composer.toRecipients
    const senderEmail = user.email ?? composer.sender ?? 'underwriting@insureai.com'
    const senderPhone = user.phone ?? '+971 4 000 0000'
    const subject = `Missing information required - ${inquiry.productName} - ${inquiry.inquiryNumber}`
    const missingItemsHtml = missingRuleNames.map((name) => `<li>${escapeHtml(name)}</li>`).join('')
    const referenceNames = missingRuleNames
      .map(
        (name) => `
          <li>
            <strong>${escapeHtml(name)}</strong>
          </li>`,
      )
      .join('')
    const description = `
      <p>Dear ${escapeHtml(brokerContactName)},</p>
      <p>Thank you for your submission for <strong>${escapeHtml(inquiry.name)}</strong> (${escapeHtml(
        inquiry.inquiryNumber,
      )}) for <strong>${escapeHtml(inquiry.productName)}</strong>.</p>
      <p>Our underwriting review has identified the following outstanding item(s) required before we can proceed with this submission:</p>
      <ul>${missingItemsHtml}</ul>
      <p><strong>Reference details:</strong></p>
      <p>&nbsp;</p>
      <ol>${referenceNames}</ol>
      <p>Please provide the above at your earliest convenience.</p>
      <p>If any of the above is not applicable or you require clarification on a specific item, please let us know and we will be happy to assist.</p>
      <p>Kind regards,</p>
      <p>${escapeHtml(user.name)}<br/>Underwriting Team<br/>InsureAI<br/>${escapeHtml(senderEmail)} | ${escapeHtml(
        senderPhone,
      )}</p>
    `.replace(/\n\s+/g, '')

    setComposer({
      sender: senderEmail,
      toRecipients: recipientEmail,
      subject,
      description,
    })
    setComposeError(null)
    setComposerEditorVersion((value) => value + 1)
    setActiveTab('details')
    setIsComposerOpen(true)
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/inquiries">
          <ArrowLeft className="h-4 w-4" />
          Back to inquiries
        </Link>
      </Button>

      <section className="space-y-5 rounded-[28px] border border-border-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,248,252,0.9)_100%)] px-6 py-6 shadow-soft dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9)_0%,rgba(15,23,42,0.78)_100%)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="new">{inquiry.inquiryNumber}</Badge>
              <Badge variant="review">{inquiry.inquiryType}</Badge>
              <Badge variant="pending">{inquiry.status}</Badge>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Underwriting workspace</p>
              <h1 className="mt-2 text-[32px] font-bold tracking-[-0.03em]">{inquiry.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {inquiry.productName} - {inquiry.planName} - {formatDate(inquiry.createdOn)}
              </p>
            </div>
          </div>
          <div className="space-y-4 lg:min-w-[320px]">
            <div className="rounded-[22px] border border-primary/12 bg-white/70 p-5 shadow-soft dark:bg-slate-950/35">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Overall Completeness
                  </p>
                  <p className="mt-3 text-4xl font-bold">{formatPercent(inquiry.readiness[0]?.value ?? 0)}</p>
                  <p className="mt-3 max-w-[210px] text-sm text-muted-foreground">
                    {inquiry.readiness[0]?.description ?? 'Tracks how much of the inquiry is ready for underwriting action.'}
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full border-4 border-primary/12 p-1">
                  <div
                    className="h-full rounded-full bg-gradient-to-br from-primary to-info"
                    style={{ clipPath: `inset(${100 - (inquiry.readiness[0]?.value ?? 0)}% 0 0 0)` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {isEditing ? (
                <>
                  <Button type="button" variant="secondary" disabled={saveBusy} onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="button" disabled={saveBusy} onClick={() => void handleSaveDetails()}>
                    <Save className="h-4 w-4" />
                    {saveBusy ? 'Saving...' : 'Save Inquiry'}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit Inquiry
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={pendingAction === 'refer'}
                onClick={() => void handleDisposition('RefertoUnderwriter', 'refer')}
              >
                Refer
              </Button>
              <Button
                variant="outline"
                disabled={pendingAction === 'escalate'}
                onClick={() => void handleDisposition('EscalatetoHeadofAviation', 'escalate')}
              >
                Escalate
              </Button>
              <Button
                variant="primary"
                disabled={pendingAction === 'quote'}
                onClick={() => void handleCreateQuote()}
              >
                Create Quote
              </Button>
            </div>
            {actionError ? <p className="text-sm text-danger lg:text-right">{actionError}</p> : null}
            {saveError ? <p className="text-sm text-danger lg:text-right">{saveError}</p> : null}
            {actionSuccess ? <p className="text-sm text-success lg:text-right">{actionSuccess}</p> : null}
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="ai">AI Extracted Response</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          {!form ? null : (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                <div className="space-y-6">
                  <Card className="space-y-5">
                    <SectionHeader title="Details" description="Core inquiry identity, product, and relationship fields." />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Name">
                        <Input disabled={!isEditing} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                      </Field>
                      <Field label="Product">
                        <SelectField disabled={!isEditing} value={form.productId} onChange={(value) => setForm({ ...form, productId: value })} options={data.options.products} />
                      </Field>
                      <Field label="Inquiry Type">
                        <SelectField disabled={!isEditing} value={form.inquiryType} onChange={(value) => setForm({ ...form, inquiryType: value })} options={data.options.inquiryTypes} />
                      </Field>
                      <Field label="Inquiry Status">
                        <SelectField disabled={!isEditing} value={form.inquiryStatus} onChange={(value) => setForm({ ...form, inquiryStatus: value })} options={data.options.inquiryStatuses} />
                      </Field>
                      <Field label="Plan">
                        <SelectField disabled={!isEditing} value={form.planId} onChange={(value) => setForm({ ...form, planId: value })} options={data.options.plans.map((item) => ({ id: item.id, name: item.name }))} />
                      </Field>
                      <Field label="Broker">
                        <SelectField disabled={!isEditing} value={form.brokerId} onChange={(value) => setForm({ ...form, brokerId: value })} options={data.options.brokers} />
                      </Field>
                      <Field label="Broker Agent">
                        <Input disabled value={form.brokerAgentName} />
                      </Field>
                    </div>
                  </Card>

                  <Card className="space-y-5">
                    <SectionHeader title="Risk" description="Exposure, scope, and risk intelligence inputs for underwriting." />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Cover Type">
                        <SelectField disabled={!isEditing} value={form.coverType} onChange={(value) => setForm({ ...form, coverType: value })} options={data.options.coverTypes} />
                      </Field>
                      <Field label="Risk Score">
                        <Input disabled={!isEditing} type="number" value={form.riskScore} onChange={(event) => setForm({ ...form, riskScore: event.target.value })} />
                      </Field>
                      <Field label="Total Sum Insured">
                        <Input disabled={!isEditing} type="number" value={form.totalSumInsured} onChange={(event) => setForm({ ...form, totalSumInsured: event.target.value })} />
                      </Field>
                      <Field label="Territorial Scope">
                        <Input disabled={!isEditing} value={form.territorialScope} onChange={(event) => setForm({ ...form, territorialScope: event.target.value })} />
                      </Field>
                      <Field label="No of Items">
                        <Input disabled={!isEditing} value={form.noOfItems} onChange={(event) => setForm({ ...form, noOfItems: event.target.value })} />
                      </Field>
                      <Field label="Risk Description">
                        <textarea
                          disabled={!isEditing}
                          className="min-h-28 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-default disabled:bg-surface-soft"
                          value={form.riskDescription}
                          onChange={(event) => setForm({ ...form, riskDescription: event.target.value })}
                        />
                      </Field>
                    </div>
                  </Card>

                  <Card className="space-y-5">
                    <SectionHeader title="Premium" description="Commercial premium and deduction controls for the inquiry." />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Premium to be Charged">
                        <Input disabled={!isEditing} type="number" value={form.premiumToBeCharged} onChange={(event) => setForm({ ...form, premiumToBeCharged: event.target.value })} />
                      </Field>
                      <Field label="Brokerage">
                        <Input disabled={!isEditing} type="number" value={form.brokerage} onChange={(event) => setForm({ ...form, brokerage: event.target.value })} />
                      </Field>
                      <Field label="Gross Premium">
                        <Input disabled={!isEditing} type="number" value={form.grossPremium} onChange={(event) => setForm({ ...form, grossPremium: event.target.value })} />
                      </Field>
                      <Field label="Payment Term">
                        <SelectField disabled={!isEditing} value={form.paymentTerm} onChange={(value) => setForm({ ...form, paymentTerm: value })} options={data.options.paymentTerms} />
                      </Field>
                      <Field label="Fee">
                        <Input disabled={!isEditing} type="number" value={form.fee} onChange={(event) => setForm({ ...form, fee: event.target.value })} />
                      </Field>
                      <Field label="Total Deduction">
                        <Input disabled={!isEditing} type="number" value={form.totalDeduction} onChange={(event) => setForm({ ...form, totalDeduction: event.target.value })} />
                      </Field>
                    </div>
                  </Card>
                </div>

                <Card variant="glass" className="space-y-5 overflow-hidden">
                  <div className="flex flex-col gap-4 border-b border-border-soft pb-5 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Email Activity Timeline</p>
                      <h3 className="text-2xl font-semibold tracking-[-0.02em]">Inquiry communications</h3>
                      <p className="text-sm text-muted-foreground">
                        All email activity linked to {inquiry.inquiryNumber} from the Dataverse email timeline.
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-border-soft bg-surface-soft px-4 py-3 text-sm">
                      <p className="font-semibold">{inquiry.accountName}</p>
                      <p className="mt-1 text-muted-foreground">{inquiry.productName} · {inquiry.planName}</p>
                      <p className="mt-1 text-muted-foreground">Broker: {inquiry.brokerName}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row">
                      <Input
                        value={emailSearch}
                        onChange={(event) => setEmailSearch(event.target.value)}
                        placeholder="Search email activity..."
                      />
                      <Button type="button" variant={isComposerOpen ? 'secondary' : 'primary'} className="whitespace-nowrap" onClick={() => setIsComposerOpen((value) => !value)}>
                        <MailPlus className="h-4 w-4" />
                        {isComposerOpen ? 'Hide Composer' : 'Compose Email'}
                      </Button>
                    </div>

                    {isComposerOpen ? (
                      <Card className="space-y-4 border border-primary/12 bg-[linear-gradient(180deg,rgba(37,99,235,0.06)_0%,rgba(255,255,255,0.6)_100%)] dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.08)_0%,rgba(15,23,42,0.4)_100%)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Compose</p>
                            <p className="mt-1 text-sm text-muted-foreground">Create a new email activity and link it directly to this inquiry.</p>
                          </div>
                          <Badge variant="review">{inquiry.inquiryNumber}</Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Sender">
                            <Input value={composer.sender} onChange={(event) => setComposer({ ...composer, sender: event.target.value })} />
                          </Field>
                          <Field label="To Recipients">
                            <Input value={composer.toRecipients} onChange={(event) => setComposer({ ...composer, toRecipients: event.target.value })} />
                          </Field>
                        </div>
                        <Field label="Subject">
                          <Input value={composer.subject} onChange={(event) => setComposer({ ...composer, subject: event.target.value })} />
                        </Field>
                        <Field label="Description">
                          <div className="overflow-hidden rounded-[18px] border border-border bg-surface">
                            <div className="flex flex-wrap items-center gap-2 border-b border-border-soft bg-surface-soft px-3 py-2">
                              <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => applyComposerFormat('bold')}>
                                <Bold className="h-4 w-4" />
                                Bold
                              </Button>
                              <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => applyComposerFormat('italic')}>
                                <Italic className="h-4 w-4" />
                                Italic
                              </Button>
                              <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => applyComposerFormat('underline')}>
                                <Underline className="h-4 w-4" />
                                Underline
                              </Button>
                              <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => applyComposerFormat('insertUnorderedList')}>
                                <List className="h-4 w-4" />
                                Bullet List
                              </Button>
                            </div>
                            <div
                              key={composerEditorVersion}
                              ref={composerEditorRef}
                              contentEditable
                              suppressContentEditableWarning
                              className="min-h-32 px-4 py-3 text-sm outline-none prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{ __html: composer.description }}
                              onInput={(event) => {
                                const description = event.currentTarget.innerHTML
                                setComposer((current) => ({
                                  ...current,
                                  description,
                                }))
                              }}
                            />
                          </div>
                        </Field>
                        {composeError ? <p className="text-sm text-danger">{composeError}</p> : null}
                        <div className="flex flex-wrap justify-end gap-3">
                          <Button type="button" variant="secondary" onClick={() => setIsComposerOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" disabled={composeBusy} onClick={() => void handleComposeEmail()}>
                            <SendHorizontal className="h-4 w-4" />
                            {composeBusy ? 'Creating...' : 'Create Email Activity'}
                          </Button>
                        </div>
                      </Card>
                    ) : null}

                    {filteredEmails.length === 0 ? (
                      <Card className="border-dashed border-border bg-surface-soft/70 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MailCheck className="h-7 w-7" />
                        </div>
                        <h4 className="mt-4 text-lg font-semibold">No linked email activity</h4>
                        <p className="mt-2 text-sm text-muted-foreground">
                          This inquiry does not have any standard Dataverse email activity yet. Use compose to create the first linked email.
                        </p>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {filteredEmails.map((email, index) => (
                          <div key={email.id} className="grid gap-4 md:grid-cols-[88px_40px_minmax(0,1fr)]">
                            <div className="flex flex-col items-start gap-2 pt-3 text-[12px] text-muted-foreground">
                              <span className="font-semibold">{formatDate(email.createdOn)}</span>
                              <span>{email.direction === 'sent' ? 'Sent' : 'Received'}</span>
                            </div>
                            <div className="relative hidden justify-center pt-1 md:flex">
                              <div
                                className={`flex h-12 w-12 shrink-0 aspect-square items-center justify-center rounded-full border-4 border-white shadow-sm transition duration-300 ${expandedEmailIds.includes(email.id) ? 'bg-primary text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)]' : 'bg-surface-soft text-primary'}`}
                              >
                                <Mail className="h-5 w-5" />
                              </div>
                              {index !== filteredEmails.length - 1 ? (
                                <div className={`absolute top-14 w-px ${expandedEmailIds.includes(email.id) ? 'bg-gradient-to-b from-primary to-primary/10' : 'bg-gradient-to-b from-border-soft to-transparent'}`} style={{ height: 'calc(100% + 1rem)' }} />
                              ) : null}
                            </div>
                            <Card variant="interactive" className="rounded-[24px] border border-border-soft bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:bg-slate-950/90 dark:shadow-[0_10px_24px_rgba(2,6,23,0.18)]">
                              <button
                                type="button"
                                className="flex w-full flex-col gap-4 text-left"
                                onClick={() => toggleEmail(email.id)}
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant={email.direction === 'sent' ? 'info' : 'approved'}>
                                        {email.status}
                                      </Badge>
                                      <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                                        {inquiry.inquiryNumber}
                                      </span>
                                    </div>
                                    <h4 className="text-lg font-semibold">{email.subject}</h4>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                      <p>From: {email.sender}</p>
                                      <p>To: {email.toRecipients}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="text-right text-[12px] text-muted-foreground">
                                      <p>{formatDate(email.createdOn)}</p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface-soft text-muted-foreground">
                                      {expandedEmailIds.includes(email.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  </div>
                                </div>
                                {!expandedEmailIds.includes(email.id) ? (
                                  <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">
                                    {getEmailPreview(getPrimaryEmailText(email.body))}
                                  </p>
                                ) : null}
                              </button>
                              {email.attachments.length > 0 ? (
                                <div className="mt-4 border-t border-border-soft pt-5">
                                  <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Paperclip className="h-4 w-4 text-primary" />
                                    Attachments ({email.attachments.length})
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2.5">
                                    {email.attachments.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-soft bg-surface-soft/90 px-3 py-2"
                                      >
                                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${attachmentAccent(attachment.mimeType).tone}`}>
                                          {attachmentAccent(attachment.mimeType).icon}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold">{attachment.name}</p>
                                          <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                                            {attachment.sizeLabel ? <span>{attachment.sizeLabel}</span> : null}
                                            {attachment.mimeType ? <span>{attachment.mimeType}</span> : null}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {expandedEmailIds.includes(email.id) ? (
                                <div className="mt-4 border-t border-border-soft pt-5">
                                  <div
                                    className="prose prose-sm max-w-none whitespace-normal text-muted-foreground dark:prose-invert prose-p:leading-7 prose-div:leading-7 prose-li:leading-7"
                                    dangerouslySetInnerHTML={{ __html: getPrimaryEmailHtml(email.body) }}
                                  />
                                </div>
                              ) : null}
                            </Card>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <Card className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-border-soft pb-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/12 text-secondary">
                  <FileStack className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">AI Extracted Response</h3>
                  <p className="text-sm text-muted-foreground">Captured responses, evidence, and business-rule decisions for this inquiry.</p>
                </div>
                <Badge variant="review">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  AI Layer
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {missingQuoteDetails.length > 0 ? (
                  <Button type="button" variant="primary" size="sm" className="rounded-full" onClick={handleMakeDraft}>
                    <MailPlus className="h-4 w-4" />
                    Request a Draft
                  </Button>
                ) : null}
                <ViewToggle value={aiView} onChange={setAiView} />
              </div>
            </div>
            <div className="rounded-[22px] border border-border-soft bg-surface-soft/70 px-5 py-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">AI Generated Summary</p>
              <p className="mt-3 text-sm leading-7 text-foreground/90">
                {inquiry.summary || 'No AI generated summary is available for this inquiry yet.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {aiCategoryFilters.map((filter) => (
                <Button
                  key={filter.label}
                  type="button"
                  variant={aiCategory === filter.label ? 'primary' : 'secondary'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setAiCategory(filter.label)}
                >
                  {filter.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                      aiCategory === filter.label ? 'bg-white/20 text-white' : 'bg-surface text-muted-foreground'
                    }`}
                  >
                    {filter.count}
                  </span>
                </Button>
              ))}
            </div>
            {inquiry.quoteDetails.length === 0 ? (
              <Card className="border-dashed border-border bg-surface-soft/70 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <FileStack className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">No AI extracted responses found</h4>
                <p className="mt-2 text-sm text-muted-foreground">No extracted AI response records are available for this inquiry yet.</p>
              </Card>
            ) : visibleQuoteDetailGroups.length === 0 ? (
              <Card className="border-dashed border-border bg-surface-soft/70 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <FileStack className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">No responses in this category</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  No AI extracted responses match the selected category filter right now.
                </p>
              </Card>
            ) : aiView === 'card' ? (
              <div className="space-y-5">
                {visibleQuoteDetailGroups.map((group) => (
                  <section key={group.category} className="space-y-4">
                    <div className="grid gap-4 xl:grid-cols-3">
                      {group.items.map((detail) => (
                        <Card key={detail.id} variant="interactive" className="space-y-4 rounded-[24px] border border-border-soft bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:bg-slate-950/95 dark:shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <h4 className="text-lg font-semibold">{detail.name}</h4>
                              <p className="text-sm text-muted-foreground">{detail.businessRuleName}</p>
                            </div>
                            <Badge variant="approved">{detail.status}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="neutral">{detail.businessRuleCategory}</Badge>
                            <Badge variant="info">{detail.conditionMet}</Badge>
                          </div>
                          <div className="space-y-3 rounded-[18px] border border-border-soft bg-surface-soft/80 p-4">
                            <div>
                              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Response</p>
                              <p className="mt-2 text-sm text-foreground/90">{detail.response || 'No response captured.'}</p>
                            </div>
                            <div>
                              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Evidence</p>
                              <p className="mt-2 text-sm text-muted-foreground">{detail.evidence}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              aiCategory === 'All' ? (
                <div className="overflow-hidden rounded-[24px] border border-border-soft">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-surface-muted/80">
                        <tr>
                          <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
                          <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
                          <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Business Rule</th>
                          <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Response</th>
                          <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Evidence</th>
                          <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Condition</th>
                          <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiry.quoteDetails.map((detail) => (
                          <tr key={detail.id} className="border-b border-border-soft/80 bg-surface transition duration-150 hover:bg-primary/5">
                            <td className="px-4 py-4 text-sm font-semibold">{detail.name}</td>
                            <td className="px-4 py-4"><Badge variant="neutral">{detail.businessRuleCategory}</Badge></td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">{detail.businessRuleName}</td>
                            <td className="px-4 py-4 text-sm text-foreground/90">{detail.response || 'No response captured.'}</td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">{detail.evidence}</td>
                            <td className="px-4 py-4"><Badge variant="info">{detail.conditionMet}</Badge></td>
                            <td className="px-4 py-4"><Badge variant="approved">{detail.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {visibleQuoteDetailGroups.map((group) => (
                    <section key={group.category} className="overflow-hidden rounded-[24px] border border-border-soft">
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-surface-muted/80">
                            <tr>
                              <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
                              <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Business Rule</th>
                              <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Response</th>
                              <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Evidence</th>
                              <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Condition</th>
                              <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((detail) => (
                              <tr key={detail.id} className="border-b border-border-soft/80 bg-surface transition duration-150 hover:bg-primary/5">
                                <td className="px-4 py-4 text-sm font-semibold">{detail.name}</td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">{detail.businessRuleName}</td>
                                <td className="px-4 py-4 text-sm text-foreground/90">{detail.response || 'No response captured.'}</td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">{detail.evidence}</td>
                                <td className="px-4 py-4"><Badge variant="info">{detail.conditionMet}</Badge></td>
                                <td className="px-4 py-4"><Badge variant="approved">{detail.status}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>
              )
            )}
          </Card>
        </TabsContent>
        <TabsContent value="actions" className="mt-4">
          <Card className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-border-soft pb-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/12 text-warning">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Actions</h3>
                  <p className="text-sm text-muted-foreground">Operational consequences and risk-control actions available for this inquiry.</p>
                </div>
              </div>
              <ViewToggle value={riskView} onChange={setRiskView} />
            </div>
            {inquiry.consequenceResults.length === 0 ? (
              <Card className="border-dashed border-border bg-surface-soft/70 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                  <GitBranch className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">No action records found</h4>
                <p className="mt-2 text-sm text-muted-foreground">No consequence or risk action records are available for this inquiry yet.</p>
              </Card>
            ) : riskView === 'card' ? (
              <div className="grid gap-4 xl:grid-cols-3">
                {inquiry.consequenceResults.map((result) => (
                  <Card key={result.id} variant="interactive" className="space-y-4 rounded-[24px] border border-border-soft bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:bg-slate-950/95 dark:shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Result Record
                        </p>
                        <h4 className="text-lg font-semibold">{result.name}</h4>
                      </div>
                      <Badge variant="info">{result.action}</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RelatedCard label="Consequence" value={result.consequenceName} />
                      <RelatedCard label="Type" value={result.type} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] text-muted-foreground">
                        {canApplyConsequence(result.type, result.action)
                          ? appliedConsequenceIds.includes(result.id)
                            ? 'Applied to the inquiry.'
                            : result.type === 'Risk'
                              ? 'Updates the inquiry risk score by 10.'
                              : 'Updates the inquiry status to match this action.'
                          : `Recorded on ${formatDate(result.createdOn)}`}
                      </div>
                      {canApplyConsequence(result.type, result.action) ? (
                        appliedConsequenceIds.includes(result.id) ? (
                          <Badge variant="approved">Applied</Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="rounded-full"
                            disabled={pendingAction === result.id}
                            onClick={() => void handleApplyConsequence(result.id)}
                          >
                            {pendingAction === result.id ? 'Applying...' : 'Apply'}
                          </Button>
                        )
                      ) : null}
                    </div>
                    <div className="rounded-[18px] border border-border-soft bg-surface-soft/80 px-4 py-3 text-[12px] text-muted-foreground">
                      Recorded on {formatDate(result.createdOn)}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-border-soft">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-surface-muted/80">
                      <tr>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Consequence</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Type</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Action</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Apply</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiry.consequenceResults.map((result) => (
                        <tr key={result.id} className="border-b border-border-soft/80 bg-surface transition duration-150 hover:bg-primary/5">
                          <td className="px-4 py-4 text-sm font-semibold">{result.name}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{result.consequenceName}</td>
                          <td className="px-4 py-4"><Badge variant="review">{result.type}</Badge></td>
                          <td className="px-4 py-4"><Badge variant="info">{result.action}</Badge></td>
                          <td className="px-4 py-4">
                            {canApplyConsequence(result.type, result.action) ? (
                              appliedConsequenceIds.includes(result.id) ? (
                                <Badge variant="approved">Applied</Badge>
                              ) : (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  className="rounded-full"
                                  disabled={pendingAction === result.id}
                                  onClick={() => void handleApplyConsequence(result.id)}
                                >
                                  {pendingAction === result.id ? 'Applying...' : 'Apply'}
                                </Button>
                              )
                            ) : (
                              <span className="text-[12px] text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(result.createdOn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="quotes" className="mt-4">
          <Card className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-border-soft pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Quotes</h3>
                <p className="mt-1 text-sm text-muted-foreground">Review linked quotes in either a compact table or a richer card layout.</p>
              </div>
              <ViewToggle value={quoteView} onChange={setQuoteView} />
            </div>
            {inquiry.quotes.length === 0 ? (
              <Card className="border-dashed border-border bg-surface-soft/70 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileStack className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">No linked quotes found</h4>
                <p className="mt-2 text-sm text-muted-foreground">Create a quote from this inquiry to start building the pricing workbench.</p>
              </Card>
            ) : quoteView === 'table' ? (
              <div className="overflow-hidden rounded-[24px] border border-border-soft">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-surface-muted/80">
                      <tr>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Quote</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Plan</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Premium</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                        <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiry.quotes.map((quote) => (
                        <tr key={quote.id} className="border-b border-border-soft/80 bg-surface transition duration-150 hover:bg-primary/5">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <Link to={`/quotes/${quote.id}/edit`} className="font-semibold text-primary transition hover:text-primary/80 hover:underline">
                                {quote.name}
                              </Link>
                              <p className="text-[12px] text-muted-foreground line-clamp-2">{quote.aiSummary}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{quote.planName}</td>
                          <td className="px-4 py-4 text-sm font-semibold">{formatCurrency(quote.totalPremium)}</td>
                          <td className="px-4 py-4"><Badge variant="approved">{quote.status}</Badge></td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(quote.createdOn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {inquiry.quotes.map((quote) => (
                  <Card key={quote.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{quote.name}</h3>
                      <Badge variant="approved">{quote.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{quote.aiSummary}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <MetricCard label="Plan" value={quote.planName} />
                      <MetricCard label="Premium" value={formatCurrency(quote.totalPremium)} />
                    </div>
                    <Button variant="secondary" asChild>
                      <Link to={`/quotes/${quote.id}/edit`}>Open Quote Workbench</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <MailCheck className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Communication Context</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                SharePoint, generated outputs, and downstream email actions should stay visible directly in the underwriting workspace.
              </p>
              <div className="rounded-2xl border border-border-soft bg-surface-soft p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">SharePoint URL</p>
                {inquiry.sharepointUrl ? (
                  <a
                    href={`https://adotdynamicscomau.sharepoint.com/sites/Datanox-DevelopmentTeam/${inquiry.sharepointUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex items-center gap-3 rounded-2xl border border-border-soft bg-white px-4 py-3 text-primary shadow-soft transition hover:border-primary/30 hover:bg-primary/5 dark:bg-slate-950/65"
                    aria-label="Open SharePoint folder"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                      <FolderOpen className="h-7 w-7" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {getSharePointFolderName(inquiry.sharepointUrl)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {inquiry.sharepointUrl}
                      </span>
                    </span>
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No SharePoint location available.</p>
                )}
              </div>
            </Card>
            <Card className="space-y-4">
              <h3 className="text-xl font-semibold">Document & Review Notes</h3>
              <p className="text-sm text-muted-foreground">{inquiry.riskDescription}</p>
              <MetricCard label="Territorial Scope" value={inquiry.territorialScope} />
              <MetricCard label="Payment Term" value={inquiry.paymentTerm} />
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="space-y-4">
              <h3 className="text-xl font-semibold">Workflow History</h3>
              <div className="space-y-3">
                {inquiry.workflow.map((step) => (
                  <Card key={step.label} className="bg-surface-soft">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{step.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {step.complete ? 'Completed in the current underwriting progression.' : 'Still waiting in the current underwriting progression.'}
                        </p>
                      </div>
                      <Badge variant={step.complete ? 'approved' : 'neutral'}>{step.complete ? 'Done' : 'Pending'}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
            <Card className="space-y-4">
              <h3 className="text-xl font-semibold">Consequence Activity</h3>
              {inquiry.consequenceResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No consequence activity has been recorded yet for this inquiry.</p>
              ) : (
                <div className="space-y-3">
                  {inquiry.consequenceResults.map((item) => (
                    <Card key={item.id} className="bg-surface-soft">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.consequenceName}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="info">{item.action}</Badge>
                          <p className="mt-2 text-[12px] text-muted-foreground">{formatDate(item.createdOn)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface-soft p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  )
}

function InquiryWorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-36 rounded-full bg-surface-soft" />
      <section className="rounded-[28px] border border-border-soft bg-surface px-6 py-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-7 w-24 rounded-full bg-surface-soft" />
              <div className="h-7 w-28 rounded-full bg-surface-soft" />
              <div className="h-7 w-24 rounded-full bg-surface-soft" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-40 rounded-full bg-surface-soft" />
              <div className="h-10 w-[420px] max-w-full rounded-2xl bg-surface-soft" />
              <div className="h-4 w-72 rounded-full bg-surface-soft" />
            </div>
          </div>
          <div className="space-y-4 lg:min-w-[320px]">
            <div className="rounded-[22px] border border-border-soft bg-surface-soft p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="h-4 w-36 rounded-full bg-surface-muted" />
                  <div className="h-10 w-24 rounded-2xl bg-surface-muted" />
                  <div className="h-4 w-52 rounded-full bg-surface-muted" />
                </div>
                <div className="h-16 w-16 rounded-full bg-surface-muted" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <div className="h-10 w-28 rounded-full bg-surface-soft" />
              <div className="h-10 w-24 rounded-full bg-surface-soft" />
              <div className="h-10 w-28 rounded-full bg-surface-soft" />
              <div className="h-10 w-32 rounded-full bg-surface-soft" />
            </div>
          </div>
        </div>
      </section>
      <div className="h-12 w-full max-w-[760px] rounded-full bg-surface-soft" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-border-soft bg-surface p-6">
            <div className="h-5 w-32 rounded-full bg-surface-soft" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-3 w-24 rounded-full bg-surface-soft" />
                  <div className="h-11 rounded-xl bg-surface-soft" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-border-soft bg-surface p-6">
            <div className="h-5 w-24 rounded-full bg-surface-soft" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-3 w-20 rounded-full bg-surface-soft" />
                  <div className="h-11 rounded-xl bg-surface-soft" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-border-soft bg-surface p-6">
          <div className="h-5 w-48 rounded-full bg-surface-soft" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-[22px] border border-border-soft bg-surface-soft p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded-full bg-surface-muted" />
                    <div className="h-5 w-48 rounded-full bg-surface-muted" />
                    <div className="h-4 w-44 rounded-full bg-surface-muted" />
                  </div>
                  <div className="h-9 w-9 rounded-full bg-surface-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
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
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; name: string }> | Array<{ value: number; label: string }>
  disabled?: boolean
}) {
  return (
    <Select
      disabled={disabled}
      value={value}
      onValueChange={onChange}
      options={[
        { value: '', label: 'Select' },
        ...options.map((option) =>
          'id' in option
            ? { value: option.id, label: option.name }
            : { value: String(option.value), label: option.label },
        ),
      ]}
    >
    </Select>
  )
}

function RelatedCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-surface-soft p-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  )
}

function canApplyConsequence(type: string, action?: string) {
  if (type === 'Risk') return true
  if (type !== 'Case Control') return false
  return toDisposition(action ?? '') !== null
}

function toDisposition(action: string) {
  const normalized = action.replace(/\s+/g, ' ').trim().toLowerCase()
  if (normalized === 'decline') return 'Decline' as const
  if (normalized === 'refer to underwriter') return 'RefertoUnderwriter' as const
  if (normalized === 'escalate to head of aviation') return 'EscalatetoHeadofAviation' as const
  if (normalized === 'property or reinsurance team') return 'PropertyorReinsuranceTeam' as const
  return null
}

function inquiryStatusValueForAction(action: string) {
  if (action === 'Decline') return 1
  if (action === 'Refer to Underwriter') return 2
  if (action === 'Escalate to Head of Aviation') return 3
  if (action === 'Property or Reinsurance Team') return 4
  return 0
}

function inquiryStatusValueForDisposition(
  disposition: 'Decline' | 'RefertoUnderwriter' | 'EscalatetoHeadofAviation' | 'PropertyorReinsuranceTeam',
) {
  if (disposition === 'Decline') return 1
  if (disposition === 'RefertoUnderwriter') return 2
  if (disposition === 'EscalatetoHeadofAviation') return 3
  if (disposition === 'PropertyorReinsuranceTeam') return 4
  return 0
}

function inquiryStatusLabelForDisposition(
  disposition: 'Decline' | 'RefertoUnderwriter' | 'EscalatetoHeadofAviation' | 'PropertyorReinsuranceTeam',
) {
  if (disposition === 'Decline') return 'Decline'
  if (disposition === 'RefertoUnderwriter') return 'Refer to Underwriter'
  if (disposition === 'EscalatetoHeadofAviation') return 'Escalate to Head of Aviation'
  if (disposition === 'PropertyorReinsuranceTeam') return 'Property or Reinsurance Team'
  return 'Draft'
}

function dispositionForInquiryStatusValue(value: number) {
  if (value === 1) return 'Decline' as const
  if (value === 2) return 'RefertoUnderwriter' as const
  if (value === 3) return 'EscalatetoHeadofAviation' as const
  if (value === 4) return 'PropertyorReinsuranceTeam' as const
  return null
}

function findOptionLabel(
  options: Array<{ value: number; label: string }>,
  value: string,
  fallback: string,
) {
  return options.find((option) => String(option.value) === value)?.label ?? fallback
}

function findOptionName(
  options: Array<{ id: string; name: string }>,
  value: string,
  fallback: string,
) {
  return options.find((option) => option.id === value)?.name ?? fallback
}

function attachmentAccent(mimeType?: string) {
  const normalized = mimeType?.toLowerCase() ?? ''
  if (normalized.includes('pdf')) {
    return {
      tone: 'bg-danger/10 text-danger',
      icon: <FileText className="h-4 w-4" />,
    }
  }
  if (normalized.includes('image') || normalized.includes('png') || normalized.includes('jpg') || normalized.includes('jpeg')) {
    return {
      tone: 'bg-info/12 text-info',
      icon: <FileImage className="h-4 w-4" />,
    }
  }
  if (normalized.includes('sheet') || normalized.includes('excel') || normalized.includes('csv')) {
    return {
      tone: 'bg-success/12 text-success',
      icon: <FileSpreadsheet className="h-4 w-4" />,
    }
  }
  if (normalized.includes('zip') || normalized.includes('archive') || normalized.includes('rar')) {
    return {
      tone: 'bg-warning/12 text-warning',
      icon: <Archive className="h-4 w-4" />,
    }
  }
  return {
    tone: 'bg-primary/10 text-primary',
    icon: <Paperclip className="h-4 w-4" />,
  }
}

function ViewToggle({
  value,
  onChange,
}: {
  value: 'card' | 'table'
  onChange: (value: 'card' | 'table') => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-muted/80 p-1">
      <Button
        type="button"
        variant={value === 'card' ? 'primary' : 'ghost'}
        size="sm"
        className="rounded-full"
        onClick={() => onChange('card')}
      >
        <LayoutGrid className="h-4 w-4" />
        Card View
      </Button>
      <Button
        type="button"
        variant={value === 'table' ? 'primary' : 'ghost'}
        size="sm"
        className="rounded-full"
        onClick={() => onChange('table')}
      >
        <Rows3 className="h-4 w-4" />
        Table View
      </Button>
    </div>
  )
}

function choiceValue(options: Array<{ value: number; label: string }>, label: string) {
  return String(options.find((option) => option.label.toLowerCase() === label.toLowerCase())?.value ?? '')
}

function buildFormState(
  inquiry: {
    name: string
    productId?: string
    productName: string
    inquiryType: string
    status: string
    inquiryStatusValue?: number
    planId?: string
    planName: string
    brokerId?: string
    brokerName: string
    contactName: string
    coverType: string
    riskScore?: number
    riskDescription: string
    totalInsured?: number
    territorialScope: string
    totalCharge?: number
    grossPremium?: number
    paymentTerm: string
    fee?: number
  },
  options: {
    products: Array<{ id: string; name: string }>
    plans: Array<{ id: string; name: string }>
    brokers: Array<{ id: string; name: string }>
    inquiryTypes: Array<{ value: number; label: string }>
    inquiryStatuses: Array<{ value: number; label: string }>
    coverTypes: Array<{ value: number; label: string }>
    paymentTerms: Array<{ value: number; label: string }>
  },
): InquiryFormState {
  return {
    name: inquiry.name,
    productId: inquiry.productId ?? options.products.find((item) => item.name === inquiry.productName)?.id ?? '',
    inquiryType: choiceValue(options.inquiryTypes, inquiry.inquiryType),
    inquiryStatus:
      inquiry.inquiryStatusValue !== undefined
        ? String(inquiry.inquiryStatusValue)
        : choiceValue(options.inquiryStatuses, inquiry.status),
    planId: inquiry.planId ?? options.plans.find((item) => item.name === inquiry.planName)?.id ?? '',
    brokerId: inquiry.brokerId ?? options.brokers.find((item) => item.name === inquiry.brokerName)?.id ?? '',
    brokerAgentName: inquiry.contactName || 'No broker agent linked',
    coverType: choiceValue(options.coverTypes, inquiry.coverType),
    riskScore: String(inquiry.riskScore ?? 0),
    riskDescription: inquiry.riskDescription,
    totalSumInsured: String(inquiry.totalInsured ?? 0),
    territorialScope: inquiry.territorialScope,
    noOfItems: '',
    premiumToBeCharged: String(inquiry.totalCharge ?? 0),
    brokerage: '0',
    grossPremium: String(inquiry.grossPremium ?? 0),
    paymentTerm: choiceValue(options.paymentTerms, inquiry.paymentTerm),
    fee: String(inquiry.fee ?? 0),
    totalDeduction: '0',
  }
}

function buildInquirySavePayload(
  form: InquiryFormState,
  overrides?: Partial<{
    inquiryStatus: number
    riskScore: number
  }>,
) {
  return {
    name: form.name,
    productId: form.productId || undefined,
    inquiryType: form.inquiryType ? Number(form.inquiryType) : undefined,
    inquiryStatus:
      overrides?.inquiryStatus ??
      (form.inquiryStatus ? Number(form.inquiryStatus) : undefined),
    planId: form.planId || undefined,
    brokerId: form.brokerId || undefined,
    coverType: form.coverType ? Number(form.coverType) : undefined,
    riskScore: overrides?.riskScore ?? (Number(form.riskScore) || 0),
    riskDescription: form.riskDescription,
    totalSumInsured: Number(form.totalSumInsured) || 0,
    territorialScope: form.territorialScope,
    noOfItems: form.noOfItems,
    premiumToBeCharged: Number(form.premiumToBeCharged) || 0,
    brokerage: Number(form.brokerage) || 0,
    grossPremium: Number(form.grossPremium) || 0,
    paymentTerm: form.paymentTerm ? Number(form.paymentTerm) : undefined,
    fee: Number(form.fee) || 0,
    totalDeduction: Number(form.totalDeduction) || 0,
  }
}

function getEmailPreview(value: string) {
  const text = htmlToPlainText(value)
  return text || 'No email body captured.'
}

function getPrimaryEmailText(value: string) {
  const html = getPrimaryEmailHtml(value)
  return htmlToPlainText(html)
}

function getPrimaryEmailHtml(value: string) {
  if (!value.trim()) return '<p>No email body captured.</p>'
  if (typeof DOMParser === 'undefined') {
    return `<p>${escapeHtml(value)}</p>`
  }

  const document = new DOMParser().parseFromString(value, 'text/html')
  const source = document.body.querySelector('.ck-content') ?? document.body
  const container = document.createElement('div')
  const children = Array.from(source.childNodes)

  for (const child of children) {
    const text = child.textContent?.replace(/\s+/g, ' ').trim() ?? ''
    if (isQuotedThreadMarker(text)) break
    container.appendChild(child.cloneNode(true))
  }

  const html = container.innerHTML.trim()
  return html || '<p>No email body captured.</p>'
}

function htmlToPlainText(value: string) {
  if (!value.trim()) return ''
  if (typeof DOMParser === 'undefined') return value
  const document = new DOMParser().parseFromString(value, 'text/html')
  return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function isQuotedThreadMarker(value: string) {
  if (!value) return false
  return [
    /\bFrom:\s/i,
    /\bSent:\s/i,
    /\bSubject:\s/i,
    /-{2,}\s*Original Message\s*-{2,}/i,
    /\bCAUTION:\s*External Email/i,
    /\bExternal Email\b/i,
  ].some((marker) => marker.test(value))
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function extractEmailAddress(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0] ?? ''
}

function getSharePointFolderName(value: string) {
  const clean = value.trim().replace(/\/+$/, '')
  if (!clean) return ''
  const parts = clean.split('/')
  return parts[parts.length - 1] ?? clean
}
