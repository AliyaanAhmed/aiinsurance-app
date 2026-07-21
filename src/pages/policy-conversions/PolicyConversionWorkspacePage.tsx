import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Heading1,
  Heading2,
  ExternalLink,
  FileCheck2,
  FileText,
  List,
  ListOrdered,
  Link2,
  Mail,
  Network,
  Save,
  SearchCheck,
  Send,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  bindPolicyConversionCustomer,
  getPolicyConversionDetail,
  getPolicyConversionDocumentTemplate,
  getPolicyConversionEmailTemplate,
  getPolicyConversionOptions,
  markPaymentLinkGenerated,
  saveAmlScreening,
  savePolicyBooking,
} from '../../services/policyConversionsService'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { formatCurrency, formatDate } from '../../lib/formatters'
import type { AmlScreeningFormState, InquiryEmailSummary, PolicyBookingFormState, PolicyConversionDetail } from '../../domain/app'

type StepKey = 'payment' | 'customer' | 'aml' | 'policy' | 'conversion'
type ConversionTemplateMode = 'email' | 'document'
type CustomerMode = 'existing' | 'create'
type CustomerType = 'account' | 'contact'
type SuccessToastState = {
  title: string
  description: string
}
type ActionStatePatch = {
  detail?: Partial<PolicyConversionDetail>
  aml?: Partial<AmlScreeningFormState>
  booking?: Partial<PolicyBookingFormState>
}
type ResolvedCustomer = {
  id: string
  type: CustomerType
  name: string
  email: string
  firstName: string
  lastName: string
}

const steps: Array<{ key: StepKey; title: string; icon: typeof CircleDollarSign }> = [
  { key: 'customer', title: 'Customer Creation', icon: UserRound },
  { key: 'payment', title: 'Payment Link', icon: CircleDollarSign },
  { key: 'aml', title: 'AML Screening', icon: ShieldCheck },
  { key: 'policy', title: 'Policy Processing', icon: FileCheck2 },
  { key: 'conversion', title: 'Policy Conversion', icon: FileText },
]

const countryOptions = [
  { value: '1', label: 'UAE' },
  { value: '2', label: 'Australia' },
  { value: '3', label: 'Qatar' },
  { value: '4', label: 'Oman' },
  { value: '5', label: 'Pakistan' },
  { value: '6', label: 'UK' },
  { value: '7', label: 'USA' },
]

const emiratesOptions = [
  { value: '1', label: 'Abu Dhabi' },
  { value: '2', label: 'Dubai' },
  { value: '3', label: 'Sharjah' },
  { value: '4', label: 'Ajman' },
  { value: '5', label: 'Umm Al Quwain' },
  { value: '6', label: 'Ras Al Khaimah' },
  { value: '7', label: 'Fujairah' },
]

const amlStatusOptions: Record<string, string> = {
  '1': 'Draft',
  '2': 'Submitted',
  '3': 'In Review',
  '4': 'Clear',
  '5': 'Hit',
  '6': 'Escalated',
  '7': 'Cancelled',
}

