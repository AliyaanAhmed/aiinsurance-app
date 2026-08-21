import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Plus, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'

interface FacPlacementRecord {
  id: string
  name: string
  amountToPlace: number
  brokerId: string
  brokeragePercentage: number
  capacityCheckId: string
  quoteId: string
  riskDescription: string
  signedDownFactor: number
  subscribedPercentage: number
  subscribedLastUpdated: string
  targetCloseDate: string
}

interface FacPlacementCreateFormState {
  name: string
  amountToPlace: string
  brokerId: string
  brokeragePercentage: string
  capacityCheckId: string
  quoteId: string
  riskDescription: string
  signedDownFactor: string
  subscribedPercentage: string
  targetCloseDate: string
}

const emptyFacPlacementCreateForm: FacPlacementCreateFormState = {
  name: '',
  amountToPlace: '',
  brokerId: '',
  brokeragePercentage: '',
  capacityCheckId: '',
  quoteId: '',
  riskDescription: '',
  signedDownFactor: '',
  subscribedPercentage: '',
  targetCloseDate: '',
}

const brokerOptions = [
  { value: 'Select', label: 'Select broker' },
  { value: 'Emirates Retakaful', label: 'Emirates Retakaful' },
  { value: 'Gulf Re', label: 'Gulf Re' },
  { value: 'Arabian Shield Re', label: 'Arabian Shield Re' },
  { value: 'Meridian Re', label: 'Meridian Re' },
]

const capacityCheckOptions = [
  { value: 'Select', label: 'Select capacity check' },
  { value: 'CC-001', label: 'CC-001' },
  { value: 'CC-002', label: 'CC-002' },
]

const facPlacements: FacPlacementRecord[] = [
  {
    id: 'fac-placement-pl-001',
    name: 'PL-001',
    amountToPlace: 10000000,
    brokerId: 'Emirates Retakaful',
    brokeragePercentage: 2.5,
    capacityCheckId: 'CC-001',
    quoteId: 'INQ-0117 - Inquiry for Commercial Property Insurance - umar.farooq@datanox.io',
    riskDescription: 'Al Rashid Trading LLC — warehouse and stock, Jebel Ali. Fire and allied perils, sprinklered, EML 60%.',
    signedDownFactor: 0.87,
    subscribedPercentage: 0,
    subscribedLastUpdated: '2026-08-21T09:39:00+05:00',
    targetCloseDate: '2026-08-14',
  },
]

const tableColumns: Array<{
  key: keyof FacPlacementRecord
  label: string
  render?: (record: FacPlacementRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'amountToPlace', label: 'Amount to Pl...', render: (record) => formatMoney(record.amountToPlace) },
  { key: 'brokerId', label: 'Broker Id' },
  { key: 'brokeragePercentage', label: 'Brokerage Percent...', render: (record) => formatDecimal(record.brokeragePercentage) },
  { key: 'capacityCheckId', label: 'Capacity Check...' },
  { key: 'quoteId', label: 'Quote Id' },
  { key: 'riskDescription', label: 'Risk Descripti...' },
  { key: 'signedDownFactor', label: 'Signed Down Fa...', render: (record) => formatDecimal(record.signedDownFactor) },
  { key: 'subscribedPercentage', label: 'Subscribed Percentage', render: (record) => formatDecimal(record.subscribedPercentage) },
  { key: 'targetCloseDate', label: 'Target Close Date', render: (record) => formatDate(record.targetCloseDate) },
]

