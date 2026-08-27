import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createTreaty,
  listTreaties,
  listTreatyProductOptions,
  updateTreaty,
  type ReinsuranceLookupOption,
  type TreatyRecord,
  type TreatySaveInput,
} from '../../services/reinsuranceService'

const tableColumns: Array<{
  key: keyof TreatyRecord
  label: string
  render?: (record: TreatyRecord) => string
}> = [
  { key: 'treatyName', label: 'Treaty Name' },
  { key: 'inceptionDate', label: 'Inception Date', render: (record) => formatDate(record.inceptionDate) },
  { key: 'productId', label: 'Product Id' },
  { key: 'profitCommissionPct', label: 'Profit Commission PCT', render: (record) => formatDecimal(record.profitCommissionPct) },
  { key: 'shariahBasis', label: 'Shariah Basis' },
  { key: 'treatyCapacity', label: 'Treaty Capacity', render: (record) => formatMoney(record.treatyCapacity) },
  { key: 'treatyType', label: 'Treaty Type' },
  { key: 'treatyYear', label: 'Treaty Year', render: (record) => formatNumber(record.treatyYear) },
]

const yesNoOptions = [
  { value: 'Select', label: 'Select option' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const shariahBasisOptions = [
  { value: 'Select', label: 'Select Shariah basis' },
  { value: 'Retakaful', label: 'Retakaful' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Conventional (Darura)', label: 'Conventional (Darura)' },
]

const treatyTypeOptions = [
  { value: 'Select', label: 'Select treaty type' },
  { value: 'Quota Share', label: 'Quota Share' },
  { value: 'Surplus', label: 'Surplus' },
  { value: 'Facultative Obligatory', label: 'Facultative Obligatory' },
  { value: 'Excess of Loss', label: 'Excess of Loss' },
]

interface TreatyCreateFormState {
  treatyName: string
  cessionPercentage: string
  commissionPercentage: string
  exchangeRate: string
  inceptionDate: string
  isCedable: string
  ownRetention: string
  productId: string
  profitCommissionPct: string
  shariahBasis: string
  surplusSharingPct: string
  treatyCapacity: string
  treatyType: string
  treatyYear: string
  wakalaFeePercentage: string
}

const emptyTreatyCreateForm: TreatyCreateFormState = {
  treatyName: '',
  cessionPercentage: '',
  commissionPercentage: '',
  exchangeRate: '',
  inceptionDate: '',
  isCedable: 'Select',
  ownRetention: '',
  productId: 'Select',
  profitCommissionPct: '',
  shariahBasis: 'Select',
  surplusSharingPct: '',
  treatyCapacity: '',
  treatyType: 'Select',
  treatyYear: '',
  wakalaFeePercentage: '',
}

export function TreatiesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, productOptions] = await Promise.all([
      listTreaties(),
      listTreatyProductOptions(),
    ])
    return { records, productOptions }
  }, [refreshKey])
  const records = data?.records ?? []
  const productOptions = data?.productOptions ?? []
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <TreatyDetail
        record={selected}
        productOptions={productOptions}
        onBack={() => setSelectedId(null)}
        onSave={async (updatedRecord) => {
          await updateTreaty(updatedRecord.id, toTreatySaveInput(updatedRecord))
          setRefreshKey((value) => value + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        eyebrow="Reinsurance"
        title="Treaties"
        description="Treaty setup, ceded percentages, retentions, capacities, and Retakaful terms."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Treaty
          </Button>
        }
      />

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading treaties...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
        <Card padding="none" variant="premium" className="overflow-hidden">
          <div className="scrollbar-sleek overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead className="bg-surface-muted/90">
                <tr>
                  {tableColumns.map((column) => (
                    <TableHeader key={column.key}>{column.label}</TableHeader>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr className="bg-surface">
                    <td colSpan={tableColumns.length} className="px-6 py-12 text-center">
                      <p className="text-base font-semibold">No treaties found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The aur_treaties datasource is connected, but there are no records for this view yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedId(record.id)}
                  className="cursor-pointer border-b border-border-soft/80 bg-surface transition hover:bg-primary/5"
                >
                  {tableColumns.map((column) => (
                    <td key={column.key} className="px-4 py-4 align-middle text-[13px]">
                      {column.key === 'treatyName' ? (
                        <button
                          type="button"
                          className="group inline-flex items-center gap-2 text-left font-semibold text-primary"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedId(record.id)
                          }}
                        >
                          {record.treatyName}
                        </button>
                      ) : column.key === 'isCedable' ? (
                        <Badge variant={record.isCedable === 'Yes' ? 'approved' : 'neutral'}>
                          {record.isCedable}
                        </Badge>
                      ) : column.key === 'productId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(productOptions, record.productLookupId, record.productId)}
                        </span>
                      ) : (
                        <span className="text-foreground">
                          {column.render ? column.render(record) : String(record[column.key])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isCreateOpen ? (
        <CreateTreatyModal
          productOptions={productOptions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (form) => {
            await createTreaty({
              treatyName: form.treatyName.trim() || 'Untitled Treaty',
              cessionPercentage: parseNumberInput(form.cessionPercentage),
              commissionPercentage: parseNumberInput(form.commissionPercentage),
              exchangeRate: parseNumberInput(form.exchangeRate) || 1,
              inceptionDate: form.inceptionDate || new Date().toISOString(),
              isCedable: resolveYesNo(form.isCedable, 'No'),
              ownRetention: form.ownRetention.trim() ? parseMoneyInput(form.ownRetention) : null,
              productLookupId: resolveLookupValue(form.productId),
              profitCommissionPct: parseNumberInput(form.profitCommissionPct),
              shariahBasis: resolveSelectValue(form.shariahBasis, 'Retakaful'),
              surplusSharingPct: parseNumberInput(form.surplusSharingPct),
              treatyCapacity: parseMoneyInput(form.treatyCapacity),
              treatyType: resolveSelectValue(form.treatyType, 'Surplus'),
              treatyYear: parseNumberInput(form.treatyYear) || new Date().getFullYear(),
              wakalaFeePercentage: parseNumberInput(form.wakalaFeePercentage),
            })
            setRefreshKey((value) => value + 1)
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateTreatyModal({
  productOptions,
  onClose,
  onCreate,
}: {
  productOptions: ReinsuranceLookupOption[]
  onClose: () => void
  onCreate: (form: TreatyCreateFormState) => Promise<void>
}) {
  const [form, setForm] = useState<TreatyCreateFormState>(emptyTreatyCreateForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateForm = <Key extends keyof TreatyCreateFormState>(
    key: Key,
    value: TreatyCreateFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submitForm = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onCreate(form)
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Unable to create treaty.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] border border-border-soft bg-surface shadow-[0_28px_90px_rgba(15,23,42,0.32)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft px-5 py-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Reinsurance
            </p>
            <h2 className="mt-1 text-xl font-bold">Create treaty</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a treaty using the shared premium Reinsurance form pattern.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="scrollbar-sleek flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ModalField label="Treaty Name">
              <Input
                value={form.treatyName}
                onChange={(event) => updateForm('treatyName', event.target.value)}
                placeholder="Enter treaty name"
              />
            </ModalField>
            <ModalField label="Cession Percentage">
              <Input
                value={form.cessionPercentage}
                onChange={(event) => updateForm('cessionPercentage', event.target.value)}
                placeholder="Enter cession percentage"
              />
            </ModalField>
            <ModalField label="Commission Percentage">
              <Input
                value={form.commissionPercentage}
                onChange={(event) => updateForm('commissionPercentage', event.target.value)}
                placeholder="Enter commission percentage"
              />
            </ModalField>
            <ModalField label="Exchange Rate">
              <Input
                value={form.exchangeRate}
                onChange={(event) => updateForm('exchangeRate', event.target.value)}
                placeholder="Enter exchange rate"
              />
            </ModalField>
            <ModalField label="Inception Date">
              <CalendarDateField
                value={form.inceptionDate}
                onChange={(value) => updateForm('inceptionDate', value)}
              />
            </ModalField>
            <ModalField label="Is Cedable">
              <Select
                value={form.isCedable}
                onValueChange={(value) => updateForm('isCedable', value)}
                options={yesNoOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Own Retention">
              <Input
                value={form.ownRetention}
                onChange={(event) => updateForm('ownRetention', event.target.value)}
                placeholder="Enter own retention"
              />
            </ModalField>
            <ModalField label="Product Id">
              <Select
                value={form.productId}
                onValueChange={(value) => updateForm('productId', value)}
                options={buildLookupOptions(productOptions, 'Look for Product Id')}
                placeholder="Look for Product Id"
              />
            </ModalField>
            <ModalField label="Profit Commission PCT">
              <Input
                value={form.profitCommissionPct}
                onChange={(event) => updateForm('profitCommissionPct', event.target.value)}
                placeholder="Enter profit commission"
              />
            </ModalField>
            <ModalField label="Shariah Basis">
              <Select
                value={form.shariahBasis}
                onValueChange={(value) => updateForm('shariahBasis', value)}
                options={shariahBasisOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Surplus Sharing PCT">
              <Input
                value={form.surplusSharingPct}
                onChange={(event) => updateForm('surplusSharingPct', event.target.value)}
                placeholder="Enter surplus sharing"
              />
            </ModalField>
            <ModalField label="Treaty Capacity">
              <Input
                value={form.treatyCapacity}
                onChange={(event) => updateForm('treatyCapacity', event.target.value)}
                placeholder="Enter treaty capacity"
              />
            </ModalField>
            <ModalField label="Treaty Type">
              <Select
                value={form.treatyType}
                onValueChange={(value) => updateForm('treatyType', value)}
                options={treatyTypeOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Treaty Year">
              <Input
                value={form.treatyYear}
                onChange={(event) => updateForm('treatyYear', event.target.value)}
                placeholder="Enter treaty year"
              />
            </ModalField>
            <ModalField label="Wakala Fee Percentage">
              <Input
                value={form.wakalaFeePercentage}
                onChange={(event) => updateForm('wakalaFeePercentage', event.target.value)}
                placeholder="Enter wakala fee"
              />
            </ModalField>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-soft bg-surface px-5 py-4">
          {submitError ? <p className="text-sm text-danger">{submitError}</p> : <span />}
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitForm()}>
              {submitting ? 'Creating...' : 'Create Record'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalendarDateField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const selectedDate = parseDateValue(value)
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())
  const calendarDays = buildCalendarDays(viewDate)
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate)

  const selectDate = (date: Date) => {
    onChange(formatInputDate(date))
    setViewDate(date)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="form-field-surface flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-foreground shadow-sm outline-none transition hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10"
      >
        <span className={value ? '' : 'text-[#94A3B8]'}>
          {selectedDate ? formatDate(selectedDate.toISOString()) : 'Select inception date'}
        </span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[70] w-[292px] rounded-2xl border border-border-soft bg-surface p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setViewDate((current) => addMonths(current, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const inMonth = date.getMonth() === viewDate.getMonth()
              const selected = selectedDate ? isSameDay(date, selectedDate) : false
              const today = isSameDay(date, new Date())
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`flex h-8 items-center justify-center rounded-lg text-[12px] font-semibold transition ${
                    selected
                      ? 'bg-primary text-white shadow-glow'
                      : today
                        ? 'border border-primary/30 bg-primary/8 text-primary'
                        : inMonth
                          ? 'text-foreground hover:bg-primary/10 hover:text-primary'
                          : 'text-muted-foreground/55 hover:bg-surface-muted'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-3">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-glow transition hover:bg-primary-dark"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ModalField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

function TreatyDetail({
  record,
  productOptions,
  onBack,
  onSave,
}: {
  record: TreatyRecord
  productOptions: ReinsuranceLookupOption[]
  onBack: () => void
  onSave: (record: TreatyRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<TreatyCreateFormState>(() => toTreatyForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateForm = <Key extends keyof TreatyCreateFormState>(key: Key, value: TreatyCreateFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toTreatyForm(record))
    setIsEditing(false)
  }

  const saveEdit = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({
        ...record,
        treatyName: form.treatyName.trim() || record.treatyName,
        cessionPercentage: parseNumberInput(form.cessionPercentage),
        commissionPercentage: parseNumberInput(form.commissionPercentage),
        exchangeRate: parseNumberInput(form.exchangeRate),
        inceptionDate: form.inceptionDate || record.inceptionDate,
        isCedable: resolveYesNo(form.isCedable, record.isCedable),
        ownRetention: form.ownRetention.trim() ? parseMoneyInput(form.ownRetention) : null,
        productId: resolveLookupLabel(productOptions, form.productId, record.productId),
        productLookupId: resolveLookupValue(form.productId),
        profitCommissionPct: parseNumberInput(form.profitCommissionPct),
        shariahBasis: resolveSelectValue(form.shariahBasis, record.shariahBasis),
        surplusSharingPct: parseNumberInput(form.surplusSharingPct),
        treatyCapacity: parseMoneyInput(form.treatyCapacity),
        treatyType: resolveSelectValue(form.treatyType, record.treatyType),
        treatyYear: parseNumberInput(form.treatyYear),
        wakalaFeePercentage: parseNumberInput(form.wakalaFeePercentage),
      })
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save treaty.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Treaties
      </Button>

      <PageHeader
        icon={FileText}
        eyebrow="Reinsurance"
        title={record.treatyName}
        description="Treaty percentages, capacity, retention, and Shariah basis details."
        actions={
          isEditing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button disabled={saving} onClick={() => void saveEdit()}>
                {saving ? 'Saving...' : 'Save Treaty'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Treaty</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Treaty Form
            </p>
            <h2 className="mt-1 text-xl font-bold">{record.treatyName}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={record.isCedable === 'Yes' ? 'approved' : 'neutral'}>
              Cedable: {record.isCedable}
            </Badge>
            <Badge variant="info">{record.treatyType}</Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {saveError ? (
            <div className="lg:col-span-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {saveError}
            </div>
          ) : null}
          {isEditing ? (
            <>
              <EditableField label="Treaty Name"><Input value={form.treatyName} onChange={(event) => updateForm('treatyName', event.target.value)} /></EditableField>
              <EditableField label="Cession Percentage"><Input value={form.cessionPercentage} onChange={(event) => updateForm('cessionPercentage', event.target.value)} /></EditableField>
              <EditableField label="Commission Percentage"><Input value={form.commissionPercentage} onChange={(event) => updateForm('commissionPercentage', event.target.value)} /></EditableField>
              <EditableField label="Exchange Rate"><Input value={form.exchangeRate} onChange={(event) => updateForm('exchangeRate', event.target.value)} /></EditableField>
              <EditableField label="Inception Date"><CalendarDateField value={form.inceptionDate} onChange={(value) => updateForm('inceptionDate', value)} /></EditableField>
              <EditableField label="Is Cedable"><Select value={form.isCedable} onValueChange={(value) => updateForm('isCedable', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Own Retention"><Input value={form.ownRetention} onChange={(event) => updateForm('ownRetention', event.target.value)} /></EditableField>
              <EditableField label="Product Id">
                <Select
                  value={form.productId}
                  onValueChange={(value) => updateForm('productId', value)}
                  options={buildLookupOptions(productOptions, 'Look for Product Id')}
                  placeholder="Look for Product Id"
                />
              </EditableField>
              <EditableField label="Profit Commission PCT"><Input value={form.profitCommissionPct} onChange={(event) => updateForm('profitCommissionPct', event.target.value)} /></EditableField>
              <EditableField label="Shariah Basis"><Select value={form.shariahBasis} onValueChange={(value) => updateForm('shariahBasis', value)} options={shariahBasisOptions} /></EditableField>
              <EditableField label="Surplus Sharing PCT"><Input value={form.surplusSharingPct} onChange={(event) => updateForm('surplusSharingPct', event.target.value)} /></EditableField>
              <EditableField label="Treaty Capacity"><Input value={form.treatyCapacity} onChange={(event) => updateForm('treatyCapacity', event.target.value)} /></EditableField>
              <EditableField label="Treaty Type"><Select value={form.treatyType} onValueChange={(value) => updateForm('treatyType', value)} options={treatyTypeOptions} /></EditableField>
              <EditableField label="Treaty Year"><Input value={form.treatyYear} onChange={(event) => updateForm('treatyYear', event.target.value)} /></EditableField>
              <EditableField label="Wakala Fee Percentage"><Input value={form.wakalaFeePercentage} onChange={(event) => updateForm('wakalaFeePercentage', event.target.value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Treaty Name" value={record.treatyName} />
              <ReadOnlyField label="Cession Percentage" value={formatDecimal(record.cessionPercentage)} />
              <ReadOnlyField label="Commission Percentage" value={formatDecimal(record.commissionPercentage)} />
              <ReadOnlyField label="Exchange Rate" value={formatExchangeRate(record.exchangeRate)} />
              <ReadOnlyField label="Inception Date" value={formatDate(record.inceptionDate)} />
              <ReadOnlyField label="Is Cedable" value={record.isCedable} />
              <ReadOnlyField label="Own Retention" value={formatOptionalMoney(record.ownRetention)} />
              <ReadOnlyField label="Product Id" value={getLookupDisplayValue(productOptions, record.productLookupId, record.productId)} />
              <ReadOnlyField label="Profit Commission PCT" value={formatDecimal(record.profitCommissionPct)} />
              <ReadOnlyField label="Shariah Basis" value={record.shariahBasis} />
              <ReadOnlyField label="Surplus Sharing PCT" value={formatDecimal(record.surplusSharingPct)} />
              <ReadOnlyField label="Treaty Capacity" value={formatMoney(record.treatyCapacity)} />
              <ReadOnlyField label="Treaty Type" value={record.treatyType} />
              <ReadOnlyField label="Treaty Year" value={formatNumber(record.treatyYear)} />
              <ReadOnlyField label="Wakala Fee Percentage" value={formatDecimal(record.wakalaFeePercentage)} />
            </>
          )}
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

function ReadOnlyField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 min-h-[20px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      </div>
      <div className="form-field-surface min-h-[42px] rounded-xl border border-border-soft px-4 py-2.5 text-sm text-foreground">
        {value}
      </div>
    </div>
  )
}

function EditableField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 min-h-[20px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      </div>
      {children}
    </div>
  )
}

function toTreatyForm(record: TreatyRecord): TreatyCreateFormState {
  return {
    treatyName: record.treatyName,
    cessionPercentage: formatDecimal(record.cessionPercentage),
    commissionPercentage: formatDecimal(record.commissionPercentage),
    exchangeRate: formatExchangeRate(record.exchangeRate),
    inceptionDate: record.inceptionDate,
    isCedable: record.isCedable,
    ownRetention: formatOptionalMoney(record.ownRetention),
    productId: record.productLookupId || 'Select',
    profitCommissionPct: formatDecimal(record.profitCommissionPct),
    shariahBasis: record.shariahBasis,
    surplusSharingPct: formatDecimal(record.surplusSharingPct),
    treatyCapacity: formatMoney(record.treatyCapacity),
    treatyType: record.treatyType,
    treatyYear: String(record.treatyYear),
    wakalaFeePercentage: formatDecimal(record.wakalaFeePercentage),
  }
}

function toTreatySaveInput(record: TreatyRecord): TreatySaveInput {
  return {
    treatyName: record.treatyName,
    cessionPercentage: record.cessionPercentage,
    commissionPercentage: record.commissionPercentage,
    exchangeRate: record.exchangeRate,
    inceptionDate: record.inceptionDate,
    isCedable: record.isCedable,
    ownRetention: record.ownRetention,
    productLookupId: record.productLookupId,
    profitCommissionPct: record.profitCommissionPct,
    shariahBasis: record.shariahBasis,
    surplusSharingPct: record.surplusSharingPct,
    treatyCapacity: record.treatyCapacity,
    treatyType: record.treatyType,
    treatyYear: record.treatyYear,
    wakalaFeePercentage: record.wakalaFeePercentage,
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatOptionalMoney(value: number | null) {
  return value == null ? '' : formatMoney(value)
}

function parseMoneyInput(value: string) {
  const normalized = Number.parseFloat(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function parseNumberInput(value: string) {
  const normalized = Number.parseFloat(value.replace(/[,\s]/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function resolveSelectValue(value: string, fallback: string) {
  return value && value !== 'Select' ? value : fallback
}

function resolveYesNo(value: string, fallback: 'Yes' | 'No'): 'Yes' | 'No' {
  return value === 'Yes' || value === 'No' ? value : fallback
}

function buildLookupOptions(options: ReinsuranceLookupOption[], placeholder: string) {
  return [
    { value: 'Select', label: placeholder },
    ...options.map((option) => ({ value: option.value, label: option.label })),
  ]
}

function resolveLookupValue(value: string) {
  return value && value !== 'Select' ? value : ''
}

function resolveLookupLabel(options: ReinsuranceLookupOption[], value: string, fallback: string) {
  if (!value || value === 'Select') return '---'
  return options.find((option) => option.value === value)?.label ?? fallback
}

function getLookupDisplayValue(options: ReinsuranceLookupOption[], lookupId: string, fallback: string) {
  if (!lookupId) return fallback
  return options.find((option) => option.value.toLowerCase() === lookupId.toLowerCase())?.label ?? fallback
}

function parseDateValue(value: string) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function buildCalendarDays(viewDate: Date) {
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const startOffset = start.getDay()
  const firstVisibleDate = new Date(start)
  firstVisibleDate.setDate(start.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate)
    date.setDate(firstVisibleDate.getDate() + index)
    return date
  })
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function formatDecimal(value: number) {
  return value.toFixed(2)
}

function formatExchangeRate(value: number) {
  return value.toFixed(12)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDate(value: string) {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
