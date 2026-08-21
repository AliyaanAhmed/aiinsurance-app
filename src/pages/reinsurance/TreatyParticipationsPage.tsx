import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Network, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'

interface TreatyParticipationRecord {
  id: string
  name: string
  isLeader: 'Yes' | 'No'
  reinsurerId: string
  sharePercentage: number
  treatyId: string
  treatyLayerId: string
}

const treatyParticipations: TreatyParticipationRecord[] = [
  {
    id: 'treaty-participation-tp-001',
    name: 'TP-001',
    isLeader: 'No',
    reinsurerId: 'Arabian Shield Re',
    sharePercentage: 0.25,
    treatyId: 'Fire Surplus 2026',
    treatyLayerId: 'TL-001',
  },
  {
    id: 'treaty-participation-tp-002',
    name: 'TP-002',
    isLeader: 'Yes',
    reinsurerId: 'Delta Reinsurance',
    sharePercentage: 0.6,
    treatyId: 'Fire Surplus 2026',
    treatyLayerId: 'TL-001',
  },
  {
    id: 'treaty-participation-tp-003',
    name: 'TP-003',
    isLeader: 'No',
    reinsurerId: 'Emirates Retakaful',
    sharePercentage: 0.35,
    treatyId: 'Fire Surplus 2026',
    treatyLayerId: 'TL-001',
  },
  {
    id: 'treaty-participation-tp-004',
    name: 'TP-004',
    isLeader: 'No',
    reinsurerId: 'Emirates Retakaful',
    sharePercentage: 0.5,
    treatyId: 'Fire XoL 2026',
    treatyLayerId: 'TL-004',
  },
  {
    id: 'treaty-participation-tp-005',
    name: 'TP-005',
    isLeader: 'Yes',
    reinsurerId: 'Gulf Re',
    sharePercentage: 0.4,
    treatyId: 'Fire XoL 2026',
    treatyLayerId: 'TL-003',
  },
  {
    id: 'treaty-participation-tp-006',
    name: 'TP-006',
    isLeader: 'Yes',
    reinsurerId: 'Gulf Re',
    sharePercentage: 0.5,
    treatyId: 'Motor QS 2026',
    treatyLayerId: 'TL-003',
  },
  {
    id: 'treaty-participation-tp-007',
    name: 'TP-007',
    isLeader: 'No',
    reinsurerId: 'Gulf Re',
    sharePercentage: 0.4,
    treatyId: 'Motor QS 2026',
    treatyLayerId: 'TL-003',
  },
]

const tableColumns: Array<{
  key: keyof TreatyParticipationRecord
  label: string
  render?: (record: TreatyParticipationRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'isLeader', label: 'Is Leader' },
  { key: 'reinsurerId', label: 'Reinsurer Id' },
  { key: 'sharePercentage', label: 'Share Percentage', render: (record) => formatDecimal(record.sharePercentage) },
  { key: 'treatyId', label: 'Treaty Id' },
  { key: 'treatyLayerId', label: 'Treaty Layer Id' },
]

