import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, FileCheck2, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'

interface CessionRecord {
  id: string
  name: string
  adjuststCessionId: string
  cededSumInsured: number
  cessionBasis: string
  commissionAmount: number
  effectiveDate: string
  grossSumInsured: number
  isAdjustment: 'Yes' | 'No'
  netPayableToReinsurers: number
  policyConversionId: string
  policyId: string
  retainedSumInsured: number
  transactionType: string
  statusReason: string
}

interface CessionCreateFormState {
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

const emptyCessionCreateForm: CessionCreateFormState = {
  name: '',
  adjuststCessionId: '',
  cededSumInsured: '',
  cessionBasis: '',
  commissionAmount: '',
  effectiveDate: '',
  grossSumInsured: '',
  isAdjustment: '',
  netPayableToReinsurers: '',
  policyConversionId: '',
  policyId: '',
  retainedSumInsured: '',
  transactionType: '',
  statusReason: '',
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

const cessions: CessionRecord[] = [
  {
    id: 'cession-ce-001',
    name: 'CE-001',
    adjuststCessionId: 'CE-001',
    cededSumInsured: 35000000,
    cessionBasis: 'Treaty',
    commissionAmount: 79317.93,
    effectiveDate: '2026-02-01',
    grossSumInsured: 340000,
    isAdjustment: 'No',
    netPayableToReinsurers: 218182.07,
    policyConversionId: 'INQ-0174 - Inquiry for Aviation - anees.rehman@datanox.io',
    policyId: 'POL-2025-087',
    retainedSumInsured: 5000000,
    transactionType: 'New',
    statusReason: 'Posted',
  },
  {
    id: 'cession-ce-002',
    name: 'CE-002',
    adjuststCessionId: 'CE-002',
    cededSumInsured: 1750000,
    cessionBasis: 'Treaty',
    commissionAmount: 3965.9,
    effectiveDate: '2026-05-15',
    grossSumInsured: 17000,
    isAdjustment: 'Yes',
    netPayableToReinsurers: 10909.1,
    policyConversionId: 'INQ-0176 - Inquiry for Aviation - umar.farooq@datanox.io',
    policyId: 'POL-2026-014',
    retainedSumInsured: 250000,
    transactionType: 'Endorsement',
    statusReason: 'Posted',
  },
  {
    id: 'cession-ce-003',
    name: 'CE-003',
    adjuststCessionId: 'CE-003',
    cededSumInsured: 200000,
    cessionBasis: 'Treaty Only',
    commissionAmount: 1440,
    effectiveDate: '2026-03-05',
    grossSumInsured: 12000,
    isAdjustment: 'No',
    netPayableToReinsurers: 3360,
    policyConversionId: 'INQ-0201 - Inquiry for Aviation - anees.rehman@datanox.io',
    policyId: 'POL-2026-031',
    retainedSumInsured: 300000,
    transactionType: 'New',
    statusReason: 'Posted',
  },
]

const tableColumns: Array<{
  key: keyof CessionRecord
  label: string
  render?: (record: CessionRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'adjuststCessionId', label: 'Adjustst Cessio...' },
  { key: 'cededSumInsured', label: 'Ceded Sum Insu...', render: (record) => formatMoney(record.cededSumInsured) },
  { key: 'cessionBasis', label: 'Cession Ba...' },
  { key: 'commissionAmount', label: 'Commission Amo...', render: (record) => formatMoney(record.commissionAmount) },
  { key: 'effectiveDate', label: 'Effective D...', render: (record) => formatDate(record.effectiveDate) },
  { key: 'grossSumInsured', label: 'Gross Sum Insu...', render: (record) => formatMoney(record.grossSumInsured) },
  { key: 'isAdjustment', label: 'Is Adjustm...' },
  { key: 'netPayableToReinsurers', label: 'Net Payable to Reins...', render: (record) => formatMoney(record.netPayableToReinsurers) },
  { key: 'policyConversionId', label: 'Policy Conversio...' },
  { key: 'policyId', label: 'Policy Id' },
  { key: 'retainedSumInsured', label: 'Retained Sum Ins...', render: (record) => formatMoney(record.retainedSumInsured) },
  { key: 'transactionType', label: 'Transaction T...' },
  { key: 'statusReason', label: 'Status Rea...' },
]

export function CessionsPage() {
  const [records, setRecords] = useState(cessions)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <CessionDetail
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
        icon={FileCheck2}
        eyebrow="Reinsurance"
        title="Cessions"
        description="Posted treaty cessions, payable amounts, retained sums, policy links, and transaction basis."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Cession
          </Button>
        }
      />

      <Card padding="none" variant="premium" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1700px] border-collapse">
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
                      ) : column.key === 'adjuststCessionId' || column.key === 'policyConversionId' || column.key === 'policyId' ? (
                        <span className="block max-w-[190px] truncate font-semibold text-primary">
                          {column.render ? column.render(record) : String(record[column.key])}
                        </span>
                      ) : column.key === 'isAdjustment' ? (
                        <Badge variant={record.isAdjustment === 'Yes' ? 'pending' : 'neutral'}>
                          {record.isAdjustment}
                        </Badge>
                      ) : column.key === 'statusReason' ? (
                        <Badge variant="approved">{record.statusReason}</Badge>
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
        <CreateCessionModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={(form) => {
            const created: CessionRecord = {
              id: `cession-${Date.now()}`,
              name: form.name.trim() || 'Untitled Cession',
              adjuststCessionId: form.adjuststCessionId.trim() || '---',
              cededSumInsured: parseMoneyInput(form.cededSumInsured),
              cessionBasis: resolveSelectValue(form.cessionBasis, 'Treaty'),
              commissionAmount: parseMoneyInput(form.commissionAmount),
              effectiveDate: form.effectiveDate || new Date().toISOString(),
              grossSumInsured: parseMoneyInput(form.grossSumInsured),
              isAdjustment: resolveYesNo(form.isAdjustment, 'No'),
              netPayableToReinsurers: parseMoneyInput(form.netPayableToReinsurers),
              policyConversionId: form.policyConversionId.trim() || '---',
              policyId: form.policyId.trim() || '---',
              retainedSumInsured: parseMoneyInput(form.retainedSumInsured),
              transactionType: resolveSelectValue(form.transactionType, 'New'),
              statusReason: form.statusReason.trim() || 'Posted',
            }
            setRecords((current) => [created, ...current])
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateCessionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: CessionCreateFormState) => void
}) {
  const [form, setForm] = useState<CessionCreateFormState>(emptyCessionCreateForm)

  const updateForm = <Key extends keyof CessionCreateFormState>(
    key: Key,
    value: CessionCreateFormState[Key],
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
            <h2 className="mt-1 text-xl font-bold">Create cession</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add cession basis, payable amounts, policy references, and transaction details.
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
                placeholder="Enter cession name"
              />
            </ModalField>
            <ModalField label="Adjustst Cession Id">
              <Input
                value={form.adjuststCessionId}
                onChange={(event) => updateForm('adjuststCessionId', event.target.value)}
                placeholder="Look for Adjustst Cession Id"
              />
            </ModalField>
            <ModalField label="Ceded Sum Insured">
              <Input
                value={form.cededSumInsured}
                onChange={(event) => updateForm('cededSumInsured', event.target.value)}
                placeholder="Enter ceded sum insured"
              />
            </ModalField>
            <ModalField label="Cession Basis">
              <Select
                value={form.cessionBasis}
                onValueChange={(value) => updateForm('cessionBasis', value)}
                options={cessionBasisOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Commission Amount">
              <Input
                value={form.commissionAmount}
                onChange={(event) => updateForm('commissionAmount', event.target.value)}
                placeholder="Enter commission amount"
              />
            </ModalField>
            <ModalField label="Effective Date">
              <CalendarDateField
                value={form.effectiveDate}
                onChange={(value) => updateForm('effectiveDate', value)}
              />
            </ModalField>
            <ModalField label="Gross Sum Insured">
              <Input
                value={form.grossSumInsured}
                onChange={(event) => updateForm('grossSumInsured', event.target.value)}
                placeholder="Enter gross sum insured"
              />
            </ModalField>
            <ModalField label="Is Adjustment">
              <Select
                value={form.isAdjustment}
                onValueChange={(value) => updateForm('isAdjustment', value)}
                options={yesNoOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Net Payable to Reinsurers">
              <Input
                value={form.netPayableToReinsurers}
                onChange={(event) => updateForm('netPayableToReinsurers', event.target.value)}
                placeholder="Enter net payable"
              />
            </ModalField>
            <ModalField label="Policy Conversion Id">
              <Input
                value={form.policyConversionId}
                onChange={(event) => updateForm('policyConversionId', event.target.value)}
                placeholder="Look for Policy Conversion Id"
              />
            </ModalField>
            <ModalField label="Policy Id">
              <Input
                value={form.policyId}
                onChange={(event) => updateForm('policyId', event.target.value)}
                placeholder="Look for Policy Id"
              />
            </ModalField>
            <ModalField label="Retained Sum Insured">
              <Input
                value={form.retainedSumInsured}
                onChange={(event) => updateForm('retainedSumInsured', event.target.value)}
                placeholder="Enter retained sum insured"
              />
            </ModalField>
            <ModalField label="Transaction Type">
              <Select
                value={form.transactionType}
                onValueChange={(value) => updateForm('transactionType', value)}
                options={transactionTypeOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Status Reason">
              <Input
                value={form.statusReason}
                onChange={(event) => updateForm('statusReason', event.target.value)}
                placeholder="Enter status reason"
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
          {selectedDate ? formatDate(selectedDate.toISOString()) : 'Select effective date'}
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

function CessionDetail({
  record,
  onBack,
  onSave,
}: {
  record: CessionRecord
  onBack: () => void
  onSave: (record: CessionRecord) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CessionCreateFormState>(() => toCessionForm(record))

  const updateForm = <Key extends keyof CessionCreateFormState>(key: Key, value: CessionCreateFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toCessionForm(record))
    setIsEditing(false)
  }

  const saveEdit = () => {
    onSave({
      ...record,
      name: form.name.trim() || record.name,
      adjuststCessionId: form.adjuststCessionId.trim() || '---',
      cededSumInsured: parseMoneyInput(form.cededSumInsured),
      cessionBasis: resolveSelectValue(form.cessionBasis, record.cessionBasis),
      commissionAmount: parseMoneyInput(form.commissionAmount),
      effectiveDate: form.effectiveDate || record.effectiveDate,
      grossSumInsured: parseMoneyInput(form.grossSumInsured),
      isAdjustment: resolveYesNo(form.isAdjustment, record.isAdjustment),
      netPayableToReinsurers: parseMoneyInput(form.netPayableToReinsurers),
      policyConversionId: form.policyConversionId.trim() || '---',
      policyId: form.policyId.trim() || '---',
      retainedSumInsured: parseMoneyInput(form.retainedSumInsured),
      transactionType: resolveSelectValue(form.transactionType, record.transactionType),
      statusReason: form.statusReason.trim() || 'Posted',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Cessions
      </Button>

      <PageHeader
        icon={FileCheck2}
        eyebrow="Reinsurance"
        title={record.name}
        description="Cession amounts, payable reinsurer value, policy conversion, retained sum, and transaction details."
        actions={
          isEditing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={saveEdit}>Save Cession</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Cession</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Cession Form
            </p>
            <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={record.isAdjustment === 'Yes' ? 'pending' : 'neutral'}>
              Adjustment: {record.isAdjustment}
            </Badge>
            <Badge variant="approved">{record.statusReason}</Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Adjustst Cession Id"><Input value={form.adjuststCessionId} onChange={(event) => updateForm('adjuststCessionId', event.target.value)} /></EditableField>
              <EditableField label="Ceded Sum Insured"><Input value={form.cededSumInsured} onChange={(event) => updateForm('cededSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Cession Basis"><Select value={form.cessionBasis} onValueChange={(value) => updateForm('cessionBasis', value)} options={cessionBasisOptions} /></EditableField>
              <EditableField label="Commission Amount"><Input value={form.commissionAmount} onChange={(event) => updateForm('commissionAmount', event.target.value)} /></EditableField>
              <EditableField label="Effective Date"><CalendarDateField value={form.effectiveDate} onChange={(value) => updateForm('effectiveDate', value)} /></EditableField>
              <EditableField label="Gross Sum Insured"><Input value={form.grossSumInsured} onChange={(event) => updateForm('grossSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Is Adjustment"><Select value={form.isAdjustment} onValueChange={(value) => updateForm('isAdjustment', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Net Payable to Reinsurers"><Input value={form.netPayableToReinsurers} onChange={(event) => updateForm('netPayableToReinsurers', event.target.value)} /></EditableField>
              <EditableField label="Policy Conversion Id"><Input value={form.policyConversionId} onChange={(event) => updateForm('policyConversionId', event.target.value)} /></EditableField>
              <EditableField label="Policy Id"><Input value={form.policyId} onChange={(event) => updateForm('policyId', event.target.value)} /></EditableField>
              <EditableField label="Retained Sum Insured"><Input value={form.retainedSumInsured} onChange={(event) => updateForm('retainedSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Transaction Type"><Select value={form.transactionType} onValueChange={(value) => updateForm('transactionType', value)} options={transactionTypeOptions} /></EditableField>
              <EditableField label="Status Reason"><Input value={form.statusReason} onChange={(event) => updateForm('statusReason', event.target.value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Adjustst Cession Id" value={record.adjuststCessionId} />
              <ReadOnlyField label="Ceded Sum Insured" value={formatMoney(record.cededSumInsured)} />
              <ReadOnlyField label="Cession Basis" value={record.cessionBasis} />
              <ReadOnlyField label="Commission Amount" value={formatMoney(record.commissionAmount)} />
              <ReadOnlyField label="Effective Date" value={formatDate(record.effectiveDate)} />
              <ReadOnlyField label="Gross Sum Insured" value={formatMoney(record.grossSumInsured)} />
              <ReadOnlyField label="Is Adjustment" value={record.isAdjustment} />
              <ReadOnlyField label="Net Payable to Reinsurers" value={formatMoney(record.netPayableToReinsurers)} />
              <ReadOnlyField label="Policy Conversion Id" value={record.policyConversionId} />
              <ReadOnlyField label="Policy Id" value={record.policyId} />
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

function toCessionForm(record: CessionRecord): CessionCreateFormState {
  return {
    name: record.name,
    adjuststCessionId: record.adjuststCessionId,
    cededSumInsured: formatMoney(record.cededSumInsured),
    cessionBasis: record.cessionBasis,
    commissionAmount: formatMoney(record.commissionAmount),
    effectiveDate: record.effectiveDate,
    grossSumInsured: formatMoney(record.grossSumInsured),
    isAdjustment: record.isAdjustment,
    netPayableToReinsurers: formatMoney(record.netPayableToReinsurers),
    policyConversionId: record.policyConversionId,
    policyId: record.policyId,
    retainedSumInsured: formatMoney(record.retainedSumInsured),
    transactionType: record.transactionType,
    statusReason: record.statusReason,
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
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