export function FacPlacementsPage() {
  const [records, setRecords] = useState(facPlacements)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <FacPlacementDetail
        record={selected}
        onBack={() => setSelectedId(null)}
        onSave={(updatedRecord) => {
          setRecords((current) =>
            current.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)),
          )
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

      <Card padding="none" variant="premium" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] border-collapse">
            <thead className="bg-surface-muted/90">
              <tr>
                {tableColumns.map((column) => (
                  <TableHeader key={column.key}>{column.label}</TableHeader>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
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
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </button>
                      ) : column.key === 'brokerId' || column.key === 'capacityCheckId' || column.key === 'quoteId' ? (
                        <span className="font-semibold text-primary">
                          {column.render ? column.render(record) : String(record[column.key])}
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isCreateOpen ? (
        <CreateFacPlacementModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={(form) => {
            const created: FacPlacementRecord = {
              id: `fac-placement-${Date.now()}`,
              name: form.name.trim() || 'Untitled Fac Placement',
              amountToPlace: parseMoneyInput(form.amountToPlace),
              brokerId: resolveSelectValue(form.brokerId, '---'),
              brokeragePercentage: parseNumberInput(form.brokeragePercentage),
              capacityCheckId: resolveSelectValue(form.capacityCheckId, '---'),
              quoteId: form.quoteId.trim() || '---',
              riskDescription: form.riskDescription.trim() || '---',
              signedDownFactor: parseNumberInput(form.signedDownFactor),
              subscribedPercentage: parseNumberInput(form.subscribedPercentage),
              subscribedLastUpdated: new Date().toISOString(),
              targetCloseDate: form.targetCloseDate || new Date().toISOString(),
            }
            setRecords((current) => [created, ...current])
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateFacPlacementModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: FacPlacementCreateFormState) => void
}) {
  const [form, setForm] = useState<FacPlacementCreateFormState>(emptyFacPlacementCreateForm)

  const updateForm = <Key extends keyof FacPlacementCreateFormState>(
    key: Key,
    value: FacPlacementCreateFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
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
          <div className="grid gap-4 lg:grid-cols-2">
            <ModalField label="Name">
              <Input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Enter placement name"
              />
            </ModalField>
            <ModalField label="Amount to Place">
              <Input
                value={form.amountToPlace}
                onChange={(event) => updateForm('amountToPlace', event.target.value)}
                placeholder="Enter amount to place"
              />
            </ModalField>
            <ModalField label="Broker Id">
              <Select
                value={form.brokerId}
                onValueChange={(value) => updateForm('brokerId', value)}
                options={brokerOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Brokerage Percentage">
              <Input
                value={form.brokeragePercentage}
                onChange={(event) => updateForm('brokeragePercentage', event.target.value)}
                placeholder="Enter brokerage percentage"
              />
            </ModalField>
            <ModalField label="Capacity Check Id">
              <Select
                value={form.capacityCheckId}
                onValueChange={(value) => updateForm('capacityCheckId', value)}
                options={capacityCheckOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Quote Id">
              <Input
                value={form.quoteId}
                onChange={(event) => updateForm('quoteId', event.target.value)}
                placeholder="Look for Quote Id"
              />
            </ModalField>
            <ModalField label="Risk Description">
              <Input
                value={form.riskDescription}
                onChange={(event) => updateForm('riskDescription', event.target.value)}
                placeholder="Enter risk description"
              />
            </ModalField>
            <ModalField label="Signed Down Factor">
              <Input
                value={form.signedDownFactor}
                onChange={(event) => updateForm('signedDownFactor', event.target.value)}
                placeholder="Enter signed down factor"
              />
            </ModalField>
            <ModalField label="Subscribed Percentage">
              <Input
                value={form.subscribedPercentage}
                onChange={(event) => updateForm('subscribedPercentage', event.target.value)}
                placeholder="Enter subscribed percentage"
              />
            </ModalField>
            <ModalField label="Target Close Date">
              <CalendarDateField
                value={form.targetCloseDate}
                onChange={(value) => updateForm('targetCloseDate', value)}
              />
            </ModalField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft bg-surface px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onCreate(form)}>
            Create Record
          </Button>
        </div>
      </div>
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
          {selectedDate ? formatDate(selectedDate.toISOString()) : 'Select target close date'}
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

function FacPlacementDetail({
  record,
  onBack,
  onSave,
}: {
  record: FacPlacementRecord
  onBack: () => void
  onSave: (record: FacPlacementRecord) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<FacPlacementCreateFormState>(() => toFacPlacementForm(record))

  const updateForm = <Key extends keyof FacPlacementCreateFormState>(key: Key, value: FacPlacementCreateFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toFacPlacementForm(record))
    setIsEditing(false)
  }

  const saveEdit = () => {
    onSave({
      ...record,
      name: form.name.trim() || record.name,
      amountToPlace: parseMoneyInput(form.amountToPlace),
      brokerId: resolveSelectValue(form.brokerId, record.brokerId),
      brokeragePercentage: parseNumberInput(form.brokeragePercentage),
      capacityCheckId: resolveSelectValue(form.capacityCheckId, record.capacityCheckId),
      quoteId: form.quoteId.trim() || '---',
      riskDescription: form.riskDescription.trim() || '---',
      signedDownFactor: parseNumberInput(form.signedDownFactor),
      subscribedPercentage: parseNumberInput(form.subscribedPercentage),
      subscribedLastUpdated: new Date().toISOString(),
      targetCloseDate: form.targetCloseDate || record.targetCloseDate,
    })
    setIsEditing(false)
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
              <Button onClick={saveEdit}>Save Fac Placement</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Fac Placement</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Fac Placement Form
          </p>
          <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Amount to Place"><Input value={form.amountToPlace} onChange={(event) => updateForm('amountToPlace', event.target.value)} /></EditableField>
              <EditableField label="Broker Id"><Select value={form.brokerId} onValueChange={(value) => updateForm('brokerId', value)} options={brokerOptions} /></EditableField>
              <EditableField label="Brokerage Percentage"><Input value={form.brokeragePercentage} onChange={(event) => updateForm('brokeragePercentage', event.target.value)} /></EditableField>
              <EditableField label="Capacity Check Id"><Select value={form.capacityCheckId} onValueChange={(value) => updateForm('capacityCheckId', value)} options={capacityCheckOptions} /></EditableField>
              <EditableField label="Quote Id"><Input value={form.quoteId} onChange={(event) => updateForm('quoteId', event.target.value)} /></EditableField>
              <EditableField label="Risk Description"><Input value={form.riskDescription} onChange={(event) => updateForm('riskDescription', event.target.value)} /></EditableField>
              <EditableField label="Signed Down Factor"><Input value={form.signedDownFactor} onChange={(event) => updateForm('signedDownFactor', event.target.value)} /></EditableField>
              <EditableField label="Subscribed Percentage" helper={`Last updated: ${formatDateTime(record.subscribedLastUpdated)}`}><Input value={form.subscribedPercentage} onChange={(event) => updateForm('subscribedPercentage', event.target.value)} /></EditableField>
              <EditableField label="Target Close Date"><CalendarDateField value={form.targetCloseDate} onChange={(value) => updateForm('targetCloseDate', value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Amount to Place" value={formatMoney(record.amountToPlace)} />
              <ReadOnlyField label="Broker Id" value={record.brokerId} />
              <ReadOnlyField label="Brokerage Percentage" value={formatDecimal(record.brokeragePercentage)} />
              <ReadOnlyField label="Capacity Check Id" value={record.capacityCheckId} />
              <ReadOnlyField label="Quote Id" value={record.quoteId} />
              <ReadOnlyField label="Risk Description" value={record.riskDescription} multiline />
              <ReadOnlyField label="Signed Down Factor" value={formatDecimal(record.signedDownFactor)} />
              <ReadOnlyField
                label="Subscribed Percentage"
                value={formatDecimal(record.subscribedPercentage)}
                helper={`Last updated: ${formatDateTime(record.subscribedLastUpdated)}`}
              />
              <ReadOnlyField label="Target Close Date" value={formatDate(record.targetCloseDate)} />
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
  helper,
  multiline = false,
}: {
  label: string
  value: string
  helper?: string
  multiline?: boolean
}) {
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

function EditableField({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 min-h-[34px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {helper ? <p className="mt-1 text-[12px] text-muted-foreground">{helper}</p> : null}
      </div>
      {children}
    </div>
  )
}

function toFacPlacementForm(record: FacPlacementRecord): FacPlacementCreateFormState {
  return {
    name: record.name,
    amountToPlace: formatMoney(record.amountToPlace),
    brokerId: record.brokerId,
    brokeragePercentage: formatDecimal(record.brokeragePercentage),
    capacityCheckId: record.capacityCheckId,
    quoteId: record.quoteId,
    riskDescription: record.riskDescription,
    signedDownFactor: formatDecimal(record.signedDownFactor),
    subscribedPercentage: formatDecimal(record.subscribedPercentage),
    targetCloseDate: record.targetCloseDate,
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

function formatDecimal(value: number) {
  return value.toFixed(2)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function parseMoneyInput(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function parseNumberInput(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveSelectValue(value: string, fallback: string) {
  return value && value !== 'Select' ? value : fallback
}

function parseDateValue(value: string) {
  if (!value) {
    return null
  }
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
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}