export function PolicyConversionWorkspacePage() {
  const { id = '' } = useParams()
  const [activeStep, setActiveStep] = useState<StepKey>('customer')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [customerMode, setCustomerMode] = useState<CustomerMode>('existing')
  const [customerType, setCustomerType] = useState<CustomerType>('account')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerDraft, setCustomerDraft] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
  })
  const [conversionMode, setConversionMode] = useState<ConversionTemplateMode | null>(null)
  const [templatePreview, setTemplatePreview] = useState<{
    id: string
    title: string
    subject?: string
    content: string
  } | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [amlForm, setAmlForm] = useState<AmlScreeningFormState | null>(null)
  const [bookingForm, setBookingForm] = useState<PolicyBookingFormState | null>(null)
  const [successToast, setSuccessToast] = useState<SuccessToastState | null>(null)
  const [detailPatch, setDetailPatch] = useState<Partial<PolicyConversionDetail>>({})

  const { data, loading, error } = useAsyncData(async () => {
    const [detail, options] = await Promise.all([
      getPolicyConversionDetail(id),
      getPolicyConversionOptions(),
    ])
    setDetailPatch({})
    setAmlForm(detail.aml)
    setBookingForm(detail.booking)
    setCustomerType(detail.customerType ?? 'account')
    setSelectedCustomerId(detail.customerId ?? '')
    setCustomerMode('existing')
    return { detail, options }
  }, [id])

  const possibleMatches = useMemo(() => {
    if (!data) return []
    const search = [customerDraft.name, customerDraft.firstName, customerDraft.lastName, customerDraft.email]
      .join(' ')
      .trim()
      .toLowerCase()
    if (!search) return []
    const source = customerType === 'account' ? data.options.accounts : data.options.contacts
    return source
      .filter((item) => `${item.name} ${item.email ?? ''}`.toLowerCase().includes(search))
      .slice(0, 4)
  }, [customerDraft, customerType, data])

  if (loading) return <Card>Loading policy conversion...</Card>
  if (error || !data || !amlForm || !bookingForm) return <Card className="text-danger">{error ?? 'Policy conversion not found.'}</Card>

  const { options } = data
  const detail = { ...data.detail, ...detailPatch }
  const linkedCustomer = resolveLinkedCustomer(detail.customerType, detail.customerId, options.accounts, options.contacts)

  function showSuccessToast(toast: SuccessToastState) {
    setSuccessToast(toast)
    window.setTimeout(() => setSuccessToast(null), 4600)
  }

  function applyActionPatch(patch?: ActionStatePatch | void) {
    if (!patch) return
    if (patch.detail) setDetailPatch((current) => ({ ...current, ...patch.detail }))
    if (patch.aml) setAmlForm((current) => (current ? { ...current, ...patch.aml } : current))
    if (patch.booking) setBookingForm((current) => (current ? { ...current, ...patch.booking } : current))
  }

  async function runAction(action: () => Promise<ActionStatePatch | void>, nextStep?: StepKey, toast?: SuccessToastState) {
    try {
      setBusy(true)
      setErrorMessage(null)
      const patch = await action()
      applyActionPatch(patch)
      if (toast) showSuccessToast(toast)
      if (nextStep) setActiveStep(nextStep)
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : 'Unable to save policy conversion.')
    } finally {
      setBusy(false)
    }
  }

  function goNext(step: StepKey) {
    setErrorMessage(null)
    setActiveStep(step)
  }

  function goBack(step: StepKey) {
    setErrorMessage(null)
    setActiveStep(step)
  }

  async function chooseConversionTemplate(mode: ConversionTemplateMode) {
    try {
      setConversionMode(mode)
      setTemplateLoading(true)
      setTemplateError(null)
      setTemplatePreview(null)
      const template =
        mode === 'email'
          ? await getPolicyConversionEmailTemplate()
          : await getPolicyConversionDocumentTemplate()
      setTemplatePreview(template)
    } catch (cause) {
      setTemplateError(cause instanceof Error ? cause.message : 'Unable to load policy conversion template.')
    } finally {
      setTemplateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {successToast ? (
        <SuccessToast
          title={successToast.title}
          description={successToast.description}
          onClose={() => setSuccessToast(null)}
        />
      ) : null}

      <Button asChild variant="ghost" size="sm">
        <Link to="/policy-conversions">
          <ArrowLeft className="h-4 w-4" />
          Back to Policy Conversion
        </Link>
      </Button>

      <Card variant="premium" className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{detail.stage}</Badge>
              <Badge variant={detail.stageStatus === 'Complete' ? 'approved' : 'pending'}>{detail.stageStatus}</Badge>
            </div>
            <h1 className="mt-2 text-[24px] font-bold tracking-[-0.02em]">{detail.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quote: {detail.quoteName ?? 'No quote linked'} - Created {formatDate(detail.createdOn)}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeaderMetric label="Payment Amount" value={formatCurrency(detail.paymentAmount)} />
            <HeaderMetric label="Customer" value={detail.customerName} />
          </div>
        </div>

        <div className="mt-2 border-t border-border-soft/80 pt-7">
          <StepProgress activeStep={activeStep} onStepChange={setActiveStep} />
        </div>
      </Card>

      {errorMessage ? <Card className="border-danger/20 bg-danger/5 text-danger">{errorMessage}</Card> : null}

      <div className="transition duration-200">
        {activeStep === 'payment' ? (
          <StageCard
            icon={Link2}
            title="Payment Link"
            description="Premium amount is inherited from the won quote. This is a dummy payment flow until the real payment provider is connected."
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      const paymentError = validatePayment(detail.paymentAmount, linkedCustomer)
                      if (paymentError) throw new Error(paymentError)
                      const paymentResult = await markPaymentLinkGenerated(id, detail.paymentAmount, {
                        email: linkedCustomer?.email ?? '',
                        firstName: linkedCustomer?.firstName ?? '',
                        lastName: linkedCustomer?.lastName ?? '',
                      })
                      return { detail: paymentResult }
                    }, undefined, {
                      title: 'Payment link generated',
                      description: 'The payment link is ready and saved on this policy conversion.',
                    })
                  }
                >
                  <Link2 className="h-4 w-4" />
                  {detail.paymentLink ? 'Regenerate Link' : 'Generate Payment Link'}
                </Button>
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goBack('customer')}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goNext('aml')}>
                  Next Step
                </Button>
              </div>
            }
          >
            <PaymentExperience
              amount={detail.paymentAmount}
              status={detail.paymentStatus}
              reference={detail.paymentReference}
              link={detail.paymentLink}
              emails={detail.emails}
            />
          </StageCard>
        ) : null}

        {activeStep === 'customer' ? (
          <StageCard
            icon={UserRound}
            title="Customer Creation"
            description="Select an existing customer or create a new corporate account / individual contact."
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      async () => {
                        const customerError = validateCustomer(customerMode, customerType, selectedCustomerId, customerDraft)
                        if (customerError) throw new Error(customerError)
                        const customerResult = await bindPolicyConversionCustomer(id, {
                          type: customerType,
                          existingId: customerMode === 'existing' ? selectedCustomerId : undefined,
                          name: customerDraft.name,
                          firstName: customerDraft.firstName,
                          lastName: customerDraft.lastName,
                          email: customerDraft.email,
                        })
                        const savedCustomer = resolveCustomerDisplayName(
                          customerMode,
                          customerType,
                          selectedCustomerId,
                          customerDraft,
                          options.accounts,
                          options.contacts,
                        )
                        return {
                          detail: {
                            customerId: customerResult.customerId,
                            customerType: customerResult.customerType,
                            customerName: savedCustomer,
                          },
                        }
                      },
                      'payment',
                    )
                  }
                >
                  <Save className="h-4 w-4" />
                  Save Customer
                </Button>
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goNext('payment')}>
                  Next Step
                </Button>
              </div>
            }
          >
            <CustomerStage
              customerType={customerType}
              customerMode={customerMode}
              selectedCustomerId={selectedCustomerId}
              customerDraft={customerDraft}
              accounts={options.accounts}
              contacts={options.contacts}
              possibleMatches={possibleMatches}
              onCustomerTypeChange={(value) => {
                setCustomerType(value)
                setSelectedCustomerId('')
              }}
              onCustomerModeChange={setCustomerMode}
              onSelectedCustomerChange={setSelectedCustomerId}
              onCustomerDraftChange={setCustomerDraft}
            />
            {possibleMatches.length > 0 ? (
              <div className="rounded-[18px] border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm font-semibold text-warning">Possible existing records</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {possibleMatches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => {
                        setCustomerMode('existing')
                        setSelectedCustomerId(match.id)
                      }}
                      className="rounded-[16px] border border-border-soft bg-surface px-3 py-2 text-left text-sm transition hover:border-primary/20 hover:bg-primary/5"
                    >
                      <span className="block font-semibold">{match.name}</span>
                      <span className="text-xs text-muted-foreground">{match.email ?? 'No email'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </StageCard>
        ) : null}

        {activeStep === 'aml' ? (
          <StageCard
            icon={ShieldCheck}
            title="AML Screening"
            description="Capture anti-money-laundering screening information for this policy conversion."
            titleAccessory={<StatusCapsule label={amlStatusOptions[amlForm.screeningStatus] ?? 'Draft'} />}
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goBack('payment')}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      const amlError = validateAml(amlForm)
                      if (amlError) throw new Error(amlError)
                      const amlResult = await saveAmlScreening(id, amlForm)
                      return { aml: { id: amlResult.id, screeningStatus: '2' } }
                    }, 'policy')
                  }
                >
                  <Save className="h-4 w-4" />
                  Save AML
                </Button>
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goNext('policy')}>
                  Next Step
                </Button>
              </div>
            }
          >
            <AmlFields form={amlForm} setForm={setAmlForm} users={options.users} />
          </StageCard>
        ) : null}

        {activeStep === 'policy' ? (
          <StageCard
            icon={FileCheck2}
            title="Policy Processing"
            description="Book the policy details and complete the conversion workflow."
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goBack('aml')}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      const bookingError = validateBooking(bookingForm)
                      if (bookingError) throw new Error(bookingError)
                      const bookingResult = await savePolicyBooking(id, bookingForm)
                      return { booking: { id: bookingResult.id } }
                    })
                  }
                >
                  <Save className="h-4 w-4" />
                  Save Policy Processing
                </Button>
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goNext('conversion')}>
                  Next Step
                </Button>
              </div>
            }
          >
            <PolicyBookingFields form={bookingForm} setForm={setBookingForm} options={options} linkedCustomer={linkedCustomer} />
          </StageCard>
        ) : null}

        {activeStep === 'conversion' ? (
          <StageCard
            icon={FileText}
            title="Policy Conversion"
            description="Prepare the final conversion communication as an email draft or a document template preview."
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => goBack('policy')}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            }
          >
            <PolicyConversionFinalStage
              mode={conversionMode}
              preview={templatePreview}
              loading={templateLoading}
              error={templateError}
              onChoose={(mode) => void chooseConversionTemplate(mode)}
            />
          </StageCard>
        ) : null}
      </div>
    </div>
  )
}

