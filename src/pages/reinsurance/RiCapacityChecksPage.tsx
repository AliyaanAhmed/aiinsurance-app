import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'

interface RiCapacityCheckRecord {
  id: string
  name: string
  calculatedOn: string
  calculatedTime: string
  calculationSource: string
  excessToPlace: number | null
  inquiryId: string
  isActive: 'Yes' | 'No'
  outcome: string
  quoteId: string
  retainedAmount: number
  sumInsured: number
  treatyAbsorbed: number
  treatyId: string
}

const riCapacityChecks: RiCapacityCheckRecord[] = [
  {
    id: 'ri-capacity-check-cc-001',
    name: 'CC-001',
    calculatedOn: '2026-01-18',
    calculatedTime: '3:00 AM',
    calculationSource: 'AI Extraction',
    excessToPlace: 10000000,
    inquiryId: 'Inquiry for Aviation - anees.rehman@datanox.io',
    isActive: 'Yes',
    outcome: 'Facultative Required',
    quoteId: '---',
    retainedAmount: 5000000,
    sumInsured: 40000000,
    treatyAbsorbed: 25000000,
    treatyId: 'Fire Surplus 2026',
  },
  {
    id: 'ri-capacity-check-cc-002',
    name: 'CC-002',
    calculatedOn: '2026-02-23',
    calculatedTime: '7:00 AM',
    calculationSource: 'AI Extraction',
    excessToPlace: null,
    inquiryId: 'Inquiry for Aviation - hassan.naeem@datanox.io',
    isActive: 'Yes',
    outcome: 'Within Treaty Capacity',
    quoteId: '---',
    retainedAmount: 300000,
    sumInsured: 12500000,
    treatyAbsorbed: 12200000,
    treatyId: 'Fire Surplus 2026',
  },
]

const tableColumns: Array<{
  key: keyof RiCapacityCheckRecord
  label: string
  render?: (record: RiCapacityCheckRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'calculatedOn', label: 'Calculated ...', render: (record) => `${formatDate(record.calculatedOn)} ${record.calculatedTime}` },
  { key: 'calculationSource', label: 'Calculation Sou...' },
  { key: 'excessToPlace', label: 'Excess to Pla...', render: (record) => formatOptionalMoney(record.excessToPlace) },
  { key: 'inquiryId', label: 'Inquiry Id' },
  { key: 'isActive', label: 'Is Active' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'quoteId', label: 'Quote Id' },
  { key: 'retainedAmount', label: 'Retained Amount', render: (record) => formatMoney(record.retainedAmount) },
  { key: 'sumInsured', label: 'Sum Insured', render: (record) => formatMoney(record.sumInsured) },
  { key: 'treatyAbsorbed', label: 'Treaty Absorbed', render: (record) => formatMoney(record.treatyAbsorbed) },
  { key: 'treatyId', label: 'Treaty Id' },
]

const yesNoOptions = [
  { value: 'Select', label: 'Select option' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const calculationSourceOptions = [
  { value: 'Select', label: 'Select calculation source' },
  { value: 'AI Extraction', label: 'AI Extraction' },
  { value: 'Manual Entry', label: 'Manual Entry' },
  { value: 'Recalculation', label: 'Recalculation' },
]

const outcomeOptions = [
  { value: 'Select', label: 'Select outcome' },
  { value: 'Within Retention', label: 'Within Retention' },
  { value: 'Within Treaty', label: 'Within Treaty' },
  { value: 'Facultative Required', label: 'Facultative Required' },
  { value: 'Refer to RI Manager', label: 'Refer to RI Manager' },
  { value: 'No Treaty Found', label: 'No Treaty Found' },
]

const timeOptions = [
  { value: 'Select', label: 'Select time' },
  ...Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2)
    const minute = index % 2 === 0 ? '00' : '30'
    const period = hour < 12 ? 'AM' : 'PM'
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const label = `${displayHour}:${minute} ${period}`
    return { value: label, label }
  }),
]

interface RiCapacityCheckCreateFormState {
  name: string
  calculatedOn: string
  calculatedTime: string
  calculationSource: string
  excessToPlace: string
  inquiryId: string
  isActive: string
  outcome: string
  quoteId: string
  retainedAmount: string
  sumInsured: string
  treatyAbsorbed: string
  treatyId: string
}

