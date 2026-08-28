import { useMemo, useState, type ReactNode } from 'react'
import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, FileText, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  listInquiryLookupOptions,
  listQuoteLookupOptions,
  listRiCapacityChecks,
  listTreaties,
  listTreatyLookupOptions,
  updateRiCapacityCheck,
  type ReinsuranceLookupOption,
  type RiCapacityCheckRecord,
  type RiCapacityCheckSaveInput,
  type TreatyRecord,
} from '../../services/reinsuranceService'

const tableColumns: Array<{
  key: keyof RiCapacityCheckRecord
  label: string
  render?: (record: RiCapacityCheckRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'excessToPlace', label: 'Excess to Place', render: (record) => formatOptionalMoney(record.excessToPlace) },
  { key: 'inquiryId', label: 'Inquiry Id' },
  { key: 'isActive', label: 'Is Active' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'quoteId', label: 'Quote Id' },
  { key: 'sumInsured', label: 'Sum Insured', render: (record) => formatMoney(record.sumInsured) },
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

type RiCapacityCheckDetailTab = 'details' | 'treaty'

export function RiCapacityChecksPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const routeState = location.state as { selectedId?: string } | null
  const [selectedId, setSelectedId] = useState<string | null>(routeId ?? routeState?.selectedId ?? null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, inquiryOptions, quoteOptions, treatyOptions, treaties] = await Promise.all([
      listRiCapacityChecks(),
      listInquiryLookupOptions(),
      listQuoteLookupOptions(),
      listTreatyLookupOptions(),
      listTreaties(),
    ])
    return { records, inquiryOptions, quoteOptions, treatyOptions, treaties }
  }, [refreshKey])
  const records = data?.records ?? []
  const inquiryOptions = data?.inquiryOptions ?? []
  const quoteOptions = data?.quoteOptions ?? []
  const treatyOptions = data?.treatyOptions ?? []
  const treaties = data?.treaties ?? []
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  useEffect(() => {
    setSelectedId(routeId ?? routeState?.selectedId ?? null)
  }, [routeId, routeState?.selectedId])

  if (selected) {
    return (
      <RiCapacityCheckDetail
        record={selected}
        inquiryOptions={inquiryOptions}
        quoteOptions={quoteOptions}
        treatyOptions={treatyOptions}
        onBack={() => {
          setSelectedId(null)
          navigate('/reinsurance/ri-capacity-checks')
        }}
        treaties={treaties}
        onOpenRelatedRecord={(path, relatedId) => navigate(path, { state: { selectedId: relatedId } })}
        onSave={async (updatedRecord) => {
          await updateRiCapacityCheck(updatedRecord.id, toRiCapacityCheckSaveInput(updatedRecord))
          setRefreshKey((value) => value + 1)
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

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading ri-capacity checks...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
      <Card padding="none" variant="premium" className="overflow-hidden">
        <div className="scrollbar-sleek overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
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
                    <p className="text-base font-semibold">No ri-capacity checks found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The aur_ri_capacity_checks datasource is connected, but there are no records for this view yet.
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => {
                    setSelectedId(record.id)
                    navigate(`/reinsurance/ri-capacity-checks/${record.id}`)
                  }}
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
                            navigate(`/reinsurance/ri-capacity-checks/${record.id}`)
                          }}
                        >
                          {record.name}
                        </button>
                      ) : column.key === 'isActive' ? (
                        <Badge variant={record.isActive === 'Yes' ? 'approved' : 'neutral'}>
                          {record.isActive}
                        </Badge>
                      ) : column.key === 'inquiryId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(inquiryOptions, record.inquiryLookupId, record.inquiryId)}
                        </span>
                      ) : column.key === 'quoteId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(quoteOptions, record.quoteLookupId, record.quoteId)}
                        </span>
                      ) : column.key === 'treatyId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      )}

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
  inquiryOptions,
  quoteOptions,
  treatyOptions,
  treaties,
  onBack,
  onOpenRelatedRecord,
  onSave,
}: {
  record: RiCapacityCheckRecord
  inquiryOptions: ReinsuranceLookupOption[]
  quoteOptions: ReinsuranceLookupOption[]
  treatyOptions: ReinsuranceLookupOption[]
  treaties: TreatyRecord[]
  onBack: () => void
  onOpenRelatedRecord: (path: string, recordId: string) => void
  onSave: (record: RiCapacityCheckRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<RiCapacityCheckDetailTab>('details')
  const [form, setForm] = useState<RiCapacityCheckCreateFormState>(() => toRiCapacityCheckForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const relatedTreaty = useMemo(
    () => treaties.find((item) => isSameLookupId(item.id, record.treatyLookupId)),
    [record.treatyLookupId, treaties],
  )
  const tabs: Array<{
    id: RiCapacityCheckDetailTab
    label: string
    count?: number
    icon: LucideIcon
  }> = [
    { id: 'details', label: 'Ri-Capacity Check Details', icon: ShieldCheck },
    { id: 'treaty', label: 'Treaty', count: relatedTreaty ? 1 : 0, icon: FileText },
  ]

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

  const saveEdit = async () => {
    const updatedRecord: RiCapacityCheckRecord = {
      ...record,
      name: form.name.trim() || record.name,
      calculatedOn: form.calculatedOn || record.calculatedOn,
      calculatedTime: resolveSelectValue(form.calculatedTime, record.calculatedTime),
      calculationSource: resolveSelectValue(form.calculationSource, record.calculationSource),
      excessToPlace: form.excessToPlace.trim() ? parseMoneyInput(form.excessToPlace) : null,
      inquiryId: resolveLookupLabel(inquiryOptions, form.inquiryId, record.inquiryId),
      inquiryLookupId: resolveLookupValue(form.inquiryId) || record.inquiryLookupId,
      isActive: resolveYesNo(form.isActive, record.isActive),
      outcome: resolveSelectValue(form.outcome, record.outcome),
      quoteId: resolveLookupLabel(quoteOptions, form.quoteId, record.quoteId),
      quoteLookupId: resolveLookupValue(form.quoteId) || record.quoteLookupId,
      retainedAmount: parseMoneyInput(form.retainedAmount),
      sumInsured: parseMoneyInput(form.sumInsured),
      treatyAbsorbed: parseMoneyInput(form.treatyAbsorbed),
      treatyId: resolveLookupLabel(treatyOptions, form.treatyId, record.treatyId),
      treatyLookupId: resolveLookupValue(form.treatyId) || record.treatyLookupId,
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(updatedRecord)
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save ri-capacity check.')
    } finally {
      setSaving(false)
    }
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
              <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Capacity Check'}</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Capacity Check</Button>
          )
        }
      />

      <div className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-2 shadow-sm lg:grid-cols-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' ? (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? 'bg-white/18 text-white' : 'bg-primary/10 text-primary'}`}>
                  {tab.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {activeTab === 'details' ? (
      <Card variant="premium" className="space-y-5">
        {saveError ? (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{saveError}</div>
        ) : null}
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
              <EditableField label="Inquiry Id"><Select value={form.inquiryId} onValueChange={(value) => updateForm('inquiryId', value)} options={buildLookupOptions(inquiryOptions, 'Look for Inquiry Id')} /></EditableField>
              <EditableField label="Is Active"><Select value={form.isActive} onValueChange={(value) => updateForm('isActive', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Outcome"><Select value={form.outcome} onValueChange={(value) => updateForm('outcome', value)} options={outcomeOptions} /></EditableField>
              <EditableField label="Quote Id"><Select value={form.quoteId} onValueChange={(value) => updateForm('quoteId', value)} options={buildLookupOptions(quoteOptions, 'Look for Quote Id')} /></EditableField>
              <EditableField label="Retained Amount"><Input value={form.retainedAmount} onChange={(event) => updateForm('retainedAmount', event.target.value)} /></EditableField>
              <EditableField label="Sum Insured"><Input value={form.sumInsured} onChange={(event) => updateForm('sumInsured', event.target.value)} /></EditableField>
              <EditableField label="Treaty Absorbed"><Input value={form.treatyAbsorbed} onChange={(event) => updateForm('treatyAbsorbed', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id"><Select value={form.treatyId} onValueChange={(value) => updateForm('treatyId', value)} options={buildLookupOptions(treatyOptions, 'Look for Treaty Id')} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Calculated On" value={formatDate(record.calculatedOn)} />
              <ReadOnlyField label="Calculated Time" value={record.calculatedTime} />
              <ReadOnlyField label="Calculation Source" value={record.calculationSource} />
              <ReadOnlyField label="Excess to Place" value={formatOptionalMoney(record.excessToPlace)} />
              <ReadOnlyField label="Inquiry Id" value={getLookupDisplayValue(inquiryOptions, record.inquiryLookupId, record.inquiryId)} />
              <ReadOnlyField label="Is Active" value={record.isActive} />
              <ReadOnlyField label="Outcome" value={record.outcome} />
              <ReadOnlyField label="Quote Id" value={getLookupDisplayValue(quoteOptions, record.quoteLookupId, record.quoteId)} />
              <ReadOnlyField label="Retained Amount" value={formatMoney(record.retainedAmount)} />
              <ReadOnlyField label="Sum Insured" value={formatMoney(record.sumInsured)} />
              <ReadOnlyField label="Treaty Absorbed" value={formatMoney(record.treatyAbsorbed)} />
              <ReadOnlyField label="Treaty Id" value={getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)} />
            </>
          )}
        </div>
      </Card>
      ) : (
        <RelatedTreatyGrid
          record={relatedTreaty}
          onOpen={(recordId) => onOpenRelatedRecord('/reinsurance/treaties', recordId)}
        />
      )}
    </div>
  )
}

function RelatedTreatyGrid({
  record,
  onOpen,
}: {
  record: TreatyRecord | undefined
  onOpen: (recordId: string) => void
}) {
  const columns = ['Treaty Name', 'Inception Date', 'Treaty Capacity', 'Treaty Type', 'Shariah Basis']
  return (
    <Card padding="none" variant="premium" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border-soft px-5 py-4">
        <div>
          <h3 className="text-lg font-bold">Treaty</h3>
          <p className="mt-1 text-sm text-muted-foreground">Linked parent record for this ri-capacity check.</p>
        </div>
        <Badge variant="info">{record ? 1 : 0}</Badge>
      </div>
      <div className="scrollbar-sleek overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-surface-muted/90">
            <tr>{columns.map((column) => <TableHeader key={column}>{column}</TableHeader>)}</tr>
          </thead>
          <tbody>
            {record ? (
              <tr
                onClick={() => onOpen(record.id)}
                className="cursor-pointer border-b border-border-soft/80 bg-surface transition hover:bg-primary/5"
              >
                <td className="px-4 py-4 align-middle text-[13px] font-semibold text-primary">{record.treatyName}</td>
                <td className="px-4 py-4 align-middle text-[13px] text-foreground">{formatDate(record.inceptionDate)}</td>
                <td className="px-4 py-4 align-middle text-[13px] text-foreground">{formatMoney(record.treatyCapacity)}</td>
                <td className="px-4 py-4 align-middle text-[13px] text-foreground">{record.treatyType}</td>
                <td className="px-4 py-4 align-middle text-[13px] text-foreground">{record.shariahBasis}</td>
              </tr>
            ) : (
              <tr className="bg-surface">
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No treaty is linked to this ri-capacity check.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
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
    inquiryId: record.inquiryLookupId || 'Select',
    isActive: record.isActive,
    outcome: record.outcome,
    quoteId: record.quoteLookupId || 'Select',
    retainedAmount: formatMoney(record.retainedAmount),
    sumInsured: formatMoney(record.sumInsured),
    treatyAbsorbed: formatMoney(record.treatyAbsorbed),
    treatyId: record.treatyLookupId || 'Select',
  }
}

function toRiCapacityCheckSaveInput(record: RiCapacityCheckRecord): RiCapacityCheckSaveInput {
  return {
    name: record.name,
    calculatedOn: record.calculatedOn,
    calculatedTime: record.calculatedTime,
    calculationSource: record.calculationSource,
    excessToPlace: record.excessToPlace,
    inquiryLookupId: record.inquiryLookupId,
    isActive: record.isActive,
    outcome: record.outcome,
    quoteLookupId: record.quoteLookupId,
    retainedAmount: record.retainedAmount,
    sumInsured: record.sumInsured,
    treatyAbsorbed: record.treatyAbsorbed,
    treatyLookupId: record.treatyLookupId,
  }
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
  if (!value || value === 'Select') return fallback
  return options.find((option) => option.value === value)?.label ?? fallback
}

function getLookupDisplayValue(options: ReinsuranceLookupOption[], lookupId: string, fallback: string) {
  if (!lookupId) return fallback
  return options.find((option) => option.value.toLowerCase() === lookupId.toLowerCase())?.label ?? fallback
}

function isSameLookupId(left: string, right: string) {
  return normalizeLookupId(left) === normalizeLookupId(right)
}

function normalizeLookupId(value: string) {
  return value.replace(/[{}]/g, '').toLowerCase()
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
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
