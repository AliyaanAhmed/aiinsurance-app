import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Plus, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createFacPlacement,
  listCapacityCheckLookupOptions,
  listFacPlacements,
  listQuoteLookupOptions,
  listReinsurerLookupOptions,
  updateFacPlacement,
  type FacPlacementRecord,
  type FacPlacementSaveInput,
  type ReinsuranceLookupOption,
} from '../../services/reinsuranceService'

interface FacPlacementFormState {
  name: string
  amountToPlace: string
  brokerId: string
  brokeragePercentage: string
  capacityCheckId: string
  quoteId: string
  riskDescription: string
  signedDownFactor: string
  targetCloseDate: string
}

const emptyFacPlacementForm: FacPlacementFormState = {
  name: '',
  amountToPlace: '',
  brokerId: 'Select',
  brokeragePercentage: '',
  capacityCheckId: 'Select',
  quoteId: 'Select',
  riskDescription: '',
  signedDownFactor: '',
  targetCloseDate: '',
}

const tableColumns: Array<{
  key: keyof FacPlacementRecord
  label: string
  render?: (record: FacPlacementRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'brokerId', label: 'Broker Id' },
  { key: 'brokeragePercentage', label: 'Brokerage Percent...', render: (record) => formatDecimal(record.brokeragePercentage) },
  { key: 'quoteId', label: 'Quote Id' },
  { key: 'subscribedPercentage', label: 'Subscribed Percentage', render: (record) => formatDecimal(record.subscribedPercentage) },
  { key: 'targetCloseDate', label: 'Target Close Date', render: (record) => formatDate(record.targetCloseDate) },
]

