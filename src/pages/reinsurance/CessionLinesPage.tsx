import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Plus, Rows3 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'

interface CessionLineRecord {
  id: string
  name: string
  cededPremium: number
  cededSumInsured: number
  cessionBasis: string
  cessionId: string
  commissionPercentage: number
  facOfferId: string
  netDue: number
  reinsurerId: string
  sharePercentage: number
  treatyId: string
}

interface CessionLineCreateFormState {
  name: string
  cededPremium: string
  cededSumInsured: string
  cessionBasis: string
  cessionId: string
  commissionPercentage: string
  facOfferId: string
  netDue: string
  reinsurerId: string
  sharePercentage: string
  treatyId: string
}

const emptyCessionLineCreateForm: CessionLineCreateFormState = {
  name: '',
  cededPremium: '',
  cededSumInsured: '',
  cessionBasis: '',
  cessionId: '',
  commissionPercentage: '',
  facOfferId: '',
  netDue: '',
  reinsurerId: '',
  sharePercentage: '',
  treatyId: '',
}

const cessionBasisOptions = [
  { value: 'Select', label: 'Select cession basis' },
  { value: 'Treaty Only', label: 'Treaty Only' },
  { value: 'Facultative Only', label: 'Facultative Only' },
  { value: 'Treaty', label: 'Treaty' },
  { value: 'Facultative', label: 'Facultative' },
]

const cessionLines: CessionLineRecord[] = [
  {
    id: 'cession-line-cl-001',
    name: 'CL-001',
    cededPremium: 85000,
    cededSumInsured: 10000000,
    cessionBasis: 'Treaty',
    cessionId: 'CE-001',
    commissionPercentage: 0.28,
    facOfferId: 'FO-002',
    netDue: 61625,
    reinsurerId: 'Gulf Re',
    sharePercentage: 0.4,
    treatyId: 'Fire XoL 2026',
  },
  {
    id: 'cession-line-cl-002',
    name: 'CL-002',
    cededPremium: 74375,
    cededSumInsured: 8750000,
    cessionBasis: 'Treaty',
    cessionId: 'CE-001',
    commissionPercentage: 0.28,
    facOfferId: 'FO-002',
    netDue: 53921.88,
    reinsurerId: 'Emirates Retakaful',
    sharePercentage: 0.35,
    treatyId: 'Fire XoL 2026',
  },
  {
    id: 'cession-line-cl-003',
    name: 'CL-003',
    cededPremium: 53125,
    cededSumInsured: 6250000,
    cessionBasis: 'Treaty',
    cessionId: 'CE-001',
    commissionPercentage: 0.28,
    facOfferId: 'FO-002',
    netDue: 38515.63,
    reinsurerId: 'Arabian Shield Re',
    sharePercentage: 0.25,
    treatyId: 'Fire XoL 2026',
  },
  {
    id: 'cession-line-cl-004',
    name: 'CL-004',
    cededPremium: 29565.22,
    cededSumInsured: 3478260.87,
    cessionBasis: 'Facultative',
    cessionId: 'CE-001',
    commissionPercentage: 0.25,
    facOfferId: 'FO-002',
    netDue: 22173.91,
    reinsurerId: 'Gulf Re',
    sharePercentage: 0.35,
    treatyId: 'Fire XoL 2026',
  },
  {
    id: 'cession-line-cl-005',
    name: 'CL-005',
    cededPremium: 22173.91,
    cededSumInsured: 2608695.65,
    cessionBasis: 'Facultative',
    cessionId: 'CE-002',
    commissionPercentage: 0.25,
    facOfferId: 'FO-005',
    netDue: 16630.43,
    reinsurerId: 'Emirates Retakaful',
    sharePercentage: 0.26,
    treatyId: 'Motor QS 2026',
  },
  {
    id: 'cession-line-cl-006',
    name: 'CL-006',
    cededPremium: 14782.61,
    cededSumInsured: 1739130.43,
    cessionBasis: 'Facultative',
    cessionId: 'CE-002',
    commissionPercentage: 0.23,
    facOfferId: 'FO-005',
    netDue: 11456.52,
    reinsurerId: 'Arabian Shield Re',
    sharePercentage: 0.17,
    treatyId: 'Motor QS 2026',
  },
  {
    id: 'cession-line-cl-007',
    name: 'CL-007',
    cededPremium: 18478.26,
    cededSumInsured: 2173913.04,
    cessionBasis: 'Facultative',
    cessionId: 'CE-002',
    commissionPercentage: 0.25,
    facOfferId: 'FO-005',
    netDue: 13858.7,
    reinsurerId: 'Sahara Retakaful',
    sharePercentage: 0.22,
    treatyId: 'Motor QS 2026',
  },
  {
    id: 'cession-line-cl-008',
    name: 'CL-008',
    cededPremium: 4250,
    cededSumInsured: 500000,
    cessionBasis: 'Treaty',
    cessionId: 'CE-003',
    commissionPercentage: 0.28,
    facOfferId: 'FO-003',
    netDue: 3081.25,
    reinsurerId: 'Gulf Re',
    sharePercentage: 0.4,
    treatyId: 'Fire Surplus 2026',
  },
  {
    id: 'cession-line-cl-009',
    name: 'CL-009',
    cededPremium: 3718.75,
    cededSumInsured: 437500,
    cessionBasis: 'Treaty',
    cessionId: 'CE-003',
    commissionPercentage: 0.28,
    facOfferId: 'FO-003',
    netDue: 2696.09,
    reinsurerId: 'Emirates Retakaful',
    sharePercentage: 0.35,
    treatyId: 'Fire Surplus 2026',
  },
  {
    id: 'cession-line-cl-010',
    name: 'CL-010',
    cededPremium: 2656.25,
    cededSumInsured: 312500,
    cessionBasis: 'Treaty',
    cessionId: 'CE-003',
    commissionPercentage: 0.28,
    facOfferId: 'FO-003',
    netDue: 1925.78,
    reinsurerId: 'Arabian Shield Re',
    sharePercentage: 0.25,
    treatyId: 'Fire Surplus 2026',
  },
]

