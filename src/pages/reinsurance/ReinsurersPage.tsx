import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Handshake, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'

interface ReinsurerRecord {
  id: string
  name: string
  accountId: string
  currentExposure: number
  lastUpdated: string
  maxExposureLimit: number
  isApproved: 'Yes' | 'No'
  partyType: string
  ratingAgency: string
  ratingExpiryDate: string
  securityRating: string
  shariahApprovalRef: string
  shariahCompliant: 'Yes' | 'No'
  country: string
}

const reinsurers: ReinsurerRecord[] = [
  {
    id: 'reinsurer-arabian-shield',
    name: 'Arabian Shield Re',
    accountId: '---',
    currentExposure: 8388586.95,
    lastUpdated: '2026-08-20T15:35:00+05:00',
    maxExposureLimit: 15000000,
    isApproved: 'Yes',
    partyType: 'Reinsurer',
    ratingAgency: 'AM Best',
    ratingExpiryDate: '2026-11-30',
    securityRating: '---',
    shariahApprovalRef: 'SB-2026-041',
    shariahCompliant: 'No',
    country: 'Pakistan',
  },
  {
    id: 'reinsurer-gulf-takaful',
    name: 'Gulf Takaful Re',
    accountId: 'ACC-RE-1008',
    currentExposure: 5120000,
    lastUpdated: '2026-08-18T11:20:00+05:00',
    maxExposureLimit: 12000000,
    isApproved: 'Yes',
    partyType: 'Reinsurer',
    ratingAgency: 'S&P Global',
    ratingExpiryDate: '2027-01-15',
    securityRating: 'A-',
    shariahApprovalRef: 'SB-2026-018',
    shariahCompliant: 'Yes',
    country: 'United Arab Emirates',
  },
  {
    id: 'reinsurer-orient-capital',
    name: 'Orient Capital Re',
    accountId: 'ACC-RE-1016',
    currentExposure: 2745000,
    lastUpdated: '2026-08-12T09:05:00+05:00',
    maxExposureLimit: 9000000,
    isApproved: 'No',
    partyType: 'Retrocessionaire',
    ratingAgency: 'Fitch',
    ratingExpiryDate: '2026-10-10',
    securityRating: 'BBB+',
    shariahApprovalRef: 'Pending',
    shariahCompliant: 'No',
    country: 'Saudi Arabia',
  },
]

const tableColumns: Array<{
  key: keyof ReinsurerRecord
  label: string
  render?: (record: ReinsurerRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'accountId', label: 'Account ID' },
  { key: 'currentExposure', label: 'Current Exposure', render: (record) => formatMoney(record.currentExposure) },
  { key: 'maxExposureLimit', label: 'Max Exposure Limit', render: (record) => formatMoney(record.maxExposureLimit) },
  { key: 'isApproved', label: 'Approved' },
  { key: 'partyType', label: 'Party Type' },
  { key: 'ratingAgency', label: 'Rating Agency' },
  { key: 'ratingExpiryDate', label: 'Rating Expiry Date', render: (record) => formatDate(record.ratingExpiryDate) },
  { key: 'securityRating', label: 'Security Rating' },
  { key: 'shariahApprovalRef', label: 'Shariah Approval Ref' },
  { key: 'shariahCompliant', label: 'Shariah Compliant' },
  { key: 'country', label: 'Country' },
]