function StepProgress({
  activeStep,
  onStepChange,
}: {
  activeStep: StepKey
  onStepChange: (step: StepKey) => void
}) {
  const activeIndex = steps.findIndex((step) => step.key === activeStep)

  return (
    <div className="overflow-x-auto pb-1 pt-2">
      <div className="mx-auto grid min-w-[760px] max-w-6xl grid-cols-5 items-start">
        {steps.map((step, index) => {
          const Icon = step.icon
          const active = step.key === activeStep
          const completed = index < activeIndex
          const highlighted = active || completed
          const nextHighlighted = index < activeIndex
          return (
            <div key={step.key} className="relative flex flex-col items-center">
              {index < steps.length - 1 ? (
                <div
                  className={`absolute left-1/2 top-[19px] z-0 h-[2px] w-full translate-x-[24px] rounded-full pr-12 transition ${
                    nextHighlighted ? 'bg-primary/70' : 'bg-border-soft'
                  }`}
                />
              ) : null}
              <button
                type="button"
                onClick={() => onStepChange(step.key)}
                className="group relative z-10 flex min-w-0 flex-col items-center gap-2 text-center"
              >
                <span
                  className={`relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 transition duration-200 group-hover:-translate-y-0.5 ${
                    active
                      ? 'border-primary bg-primary text-white shadow-[0_0_0_5px_hsl(var(--primary)/0.12)]'
                      : completed
                        ? 'border-primary bg-primary text-white shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]'
                        : 'border-border-soft bg-surface-soft text-muted-foreground group-hover:border-primary/40 group-hover:text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={`max-w-[140px] truncate text-[12px] font-bold transition ${
                    highlighted ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CustomerStage({
  customerType,
  customerMode,
  selectedCustomerId,
  customerDraft,
  accounts,
  contacts,
  possibleMatches,
  onCustomerTypeChange,
  onCustomerModeChange,
  onSelectedCustomerChange,
  onCustomerDraftChange,
}: {
  customerType: CustomerType
  customerMode: CustomerMode
  selectedCustomerId: string
  customerDraft: { name: string; firstName: string; lastName: string; email: string }
  accounts: Array<{ id: string; name: string; email?: string }>
  contacts: Array<{ id: string; name: string; email?: string }>
  possibleMatches: Array<{ id: string; name: string; email?: string }>
  onCustomerTypeChange: (value: CustomerType) => void
  onCustomerModeChange: (value: CustomerMode) => void
  onSelectedCustomerChange: (value: string) => void
  onCustomerDraftChange: (value: { name: string; firstName: string; lastName: string; email: string }) => void
}) {
  const customerOptions = customerType === 'account' ? accounts : contacts
  const selectedCustomer = customerOptions.find((item) => item.id === selectedCustomerId)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <CustomerChoiceCard
          active={customerType === 'account'}
          icon={Building2}
          title="Corporate"
          description="Create or link an account customer."
          onClick={() => {
            onCustomerTypeChange('account')
            onCustomerModeChange('existing')
          }}
        />
        <CustomerChoiceCard
          active={customerType === 'contact'}
          icon={UserRound}
          title="Individual"
          description="Create or link a contact customer."
          onClick={() => {
            onCustomerTypeChange('contact')
            onCustomerModeChange('existing')
          }}
        />
      </div>

      <div className="inline-flex rounded-full border border-border-soft bg-surface-soft p-1">
        {[
          { value: 'existing', label: 'Use Existing', icon: SearchCheck },
          { value: 'create', label: 'Create New', icon: UserRound },
        ].map((item) => {
          const Icon = item.icon
          const active = customerMode === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onCustomerModeChange(item.value as CustomerMode)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </div>

      {customerMode === 'existing' ? (
        <div className="rounded-[24px] border border-border-soft bg-white p-4 dark:bg-surface">
          <Field label={customerType === 'account' ? 'Account' : 'Contact'}>
            <Select
              value={selectedCustomerId}
              onValueChange={onSelectedCustomerChange}
              placeholder={customerType === 'account' ? 'Choose an account...' : 'Choose a contact...'}
              options={customerOptions.map((item) => ({
                value: item.id,
                label: `${item.name}${item.email ? ` - ${item.email}` : ''}`,
              }))}
            />
          </Field>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {customerType === 'account' ? (
              <>
                <PreviewField label="Account Name" value={selectedCustomer?.name} />
                <PreviewField label="Account Email" value={selectedCustomer?.email} />
              </>
            ) : (
              <>
                <PreviewField label="Contact Name" value={selectedCustomer?.name} />
                <PreviewField label="Contact Email" value={selectedCustomer?.email} />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-border-soft bg-surface-soft/60 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {customerType === 'account' ? (
              <TextField
                label="Account Name"
                value={customerDraft.name}
                onChange={(value) => onCustomerDraftChange({ ...customerDraft, name: value })}
              />
            ) : (
              <>
                <TextField
                  label="First Name"
                  value={customerDraft.firstName}
                  onChange={(value) => onCustomerDraftChange({ ...customerDraft, firstName: value })}
                />
                <TextField
                  label="Last Name"
                  value={customerDraft.lastName}
                  onChange={(value) => onCustomerDraftChange({ ...customerDraft, lastName: value })}
                />
              </>
            )}
            <TextField
              label="Email"
              value={customerDraft.email}
              onChange={(value) => onCustomerDraftChange({ ...customerDraft, email: value })}
            />
          </div>
        </div>
      )}

      {possibleMatches.length === 0 && customerMode === 'create' ? (
        <p className="text-xs text-muted-foreground">
          Dedupe checks will appear here when the entered name or email matches existing records.
        </p>
      ) : null}
    </div>
  )
}

function CustomerChoiceCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: typeof Building2
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-[22px] border px-5 py-5 text-left transition ${
        active
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border-soft bg-white hover:border-primary/20 hover:bg-primary/5 dark:bg-surface'
      }`}
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${active ? 'bg-primary text-white' : 'bg-surface-soft text-muted-foreground'}`}>
        <Icon className="h-7 w-7" />
      </span>
      <span>
        <span className="block text-base font-bold">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

function PolicyConversionFinalStage({
  mode,
  preview,
  loading,
  error,
  onChoose,
}: {
  mode: ConversionTemplateMode | null
  preview: { id: string; title: string; subject?: string; content: string } | null
  loading: boolean
  error: string | null
  onChoose: (mode: ConversionTemplateMode) => void
}) {
  return (
    <div className="flex min-h-[360px] flex-col justify-center space-y-6 py-8">
      <div className="mx-auto grid w-full max-w-3xl items-center gap-5 md:grid-cols-2">
        <ConversionChoiceCard
          active={mode === 'document'}
          icon={FileText}
          title="Document Template"
          description="Preview the saved conversion document template."
          onClick={() => onChoose('document')}
        />
        <ConversionChoiceCard
          active={mode === 'email'}
          icon={Mail}
          title="Send Email"
          description="Prepare a customer-ready policy conversion email."
          onClick={() => onChoose('email')}
        />
      </div>

      <div
        className={`transition duration-300 ${
          mode ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        {loading ? (
          <div className="rounded-[26px] border border-border-soft bg-surface-soft p-6">
            <div className="h-4 w-40 animate-pulse rounded-full bg-primary/15" />
            <div className="mt-5 space-y-3">
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-10/12 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-8/12 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[22px] border border-danger/20 bg-danger/5 px-4 py-4 text-sm font-semibold text-danger">
            {error}
          </div>
        ) : preview ? (
          mode === 'email' ? (
            <EmailTemplateDraft preview={preview} />
          ) : (
            <DocumentTemplatePreview preview={preview} />
          )
        ) : (
          <div className="rounded-[24px] border border-dashed border-border-soft bg-surface-soft/70 px-5 py-8 text-center text-sm text-muted-foreground">
            Choose Document Template or Send Email to load the conversion template.
          </div>
        )}
      </div>
    </div>
  )
}

function ConversionChoiceCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: typeof FileText
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[190px] overflow-hidden rounded-[26px] border px-6 py-7 text-center transition duration-200 hover:-translate-y-0.5 ${
        active
          ? 'border-primary/35 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.14),transparent_38%),white] shadow-[0_18px_40px_rgba(37,99,235,0.13)] dark:bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_40%),hsl(var(--surface))]'
          : 'border-border-soft bg-white hover:border-primary/25 hover:bg-primary/5 dark:bg-surface'
      }`}
    >
      <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/8 transition group-hover:scale-125" />
      <span
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full transition duration-200 ${
          active ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
        }`}
      >
        <Icon className="h-7 w-7" />
      </span>
      <span className="mt-5 block text-base font-bold tracking-[-0.01em]">{title}</span>
      <span className="mx-auto mt-2 block max-w-[240px] text-sm leading-6 text-muted-foreground">{description}</span>
      <span
        className={`mx-auto mt-5 block h-1.5 w-14 rounded-full transition ${
          active ? 'bg-primary' : 'bg-border-soft group-hover:bg-primary/50'
        }`}
      />
    </button>
  )
}

function EmailTemplateDraft({ preview }: { preview: { id: string; title: string; subject?: string; content: string } }) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [subject, setSubject] = useState(preview.subject || preview.title)

  useEffect(() => {
    setSubject(preview.subject || preview.title)
    if (editorRef.current) {
      editorRef.current.innerHTML = preview.content || '<p>No email body available.</p>'
    }
  }, [preview.id, preview.subject, preview.title, preview.content])

  function format(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-border-soft bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft bg-surface-soft/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Email Composer</p>
            <h3 className="mt-0.5 text-lg font-bold tracking-[-0.01em]">Policy conversion email draft</h3>
          </div>
        </div>
        <Button type="button" className="rounded-[14px]">
          <Send className="h-4 w-4" />
          Send Email
        </Button>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="overflow-hidden rounded-[20px] border border-border-soft bg-surface">
          <ComposerRow label="From" value="Underwriting Team <underwriting@insureai.com>" />
          <ComposerRow label="To" value="Customer recipient" muted />
          <div className="grid gap-3 border-t border-border-soft px-4 py-3 md:grid-cols-[86px_1fr] md:items-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Subject</p>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-[14px] border border-transparent bg-transparent px-0 py-1 text-sm font-semibold text-foreground outline-none transition focus:border-primary/20 focus:bg-white focus:px-3 dark:focus:bg-white/5"
              placeholder="Enter email subject"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-border-soft bg-white dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-1 border-b border-border-soft bg-surface-soft/70 px-3 py-2">
            <EditorButton label="Bold" onClick={() => format('bold')}>
              <span className="font-black">B</span>
            </EditorButton>
            <EditorButton label="Italic" onClick={() => format('italic')}>
              <span className="italic">I</span>
            </EditorButton>
            <EditorButton label="Underline" onClick={() => format('underline')}>
              <span className="underline">U</span>
            </EditorButton>
            <span className="mx-1 h-5 w-px bg-border-soft" />
            <EditorButton label="Heading 1" onClick={() => format('formatBlock', 'h1')}>
              <Heading1 className="h-4 w-4" />
            </EditorButton>
            <EditorButton label="Heading 2" onClick={() => format('formatBlock', 'h2')}>
              <Heading2 className="h-4 w-4" />
            </EditorButton>
            <span className="mx-1 h-5 w-px bg-border-soft" />
            <EditorButton label="Bullet list" onClick={() => format('insertUnorderedList')}>
              <List className="h-4 w-4" />
            </EditorButton>
            <EditorButton label="Numbered list" onClick={() => format('insertOrderedList')}>
              <ListOrdered className="h-4 w-4" />
            </EditorButton>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="prose prose-sm min-h-[280px] max-w-none px-5 py-5 text-foreground outline-none transition focus:bg-primary/[0.015] dark:prose-invert"
          />
        </div>
      </div>
    </div>
  )
}

function ComposerRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="grid gap-3 border-t border-border-soft px-4 py-3 first:border-t-0 md:grid-cols-[86px_1fr] md:items-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div
        className={`flex min-h-9 items-center rounded-[14px] border px-3 text-sm ${
          muted
            ? 'border-dashed border-border-soft bg-surface-soft/70 text-muted-foreground'
            : 'border-primary/10 bg-primary/5 font-semibold text-primary'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function EditorButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => {
        event.preventDefault()
        onClick()
      }}
      className="flex h-9 min-w-9 items-center justify-center rounded-[12px] px-2 text-sm font-semibold text-muted-foreground transition hover:bg-white hover:text-primary dark:hover:bg-white/10"
    >
      {children}
    </button>
  )
}

function DocumentTemplatePreview({ preview }: { preview: { title: string; content: string } }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border-soft bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:bg-surface">
      <div className="border-b border-border-soft bg-surface-soft/70 px-6 py-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Document Template</p>
        <h3 className="mt-1 text-xl font-bold">{preview.title}</h3>
      </div>
      <div className="px-6 py-5">
        <div className="rounded-[22px] border border-border-soft bg-surface-soft/70 px-6 py-6 dark:bg-white/[0.03]">
          <div
            className="prose prose-sm max-w-none text-foreground dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: preview.content || '<p>No document content available.</p>' }}
          />
        </div>
      </div>
    </div>
  )
}

function PaymentExperience({
  amount,
  status,
  reference,
  link,
  emails,
}: {
  amount: number
  status: string
  reference: string
  link: string
  emails: InquiryEmailSummary[]
}) {
  const [expandedEmailIds, setExpandedEmailIds] = useState<string[]>([])

  function toggleEmail(emailId: string) {
    setExpandedEmailIds((current) =>
      current.includes(emailId) ? current.filter((id) => id !== emailId) : [...current, emailId],
    )
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[0.86fr_1.14fr]">
      <div className="relative flex min-h-[390px] flex-col justify-center overflow-hidden rounded-[30px] border border-[#DDEBFF] bg-[radial-gradient(circle_at_18%_18%,rgba(40,108,255,0.13),transparent_30%),linear-gradient(135deg,rgba(248,251,255,0.98),rgba(255,255,255,0.96)_42%,rgba(236,253,245,0.72))] p-8 dark:border-white/10 dark:bg-[radial-gradient(circle_at_18%_18%,rgba(79,152,255,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95))]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-primary/15" />
        <div className="pointer-events-none absolute bottom-8 right-8 grid grid-cols-3 gap-2 opacity-40">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="h-2 w-2 rounded-full bg-primary/40" />
          ))}
        </div>
        <div className="flex items-center gap-3 text-primary">
          <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary text-white shadow-[0_18px_35px_rgba(37,99,235,0.24)]">
            <Network className="h-6 w-6" />
          </span>
          <p className="text-2xl font-bold tracking-[-0.02em]">network</p>
          <span className="text-sm font-semibold text-danger">Developer Hub</span>
        </div>
        <h3 className="mt-10 max-w-xl text-[30px] font-bold leading-tight tracking-[-0.03em]">
          Seamlessly prepare premium collection for this conversion
        </h3>
        <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
          This dummy screen prepares the payment session structure. The real Network payment API can be connected later without changing the policy workflow.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <PaymentMetric label="Amount" value={formatCurrency(amount)} />
          <PaymentMetric label="Status" value={status} />
          <PaymentMetric label="Reference" value={reference || 'Pending'} />
        </div>
        {link ? (
          <a
            href={normalizeExternalUrl(link)}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex items-center justify-between gap-4 rounded-[20px] border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-primary shadow-[0_14px_32px_rgba(40,108,255,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5 dark:bg-surface dark:hover:bg-primary/10"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Payment link ready
              </span>
              <span className="mt-1 block truncate">{link}</span>
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <ExternalLink className="h-4 w-4" />
            </span>
          </a>
        ) : null}
      </div>
      <div className="rounded-[30px] border border-[#E6EEF8] bg-[#F7FBFF] p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Linked Emails</p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.01em]">Payment communication</h3>
          </div>
          <span className="rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-bold text-primary dark:bg-surface">
            {emails.length} {emails.length === 1 ? 'email' : 'emails'}
          </span>
        </div>

        {emails.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-border-soft bg-white px-5 py-8 text-center dark:bg-surface">
            <Mail className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-sm font-bold">No payment emails linked yet</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Emails regarding this policy conversion will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email, index) => {
              const expanded = expandedEmailIds.includes(email.id)
              return (
                <div key={email.id} className="grid gap-4 md:grid-cols-[82px_36px_minmax(0,1fr)]">
                  <div className="pt-2 text-right text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground/80">{formatEmailDate(email.createdOn)}</p>
                    <p className="mt-1">{formatEmailTime(email.createdOn)}</p>
                  </div>
                  <div className="relative flex justify-center">
                    <span className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm transition duration-200 dark:border-surface ${expanded ? 'bg-primary text-white shadow-[0_16px_30px_rgba(37,99,235,0.25)]' : 'bg-primary/10 text-primary'}`}>
                      <Mail className="h-5 w-5" />
                    </span>
                    <span
                      className={`absolute top-12 h-[calc(100%+1rem)] w-[2px] ${
                        index === emails.length - 1
                          ? 'bg-gradient-to-b from-border-soft to-transparent'
                          : expanded
                            ? 'bg-gradient-to-b from-primary to-primary/10'
                            : 'bg-gradient-to-b from-border-soft to-border-soft/20'
                      }`}
                    />
                  </div>
                  <div className="overflow-hidden rounded-[22px] border border-border-soft bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] dark:bg-surface">
                    <button
                      type="button"
                      onClick={() => toggleEmail(email.id)}
                      className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-primary/5"
                    >
                      <span className="min-w-0">
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold">{email.subject}</span>
                          <span className="rounded-full border border-border-soft bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                            {email.status}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          From {email.sender} to {email.toRecipients}
                        </span>
                        {!expanded ? (
                          <span className="mt-2 line-clamp-2 block text-sm leading-5 text-muted-foreground">
                            {getEmailPreview(getPrimaryEmailText(email.body))}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </span>
                    </button>
                    {expanded ? (
                      <div className="border-t border-border-soft px-5 py-5">
                        <div
                          className="prose prose-sm max-w-none text-foreground dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: getPrimaryEmailHtml(email.body) }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function formatEmailDate(value?: string) {
  if (!value) return '--'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit' }).format(new Date(value))
}

function formatEmailTime(value?: string) {
  if (!value) return '--'
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function SuccessToast({
  title,
  description,
  onClose,
}: {
  title: string
  description: string
  onClose: () => void
}) {
  return (
    <div className="fixed right-6 top-6 z-[90] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[16px] border border-primary/20 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.14)] transition duration-300 dark:border-white/10 dark:bg-[#102033]">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface-soft text-muted-foreground transition hover:border-primary/25 hover:text-primary"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function PaymentMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/70 bg-white/75 px-3 py-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function getEmailPreview(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 150) || 'No preview available.'
}

function getPrimaryEmailText(value: string) {
  return getPrimaryEmailHtml(value)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function getPrimaryEmailHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return '<p>No email body captured.</p>'
  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const html = bodyMatch?.[1] ?? trimmed
  return html
    .replace(/<meta[\s\S]*?>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
}

function PreviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[16px] border border-border-soft bg-surface-soft px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value || 'Not available'}</p>
    </div>
  )
}

function AmlFields({
  form,
  setForm,
  users,
}: {
  form: AmlScreeningFormState
  setForm: (form: AmlScreeningFormState) => void
  users: Array<{ id: string; name: string }>
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Field label="Client Type *">
          <Select value={form.clientType} onValueChange={(value) => setForm({ ...form, clientType: value })} options={[{ value: '1', label: 'Corporate' }, { value: '2', label: 'Individual' }]} />
        </Field>
        <TextField label="Trade License" value={form.tradeLicense} onChange={(value) => setForm({ ...form, tradeLicense: value })} />
        <Field label="Assign To">
          <Select
            value={form.assignedToId}
            onValueChange={(value) => setForm({ ...form, assignedToId: value })}
            placeholder="Choose a user..."
            options={users.map((item) => ({ value: item.id, label: item.name }))}
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Client Name" value={form.clientName} onChange={(value) => setForm({ ...form, clientName: value })} />
        <TextField type="email" label="Client Email" value={form.clientEmail} onChange={(value) => setForm({ ...form, clientEmail: value })} />
        <TextField label="Email Subject" value={form.emailSubject} onChange={(value) => setForm({ ...form, emailSubject: value })} />
        <DateField type="datetime-local" label="Email Date" value={form.emailDate} onChange={(value) => setForm({ ...form, emailDate: value })} />
        <TextField label="Type of Policy *" value={form.typeOfPolicy} onChange={(value) => setForm({ ...form, typeOfPolicy: value })} />
        <TextField type="number" label="Premium *" value={form.premium} onChange={(value) => setForm({ ...form, premium: value })} />
      </div>
      <TextAreaField label="Remarks *" value={form.remarks} onChange={(value) => setForm({ ...form, remarks: value })} />
      <AmlDocumentDropzone />
    </div>
  )
}

function AmlDocumentDropzone() {
  return (
    <div className="rounded-[22px] border border-dashed border-primary/25 bg-primary/5 px-6 py-7 text-center transition hover:border-primary/45 hover:bg-primary/8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-primary shadow-[0_12px_28px_rgba(37,99,235,0.12)] dark:bg-surface">
        <UploadCloud className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-bold">Drag and drop AML documents here</p>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
        File upload will be connected later. For now this area reserves the AML evidence upload experience.
      </p>
      <button
        type="button"
        className="mt-4 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white dark:bg-surface"
      >
        Browse files
      </button>
    </div>
  )
}

function PolicyBookingFields({
  form,
  setForm,
  options,
  linkedCustomer,
}: {
  form: PolicyBookingFormState
  setForm: (form: PolicyBookingFormState) => void
  options: Awaited<ReturnType<typeof getPolicyConversionOptions>>
  linkedCustomer?: ResolvedCustomer
}) {
  const branchOptions = options.businessUnits
    .filter((item) => item.type === 751820001)
    .map((item) => ({ value: item.id, label: item.name }))
  const departmentOptions = options.businessUnits
    .filter((item) => item.type === 751820002)
    .map((item) => ({ value: item.id, label: item.name }))

  return (
    <div className="mt-2 space-y-8">
      <FormSection title="1. Request Information">
        <TextField label="Request No" value={form.requestNo} onChange={(value) => setForm({ ...form, requestNo: value })} />
        <SelectField label="Transaction Type *" value={form.transactionType} options={[{ value: '1', label: 'New' }, { value: '2', label: 'Renew' }, { value: '3', label: 'Endorsement' }]} onChange={(value) => setForm({ ...form, transactionType: value })} />
        <TextField label="Current/Old Policy No *" value={form.currentOldPolicyNo} onChange={(value) => setForm({ ...form, currentOldPolicyNo: value })} />
        <TextField label="New Policy No" value={form.newPolicyNo} onChange={(value) => setForm({ ...form, newPolicyNo: value })} />
        <SelectField label="Branch Code *" value={form.branchId} options={branchOptions} onChange={(value) => setForm({ ...form, branchId: value })} />
        <SelectField label="Department *" value={form.departmentId} options={departmentOptions} onChange={(value) => setForm({ ...form, departmentId: value })} />
        <SelectField label="Product *" value={form.productId} options={options.products.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => setForm({ ...form, productId: value })} />
      </FormSection>
      <FormSection title="2. Customer Detail" columns="one">
        <div className="xl:col-span-2">
          <PreviewField label="Customer Name" value={linkedCustomer?.name} />
        </div>
        <div className="xl:col-span-2">
          <PreviewField label="Customer Email" value={linkedCustomer?.email} />
        </div>
        {linkedCustomer?.type === 'contact' ? (
          <div className="xl:col-span-2">
            <SelectField
              label="Customer Contact Lookup"
              value={form.customerContactId || linkedCustomer.id}
              options={options.contacts.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => setForm({ ...form, customerContactId: value })}
            />
          </div>
        ) : null}
      </FormSection>
      <FormSection title="3. Insured Detail">
        <TextField label="Insured Name *" value={form.insuredName} onChange={(value) => setForm({ ...form, insuredName: value })} />
        <TextField label="Insured Address" value={form.insuredAddress} onChange={(value) => setForm({ ...form, insuredAddress: value })} />
        <SelectField label="Insured Country" value={form.insuredCountry} options={countryOptions} onChange={(value) => setForm({ ...form, insuredCountry: value })} />
        <SelectField label="Insured Emirates" value={form.insuredEmirates} options={emiratesOptions} onChange={(value) => setForm({ ...form, insuredEmirates: value })} />
        <SelectField label="Insured Nationality" value={form.insuredNationality} options={countryOptions} onChange={(value) => setForm({ ...form, insuredNationality: value })} />
      </FormSection>
      <FormSection title="4. Period & Currency">
        <DateField label="Period From" value={form.periodFrom} onChange={(value) => setForm({ ...form, periodFrom: value })} />
        <DateField label="Period To" value={form.periodTo} onChange={(value) => setForm({ ...form, periodTo: value })} />
        <SelectField label="SI / Prem Currency" value={form.transactionCurrencyId} options={options.currencies.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => setForm({ ...form, transactionCurrencyId: value })} />
        <TextField type="number" label="Installments" value={form.installments} onChange={(value) => setForm({ ...form, installments: value })} />
      </FormSection>
      <FormSection title="6. Inward Business">
        <TextField label="Inward Ref No" value={form.inwardRefNo} onChange={(value) => setForm({ ...form, inwardRefNo: value })} />
        <TextField label="Inward Policy No" value={form.inwardPolicyNo} onChange={(value) => setForm({ ...form, inwardPolicyNo: value })} />
        <TextField type="number" label="100% SI" value={form.hundredPercentSi} onChange={(value) => setForm({ ...form, hundredPercentSi: value })} />
        <TextField type="number" label="100% Premium *" value={form.hundredPercentPremium} onChange={(value) => setForm({ ...form, hundredPercentPremium: value })} />
        <TextField type="number" label="Our Share % *" value={form.ourSharePercent} onChange={(value) => setForm({ ...form, ourSharePercent: value })} />
        <TextField type="number" label="ADNTC Share Premium" value={form.adntcSharePremium} onChange={(value) => setForm({ ...form, adntcSharePremium: value })} />
        <TextField type="number" label="Ceding Commission % *" value={form.cedingCommissionPercent} onChange={(value) => setForm({ ...form, cedingCommissionPercent: value })} />
        <TextField type="number" label="Broker Commission % *" value={form.brokerCommissionPercent} onChange={(value) => setForm({ ...form, brokerCommissionPercent: value })} />
        <TextField type="number" label="Tax % *" value={form.taxPercent} onChange={(value) => setForm({ ...form, taxPercent: value })} />
      </FormSection>
      <FormSection title="7. Remarks" columns="one">
        <div className="xl:col-span-4">
          <TextAreaField label="Remarks *" value={form.remarks} onChange={(value) => setForm({ ...form, remarks: value })} />
        </div>
      </FormSection>
    </div>
  )
}

function StageCard({
  icon: Icon,
  title,
  description,
  titleAccessory,
  action,
  children,
}: {
  icon: typeof CircleDollarSign
  title: string
  description: string
  titleAccessory?: ReactNode
  action: ReactNode
  children: ReactNode
}) {
  return (
    <Card variant="premium" className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-[-0.02em]">{title}</h2>
              {titleAccessory}
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

function StatusCapsule({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
      {label}
    </span>
  )
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[180px] rounded-[18px] border border-border-soft bg-surface-soft px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
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

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <Field label={label}>
      <Input
        type={type}
        value={value}
        inputMode={type === 'number' ? 'decimal' : undefined}
        step={type === 'number' ? 'any' : undefined}
        onChange={(event) => onChange(type === 'number' ? sanitizeNumberInput(event.target.value) : event.target.value)}
      />
    </Field>
  )
}

function DateField({
  label,
  value,
  onChange,
  type = 'date',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'date' | 'datetime-local'
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseInputDate(value)
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate ?? new Date())
  const monthDays = getCalendarDays(viewDate)
  const timeValue = type === 'datetime-local' && value.includes('T') ? value.split('T')[1] : '09:00'

  function selectDate(day: Date) {
    const datePart = toDateInputValue(day)
    onChange(type === 'datetime-local' ? `${datePart}T${timeValue}` : datePart)
    if (type === 'date') setOpen(false)
  }

  return (
    <Field label={label}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="form-field-surface flex min-h-[46px] w-full items-center justify-between rounded-[16px] border border-border px-3 py-2.5 text-left text-sm font-medium outline-none transition hover:border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {formatDateInputLabel(value, type)}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </span>
        </button>
        {open ? (
          <div
            role="dialog"
            className="absolute left-1/2 top-full z-50 mt-2 w-auto -translate-x-1/2 rounded-[18px] border border-[#DDEBFF] bg-white p-3 text-foreground shadow-[0_18px_42px_rgba(15,23,42,0.16)] outline-none dark:border-white/10 dark:bg-[#1E293B] dark:text-white"
          >
            <div className="relative flex w-full flex-col gap-4">
              <nav className="absolute inset-x-0 top-0 flex w-full items-center justify-between" aria-label="Calendar navigation">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                  onClick={() => setViewDate((current) => addMonths(current, -1))}
                  aria-label="Go to the previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                  onClick={() => setViewDate((current) => addMonths(current, 1))}
                  aria-label="Go to the next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
              <div className="flex h-8 w-full items-center justify-center px-8">
                <span className="select-none text-sm font-semibold">
                  {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="grid w-56 grid-cols-7 gap-y-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="flex h-8 items-center justify-center rounded-md text-[0.8rem] font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {monthDays.map((day) => {
                  const muted = day.getMonth() !== viewDate.getMonth()
                  const selected = selectedDate ? isSameDate(day, selectedDate) : false
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => selectDate(day)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg p-2 text-sm leading-none outline-none transition hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/35 ${
                        selected
                          ? 'bg-primary text-white hover:bg-primary'
                          : muted
                            ? 'text-muted-foreground/50'
                            : 'text-primary'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
              {type === 'datetime-local' ? (
                <div className="flex items-center gap-2 border-t border-border-soft pt-3">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Time</span>
                  <Input
                    type="time"
                    value={timeValue}
                    onChange={(event) => {
                      const datePart = value.split('T')[0] || toDateInputValue(selectedDate ?? new Date())
                      onChange(`${datePart}T${event.target.value}`)
                    }}
                    className="h-9 rounded-xl"
                  />
                  <Button type="button" size="sm" onClick={() => setOpen(false)}>
                    Apply
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Field>
  )
}
function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <textarea
        className="form-field-surface min-h-28 w-full rounded-[16px] border border-border px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange} options={options} />
    </Field>
  )
}

function FormSection({
  title,
  children,
  columns = 'three',
}: {
  title: string
  children: ReactNode
  columns?: 'one' | 'three'
}) {
  return (
    <section className="space-y-4 border-t border-border-soft pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-base font-bold tracking-[-0.01em] text-foreground">{title}</h3>
      <div className={columns === 'one' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-4' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-4'}>{children}</div>
    </section>
  )
}

function validateCustomer(
  mode: CustomerMode,
  type: CustomerType,
  selectedCustomerId: string,
  draft: { name: string; firstName: string; lastName: string; email: string },
) {
  if (mode === 'existing' && !selectedCustomerId) {
    return type === 'account' ? 'Select an existing account before saving.' : 'Select an existing contact before saving.'
  }
  if (mode === 'create' && type === 'account' && !draft.name.trim()) {
    return 'Enter an account name before creating the customer.'
  }
  if (mode === 'create' && type === 'contact' && !draft.lastName.trim()) {
    return 'Enter a contact last name before creating the customer.'
  }
  if (draft.email.trim() && !isValidEmail(draft.email)) return 'Enter a valid customer email address.'
  return null
}

function validatePayment(amount: number, customer?: ResolvedCustomer) {
  if (!amount || Number.isNaN(Number(amount))) return 'Payment amount is required before generating a payment link.'
  if (!customer?.id) return 'Select and save a customer before generating a payment link.'
  if (!customer.email.trim()) return 'Customer email is required before generating a payment link.'
  if (!isValidEmail(customer.email)) return 'Customer email must be valid before generating a payment link.'
  if (!customer.firstName.trim()) return 'Customer first name is required before generating a payment link.'
  if (!customer.lastName.trim()) return 'Customer last name is required before generating a payment link.'
  return null
}

function validateAml(form: AmlScreeningFormState) {
  if (!form.clientType) return 'Select a client type before saving AML screening.'
  if (form.clientEmail.trim() && !isValidEmail(form.clientEmail)) return 'Enter a valid AML client email address.'
  if (!form.typeOfPolicy.trim()) return 'Enter the type of policy before saving AML screening.'
  if (!form.premium.trim() || Number.isNaN(Number(form.premium))) return 'Enter a valid premium amount before saving AML screening.'
  if (!form.remarks.trim()) return 'Enter AML remarks before saving.'
  return null
}

function validateBooking(form: PolicyBookingFormState) {
  if (!form.branchId) return 'Select a branch code before saving policy processing.'
  if (!form.transactionType) return 'Select a transaction type before saving policy processing.'
  if (!form.currentOldPolicyNo.trim()) return 'Enter the current/old policy number before saving.'
  if (!form.insuredName.trim()) return 'Enter the insured name before saving.'
  const numericFields: Array<[string, string]> = [
    ['100% Premium', form.hundredPercentPremium],
    ['Our Share %', form.ourSharePercent],
    ['Ceding Commission %', form.cedingCommissionPercent],
    ['Broker Commission %', form.brokerCommissionPercent],
    ['Tax %', form.taxPercent],
  ]
  const invalid = numericFields.find(([, value]) => !value.trim() || Number.isNaN(Number(value)))
  if (invalid) return `Enter a valid ${invalid[0]} value before saving.`
  return null
}

function sanitizeNumberInput(value: string) {
  return value.replace(/[^\d.-]/g, '')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function resolveLinkedCustomer(
  type: CustomerType | undefined,
  id: string | undefined,
  accounts: Array<{ id: string; name: string; email?: string }>,
  contacts: Array<{ id: string; name: string; email?: string }>,
): ResolvedCustomer | undefined {
  if (!type || !id) return undefined
  const source = type === 'account' ? accounts : contacts
  const record = source.find((item) => normalizeId(item.id) === normalizeId(id))
  if (!record) return undefined
  const nameParts = splitCustomerName(record.name)
  return {
    id: record.id,
    type,
    name: record.name,
    email: record.email ?? '',
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
  }
}

function resolveCustomerDisplayName(
  mode: CustomerMode,
  type: CustomerType,
  selectedCustomerId: string,
  draft: { name: string; firstName: string; lastName: string; email: string },
  accounts: Array<{ id: string; name: string; email?: string }>,
  contacts: Array<{ id: string; name: string; email?: string }>,
) {
  if (mode === 'existing') {
    const source = type === 'account' ? accounts : contacts
    const record = source.find((item) => normalizeId(item.id) === normalizeId(selectedCustomerId))
    return record?.name ?? 'Linked customer'
  }
  if (type === 'account') return draft.name.trim() || 'New account'
  return [draft.firstName, draft.lastName].filter(Boolean).join(' ').trim() || draft.name.trim() || 'New contact'
}

function splitCustomerName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function normalizeId(value?: string) {
  return value?.replace(/[{}]/g, '').toLowerCase() ?? ''
}

function parseInputDate(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateInputLabel(value: string, type: 'date' | 'datetime-local') {
  if (!value) return type === 'datetime-local' ? 'Select date and time...' : 'Select date...'
  const date = parseInputDate(value)
  if (!date) return value
  const dateLabel = date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  if (type === 'date') return dateLabel
  const time = value.includes('T') ? value.split('T')[1] : ''
  return time ? `${dateLabel} at ${time}` : dateLabel
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function getCalendarDays(viewDate: Date) {
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const calendarStart = new Date(start)
  calendarStart.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart)
    day.setDate(calendarStart.getDate() + index)
    return day
  })
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}
