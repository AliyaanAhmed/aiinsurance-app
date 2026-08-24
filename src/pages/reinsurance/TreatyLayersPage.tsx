import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Layers3, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createTreatyLayer,
  listTreatyLayers,
  listTreatyLayerLookupOptions,
  updateTreatyLayer,
  type ReinsuranceLookupOption,
  type TreatyLayerRecord,
  type TreatyLayerSaveInput,
} from '../../services/reinsuranceService'

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
  treatyId: 'Select',
}

export function TreatyLayersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, treatyOptions] = await Promise.all([
      listTreatyLayers(),
      listTreatyLayerLookupOptions(),
    ])
    return { records, treatyOptions }
  }, [refreshKey])
  const records = data?.records ?? []
  const treatyOptions = data?.treatyOptions ?? []
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <TreatyLayerDetail
        record={selected}
        treatyOptions={treatyOptions}
        onBack={() => setSelectedId(null)}
        onSave={async (input) => {
          await updateTreatyLayer(selected.id, input)
          setRefreshKey((value) => value + 1)
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

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading treaty layers...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
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
                {records.length === 0 ? (
                  <tr className="bg-surface">
                    <td colSpan={tableColumns.length} className="px-6 py-12 text-center">
                      <p className="text-base font-semibold">No treaty layers found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The aur_treaty_layers datasource is connected, but there are no records for this view yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
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
                      ) : column.key === 'treatyId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)}
                        </span>
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

      {isCreateOpen ? (
        <CreateTreatyLayerModal
          treatyOptions={treatyOptions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (form) => {
            await createTreatyLayer({
              name: form.name.trim() || 'Untitled Layer',
              attachmentPoint: form.attachmentPoint.trim() ? parseMoneyInput(form.attachmentPoint) : null,
              layerCapacity: parseMoneyInput(form.layerCapacity),
              layerLimit: parseMoneyInput(form.layerLimit),
              lineNumber: parseNumberInput(form.lineNumber),
              linesCount: parseNumberInput(form.linesCount),
              treatyLookupId: resolveLookupValue(form.treatyId),
            })
            setRefreshKey((value) => value + 1)
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateTreatyLayerModal({
  treatyOptions,
  onClose,
  onCreate,
}: {
  treatyOptions: ReinsuranceLookupOption[]
  onClose: () => void
  onCreate: (form: TreatyLayerCreateFormState) => Promise<void>
}) {
  const [form, setForm] = useState<TreatyLayerCreateFormState>(emptyTreatyLayerCreateForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateForm = <Key extends keyof TreatyLayerCreateFormState>(
    key: Key,
    value: TreatyLayerCreateFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submitForm = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onCreate(form)
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Unable to create treaty layer.')
    } finally {
      setSubmitting(false)
    }
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
              <Select
                value={form.treatyId}
                onValueChange={(value) => updateForm('treatyId', value)}
                options={buildLookupOptions(treatyOptions, 'Look for Treaty Id')}
                placeholder="Look for Treaty Id"
              />
            </ModalField>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-soft bg-surface px-5 py-4">
          {submitError ? <p className="text-sm text-danger">{submitError}</p> : <span />}
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitForm()}>
              {submitting ? 'Creating...' : 'Create Record'}
            </Button>
          </div>
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
  treatyOptions,
  onBack,
  onSave,
}: {
  record: TreatyLayerRecord
  treatyOptions: ReinsuranceLookupOption[]
  onBack: () => void
  onSave: (input: TreatyLayerSaveInput) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<TreatyLayerCreateFormState>(() => toTreatyLayerForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateForm = <Key extends keyof TreatyLayerCreateFormState>(key: Key, value: TreatyLayerCreateFormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const cancelEdit = () => {
    setForm(toTreatyLayerForm(record))
    setIsEditing(false)
  }

  const saveEdit = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({
        name: form.name.trim() || record.name,
        attachmentPoint: form.attachmentPoint.trim() ? parseMoneyInput(form.attachmentPoint) : null,
        layerCapacity: parseMoneyInput(form.layerCapacity),
        layerLimit: parseMoneyInput(form.layerLimit),
        lineNumber: parseNumberInput(form.lineNumber),
        linesCount: parseNumberInput(form.linesCount),
        treatyLookupId: resolveLookupValue(form.treatyId) || record.treatyLookupId,
      })
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save treaty layer.')
    } finally {
      setSaving(false)
    }
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
              <Button disabled={saving} onClick={() => void saveEdit()}>
                {saving ? 'Saving...' : 'Save Treaty Layer'}
              </Button>
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
          {saveError ? (
            <div className="lg:col-span-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {saveError}
            </div>
          ) : null}
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Attachment Point"><Input value={form.attachmentPoint} onChange={(event) => updateForm('attachmentPoint', event.target.value)} /></EditableField>
              <EditableField label="Layer Capacity"><Input value={form.layerCapacity} onChange={(event) => updateForm('layerCapacity', event.target.value)} /></EditableField>
              <EditableField label="Layer Limit"><Input value={form.layerLimit} onChange={(event) => updateForm('layerLimit', event.target.value)} /></EditableField>
              <EditableField label="Line Number"><Input value={form.lineNumber} onChange={(event) => updateForm('lineNumber', event.target.value)} /></EditableField>
              <EditableField label="Lines Count"><Input value={form.linesCount} onChange={(event) => updateForm('linesCount', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id">
                <Select
                  value={form.treatyId}
                  onValueChange={(value) => updateForm('treatyId', value)}
                  options={buildLookupOptions(treatyOptions, 'Look for Treaty Id')}
                  placeholder="Look for Treaty Id"
                />
              </EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Attachment Point" value={formatOptionalMoney(record.attachmentPoint)} />
              <ReadOnlyField label="Layer Capacity" value={formatMoney(record.layerCapacity)} />
              <ReadOnlyField label="Layer Limit" value={formatMoney(record.layerLimit)} />
              <ReadOnlyField label="Line Number" value={formatNumber(record.lineNumber)} />
              <ReadOnlyField label="Lines Count" value={formatNumber(record.linesCount)} />
              <ReadOnlyField label="Treaty Id" value={getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)} />
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
    treatyId: record.treatyLookupId || 'Select',
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

function buildLookupOptions(options: ReinsuranceLookupOption[], placeholder: string) {
  return [
    { value: 'Select', label: placeholder },
    ...options.map((option) => ({ value: option.value, label: option.label })),
  ]
}

function resolveLookupValue(value: string) {
  return value && value !== 'Select' ? value : ''
}

function getLookupDisplayValue(options: ReinsuranceLookupOption[], lookupId: string, fallback: string) {
  if (!lookupId) return fallback
  return options.find((option) => option.value.toLowerCase() === lookupId.toLowerCase())?.label ?? fallback
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