const yesNoOptions = [
  { value: 'Select', label: 'Select option' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

const partyTypeOptions = [
  { value: 'Select', label: 'Select party type' },
  { value: 'Reinsurer', label: 'Reinsurer' },
  { value: 'National Reinsurer', label: 'National Reinsurer' },
  { value: 'Reinsurance Broker', label: 'Reinsurance Broker' },
  { value: 'Retakaful Operator', label: 'Retakaful Operator' },
]

const ratingAgencyOptions = [
  { value: 'Select', label: 'Select rating agency' },
  { value: 'AM Best', label: 'AM Best' },
  { value: 'S&P', label: 'S&P' },
  { value: 'S&P Global', label: 'S&P Global' },
  { value: "Moody's", label: "Moody's" },
  { value: 'Fitch', label: 'Fitch' },
  { value: 'Unrated', label: 'Unrated' },
]

const securityRatingOptions = [
  { value: 'Select', label: 'Select security rating' },
  { value: 'AAA ... B', label: 'AAA ... B' },
  { value: 'A-', label: 'A-' },
  { value: 'BBB+', label: 'BBB+' },
  { value: 'Unrated', label: 'Unrated' },
]

const countryOptions = [
  { value: 'Select', label: 'Select country' },
  { value: 'UAE', label: 'UAE' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Oman', label: 'Oman' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'UK', label: 'UK' },
  { value: 'USA', label: 'USA' },
]

interface ReinsurerCreateFormState {
  name: string
  accountId: string
  currentExposure: string
  maxExposureLimit: string
  isApproved: string
  partyType: string
  ratingAgency: string
  ratingExpiryDate: string
  securityRating: string
  shariahApprovalRef: string
  shariahCompliant: string
  country: string
}

interface ReinsurerEditFormState {
  name: string
  accountId: string
  currentExposure: string
  maxExposureLimit: string
  isApproved: 'Yes' | 'No'
  partyType: string
  ratingAgency: string
  ratingExpiryDate: string
  securityRating: string
  shariahApprovalRef: string
  shariahCompliant: 'Yes' | 'No'
  country: string
}

const emptyCreateForm: ReinsurerCreateFormState = {
  name: '',
  accountId: '',
  currentExposure: '',
  maxExposureLimit: '',
  isApproved: 'Select',
  partyType: 'Select',
  ratingAgency: 'Select',
  ratingExpiryDate: '',
  securityRating: 'Select',
  shariahApprovalRef: '',
  shariahCompliant: 'Select',
  country: 'Select',
}

export function ReinsurersPage() {
  const [records, setRecords] = useState(reinsurers)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <ReinsurerDetail
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
        icon={Handshake}
        eyebrow="Reinsurance"
        title="Reinsurers"
        description="Approved counterparties, exposure controls, ratings, and Shariah status."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Reinsurer
          </Button>
        }
      />

      <Card padding="none" variant="premium" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] border-collapse">
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
                        ) : column.key === 'isApproved' ? (
                          <Badge variant={record.isApproved === 'Yes' ? 'approved' : 'pending'}>
                            {record.isApproved}
                          </Badge>
                        ) : column.key === 'shariahCompliant' ? (
                          <Badge variant={record.shariahCompliant === 'Yes' ? 'approved' : 'neutral'}>
                            {record.shariahCompliant}
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

      {isCreateOpen ? (
        <CreateReinsurerModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={(form) => {
            const created: ReinsurerRecord = {
              id: `reinsurer-${Date.now()}`,
              name: form.name.trim() || 'Untitled Reinsurer',
              accountId: form.accountId.trim() || '---',
              currentExposure: parseMoneyInput(form.currentExposure),
              lastUpdated: new Date().toISOString(),
              maxExposureLimit: parseMoneyInput(form.maxExposureLimit),
              isApproved: resolveYesNo(form.isApproved, 'No'),
              partyType: resolveSelectValue(form.partyType, 'Reinsurer'),
              ratingAgency: resolveSelectValue(form.ratingAgency, 'Unrated'),
              ratingExpiryDate: form.ratingExpiryDate || new Date().toISOString(),
              securityRating: resolveSelectValue(form.securityRating, 'Unrated'),
              shariahApprovalRef: form.shariahApprovalRef.trim() || '---',
              shariahCompliant: resolveYesNo(form.shariahCompliant, 'No'),
              country: resolveSelectValue(form.country, 'UAE'),
            }
            setRecords((current) => [created, ...current])
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateReinsurerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: ReinsurerCreateFormState) => void
}) {
  const [form, setForm] = useState<ReinsurerCreateFormState>(emptyCreateForm)

  const updateForm = <Key extends keyof ReinsurerCreateFormState>(
    key: Key,
    value: ReinsurerCreateFormState[Key],
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
            <h2 className="mt-1 text-xl font-bold">Create reinsurer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a reinsurer using the shared premium Reinsurance form pattern.
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
                placeholder="Enter reinsurer name"
              />
            </ModalField>
            <ModalField label="Account Id">
              <Input
                value={form.accountId}
                onChange={(event) => updateForm('accountId', event.target.value)}
                placeholder="Enter account id"
              />
            </ModalField>
            <ModalField label="Current Exposure">
              <Input
                value={form.currentExposure}
                onChange={(event) => updateForm('currentExposure', event.target.value)}
                placeholder="Enter current exposure"
              />
            </ModalField>
            <ModalField label="Max Exposure Limit">
              <Input
                value={form.maxExposureLimit}
                onChange={(event) => updateForm('maxExposureLimit', event.target.value)}
                placeholder="Enter max exposure limit"
              />
            </ModalField>
            <ModalField label="Is Approved">
              <Select
                value={form.isApproved}
                onValueChange={(value) => updateForm('isApproved', value)}
                options={yesNoOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Party Type">
              <Select
                value={form.partyType}
                onValueChange={(value) => updateForm('partyType', value)}
                options={partyTypeOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Rating Agency">
              <Select
                value={form.ratingAgency}
                onValueChange={(value) => updateForm('ratingAgency', value)}
                options={ratingAgencyOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Rating Expiry Date">
              <CalendarDateField
                value={form.ratingExpiryDate}
                onChange={(value) => updateForm('ratingExpiryDate', value)}
              />
            </ModalField>
            <ModalField label="Security Rating">
              <Select
                value={form.securityRating}
                onValueChange={(value) => updateForm('securityRating', value)}
                options={securityRatingOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Shariah Approval Ref">
              <Input
                value={form.shariahApprovalRef}
                onChange={(event) => updateForm('shariahApprovalRef', event.target.value)}
                placeholder="Enter Shariah approval reference"
              />
            </ModalField>
            <ModalField label="Shariah Compliant">
              <Select
                value={form.shariahCompliant}
                onValueChange={(value) => updateForm('shariahCompliant', value)}
                options={yesNoOptions}
                placeholder="Select"
              />
            </ModalField>
            <ModalField label="Country">
              <Select
                value={form.country}
                onValueChange={(value) => updateForm('country', value)}
                options={countryOptions}
                placeholder="Select"
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
          {selectedDate ? formatDate(selectedDate.toISOString()) : 'Select rating expiry date'}
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

function ReinsurerDetail({
  record,
  onBack,
  onSave,
}: {
  record: ReinsurerRecord
  onBack: () => void
  onSave: (record: ReinsurerRecord) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<ReinsurerEditFormState>(() => toEditForm(record))

  const updateForm = <Key extends keyof ReinsurerEditFormState>(
    key: Key,
    value: ReinsurerEditFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toEditForm(record))
    setIsEditing(false)
  }

  const saveEdit = () => {
    onSave({
      ...record,
      name: form.name.trim() || record.name,
      accountId: form.accountId.trim() || '---',
      currentExposure: parseMoneyInput(form.currentExposure),
      lastUpdated: new Date().toISOString(),
      maxExposureLimit: parseMoneyInput(form.maxExposureLimit),
      isApproved: form.isApproved,
      partyType: form.partyType,
      ratingAgency: form.ratingAgency,
      ratingExpiryDate: form.ratingExpiryDate || record.ratingExpiryDate,
      securityRating: form.securityRating.trim() || '---',
      shariahApprovalRef: form.shariahApprovalRef.trim() || '---',
      shariahCompliant: form.shariahCompliant,
      country: form.country,
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Reinsurers
      </Button>

      <PageHeader
        icon={Handshake}
        eyebrow="Reinsurance"
        title={record.name}
        description="Reinsurer exposure, rating, approval, and compliance details."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button onClick={saveEdit}>
                  Save Reinsurer
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Reinsurer
              </Button>
            )}
          </div>
        }
      />

      <Card variant="premium" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Reinsurer Form
            </p>
            <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={record.isApproved === 'Yes' ? 'approved' : 'pending'}>
              Approved: {record.isApproved}
            </Badge>
            <Badge variant="info">{record.partyType}</Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name">
                <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
              </EditableField>
              <EditableField label="Account Id">
                <Input value={form.accountId} onChange={(event) => updateForm('accountId', event.target.value)} />
              </EditableField>
              <EditableField label="Current Exposure" helper={`Last updated: ${formatDateTime(record.lastUpdated)}`}>
                <Input
                  value={form.currentExposure}
                  onChange={(event) => updateForm('currentExposure', event.target.value)}
                />
              </EditableField>
              <EditableField label="Max Exposure Limit">
                <Input
                  value={form.maxExposureLimit}
                  onChange={(event) => updateForm('maxExposureLimit', event.target.value)}
                />
              </EditableField>
              <EditableField label="Is Approved">
                <Select
                  value={form.isApproved}
                  onValueChange={(value) => updateForm('isApproved', resolveYesNo(value, form.isApproved))}
                  options={yesNoOptions}
                  placeholder="Select"
                />
              </EditableField>
              <EditableField label="Party Type">
                <Select
                  value={form.partyType}
                  onValueChange={(value) => updateForm('partyType', resolveSelectValue(value, form.partyType))}
                  options={partyTypeOptions}
                  placeholder="Select"
                />
              </EditableField>
              <EditableField label="Rating Agency">
                <Select
                  value={form.ratingAgency}
                  onValueChange={(value) => updateForm('ratingAgency', resolveSelectValue(value, form.ratingAgency))}
                  options={ratingAgencyOptions}
                  placeholder="Select"
                />
              </EditableField>
              <EditableField label="Rating Expiry Date">
                <CalendarDateField
                  value={form.ratingExpiryDate}
                  onChange={(value) => updateForm('ratingExpiryDate', value)}
                />
              </EditableField>
              <EditableField label="Security Rating">
                <Select
                  value={form.securityRating}
                  onValueChange={(value) => updateForm('securityRating', resolveSelectValue(value, form.securityRating))}
                  options={securityRatingOptions}
                  placeholder="Select"
                />
              </EditableField>
              <EditableField label="Shariah Approval Ref">
                <Input
                  value={form.shariahApprovalRef}
                  onChange={(event) => updateForm('shariahApprovalRef', event.target.value)}
                />
              </EditableField>
              <EditableField label="Shariah Compliant">
                <Select
                  value={form.shariahCompliant}
                  onValueChange={(value) => updateForm('shariahCompliant', resolveYesNo(value, form.shariahCompliant))}
                  options={yesNoOptions}
                  placeholder="Select"
                />
              </EditableField>
              <EditableField label="Country">
                <Select
                  value={form.country}
                  onValueChange={(value) => updateForm('country', resolveSelectValue(value, form.country))}
                  options={countryOptions}
                  placeholder="Select"
                />
              </EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Account Id" value={record.accountId} />
              <ReadOnlyField
                label="Current Exposure"
                value={formatMoney(record.currentExposure)}
                helper={`Last updated: ${formatDateTime(record.lastUpdated)}`}
              />
              <ReadOnlyField label="Max Exposure Limit" value={formatMoney(record.maxExposureLimit)} />
              <ReadOnlyField label="Is Approved" value={record.isApproved} />
              <ReadOnlyField label="Party Type" value={record.partyType} />
              <ReadOnlyField label="Rating Agency" value={record.ratingAgency} />
              <ReadOnlyField label="Rating Expiry Date" value={formatDate(record.ratingExpiryDate)} />
              <ReadOnlyField label="Security Rating" value={record.securityRating} />
              <ReadOnlyField label="Shariah Approval Ref" value={record.shariahApprovalRef} />
              <ReadOnlyField label="Shariah Compliant" value={record.shariahCompliant} />
              <ReadOnlyField label="Country" value={record.country} />
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
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 min-h-[34px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {helper ? <p className="mt-1 text-[12px] text-muted-foreground">{helper}</p> : null}
      </div>
      <div className="form-field-surface min-h-[42px] rounded-xl border border-border-soft px-4 py-2.5 text-sm text-foreground">
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

function toEditForm(record: ReinsurerRecord): ReinsurerEditFormState {
  return {
    name: record.name,
    accountId: record.accountId,
    currentExposure: formatMoney(record.currentExposure),
    maxExposureLimit: formatMoney(record.maxExposureLimit),
    isApproved: record.isApproved,
    partyType: record.partyType,
    ratingAgency: record.ratingAgency,
    ratingExpiryDate: record.ratingExpiryDate,
    securityRating: record.securityRating,
    shariahApprovalRef: record.shariahApprovalRef,
    shariahCompliant: record.shariahCompliant,
    country: record.country,
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