const tableColumns: Array<{
  key: keyof CessionLineRecord
  label: string
  render?: (record: CessionLineRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'cededPremium', label: 'Ceded Premi...', render: (record) => formatMoney(record.cededPremium) },
  { key: 'cededSumInsured', label: 'Ceded Sum Insu...', render: (record) => formatMoney(record.cededSumInsured) },
  { key: 'cessionBasis', label: 'Cession Ba...' },
  { key: 'cessionId', label: 'Cession ...' },
  { key: 'commissionPercentage', label: 'Commission Percen...', render: (record) => formatMoneyLikeDecimal(record.commissionPercentage) },
  { key: 'facOfferId', label: 'Fac Offer ...' },
  { key: 'netDue', label: 'Net Due', render: (record) => formatMoney(record.netDue) },
  { key: 'reinsurerId', label: 'Reinsurer...' },
  { key: 'sharePercentage', label: 'Share Percent...', render: (record) => formatDecimal(record.sharePercentage) },
  { key: 'treatyId', label: 'Treaty Id' },
]

export function CessionLinesPage() {
  const [records, setRecords] = useState(cessionLines)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <CessionLineDetail
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
        icon={Rows3}
        eyebrow="Reinsurance"
        title="Cession Lines"
        description="Ceded premiums, ceded sums insured, commission, net due, reinsurer share, and treaty links."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Cession Line
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
                      ) : column.key === 'cessionId' || column.key === 'facOfferId' || column.key === 'reinsurerId' || column.key === 'treatyId' ? (
                        <span className="block max-w-[170px] truncate font-semibold text-primary">
                          {column.render ? column.render(record) : String(record[column.key])}
                        </span>
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
        <CreateCessionLineModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={(form) => {
            const created: CessionLineRecord = {
              id: `cession-line-${Date.now()}`,
              name: form.name.trim() || 'Untitled Cession Line',
              cededPremium: parseMoneyInput(form.cededPremium),
              cededSumInsured: parseMoneyInput(form.cededSumInsured),
              cessionBasis: resolveSelectValue(form.cessionBasis, 'Treaty'),
              cessionId: form.cessionId.trim() || '---',
              commissionPercentage: parseNumberInput(form.commissionPercentage),
              facOfferId: form.facOfferId.trim() || '---',
              netDue: parseMoneyInput(form.netDue),
              reinsurerId: form.reinsurerId.trim() || '---',
              sharePercentage: parseNumberInput(form.sharePercentage),
              treatyId: form.treatyId.trim() || '---',
            }
            setRecords((current) => [created, ...current])
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateCessionLineModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: CessionLineCreateFormState) => void
}) {
  const [form, setForm] = useState<CessionLineCreateFormState>(emptyCessionLineCreateForm)

  const updateForm = <Key extends keyof CessionLineCreateFormState>(
    key: Key,
    value: CessionLineCreateFormState[Key],
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
            <h2 className="mt-1 text-xl font-bold">Create cession line</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add ceded premium, cession basis, net due, reinsurer share, and treaty links.
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
                placeholder="Enter cession line name"
              />
            </ModalField>
            <ModalField label="Ceded Premium">
              <Input
                value={form.cededPremium}
                onChange={(event) => updateForm('cededPremium', event.target.value)}
                placeholder="Enter ceded premium"
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
            <ModalField label="Cession Id">
              <Input
                value={form.cessionId}
                onChange={(event) => updateForm('cessionId', event.target.value)}
                placeholder="Look for Cession Id"
              />
            </ModalField>
            <ModalField label="Commission Percentage">
              <Input
                value={form.commissionPercentage}
                onChange={(event) => updateForm('commissionPercentage', event.target.value)}
                placeholder="Enter commission percentage"
              />
            </ModalField>
            <ModalField label="Fac Offer Id">
              <Input
                value={form.facOfferId}
                onChange={(event) => updateForm('facOfferId', event.target.value)}
                placeholder="Look for Fac Offer Id"
              />
            </ModalField>
            <ModalField label="Net Due">
              <Input
                value={form.netDue}
                onChange={(event) => updateForm('netDue', event.target.value)}
                placeholder="Enter net due"
              />
            </ModalField>
            <ModalField label="Reinsurer Id">
              <Input
                value={form.reinsurerId}
                onChange={(event) => updateForm('reinsurerId', event.target.value)}
                placeholder="Look for Reinsurer Id"
              />
            </ModalField>
            <ModalField label="Share Percentage">
              <Input
                value={form.sharePercentage}
                onChange={(event) => updateForm('sharePercentage', event.target.value)}
                placeholder="Enter share percentage"
              />
            </ModalField>
            <ModalField label="Treaty Id">
              <Input
                value={form.treatyId}
                onChange={(event) => updateForm('treatyId', event.target.value)}
                placeholder="Look for Treaty Id"
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

function CessionLineDetail({
  record,
  onBack,
  onSave,
}: {
  record: CessionLineRecord
  onBack: () => void
  onSave: (record: CessionLineRecord) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<CessionLineCreateFormState>(() => toCessionLineForm(record))

  const updateForm = <Key extends keyof CessionLineCreateFormState>(key: Key, value: CessionLineCreateFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toCessionLineForm(record))
    setIsEditing(false)
  }

  const saveEdit = () => {
    onSave({
      ...record,
      name: form.name.trim() || record.name,
      cededPremium: parseMoneyInput(form.cededPremium),
      cededSumInsured: parseMoneyInput(form.cededSumInsured),
      cessionBasis: resolveSelectValue(form.cessionBasis, record.cessionBasis),
      cessionId: form.cessionId.trim() || '---',
      commissionPercentage: parseNumberInput(form.commissionPercentage),
      facOfferId: form.facOfferId.trim() || '---',
      netDue: parseMoneyInput(form.netDue),
      reinsurerId: form.reinsurerId.trim() || '---',
      sharePercentage: parseNumberInput(form.sharePercentage),
      treatyId: form.treatyId.trim() || '---',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Cession Lines
      </Button>

      <PageHeader
        icon={Rows3}
        eyebrow="Reinsurance"
        title={record.name}
        description="Cession line ceded premium, reinsurer share, net due, treaty, and facultative offer details."
        actions={
          isEditing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={saveEdit}>Save Cession Line</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Cession Line</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Cession Line Form
          </p>
          <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Ceded Premium"><Input value={form.cededPremium} onChange={(event) => updateForm('cededPremium', event.target.value)} /></EditableField>
              <EditableField label="Ceded Sum Insured"><Input value={form.cededSumInsured} onChange={(event) => updateForm('cededSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Cession Basis"><Select value={form.cessionBasis} onValueChange={(value) => updateForm('cessionBasis', value)} options={cessionBasisOptions} /></EditableField>
              <EditableField label="Cession Id"><Input value={form.cessionId} onChange={(event) => updateForm('cessionId', event.target.value)} /></EditableField>
              <EditableField label="Commission Percentage"><Input value={form.commissionPercentage} onChange={(event) => updateForm('commissionPercentage', event.target.value)} /></EditableField>
              <EditableField label="Fac Offer Id"><Input value={form.facOfferId} onChange={(event) => updateForm('facOfferId', event.target.value)} /></EditableField>
              <EditableField label="Net Due"><Input value={form.netDue} onChange={(event) => updateForm('netDue', event.target.value)} /></EditableField>
              <EditableField label="Reinsurer Id"><Input value={form.reinsurerId} onChange={(event) => updateForm('reinsurerId', event.target.value)} /></EditableField>
              <EditableField label="Share Percentage"><Input value={form.sharePercentage} onChange={(event) => updateForm('sharePercentage', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id"><Input value={form.treatyId} onChange={(event) => updateForm('treatyId', event.target.value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Ceded Premium" value={formatMoney(record.cededPremium)} />
              <ReadOnlyField label="Ceded Sum Insured" value={formatMoney(record.cededSumInsured)} />
              <ReadOnlyField label="Cession Basis" value={record.cessionBasis} />
              <ReadOnlyField label="Cession Id" value={record.cessionId} />
              <ReadOnlyField label="Commission Percentage" value={formatMoneyLikeDecimal(record.commissionPercentage)} />
              <ReadOnlyField label="Fac Offer Id" value={record.facOfferId} />
              <ReadOnlyField label="Net Due" value={formatMoney(record.netDue)} />
              <ReadOnlyField label="Reinsurer Id" value={record.reinsurerId} />
              <ReadOnlyField label="Share Percentage" value={formatDecimal(record.sharePercentage)} />
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

function toCessionLineForm(record: CessionLineRecord): CessionLineCreateFormState {
  return {
    name: record.name,
    cededPremium: formatMoney(record.cededPremium),
    cededSumInsured: formatMoney(record.cededSumInsured),
    cessionBasis: record.cessionBasis,
    cessionId: record.cessionId,
    commissionPercentage: formatMoneyLikeDecimal(record.commissionPercentage),
    facOfferId: record.facOfferId,
    netDue: formatMoney(record.netDue),
    reinsurerId: record.reinsurerId,
    sharePercentage: formatDecimal(record.sharePercentage),
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

function formatMoneyLikeDecimal(value: number) {
  return `$${value.toFixed(2)}`
}

function formatDecimal(value: number) {
  return value.toFixed(2)
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
