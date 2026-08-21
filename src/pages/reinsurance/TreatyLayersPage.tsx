import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Layers3, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'

interface TreatyLayerRecord {
  id: string
  name: string
  attachmentPoint: number | null
  layerCapacity: number
  layerLimit: number
  lineNumber: number
  linesCount: number
  treatyId: string
}

const treatyLayers: TreatyLayerRecord[] = [
  {
    id: 'treaty-layer-tl-001',
    name: 'TL-001',
    attachmentPoint: 5000000,
    layerCapacity: 25000000,
    layerLimit: 5000000,
    lineNumber: 1,
    linesCount: 5,
    treatyId: '---',
  },
  {
    id: 'treaty-layer-tl-002',
    name: 'TL-002',
    attachmentPoint: null,
    layerCapacity: 20000000,
    layerLimit: 20000000,
    lineNumber: 1,
    linesCount: 0,
    treatyId: '---',
  },
  {
    id: 'treaty-layer-tl-003',
    name: 'TL-003',
    attachmentPoint: 5000000,
    layerCapacity: 15000000,
    layerLimit: 15000000,
    lineNumber: 1,
    linesCount: 0,
    treatyId: '---',
  },
  {
    id: 'treaty-layer-tl-004',
    name: 'TL-004',
    attachmentPoint: 20000000,
    layerCapacity: 30000000,
    layerLimit: 30000000,
    lineNumber: 2,
    linesCount: 0,
    treatyId: '---',
  },
]

const tableColumns: Array<{
  key: keyof TreatyLayerRecord
  label: string
  render?: (record: TreatyLayerRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'attachmentPoint', label: 'Attachment Point', render: (record) => formatOptionalMoney(record.attachmentPoint) },
  { key: 'layerCapacity', label: 'Layer Capacity', render: (record) => formatMoney(record.layerCapacity) },
  { key: 'layerLimit', label: 'Layer Limit', render: (record) => formatMoney(record.layerLimit) },
  { key: 'lineNumber', label: 'Line Number', render: (record) => formatNumber(record.lineNumber) },
  { key: 'linesCount', label: 'Lines Count', render: (record) => formatNumber(record.linesCount) },
  { key: 'treatyId', label: 'Treaty Id' },
]

interface TreatyLayerCreateFormState {
  name: string
  attachmentPoint: string
  layerCapacity: string
  layerLimit: string
  lineNumber: string
  linesCount: string
  treatyId: string
}

const emptyTreatyLayerCreateForm: TreatyLayerCreateFormState = {
  name: '',
  attachmentPoint: '',
  layerCapacity: '',
  layerLimit: '',
  lineNumber: '',
  linesCount: '',
  treatyId: '',
}