export function RiCapacityChecksPage() {
  const [records, setRecords] = useState(riCapacityChecks)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <RiCapacityCheckDetail
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
        icon={ShieldCheck}
        eyebrow="Reinsurance"
        title="Ri-Capacity Checks"
        description="Capacity calculations, retained values, treaty absorption, and placement outcomes."
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
                      ) : column.key === 'isActive' ? (
                        <Badge variant={record.isActive === 'Yes' ? 'approved' : 'neutral'}>
                          {record.isActive}
                        </Badge>
                      ) : column.key === 'inquiryId' || column.key === 'quoteId' || column.key === 'treatyId' ? (
                        <span className="font-semibold text-primary">
                          {column.render ? column.render(record) : String(record[column.key])}
                        </span>
                      ) : column.key === 'outcome' ? (
                        <Badge variant={record.outcome === 'Facultative Required' ? 'pending' : 'approved'}>
                          {record.outcome}
                        </Badge>
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
          {selectedDate ? formatDate(selectedDate.toISOString()) : 'Select calculated date'}
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

function RiCapacityCheckDetail({
  record,
  onBack,
  onSave,
}: {
  record: RiCapacityCheckRecord
  onBack: () => void
  onSave: (record: RiCapacityCheckRecord) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<RiCapacityCheckCreateFormState>(() => toRiCapacityCheckForm(record))

  const updateForm = <Key extends keyof RiCapacityCheckCreateFormState>(
    key: Key,
    value: RiCapacityCheckCreateFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toRiCapacityCheckForm(record))
    setIsEditing(false)
  }

  const saveEdit = () => {
    onSave({
      ...record,
      name: form.name.trim() || record.name,
      calculatedOn: form.calculatedOn || record.calculatedOn,
      calculatedTime: resolveSelectValue(form.calculatedTime, record.calculatedTime),
      calculationSource: resolveSelectValue(form.calculationSource, record.calculationSource),
      excessToPlace: form.excessToPlace.trim() ? parseMoneyInput(form.excessToPlace) : null,
      inquiryId: form.inquiryId.trim() || '---',
      isActive: resolveYesNo(form.isActive, record.isActive),
      outcome: resolveSelectValue(form.outcome, record.outcome),
      quoteId: form.quoteId.trim() || '---',
      retainedAmount: parseMoneyInput(form.retainedAmount),
      sumInsured: parseMoneyInput(form.sumInsured),
      treatyAbsorbed: parseMoneyInput(form.treatyAbsorbed),
      treatyId: form.treatyId.trim() || '---',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Ri-Capacity Checks
      </Button>

      <PageHeader
        icon={ShieldCheck}
        eyebrow="Reinsurance"
        title={record.name}
        description="Capacity check calculation source, treaty response, and facultative placement requirement."
        actions={
          isEditing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={saveEdit}>Save Capacity Check</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Capacity Check</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Ri-Capacity Check Form
            </p>
            <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={record.isActive === 'Yes' ? 'approved' : 'neutral'}>
              Active: {record.isActive}
            </Badge>
            <Badge variant={record.outcome === 'Facultative Required' ? 'pending' : 'approved'}>
              {record.outcome}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Calculated On"><CalendarDateField value={form.calculatedOn} onChange={(value) => updateForm('calculatedOn', value)} /></EditableField>
              <EditableField label="Calculated Time"><Select value={form.calculatedTime} onValueChange={(value) => updateForm('calculatedTime', value)} options={timeOptions} /></EditableField>
              <EditableField label="Calculation Source"><Select value={form.calculationSource} onValueChange={(value) => updateForm('calculationSource', value)} options={calculationSourceOptions} /></EditableField>
              <EditableField label="Excess to Place"><Input value={form.excessToPlace} onChange={(event) => updateForm('excessToPlace', event.target.value)} /></EditableField>
              <EditableField label="Inquiry Id"><Input value={form.inquiryId} onChange={(event) => updateForm('inquiryId', event.target.value)} /></EditableField>
              <EditableField label="Is Active"><Select value={form.isActive} onValueChange={(value) => updateForm('isActive', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Outcome"><Select value={form.outcome} onValueChange={(value) => updateForm('outcome', value)} options={outcomeOptions} /></EditableField>
              <EditableField label="Quote Id"><Input value={form.quoteId} onChange={(event) => updateForm('quoteId', event.target.value)} /></EditableField>
              <EditableField label="Retained Amount"><Input value={form.retainedAmount} onChange={(event) => updateForm('retainedAmount', event.target.value)} /></EditableField>
              <EditableField label="Sum Insured"><Input value={form.sumInsured} onChange={(event) => updateForm('sumInsured', event.target.value)} /></EditableField>
              <EditableField label="Treaty Absorbed"><Input value={form.treatyAbsorbed} onChange={(event) => updateForm('treatyAbsorbed', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id"><Input value={form.treatyId} onChange={(event) => updateForm('treatyId', event.target.value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Calculated On" value={formatDate(record.calculatedOn)} />
              <ReadOnlyField label="Calculated Time" value={record.calculatedTime} />
              <ReadOnlyField label="Calculation Source" value={record.calculationSource} />
              <ReadOnlyField label="Excess to Place" value={formatOptionalMoney(record.excessToPlace)} />
              <ReadOnlyField label="Inquiry Id" value={record.inquiryId} />
              <ReadOnlyField label="Is Active" value={record.isActive} />
              <ReadOnlyField label="Outcome" value={record.outcome} />
              <ReadOnlyField label="Quote Id" value={record.quoteId} />
              <ReadOnlyField label="Retained Amount" value={formatMoney(record.retainedAmount)} />
              <ReadOnlyField label="Sum Insured" value={formatMoney(record.sumInsured)} />
              <ReadOnlyField label="Treaty Absorbed" value={formatMoney(record.treatyAbsorbed)} />
              <ReadOnlyField label="Treaty Id" value={record.treatyId} />
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

function toRiCapacityCheckForm(record: RiCapacityCheckRecord): RiCapacityCheckCreateFormState {
  return {
    name: record.name,
    calculatedOn: record.calculatedOn,
    calculatedTime: record.calculatedTime,
    calculationSource: record.calculationSource,
    excessToPlace: formatOptionalMoney(record.excessToPlace),
    inquiryId: record.inquiryId,
    isActive: record.isActive,
    outcome: record.outcome,
    quoteId: record.quoteId,
    retainedAmount: formatMoney(record.retainedAmount),
    sumInsured: formatMoney(record.sumInsured),
    treatyAbsorbed: formatMoney(record.treatyAbsorbed),
    treatyId: record.treatyId,
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

function resolveSelectValue(value: string, fallback: string) {
  return value && value !== 'Select' ? value : fallback
}

function resolveYesNo(value: string, fallback: 'Yes' | 'No'): 'Yes' | 'No' {
  return value === 'Yes' || value === 'No' ? value : fallback
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