export function FacPlacementsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, brokerOptions, capacityCheckOptions, quoteOptions] = await Promise.all([
      listFacPlacements(),
      listReinsurerLookupOptions(),
      listCapacityCheckLookupOptions(),
      listQuoteLookupOptions(),
    ])
    return { records, brokerOptions, capacityCheckOptions, quoteOptions }
  }, [refreshKey])
  const records = data?.records ?? []
  const brokerOptions = data?.brokerOptions ?? []
  const capacityCheckOptions = data?.capacityCheckOptions ?? []
  const quoteOptions = data?.quoteOptions ?? []
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <FacPlacementDetail
        record={selected}
        brokerOptions={brokerOptions}
        capacityCheckOptions={capacityCheckOptions}
        quoteOptions={quoteOptions}
        onBack={() => setSelectedId(null)}
        onSave={async (updatedRecord) => {
          await updateFacPlacement(updatedRecord.id, toFacPlacementSaveInput(updatedRecord))
          setRefreshKey((value) => value + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Send}
        eyebrow="Reinsurance"
        title="Fac Placements"
        description="Facultative placement amounts, brokers, capacity checks, quotes, and subscribed percentages."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Fac Placement
          </Button>
        }
      />

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading fac placements...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
        <Card padding="none" variant="premium" className="overflow-hidden">
          <div className="scrollbar-sleek overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
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
                      <p className="text-base font-semibold">No fac placements found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The aur_fac_placements datasource is connected, but there are no records for this view yet.
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
                          {column.key === 'name' ? (
                            <button
                              type="button"
                              className="group inline-flex items-center gap-2 text-left font-semibold text-primary"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedId(record.id)
                              }}
                            >
                              {record.name}
                            </button>
                          ) : column.key === 'brokerId' ? (
                            <span className="font-semibold text-primary">
                              {getLookupDisplayValue(brokerOptions, record.brokerLookupId, record.brokerId)}
                            </span>
                          ) : column.key === 'capacityCheckId' ? (
                            <span className="font-semibold text-primary">
                              {getLookupDisplayValue(capacityCheckOptions, record.capacityCheckLookupId, record.capacityCheckId)}
                            </span>
                          ) : column.key === 'quoteId' ? (
                            <span className="font-semibold text-primary">
                              {getLookupDisplayValue(quoteOptions, record.quoteLookupId, record.quoteId)}
                            </span>
                          ) : column.key === 'riskDescription' ? (
                            <span className="block max-w-[220px] truncate text-foreground">{record.riskDescription}</span>
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
        <CreateFacPlacementModal
          brokerOptions={brokerOptions}
          capacityCheckOptions={capacityCheckOptions}
          quoteOptions={quoteOptions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (form) => {
            await createFacPlacement(toFacPlacementCreateInput(form))
            setRefreshKey((value) => value + 1)
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateFacPlacementModal({
  brokerOptions,
  capacityCheckOptions,
  quoteOptions,
  onClose,
  onCreate,
}: {
  brokerOptions: ReinsuranceLookupOption[]
  capacityCheckOptions: ReinsuranceLookupOption[]
  quoteOptions: ReinsuranceLookupOption[]
  onClose: () => void
  onCreate: (form: FacPlacementFormState) => Promise<void>
}) {
  const [form, setForm] = useState<FacPlacementFormState>(emptyFacPlacementForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateForm = <Key extends keyof FacPlacementFormState>(key: Key, value: FacPlacementFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onCreate(form)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create fac placement.')
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
            <h2 className="mt-1 text-xl font-bold">Create fac placement</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add placement, broker, quote, risk, subscription, and target close details.
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
          {error ? (
            <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <ModalField label="Name">
              <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Enter placement name" />
            </ModalField>
            <ModalField label="Amount to Place">
              <Input value={form.amountToPlace} onChange={(event) => updateForm('amountToPlace', event.target.value)} placeholder="Enter amount to place" />
            </ModalField>
            <ModalField label="Broker Id">
              <Select value={form.brokerId} onValueChange={(value) => updateForm('brokerId', value)} options={buildLookupOptions(brokerOptions, 'Look for Broker Id')} />
            </ModalField>
            <ModalField label="Brokerage Percentage">
              <Input value={form.brokeragePercentage} onChange={(event) => updateForm('brokeragePercentage', event.target.value)} placeholder="Enter brokerage percentage" />
            </ModalField>
            <ModalField label="Capacity Check Id">
              <Select value={form.capacityCheckId} onValueChange={(value) => updateForm('capacityCheckId', value)} options={buildLookupOptions(capacityCheckOptions, 'Look for Capacity Check Id')} />
            </ModalField>
            <ModalField label="Quote Id">
              <Select value={form.quoteId} onValueChange={(value) => updateForm('quoteId', value)} options={buildLookupOptions(quoteOptions, 'Look for Quote Id')} />
            </ModalField>
            <ModalField label="Risk Description">
              <Input value={form.riskDescription} onChange={(event) => updateForm('riskDescription', event.target.value)} placeholder="Enter risk description" />
            </ModalField>
            <ModalField label="Signed Down Factor">
              <Input value={form.signedDownFactor} onChange={(event) => updateForm('signedDownFactor', event.target.value)} placeholder="Enter signed down factor" />
            </ModalField>
            <ModalField label="Target Close Date">
              <CalendarDateField value={form.targetCloseDate} onChange={(value) => updateForm('targetCloseDate', value)} />
            </ModalField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft bg-surface px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Record'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

function CalendarDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selectedDate = parseDateValue(value)
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date())
  const calendarDays = buildCalendarDays(viewDate)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)

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
          {selectedDate ? formatDate(selectedDate.toISOString()) : 'Select target close date'}
        </span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[70] w-[292px] rounded-2xl border border-border-soft bg-surface p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setViewDate((current) => addMonths(current, -1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold">{monthLabel}</p>
            <button type="button" onClick={() => setViewDate((current) => addMonths(current, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
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
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground">
              Clear
            </button>
            <button type="button" onClick={() => selectDate(new Date())} className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-glow transition hover:bg-primary-dark">
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FacPlacementDetail({
  record,
  brokerOptions,
  capacityCheckOptions,
  quoteOptions,
  onBack,
  onSave,
}: {
  record: FacPlacementRecord
  brokerOptions: ReinsuranceLookupOption[]
  capacityCheckOptions: ReinsuranceLookupOption[]
  quoteOptions: ReinsuranceLookupOption[]
  onBack: () => void
  onSave: (record: FacPlacementRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<FacPlacementFormState>(() => toFacPlacementForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateForm = <Key extends keyof FacPlacementFormState>(key: Key, value: FacPlacementFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toFacPlacementForm(record))
    setSaveError(null)
    setIsEditing(false)
  }

  const saveEdit = async () => {
    const updatedRecord: FacPlacementRecord = {
      ...record,
      name: form.name.trim() || record.name,
      amountToPlace: parseMoneyInput(form.amountToPlace),
      brokerId: resolveLookupLabel(brokerOptions, form.brokerId, record.brokerId),
      brokerLookupId: resolveLookupValue(form.brokerId) || record.brokerLookupId,
      brokeragePercentage: parseNumberInput(form.brokeragePercentage),
      capacityCheckId: resolveLookupLabel(capacityCheckOptions, form.capacityCheckId, record.capacityCheckId),
      capacityCheckLookupId: resolveLookupValue(form.capacityCheckId) || record.capacityCheckLookupId,
      quoteId: resolveLookupLabel(quoteOptions, form.quoteId, record.quoteId),
      quoteLookupId: resolveLookupValue(form.quoteId) || record.quoteLookupId,
      riskDescription: form.riskDescription.trim() || '---',
      signedDownFactor: parseNumberInput(form.signedDownFactor),
      targetCloseDate: form.targetCloseDate || record.targetCloseDate,
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(updatedRecord)
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save fac placement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Fac Placements
      </Button>

      <PageHeader
        icon={Send}
        eyebrow="Reinsurance"
        title={record.name}
        description="Facultative placement broker, quote, risk, subscribed percentage, and close date details."
        actions={
          isEditing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Fac Placement'}</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Fac Placement</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        {saveError ? <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{saveError}</div> : null}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Fac Placement Form</p>
          <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Amount to Place"><Input value={form.amountToPlace} onChange={(event) => updateForm('amountToPlace', event.target.value)} /></EditableField>
              <EditableField label="Broker Id"><Select value={form.brokerId} onValueChange={(value) => updateForm('brokerId', value)} options={buildLookupOptions(brokerOptions, 'Look for Broker Id')} /></EditableField>
              <EditableField label="Brokerage Percentage"><Input value={form.brokeragePercentage} onChange={(event) => updateForm('brokeragePercentage', event.target.value)} /></EditableField>
              <EditableField label="Capacity Check Id"><Select value={form.capacityCheckId} onValueChange={(value) => updateForm('capacityCheckId', value)} options={buildLookupOptions(capacityCheckOptions, 'Look for Capacity Check Id')} /></EditableField>
              <EditableField label="Quote Id"><Select value={form.quoteId} onValueChange={(value) => updateForm('quoteId', value)} options={buildLookupOptions(quoteOptions, 'Look for Quote Id')} /></EditableField>
              <EditableField label="Risk Description"><Input value={form.riskDescription} onChange={(event) => updateForm('riskDescription', event.target.value)} /></EditableField>
              <EditableField label="Signed Down Factor"><Input value={form.signedDownFactor} onChange={(event) => updateForm('signedDownFactor', event.target.value)} /></EditableField>
              <ReadOnlyField label="Subscribed Percentage" value={formatDecimal(record.subscribedPercentage)} helper={`Last updated: ${formatDateTime(record.subscribedLastUpdated)}`} />
              <EditableField label="Target Close Date"><CalendarDateField value={form.targetCloseDate} onChange={(value) => updateForm('targetCloseDate', value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Amount to Place" value={formatMoney(record.amountToPlace)} />
              <ReadOnlyField label="Broker Id" value={getLookupDisplayValue(brokerOptions, record.brokerLookupId, record.brokerId)} />
              <ReadOnlyField label="Brokerage Percentage" value={formatDecimal(record.brokeragePercentage)} />
              <ReadOnlyField label="Capacity Check Id" value={getLookupDisplayValue(capacityCheckOptions, record.capacityCheckLookupId, record.capacityCheckId)} />
              <ReadOnlyField label="Quote Id" value={getLookupDisplayValue(quoteOptions, record.quoteLookupId, record.quoteId)} />
              <ReadOnlyField label="Risk Description" value={record.riskDescription} multiline />
              <ReadOnlyField label="Signed Down Factor" value={formatDecimal(record.signedDownFactor)} />
              <ReadOnlyField label="Subscribed Percentage" value={formatDecimal(record.subscribedPercentage)} helper={`Last updated: ${formatDateTime(record.subscribedLastUpdated)}`} />
              <ReadOnlyField label="Target Close Date" value={formatDate(record.targetCloseDate)} />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

function TableHeader({ children }: { children: string }) {
  return <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{children}</th>
}

function ReadOnlyField({ label, value, helper, multiline = false }: { label: string; value: string; helper?: string; multiline?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 min-h-[34px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {helper ? <p className="mt-1 text-[12px] text-muted-foreground">{helper}</p> : null}
      </div>
      <div className={`form-field-surface rounded-xl border border-border-soft px-4 py-2.5 text-sm text-foreground ${multiline ? 'min-h-[92px]' : 'min-h-[42px]'}`}>
        {value}
      </div>
    </div>
  )
}

function EditableField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 min-h-[34px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      </div>
      {children}
    </div>
  )
}

function toFacPlacementForm(record: FacPlacementRecord): FacPlacementFormState {
  return {
    name: record.name,
    amountToPlace: formatMoney(record.amountToPlace),
    brokerId: record.brokerLookupId || 'Select',
    brokeragePercentage: formatDecimal(record.brokeragePercentage),
    capacityCheckId: record.capacityCheckLookupId || 'Select',
    quoteId: record.quoteLookupId || 'Select',
    riskDescription: record.riskDescription,
    signedDownFactor: formatDecimal(record.signedDownFactor),
    targetCloseDate: record.targetCloseDate,
  }
}

function toFacPlacementCreateInput(form: FacPlacementFormState): FacPlacementSaveInput {
  return {
    name: form.name.trim() || 'Untitled Fac Placement',
    amountToPlace: parseMoneyInput(form.amountToPlace),
    brokerLookupId: resolveLookupValue(form.brokerId),
    brokeragePercentage: parseNumberInput(form.brokeragePercentage),
    capacityCheckLookupId: resolveLookupValue(form.capacityCheckId),
    quoteLookupId: resolveLookupValue(form.quoteId),
    riskDescription: form.riskDescription.trim() || '---',
    signedDownFactor: parseNumberInput(form.signedDownFactor),
    targetCloseDate: form.targetCloseDate,
  }
}

function toFacPlacementSaveInput(record: FacPlacementRecord): FacPlacementSaveInput {
  return {
    name: record.name,
    amountToPlace: record.amountToPlace,
    brokerLookupId: record.brokerLookupId,
    brokeragePercentage: record.brokeragePercentage,
    capacityCheckLookupId: record.capacityCheckLookupId,
    quoteLookupId: record.quoteLookupId,
    riskDescription: record.riskDescription,
    signedDownFactor: record.signedDownFactor,
    targetCloseDate: record.targetCloseDate,
  }
}

function buildLookupOptions(options: ReinsuranceLookupOption[], placeholder: string) {
  return [{ value: 'Select', label: placeholder }, ...options.map((option) => ({ value: option.value, label: option.label }))]
}

function resolveLookupValue(value: string) {
  return value && value !== 'Select' ? value : ''
}

function resolveLookupLabel(options: ReinsuranceLookupOption[], value: string, fallback: string) {
  if (!value || value === 'Select') return fallback
  return options.find((option) => option.value === value)?.label ?? fallback
}

function getLookupDisplayValue(options: ReinsuranceLookupOption[], lookupId: string, fallback: string) {
  if (!lookupId) return fallback
  return options.find((option) => option.value.toLowerCase() === lookupId.toLowerCase())?.label ?? fallback
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function formatDecimal(value: number) {
  return value.toFixed(2)
}

function formatDate(value: string) {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }).format(date)
}

function formatDateTime(value: string) {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

function parseMoneyInput(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function parseNumberInput(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDateValue(value: string) {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function buildCalendarDays(viewDate: Date) {
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start)
    next.setDate(start.getDate() + index)
    return next
  })
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
}