const yesNoOptions = [
  { value: 'Select', label: 'Select option' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

interface TreatyParticipationCreateFormState {
  name: string
  isLeader: string
  reinsurerId: string
  sharePercentage: string
  treatyId: string
  treatyLayerId: string
}

const emptyTreatyParticipationCreateForm: TreatyParticipationCreateFormState = {
  name: '',
  isLeader: 'Select',
  reinsurerId: '',
  sharePercentage: '',
  treatyId: '',
  treatyLayerId: '',
}

export function TreatyParticipationsPage() {
  const [records, setRecords] = useState(treatyParticipations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <TreatyParticipationDetail
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
        icon={Network}
        eyebrow="Reinsurance"
        title="Treaty Participations"
        description="Participant reinsurers, leader status, share percentage, treaty, and layer links."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Participation
          </Button>
        }
      />

      <Card padding="none" variant="premium" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full table-fixed border-collapse">
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
                      ) : column.key === 'isLeader' ? (
                        <Badge variant={record.isLeader === 'Yes' ? 'approved' : 'neutral'}>
                          {record.isLeader}
                        </Badge>
                      ) : column.key === 'reinsurerId' || column.key === 'treatyId' || column.key === 'treatyLayerId' ? (
                        <span className="font-semibold text-primary">
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
        <CreateTreatyParticipationModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={(form) => {
            const created: TreatyParticipationRecord = {
              id: `treaty-participation-${Date.now()}`,
              name: form.name.trim() || 'Untitled Participation',
              isLeader: resolveYesNo(form.isLeader, 'No'),
              reinsurerId: form.reinsurerId.trim() || '---',
              sharePercentage: parseNumberInput(form.sharePercentage),
              treatyId: form.treatyId.trim() || '---',
              treatyLayerId: form.treatyLayerId.trim() || '---',
            }
            setRecords((current) => [created, ...current])
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateTreatyParticipationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: TreatyParticipationCreateFormState) => void
}) {
  const [form, setForm] = useState<TreatyParticipationCreateFormState>(emptyTreatyParticipationCreateForm)

  const updateForm = <Key extends keyof TreatyParticipationCreateFormState>(
    key: Key,
    value: TreatyParticipationCreateFormState[Key],
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
            <h2 className="mt-1 text-xl font-bold">Create treaty participation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a treaty participation using the shared premium Reinsurance form pattern.
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
                placeholder="Enter participation name"
              />
            </ModalField>
            <ModalField label="Is Leader">
              <Select
                value={form.isLeader}
                onValueChange={(value) => updateForm('isLeader', value)}
                options={yesNoOptions}
                placeholder="Select"
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
            <ModalField label="Treaty Layer Id">
              <Input
                value={form.treatyLayerId}
                onChange={(event) => updateForm('treatyLayerId', event.target.value)}
                placeholder="Look for Treaty Layer Id"
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

function TreatyParticipationDetail({
  record,
  onBack,
  onSave,
}: {
  record: TreatyParticipationRecord
  onBack: () => void
  onSave: (record: TreatyParticipationRecord) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<TreatyParticipationCreateFormState>(() => toTreatyParticipationForm(record))

  const updateForm = <Key extends keyof TreatyParticipationCreateFormState>(
    key: Key,
    value: TreatyParticipationCreateFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toTreatyParticipationForm(record))
    setIsEditing(false)
  }

  const saveEdit = () => {
    onSave({
      ...record,
      name: form.name.trim() || record.name,
      isLeader: resolveYesNo(form.isLeader, record.isLeader),
      reinsurerId: form.reinsurerId.trim() || '---',
      sharePercentage: parseNumberInput(form.sharePercentage),
      treatyId: form.treatyId.trim() || '---',
      treatyLayerId: form.treatyLayerId.trim() || '---',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Treaty Participations
      </Button>

      <PageHeader
        icon={Network}
        eyebrow="Reinsurance"
        title={record.name}
        description="Treaty participation leader status, reinsurer, share, treaty, and layer details."
        actions={
          isEditing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={saveEdit}>Save Participation</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Participation</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Treaty Participation Form
            </p>
            <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
          </div>
          <Badge variant={record.isLeader === 'Yes' ? 'approved' : 'neutral'}>
            Leader: {record.isLeader}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Is Leader"><Select value={form.isLeader} onValueChange={(value) => updateForm('isLeader', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Reinsurer Id"><Input value={form.reinsurerId} onChange={(event) => updateForm('reinsurerId', event.target.value)} /></EditableField>
              <EditableField label="Share Percentage"><Input value={form.sharePercentage} onChange={(event) => updateForm('sharePercentage', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id"><Input value={form.treatyId} onChange={(event) => updateForm('treatyId', event.target.value)} /></EditableField>
              <EditableField label="Treaty Layer Id"><Input value={form.treatyLayerId} onChange={(event) => updateForm('treatyLayerId', event.target.value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Is Leader" value={record.isLeader} />
              <ReadOnlyField label="Reinsurer Id" value={record.reinsurerId} />
              <ReadOnlyField label="Share Percentage" value={formatDecimal(record.sharePercentage)} />
              <ReadOnlyField label="Treaty Id" value={record.treatyId} />
              <ReadOnlyField label="Treaty Layer Id" value={record.treatyLayerId} />
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

function toTreatyParticipationForm(record: TreatyParticipationRecord): TreatyParticipationCreateFormState {
  return {
    name: record.name,
    isLeader: record.isLeader,
    reinsurerId: record.reinsurerId,
    sharePercentage: formatDecimal(record.sharePercentage),
    treatyId: record.treatyId,
    treatyLayerId: record.treatyLayerId,
  }
}

function parseNumberInput(value: string) {
  const normalized = Number.parseFloat(value.replace(/[,\s]/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function resolveYesNo(value: string, fallback: 'Yes' | 'No'): 'Yes' | 'No' {
  return value === 'Yes' || value === 'No' ? value : fallback
}

function formatDecimal(value: number) {
  return value.toFixed(2)
}
