import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MailCheck, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createFacOffer,
  listFacOffers,
  listFacPlacementLookupOptions,
  listReinsurerLookupOptions,
  updateFacOffer,
  type FacOfferRecord,
  type FacOfferSaveInput,
  type ReinsuranceLookupOption,
} from '../../services/reinsuranceService'

interface FacOfferFormState {
  name: string
  isLeader: string
  offeredSharePercentage: string
  placementId: string
  quotedRate: string
  reinsurerId: string
  responseDate: string
  signedLinePercentage: string
  termsAndConditions: string
  writtenLinePercentage: string
  statusReason: string
}

const emptyFacOfferForm: FacOfferFormState = {
  name: '',
  isLeader: 'Select',
  offeredSharePercentage: '',
  placementId: 'Select',
  quotedRate: '',
  reinsurerId: 'Select',
  responseDate: '',
  signedLinePercentage: '',
  termsAndConditions: '',
  writtenLinePercentage: '',
  statusReason: 'Select',
}

const yesNoOptions = [
  { value: 'Select', label: 'Select option' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const statusReasonOptions = [
  { value: 'Select', label: 'Select status reason' },
  { value: 'Not Approached', label: 'Not Approached' },
  { value: 'Invited', label: 'Invited' },
  { value: 'Quoted', label: 'Quoted' },
  { value: 'Counter-Offered', label: 'Counter-Offered' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Declined', label: 'Declined' },
  { value: 'Withdrawn', label: 'Withdrawn' },
  { value: 'Expired', label: 'Expired' },
]

const tableColumns: Array<{
  key: keyof FacOfferRecord
  label: string
  render?: (record: FacOfferRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'isLeader', label: 'Is Leader' },
  { key: 'offeredSharePercentage', label: 'Offered Share Percen...', render: (record) => formatDecimal(record.offeredSharePercentage) },
  { key: 'placementId', label: 'Placement...' },
  { key: 'quotedRate', label: 'Quoted R...', render: (record) => formatDecimal(record.quotedRate) },
  { key: 'reinsurerId', label: 'Reinsurer...' },
  { key: 'responseDate', label: 'Response D...', render: (record) => formatDate(record.responseDate) },
  { key: 'signedLinePercentage', label: 'Signed Line Percent...', render: (record) => formatDecimal(record.signedLinePercentage) },
  { key: 'termsAndConditions', label: 'Terms and Conditi...' },
  { key: 'writtenLinePercentage', label: 'Written Line Percent...', render: (record) => formatDecimal(record.writtenLinePercentage) },
  { key: 'statusReason', label: 'Status Rea...' },
]

export function FacOffersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, placementOptions, reinsurerOptions] = await Promise.all([
      listFacOffers(),
      listFacPlacementLookupOptions(),
      listReinsurerLookupOptions(),
    ])
    return { records, placementOptions, reinsurerOptions }
  }, [refreshKey])
  const records = data?.records ?? []
  const placementOptions = data?.placementOptions ?? []
  const reinsurerOptions = data?.reinsurerOptions ?? []
  const selected = useMemo(() => records.find((record) => record.id === selectedId), [records, selectedId])

  if (selected) {
    return (
      <FacOfferDetail
        record={selected}
        placementOptions={placementOptions}
        reinsurerOptions={reinsurerOptions}
        onBack={() => setSelectedId(null)}
        onSave={async (updatedRecord) => {
          await updateFacOffer(updatedRecord.id, toFacOfferSaveInput(updatedRecord))
          setRefreshKey((value) => value + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MailCheck}
        eyebrow="Reinsurance"
        title="Fac Offers"
        description="Facultative offer responses, quoted rates, signed lines, written lines, and status reasons."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Fac Offer
          </Button>
        }
      />

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading fac offers...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
        <Card padding="none" variant="premium" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse">
              <thead className="bg-surface-muted/90">
                <tr>{tableColumns.map((column) => <TableHeader key={column.key}>{column.label}</TableHeader>)}</tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr className="bg-surface">
                    <td colSpan={tableColumns.length} className="px-6 py-12 text-center">
                      <p className="text-base font-semibold">No fac offers found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The aur_fac_offers datasource is connected, but there are no records for this view yet.
                      </p>
                    </td>
                  </tr>
                ) : records.map((record) => (
                  <tr key={record.id} onClick={() => setSelectedId(record.id)} className="cursor-pointer border-b border-border-soft/80 bg-surface transition hover:bg-primary/5">
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
                        ) : column.key === 'isLeader' ? (
                          <Badge variant={record.isLeader === 'Yes' ? 'approved' : 'neutral'}>{record.isLeader}</Badge>
                        ) : column.key === 'placementId' ? (
                          <span className="font-semibold text-primary">{getLookupDisplayValue(placementOptions, record.placementLookupId, record.placementId)}</span>
                        ) : column.key === 'reinsurerId' ? (
                          <span className="font-semibold text-primary">{getLookupDisplayValue(reinsurerOptions, record.reinsurerLookupId, record.reinsurerId)}</span>
                        ) : column.key === 'statusReason' ? (
                          <Badge variant={record.statusReason === 'Accepted' ? 'approved' : record.statusReason === 'Declined' ? 'rejected' : 'pending'}>
                            {record.statusReason}
                          </Badge>
                        ) : column.key === 'termsAndConditions' ? (
                          <span className="block max-w-[220px] truncate text-foreground">{record.termsAndConditions}</span>
                        ) : (
                          <span className="text-foreground">{column.render ? column.render(record) : String(record[column.key])}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isCreateOpen ? (
        <CreateFacOfferModal
          placementOptions={placementOptions}
          reinsurerOptions={reinsurerOptions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (form) => {
            await createFacOffer(toFacOfferCreateInput(form))
            setRefreshKey((value) => value + 1)
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateFacOfferModal({
  placementOptions,
  reinsurerOptions,
  onClose,
  onCreate,
}: {
  placementOptions: ReinsuranceLookupOption[]
  reinsurerOptions: ReinsuranceLookupOption[]
  onClose: () => void
  onCreate: (form: FacOfferFormState) => Promise<void>
}) {
  const [form, setForm] = useState<FacOfferFormState>(emptyFacOfferForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateForm = <Key extends keyof FacOfferFormState>(key: Key, value: FacOfferFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onCreate(form)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create fac offer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] border border-border-soft bg-surface shadow-[0_28px_90px_rgba(15,23,42,0.32)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-border-soft px-5 py-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Reinsurance</p>
            <h2 className="mt-1 text-xl font-bold">Create fac offer</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add offer share, placement, reinsurer response, signed line, and status details.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground">
            Close
          </button>
        </div>

        <div className="scrollbar-sleek flex-1 overflow-y-auto px-5 py-4">
          {error ? <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <ModalField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Enter offer name" /></ModalField>
            <ModalField label="Is Leader"><Select value={form.isLeader} onValueChange={(value) => updateForm('isLeader', value)} options={yesNoOptions} /></ModalField>
            <ModalField label="Offered Share Percentage"><Input value={form.offeredSharePercentage} onChange={(event) => updateForm('offeredSharePercentage', event.target.value)} placeholder="Enter offered share percentage" /></ModalField>
            <ModalField label="Placement Id"><Select value={form.placementId} onValueChange={(value) => updateForm('placementId', value)} options={buildLookupOptions(placementOptions, 'Look for Placement Id')} /></ModalField>
            <ModalField label="Quoted Rate"><Input value={form.quotedRate} onChange={(event) => updateForm('quotedRate', event.target.value)} placeholder="Enter quoted rate" /></ModalField>
            <ModalField label="Reinsurer Id"><Select value={form.reinsurerId} onValueChange={(value) => updateForm('reinsurerId', value)} options={buildLookupOptions(reinsurerOptions, 'Look for Reinsurer Id')} /></ModalField>
            <ModalField label="Response Date"><CalendarDateField value={form.responseDate} onChange={(value) => updateForm('responseDate', value)} /></ModalField>
            <ModalField label="Signed Line Percentage"><Input value={form.signedLinePercentage} onChange={(event) => updateForm('signedLinePercentage', event.target.value)} placeholder="Enter signed line percentage" /></ModalField>
            <ModalField label="Terms and Conditions"><Input value={form.termsAndConditions} onChange={(event) => updateForm('termsAndConditions', event.target.value)} placeholder="Enter terms and conditions" /></ModalField>
            <ModalField label="Written Line Percentage"><Input value={form.writtenLinePercentage} onChange={(event) => updateForm('writtenLinePercentage', event.target.value)} placeholder="Enter written line percentage" /></ModalField>
            <ModalField label="Status Reason"><Select value={form.statusReason} onValueChange={(value) => updateForm('statusReason', value)} options={statusReasonOptions} /></ModalField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-soft bg-surface px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={submitting}>{submitting ? 'Creating...' : 'Create Record'}</Button>
        </div>
      </div>
    </div>
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
      <button type="button" onClick={() => setOpen((current) => !current)} className="form-field-surface flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-foreground shadow-sm outline-none transition hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10">
        <span className={value ? '' : 'text-[#94A3B8]'}>{selectedDate ? formatDate(selectedDate.toISOString()) : 'Select response date'}</span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[70] w-[292px] rounded-2xl border border-border-soft bg-surface p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setViewDate((current) => addMonths(current, -1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-sm font-bold">{monthLabel}</p>
            <button type="button" onClick={() => setViewDate((current) => addMonths(current, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
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
                <button key={date.toISOString()} type="button" onClick={() => selectDate(date)} className={`flex h-8 items-center justify-center rounded-lg text-[12px] font-semibold transition ${selected ? 'bg-primary text-white shadow-glow' : today ? 'border border-primary/30 bg-primary/8 text-primary' : inMonth ? 'text-foreground hover:bg-primary/10 hover:text-primary' : 'text-muted-foreground/55 hover:bg-surface-muted'}`}>
                  {date.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-3">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground">Clear</button>
            <button type="button" onClick={() => selectDate(new Date())} className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-glow transition hover:bg-primary-dark">Today</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FacOfferDetail({
  record,
  placementOptions,
  reinsurerOptions,
  onBack,
  onSave,
}: {
  record: FacOfferRecord
  placementOptions: ReinsuranceLookupOption[]
  reinsurerOptions: ReinsuranceLookupOption[]
  onBack: () => void
  onSave: (record: FacOfferRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<FacOfferFormState>(() => toFacOfferForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const updateForm = <Key extends keyof FacOfferFormState>(key: Key, value: FacOfferFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }
  const cancelEdit = () => {
    setForm(toFacOfferForm(record))
    setSaveError(null)
    setIsEditing(false)
  }
  const saveEdit = async () => {
    const updatedRecord: FacOfferRecord = {
      ...record,
      name: form.name.trim() || record.name,
      isLeader: resolveYesNo(form.isLeader, record.isLeader),
      offeredSharePercentage: parseNumberInput(form.offeredSharePercentage),
      placementId: resolveLookupLabel(placementOptions, form.placementId, record.placementId),
      placementLookupId: resolveLookupValue(form.placementId) || record.placementLookupId,
      quotedRate: parseNumberInput(form.quotedRate),
      reinsurerId: resolveLookupLabel(reinsurerOptions, form.reinsurerId, record.reinsurerId),
      reinsurerLookupId: resolveLookupValue(form.reinsurerId) || record.reinsurerLookupId,
      responseDate: form.responseDate || record.responseDate,
      signedLinePercentage: parseNumberInput(form.signedLinePercentage),
      termsAndConditions: form.termsAndConditions.trim() || '---',
      writtenLinePercentage: parseNumberInput(form.writtenLinePercentage),
      statusReason: resolveSelectValue(form.statusReason, record.statusReason),
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(updatedRecord)
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save fac offer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back to Fac Offers</Button>
      <PageHeader
        icon={MailCheck}
        eyebrow="Reinsurance"
        title={record.name}
        description="Facultative offer leader status, share, rate, response, signed line, and status reason."
        actions={isEditing ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Fac Offer'}</Button>
          </div>
        ) : <Button onClick={() => setIsEditing(true)}>Edit Fac Offer</Button>}
      />
      <Card variant="premium" className="space-y-5">
        {saveError ? <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{saveError}</div> : null}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Fac Offer Form</p>
            <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={record.isLeader === 'Yes' ? 'approved' : 'neutral'}>Leader: {record.isLeader}</Badge>
            <Badge variant={record.statusReason === 'Accepted' ? 'approved' : record.statusReason === 'Declined' ? 'rejected' : 'pending'}>{record.statusReason}</Badge>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Is Leader"><Select value={form.isLeader} onValueChange={(value) => updateForm('isLeader', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Offered Share Percentage"><Input value={form.offeredSharePercentage} onChange={(event) => updateForm('offeredSharePercentage', event.target.value)} /></EditableField>
              <EditableField label="Placement Id"><Select value={form.placementId} onValueChange={(value) => updateForm('placementId', value)} options={buildLookupOptions(placementOptions, 'Look for Placement Id')} /></EditableField>
              <EditableField label="Quoted Rate"><Input value={form.quotedRate} onChange={(event) => updateForm('quotedRate', event.target.value)} /></EditableField>
              <EditableField label="Reinsurer Id"><Select value={form.reinsurerId} onValueChange={(value) => updateForm('reinsurerId', value)} options={buildLookupOptions(reinsurerOptions, 'Look for Reinsurer Id')} /></EditableField>
              <EditableField label="Response Date"><CalendarDateField value={form.responseDate} onChange={(value) => updateForm('responseDate', value)} /></EditableField>
              <EditableField label="Signed Line Percentage"><Input value={form.signedLinePercentage} onChange={(event) => updateForm('signedLinePercentage', event.target.value)} /></EditableField>
              <EditableField label="Terms and Conditions"><Input value={form.termsAndConditions} onChange={(event) => updateForm('termsAndConditions', event.target.value)} /></EditableField>
              <EditableField label="Written Line Percentage"><Input value={form.writtenLinePercentage} onChange={(event) => updateForm('writtenLinePercentage', event.target.value)} /></EditableField>
              <EditableField label="Status Reason"><Select value={form.statusReason} onValueChange={(value) => updateForm('statusReason', value)} options={statusReasonOptions} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Is Leader" value={record.isLeader} />
              <ReadOnlyField label="Offered Share Percentage" value={formatDecimal(record.offeredSharePercentage)} />
              <ReadOnlyField label="Placement Id" value={getLookupDisplayValue(placementOptions, record.placementLookupId, record.placementId)} />
              <ReadOnlyField label="Quoted Rate" value={formatDecimal(record.quotedRate)} />
              <ReadOnlyField label="Reinsurer Id" value={getLookupDisplayValue(reinsurerOptions, record.reinsurerLookupId, record.reinsurerId)} />
              <ReadOnlyField label="Response Date" value={formatDate(record.responseDate)} />
              <ReadOnlyField label="Signed Line Percentage" value={formatDecimal(record.signedLinePercentage)} />
              <ReadOnlyField label="Terms and Conditions" value={record.termsAndConditions} multiline />
              <ReadOnlyField label="Written Line Percentage" value={formatDecimal(record.writtenLinePercentage)} />
              <ReadOnlyField label="Status Reason" value={record.statusReason} />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>{children}</label>
}

function TableHeader({ children }: { children: string }) {
  return <th className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{children}</th>
}

function ReadOnlyField({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 min-h-[20px]"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p></div>
      <div className={`form-field-surface rounded-xl border border-border-soft px-4 py-2.5 text-sm text-foreground ${multiline ? 'min-h-[82px]' : 'min-h-[42px]'}`}>{value}</div>
    </div>
  )
}

function EditableField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><div className="mb-2 min-h-[20px]"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p></div>{children}</div>
}

function toFacOfferForm(record: FacOfferRecord): FacOfferFormState {
  return {
    name: record.name,
    isLeader: record.isLeader,
    offeredSharePercentage: formatDecimal(record.offeredSharePercentage),
    placementId: record.placementLookupId || 'Select',
    quotedRate: formatDecimal(record.quotedRate),
    reinsurerId: record.reinsurerLookupId || 'Select',
    responseDate: record.responseDate,
    signedLinePercentage: formatDecimal(record.signedLinePercentage),
    termsAndConditions: record.termsAndConditions,
    writtenLinePercentage: formatDecimal(record.writtenLinePercentage),
    statusReason: record.statusReason,
  }
}

function toFacOfferCreateInput(form: FacOfferFormState): FacOfferSaveInput {
  return {
    name: form.name.trim() || 'Untitled Fac Offer',
    isLeader: resolveYesNo(form.isLeader, 'No'),
    offeredSharePercentage: parseNumberInput(form.offeredSharePercentage),
    placementLookupId: resolveLookupValue(form.placementId),
    quotedRate: parseNumberInput(form.quotedRate),
    reinsurerLookupId: resolveLookupValue(form.reinsurerId),
    responseDate: form.responseDate,
    signedLinePercentage: parseNumberInput(form.signedLinePercentage),
    termsAndConditions: form.termsAndConditions.trim() || '---',
    writtenLinePercentage: parseNumberInput(form.writtenLinePercentage),
    statusReason: resolveSelectValue(form.statusReason, 'Not Approached'),
  }
}

function toFacOfferSaveInput(record: FacOfferRecord): FacOfferSaveInput {
  return {
    name: record.name,
    isLeader: record.isLeader,
    offeredSharePercentage: record.offeredSharePercentage,
    placementLookupId: record.placementLookupId,
    quotedRate: record.quotedRate,
    reinsurerLookupId: record.reinsurerLookupId,
    responseDate: record.responseDate,
    signedLinePercentage: record.signedLinePercentage,
    termsAndConditions: record.termsAndConditions,
    writtenLinePercentage: record.writtenLinePercentage,
    statusReason: record.statusReason,
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

function formatDecimal(value: number) {
  return value.toFixed(2)
}

function formatDate(value: string) {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }).format(date)
}

function parseNumberInput(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveSelectValue(value: string, fallback: string) {
  return value && value !== 'Select' ? value : fallback
}

function resolveYesNo(value: string, fallback: 'Yes' | 'No'): 'Yes' | 'No' {
  return value === 'Yes' || value === 'No' ? value : fallback
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
