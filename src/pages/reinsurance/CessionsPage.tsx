import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, FileCheck2, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createCession,
  listCessionLookupOptions,
  listCessions,
  listPolicyConversionLookupOptions,
  listPolicyLookupOptions,
  updateCession,
  type CessionRecord,
  type CessionSaveInput,
  type ReinsuranceLookupOption,
} from '../../services/reinsuranceService'

interface CessionFormState {
  name: string
  adjuststCessionId: string
  cededSumInsured: string
  cessionBasis: string
  commissionAmount: string
  effectiveDate: string
  grossSumInsured: string
  isAdjustment: string
  netPayableToReinsurers: string
  policyConversionId: string
  policyId: string
  retainedSumInsured: string
  transactionType: string
  statusReason: string
}

const emptyCessionForm: CessionFormState = {
  name: '',
  adjuststCessionId: 'Select',
  cededSumInsured: '',
  cessionBasis: 'Select',
  commissionAmount: '',
  effectiveDate: '',
  grossSumInsured: '',
  isAdjustment: 'Select',
  netPayableToReinsurers: '',
  policyConversionId: 'Select',
  policyId: 'Select',
  retainedSumInsured: '',
  transactionType: 'Select',
  statusReason: 'Select',
}

const cessionBasisOptions = [
  { value: 'Select', label: 'Select cession basis' },
  { value: 'Treaty Only', label: 'Treaty Only' },
  { value: 'Facultative Only', label: 'Facultative Only' },
  { value: 'Treaty', label: 'Treaty' },
  { value: 'Facultative', label: 'Facultative' },
]