export function TreatyLayersPage() {
  const [records, setRecords] = useState(treatyLayers)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <TreatyLayerDetail
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
        icon={Layers3}
        eyebrow="Reinsurance"
        title="Treaty Layers"
        description="Layer attachment points, capacities, limits, and treaty line counts."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Treaty Layer
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
        <CreateTreatyLayerModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={(form) => {
            const created: TreatyLayerRecord = {
              id: `treaty-layer-${Date.now()}`,
              name: form.name.trim() || 'Untitled Layer',
              attachmentPoint: form.attachmentPoint.trim() ? parseMoneyInput(form.attachmentPoint) : null,
              layerCapacity: parseMoneyInput(form.layerCapacity),
              layerLimit: parseMoneyInput(form.layerLimit),
              lineNumber: parseNumberInput(form.lineNumber),
              linesCount: parseNumberInput(form.linesCount),
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

function CreateTreatyLayerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (form: TreatyLayerCreateFormState) => void
}) {
  const [form, setForm] = useState<TreatyLayerCreateFormState>(emptyTreatyLayerCreateForm)

  const updateForm = <Key extends keyof TreatyLayerCreateFormState>(
    key: Key,
    value: TreatyLayerCreateFormState[Key],
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
            <h2 className="mt-1 text-xl font-bold">Create treaty layer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a treaty layer using the shared premium Reinsurance form pattern.
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
                placeholder="Enter layer name"
              />
            </ModalField>
            <ModalField label="Attachment Point">
              <Input
                value={form.attachmentPoint}
                onChange={(event) => updateForm('attachmentPoint', event.target.value)}
                placeholder="Enter attachment point"
              />
            </ModalField>
            <ModalField label="Layer Capacity">
              <Input
                value={form.layerCapacity}
                onChange={(event) => updateForm('layerCapacity', event.target.value)}
                placeholder="Enter layer capacity"
              />
            </ModalField>
            <ModalField label="Layer Limit">
              <Input
                value={form.layerLimit}
                onChange={(event) => updateForm('layerLimit', event.target.value)}
                placeholder="Enter layer limit"
              />
            </ModalField>
            <ModalField label="Line Number">
              <Input
                value={form.lineNumber}
                onChange={(event) => updateForm('lineNumber', event.target.value)}
                placeholder="Enter line number"
              />
            </ModalField>
            <ModalField label="Lines Count">
              <Input
                value={form.linesCount}
                onChange={(event) => updateForm('linesCount', event.target.value)}
                placeholder="Enter lines count"
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

function TreatyLayerDetail({
  record,
  onBack,
  onSave,
}: {
  record: TreatyLayerRecord
  onBack: () => void
  onSave: (record: TreatyLayerRecord) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<TreatyLayerCreateFormState>(() => toTreatyLayerForm(record))

  const updateForm = <Key extends keyof TreatyLayerCreateFormState>(key: Key, value: TreatyLayerCreateFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toTreatyLayerForm(record))
    setIsEditing(false)
  }

  const saveEdit = () => {
    onSave({
      ...record,
      name: form.name.trim() || record.name,
      attachmentPoint: form.attachmentPoint.trim() ? parseMoneyInput(form.attachmentPoint) : null,
      layerCapacity: parseMoneyInput(form.layerCapacity),
      layerLimit: parseMoneyInput(form.layerLimit),
      lineNumber: parseNumberInput(form.lineNumber),
      linesCount: parseNumberInput(form.linesCount),
      treatyId: form.treatyId.trim() || '---',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Treaty Layers
      </Button>

      <PageHeader
        icon={Layers3}
        eyebrow="Reinsurance"
        title={record.name}
        description="Treaty layer financial limits and line count details."
        actions={
          isEditing ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={saveEdit}>Save Treaty Layer</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Treaty Layer</Button>
          )
        }
      />

      <Card variant="premium" className="space-y-5">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Treaty Layer Form
          </p>
          <h2 className="mt-1 text-xl font-bold">{record.name}</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Attachment Point"><Input value={form.attachmentPoint} onChange={(event) => updateForm('attachmentPoint', event.target.value)} /></EditableField>
              <EditableField label="Layer Capacity"><Input value={form.layerCapacity} onChange={(event) => updateForm('layerCapacity', event.target.value)} /></EditableField>
              <EditableField label="Layer Limit"><Input value={form.layerLimit} onChange={(event) => updateForm('layerLimit', event.target.value)} /></EditableField>
              <EditableField label="Line Number"><Input value={form.lineNumber} onChange={(event) => updateForm('lineNumber', event.target.value)} /></EditableField>
              <EditableField label="Lines Count"><Input value={form.linesCount} onChange={(event) => updateForm('linesCount', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id"><Input value={form.treatyId} onChange={(event) => updateForm('treatyId', event.target.value)} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Attachment Point" value={formatOptionalMoney(record.attachmentPoint)} />
              <ReadOnlyField label="Layer Capacity" value={formatMoney(record.layerCapacity)} />
              <ReadOnlyField label="Layer Limit" value={formatMoney(record.layerLimit)} />
              <ReadOnlyField label="Line Number" value={formatNumber(record.lineNumber)} />
              <ReadOnlyField label="Lines Count" value={formatNumber(record.linesCount)} />
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

function toTreatyLayerForm(record: TreatyLayerRecord): TreatyLayerCreateFormState {
  return {
    name: record.name,
    attachmentPoint: formatOptionalMoney(record.attachmentPoint),
    layerCapacity: formatMoney(record.layerCapacity),
    layerLimit: formatMoney(record.layerLimit),
    lineNumber: String(record.lineNumber),
    linesCount: String(record.linesCount),
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

function parseNumberInput(value: string) {
  const normalized = Number.parseFloat(value.replace(/[,\s]/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