const yesNoOptions = [
  { value: 'Select', label: 'Select option' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const transactionTypeOptions = [
  { value: 'Select', label: 'Select transaction type' },
  { value: 'New', label: 'New' },
  { value: 'Renew', label: 'Renew' },
  { value: 'Endorsement', label: 'Endorsement' },
  { value: 'Cancellation', label: 'Cancellation' },
]

const statusReasonOptions = [
  { value: 'Select', label: 'Select status reason' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Posted', label: 'Posted' },
  { value: 'Reversed', label: 'Reversed' },
]

const tableColumns: Array<{
  key: keyof CessionRecord
  label: string
  render?: (record: CessionRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'cededSumInsured', label: 'Ceded Sum Insured', render: (record) => formatMoney(record.cededSumInsured) },
  { key: 'commissionAmount', label: 'Commission Amount', render: (record) => formatMoney(record.commissionAmount) },
  { key: 'isAdjustment', label: 'Is Adjustment' },
  { key: 'netPayableToReinsurers', label: 'Net Payable to Reinsurers', render: (record) => formatMoney(record.netPayableToReinsurers) },
  { key: 'policyId', label: 'Policy Id' },
  { key: 'retainedSumInsured', label: 'Retained Sum Insured', render: (record) => formatMoney(record.retainedSumInsured) },
  { key: 'transactionType', label: 'Transaction Type' },
  { key: 'statusReason', label: 'Status Reason' },
]

export function CessionsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, cessionOptions, policyConversionOptions, policyOptions] = await Promise.all([
      listCessions(),
      listCessionLookupOptions(),
      listPolicyConversionLookupOptions(),
      listPolicyLookupOptions(),
    ])
    return { records, cessionOptions, policyConversionOptions, policyOptions }
  }, [refreshKey])
  const records = data?.records ?? []
  const cessionOptions = data?.cessionOptions ?? []
  const policyConversionOptions = data?.policyConversionOptions ?? []
  const policyOptions = data?.policyOptions ?? []
  const selected = useMemo(() => records.find((record) => record.id === selectedId), [records, selectedId])

  if (selected) {
    return (
      <CessionDetail
        record={selected}
        cessionOptions={cessionOptions}
        policyConversionOptions={policyConversionOptions}
        policyOptions={policyOptions}
        onBack={() => setSelectedId(null)}
        onSave={async (updatedRecord) => {
          await updateCession(updatedRecord.id, toCessionSaveInput(updatedRecord))
          setRefreshKey((value) => value + 1)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileCheck2}
        eyebrow="Reinsurance"
        title="Cessions"
        description="Posted treaty cessions, payable amounts, retained sums, policy links, and transaction basis."
        actions={<Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4" />Create Cession</Button>}
      />

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading cessions...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
        <Card padding="none" variant="premium" className="overflow-hidden">
          <div className="scrollbar-sleek overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse">
              <thead className="bg-surface-muted/90">
                <tr>{tableColumns.map((column) => <TableHeader key={column.key}>{column.label}</TableHeader>)}</tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr className="bg-surface">
                    <td colSpan={tableColumns.length} className="px-6 py-12 text-center">
                      <p className="text-base font-semibold">No cessions found</p>
                      <p className="mt-1 text-sm text-muted-foreground">The aur_cessions datasource is connected, but there are no records for this view yet.</p>
                    </td>
                  </tr>
                ) : records.map((record) => (
                  <tr key={record.id} onClick={() => setSelectedId(record.id)} className="cursor-pointer border-b border-border-soft/80 bg-surface transition hover:bg-primary/5">
                    {tableColumns.map((column) => (
                      <td key={column.key} className="px-4 py-4 align-middle text-[13px]">
                        {column.key === 'name' ? (
                          <button type="button" className="group inline-flex items-center gap-2 text-left font-semibold text-primary" onClick={(event) => { event.stopPropagation(); setSelectedId(record.id) }}>
                            {record.name}
                          </button>
                        ) : column.key === 'adjuststCessionId' ? (
                          <span className="block max-w-[190px] truncate font-semibold text-primary">{getLookupDisplayValue(cessionOptions, record.adjuststCessionLookupId, record.adjuststCessionId)}</span>
                        ) : column.key === 'policyConversionId' ? (
                          <span className="block max-w-[190px] truncate font-semibold text-primary">{getLookupDisplayValue(policyConversionOptions, record.policyConversionLookupId, record.policyConversionId)}</span>
                        ) : column.key === 'policyId' ? (
                          <span className="block max-w-[190px] truncate font-semibold text-primary">{getLookupDisplayValue(policyOptions, record.policyLookupId, record.policyId)}</span>
                        ) : column.key === 'isAdjustment' ? (
                          <Badge variant={record.isAdjustment === 'Yes' ? 'pending' : 'neutral'}>{record.isAdjustment}</Badge>
                        ) : column.key === 'statusReason' ? (
                          <Badge variant={record.statusReason === 'Posted' ? 'approved' : record.statusReason === 'Reversed' ? 'rejected' : 'pending'}>{record.statusReason}</Badge>
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
        <CreateCessionModal
          cessionOptions={cessionOptions}
          policyConversionOptions={policyConversionOptions}
          policyOptions={policyOptions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (form) => {
            await createCession(toCessionCreateInput(form))
            setRefreshKey((value) => value + 1)
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateCessionModal({
  cessionOptions,
  policyConversionOptions,
  policyOptions,
  onClose,
  onCreate,
}: {
  cessionOptions: ReinsuranceLookupOption[]
  policyConversionOptions: ReinsuranceLookupOption[]
  policyOptions: ReinsuranceLookupOption[]
  onClose: () => void
  onCreate: (form: CessionFormState) => Promise<void>
}) {
  const [form, setForm] = useState<CessionFormState>(emptyCessionForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const updateForm = <Key extends keyof CessionFormState>(key: Key, value: CessionFormState[Key]) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onCreate(form)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create cession.')
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
            <h2 className="mt-1 text-xl font-bold">Create cession</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add cession basis, payable amounts, policy references, and transaction details.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground">Close</button>
        </div>

        <div className="scrollbar-sleek flex-1 overflow-y-auto px-5 py-4">
          {error ? <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <ModalField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Enter cession name" /></ModalField>
            <ModalField label="Adjustst Cession Id"><Select value={form.adjuststCessionId} onValueChange={(value) => updateForm('adjuststCessionId', value)} options={buildLookupOptions(cessionOptions, 'Look for Adjustst Cession Id')} /></ModalField>
            <ModalField label="Ceded Sum Insured"><Input value={form.cededSumInsured} onChange={(event) => updateForm('cededSumInsured', event.target.value)} placeholder="Enter ceded sum insured" /></ModalField>
            <ModalField label="Cession Basis"><Select value={form.cessionBasis} onValueChange={(value) => updateForm('cessionBasis', value)} options={cessionBasisOptions} /></ModalField>
            <ModalField label="Commission Amount"><Input value={form.commissionAmount} onChange={(event) => updateForm('commissionAmount', event.target.value)} placeholder="Enter commission amount" /></ModalField>
            <ModalField label="Effective Date"><CalendarDateField value={form.effectiveDate} onChange={(value) => updateForm('effectiveDate', value)} /></ModalField>
            <ModalField label="Gross Sum Insured"><Input value={form.grossSumInsured} onChange={(event) => updateForm('grossSumInsured', event.target.value)} placeholder="Enter gross sum insured" /></ModalField>
            <ModalField label="Is Adjustment"><Select value={form.isAdjustment} onValueChange={(value) => updateForm('isAdjustment', value)} options={yesNoOptions} /></ModalField>
            <ModalField label="Net Payable to Reinsurers"><Input value={form.netPayableToReinsurers} onChange={(event) => updateForm('netPayableToReinsurers', event.target.value)} placeholder="Enter net payable" /></ModalField>
            <ModalField label="Policy Conversion Id"><Select value={form.policyConversionId} onValueChange={(value) => updateForm('policyConversionId', value)} options={buildLookupOptions(policyConversionOptions, 'Look for Policy Conversion Id')} /></ModalField>
            <ModalField label="Policy Id"><Select value={form.policyId} onValueChange={(value) => updateForm('policyId', value)} options={buildLookupOptions(policyOptions, 'Look for Policy Id')} /></ModalField>
            <ModalField label="Retained Sum Insured"><Input value={form.retainedSumInsured} onChange={(event) => updateForm('retainedSumInsured', event.target.value)} placeholder="Enter retained sum insured" /></ModalField>
            <ModalField label="Transaction Type"><Select value={form.transactionType} onValueChange={(value) => updateForm('transactionType', value)} options={transactionTypeOptions} /></ModalField>
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
        <span className={value ? '' : 'text-[#94A3B8]'}>{selectedDate ? formatDate(selectedDate.toISOString()) : 'Select effective date'}</span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[70] w-[292px] rounded-2xl border border-border-soft bg-surface p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setViewDate((current) => addMonths(current, -1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-sm font-bold">{monthLabel}</p>
            <button type="button" onClick={() => setViewDate((current) => addMonths(current, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const inMonth = date.getMonth() === viewDate.getMonth()
              const selected = selectedDate ? isSameDay(date, selectedDate) : false
              const today = isSameDay(date, new Date())
              return <button key={date.toISOString()} type="button" onClick={() => selectDate(date)} className={`flex h-8 items-center justify-center rounded-lg text-[12px] font-semibold transition ${selected ? 'bg-primary text-white shadow-glow' : today ? 'border border-primary/30 bg-primary/8 text-primary' : inMonth ? 'text-foreground hover:bg-primary/10 hover:text-primary' : 'text-muted-foreground/55 hover:bg-surface-muted'}`}>{date.getDate()}</button>
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

function CessionDetail({
  record,
  cessionOptions,
  policyConversionOptions,
  policyOptions,
  onBack,
  onSave,
}: {
  record: CessionRecord
  cessionOptions: ReinsuranceLookupOption[]
  policyConversionOptions: ReinsuranceLookupOption[]
  policyOptions: ReinsuranceLookupOption[]
  onBack: () => void
  onSave: (record: CessionRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CessionFormState>(() => toCessionForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const updateForm = <Key extends keyof CessionFormState>(key: Key, value: CessionFormState[Key]) => setForm((current) => ({ ...current, [key]: value }))
  const cancelEdit = () => {
    setForm(toCessionForm(record))
    setSaveError(null)
    setIsEditing(false)
  }
  const saveEdit = async () => {
    const updatedRecord: CessionRecord = {
      ...record,
      name: form.name.trim() || record.name,
      adjuststCessionId: resolveLookupLabel(cessionOptions, form.adjuststCessionId, record.adjuststCessionId),
      adjuststCessionLookupId: resolveLookupValue(form.adjuststCessionId) || record.adjuststCessionLookupId,
      cededSumInsured: parseMoneyInput(form.cededSumInsured),
      cessionBasis: resolveSelectValue(form.cessionBasis, record.cessionBasis),
      commissionAmount: parseMoneyInput(form.commissionAmount),
      effectiveDate: form.effectiveDate || record.effectiveDate,
      grossSumInsured: parseMoneyInput(form.grossSumInsured),
      isAdjustment: resolveYesNo(form.isAdjustment, record.isAdjustment),
      netPayableToReinsurers: parseMoneyInput(form.netPayableToReinsurers),
      policyConversionId: resolveLookupLabel(policyConversionOptions, form.policyConversionId, record.policyConversionId),
      policyConversionLookupId: resolveLookupValue(form.policyConversionId) || record.policyConversionLookupId,
      policyId: resolveLookupLabel(policyOptions, form.policyId, record.policyId),
      policyLookupId: resolveLookupValue(form.policyId) || record.policyLookupId,
      retainedSumInsured: parseMoneyInput(form.retainedSumInsured),
      transactionType: resolveSelectValue(form.transactionType, record.transactionType),
      statusReason: resolveSelectValue(form.statusReason, record.statusReason),
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(updatedRecord)
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save cession.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back to Cessions</Button>
      <PageHeader
        icon={FileCheck2}
        eyebrow="Reinsurance"
        title={record.name}
        description="Cession amounts, payable reinsurer value, policy conversion, retained sum, and transaction details."
        actions={isEditing ? <div className="flex flex-wrap items-center justify-end gap-2"><Button variant="secondary" onClick={cancelEdit}>Cancel</Button><Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Cession'}</Button></div> : <Button onClick={() => setIsEditing(true)}>Edit Cession</Button>}
      />
      <Card variant="premium" className="space-y-5">
        {saveError ? <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{saveError}</div> : null}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Cession Form</p><h2 className="mt-1 text-xl font-bold">{record.name}</h2></div>
          <div className="flex flex-wrap gap-2"><Badge variant={record.isAdjustment === 'Yes' ? 'pending' : 'neutral'}>Adjustment: {record.isAdjustment}</Badge><Badge variant={record.statusReason === 'Posted' ? 'approved' : record.statusReason === 'Reversed' ? 'rejected' : 'pending'}>{record.statusReason}</Badge></div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Adjustst Cession Id"><Select value={form.adjuststCessionId} onValueChange={(value) => updateForm('adjuststCessionId', value)} options={buildLookupOptions(cessionOptions, 'Look for Adjustst Cession Id')} /></EditableField>
              <EditableField label="Ceded Sum Insured"><Input value={form.cededSumInsured} onChange={(event) => updateForm('cededSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Cession Basis"><Select value={form.cessionBasis} onValueChange={(value) => updateForm('cessionBasis', value)} options={cessionBasisOptions} /></EditableField>
              <EditableField label="Commission Amount"><Input value={form.commissionAmount} onChange={(event) => updateForm('commissionAmount', event.target.value)} /></EditableField>
              <EditableField label="Effective Date"><CalendarDateField value={form.effectiveDate} onChange={(value) => updateForm('effectiveDate', value)} /></EditableField>
              <EditableField label="Gross Sum Insured"><Input value={form.grossSumInsured} onChange={(event) => updateForm('grossSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Is Adjustment"><Select value={form.isAdjustment} onValueChange={(value) => updateForm('isAdjustment', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Net Payable to Reinsurers"><Input value={form.netPayableToReinsurers} onChange={(event) => updateForm('netPayableToReinsurers', event.target.value)} /></EditableField>
              <EditableField label="Policy Conversion Id"><Select value={form.policyConversionId} onValueChange={(value) => updateForm('policyConversionId', value)} options={buildLookupOptions(policyConversionOptions, 'Look for Policy Conversion Id')} /></EditableField>
              <EditableField label="Policy Id"><Select value={form.policyId} onValueChange={(value) => updateForm('policyId', value)} options={buildLookupOptions(policyOptions, 'Look for Policy Id')} /></EditableField>
              <EditableField label="Retained Sum Insured"><Input value={form.retainedSumInsured} onChange={(event) => updateForm('retainedSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Transaction Type"><Select value={form.transactionType} onValueChange={(value) => updateForm('transactionType', value)} options={transactionTypeOptions} /></EditableField>
              <EditableField label="Status Reason"><Select value={form.statusReason} onValueChange={(value) => updateForm('statusReason', value)} options={statusReasonOptions} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Adjustst Cession Id" value={getLookupDisplayValue(cessionOptions, record.adjuststCessionLookupId, record.adjuststCessionId)} />
              <ReadOnlyField label="Ceded Sum Insured" value={formatMoney(record.cededSumInsured)} />
              <ReadOnlyField label="Cession Basis" value={record.cessionBasis} />
              <ReadOnlyField label="Commission Amount" value={formatMoney(record.commissionAmount)} />
              <ReadOnlyField label="Effective Date" value={formatDate(record.effectiveDate)} />
              <ReadOnlyField label="Gross Sum Insured" value={formatMoney(record.grossSumInsured)} />
              <ReadOnlyField label="Is Adjustment" value={record.isAdjustment} />
              <ReadOnlyField label="Net Payable to Reinsurers" value={formatMoney(record.netPayableToReinsurers)} />
              <ReadOnlyField label="Policy Conversion Id" value={getLookupDisplayValue(policyConversionOptions, record.policyConversionLookupId, record.policyConversionId)} />
              <ReadOnlyField label="Policy Id" value={getLookupDisplayValue(policyOptions, record.policyLookupId, record.policyId)} />
              <ReadOnlyField label="Retained Sum Insured" value={formatMoney(record.retainedSumInsured)} />
              <ReadOnlyField label="Transaction Type" value={record.transactionType} />
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><div className="mb-2 min-h-[20px]"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p></div><div className="form-field-surface min-h-[42px] rounded-xl border border-border-soft px-4 py-2.5 text-sm text-foreground">{value}</div></div>
}

function EditableField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><div className="mb-2 min-h-[20px]"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p></div>{children}</div>
}

function toCessionForm(record: CessionRecord): CessionFormState {
  return {
    name: record.name,
    adjuststCessionId: record.adjuststCessionLookupId || 'Select',
    cededSumInsured: formatMoney(record.cededSumInsured),
    cessionBasis: record.cessionBasis,
    commissionAmount: formatMoney(record.commissionAmount),
    effectiveDate: record.effectiveDate,
    grossSumInsured: formatMoney(record.grossSumInsured),
    isAdjustment: record.isAdjustment,
    netPayableToReinsurers: formatMoney(record.netPayableToReinsurers),
    policyConversionId: record.policyConversionLookupId || 'Select',
    policyId: record.policyLookupId || 'Select',
    retainedSumInsured: formatMoney(record.retainedSumInsured),
    transactionType: record.transactionType,
    statusReason: record.statusReason,
  }
}

function toCessionCreateInput(form: CessionFormState): CessionSaveInput {
  return {
    name: form.name.trim() || 'Untitled Cession',
    adjuststCessionLookupId: resolveLookupValue(form.adjuststCessionId),
    cededSumInsured: parseMoneyInput(form.cededSumInsured),
    cessionBasis: resolveSelectValue(form.cessionBasis, 'Treaty'),
    commissionAmount: parseMoneyInput(form.commissionAmount),
    effectiveDate: form.effectiveDate,
    grossSumInsured: parseMoneyInput(form.grossSumInsured),
    isAdjustment: resolveYesNo(form.isAdjustment, 'No'),
    netPayableToReinsurers: parseMoneyInput(form.netPayableToReinsurers),
    policyConversionLookupId: resolveLookupValue(form.policyConversionId),
    policyLookupId: resolveLookupValue(form.policyId),
    retainedSumInsured: parseMoneyInput(form.retainedSumInsured),
    transactionType: resolveSelectValue(form.transactionType, 'New'),
    statusReason: resolveSelectValue(form.statusReason, 'Draft'),
  }
}

function toCessionSaveInput(record: CessionRecord): CessionSaveInput {
  return {
    name: record.name,
    adjuststCessionLookupId: record.adjuststCessionLookupId,
    cededSumInsured: record.cededSumInsured,
    cessionBasis: record.cessionBasis,
    commissionAmount: record.commissionAmount,
    effectiveDate: record.effectiveDate,
    grossSumInsured: record.grossSumInsured,
    isAdjustment: record.isAdjustment,
    netPayableToReinsurers: record.netPayableToReinsurers,
    policyConversionLookupId: record.policyConversionLookupId,
    policyLookupId: record.policyLookupId,
    retainedSumInsured: record.retainedSumInsured,
    transactionType: record.transactionType,
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function formatDate(value: string) {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }).format(date)
}

function parseMoneyInput(value: string) {
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
