import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Network, Plus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createTreatyParticipation,
  listReinsurerLookupOptions,
  listTreatyLayerLookupOptions,
  listTreatyLookupOptions,
  listTreatyParticipations,
  updateTreatyParticipation,
  type ReinsuranceLookupOption,
  type TreatyParticipationRecord,
  type TreatyParticipationSaveInput,
} from '../../services/reinsuranceService'

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
  reinsurerId: 'Select',
  sharePercentage: '',
  treatyId: 'Select',
  treatyLayerId: 'Select',
}

export function TreatyParticipationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, reinsurerOptions, treatyOptions, treatyLayerOptions] = await Promise.all([
      listTreatyParticipations(),
      listReinsurerLookupOptions(),
      listTreatyLookupOptions(),
      listTreatyLayerLookupOptions(),
    ])
    return { records, reinsurerOptions, treatyOptions, treatyLayerOptions }
  }, [refreshKey])
  const records = data?.records ?? []
  const reinsurerOptions = data?.reinsurerOptions ?? []
  const treatyOptions = data?.treatyOptions ?? []
  const treatyLayerOptions = data?.treatyLayerOptions ?? []
  const selected = useMemo(
    () => records.find((record) => record.id === selectedId),
    [records, selectedId],
  )

  if (selected) {
    return (
      <TreatyParticipationDetail
        record={selected}
        reinsurerOptions={reinsurerOptions}
        treatyOptions={treatyOptions}
        treatyLayerOptions={treatyLayerOptions}
        onBack={() => setSelectedId(null)}
        onSave={async (updatedRecord) => {
          await updateTreatyParticipation(updatedRecord.id, toTreatyParticipationSaveInput(updatedRecord))
          setRefreshKey((value) => value + 1)
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

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading treaty participations...</Card>
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
                    <p className="text-base font-semibold">No treaty participations found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The aur_treaty_participations datasource is connected, but there are no records for this view yet.
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
                      ) : column.key === 'isLeader' ? (
                        <Badge variant={record.isLeader === 'Yes' ? 'approved' : 'neutral'}>
                          {record.isLeader}
                        </Badge>
                      ) : column.key === 'reinsurerId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(reinsurerOptions, record.reinsurerLookupId, record.reinsurerId)}
                        </span>
                      ) : column.key === 'treatyId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)}
                        </span>
                      ) : column.key === 'treatyLayerId' ? (
                        <span className="font-semibold text-primary">
                          {getLookupDisplayValue(treatyLayerOptions, record.treatyLayerLookupId, record.treatyLayerId)}
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
        <CreateTreatyParticipationModal
          reinsurerOptions={reinsurerOptions}
          treatyOptions={treatyOptions}
          treatyLayerOptions={treatyLayerOptions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (form) => {
            await createTreatyParticipation({
              name: form.name.trim() || 'Untitled Participation',
              isLeader: resolveYesNo(form.isLeader, 'No'),
              reinsurerLookupId: resolveLookupValue(form.reinsurerId),
              sharePercentage: parseNumberInput(form.sharePercentage),
              treatyLookupId: resolveLookupValue(form.treatyId),
              treatyLayerLookupId: resolveLookupValue(form.treatyLayerId),
            })
            setRefreshKey((value) => value + 1)
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateTreatyParticipationModal({
  reinsurerOptions,
  treatyOptions,
  treatyLayerOptions,
  onClose,
  onCreate,
}: {
  reinsurerOptions: ReinsuranceLookupOption[]
  treatyOptions: ReinsuranceLookupOption[]
  treatyLayerOptions: ReinsuranceLookupOption[]
  onClose: () => void
  onCreate: (form: TreatyParticipationCreateFormState) => Promise<void>
}) {
  const [form, setForm] = useState<TreatyParticipationCreateFormState>(emptyTreatyParticipationCreateForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateForm = <Key extends keyof TreatyParticipationCreateFormState>(
    key: Key,
    value: TreatyParticipationCreateFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submitForm = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onCreate(form)
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Unable to create treaty participation.')
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
              <Select
                value={form.reinsurerId}
                onValueChange={(value) => updateForm('reinsurerId', value)}
                options={buildLookupOptions(reinsurerOptions, 'Look for Reinsurer Id')}
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
              <Select
                value={form.treatyId}
                onValueChange={(value) => updateForm('treatyId', value)}
                options={buildLookupOptions(treatyOptions, 'Look for Treaty Id')}
                placeholder="Look for Treaty Id"
              />
            </ModalField>
            <ModalField label="Treaty Layer Id">
              <Select
                value={form.treatyLayerId}
                onValueChange={(value) => updateForm('treatyLayerId', value)}
                options={buildLookupOptions(treatyLayerOptions, 'Look for Treaty Layer Id')}
                placeholder="Look for Treaty Layer Id"
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

function TreatyParticipationDetail({
  record,
  reinsurerOptions,
  treatyOptions,
  treatyLayerOptions,
  onBack,
  onSave,
}: {
  record: TreatyParticipationRecord
  reinsurerOptions: ReinsuranceLookupOption[]
  treatyOptions: ReinsuranceLookupOption[]
  treatyLayerOptions: ReinsuranceLookupOption[]
  onBack: () => void
  onSave: (record: TreatyParticipationRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<TreatyParticipationCreateFormState>(() => toTreatyParticipationForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const saveEdit = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({
        ...record,
        name: form.name.trim() || record.name,
        isLeader: resolveYesNo(form.isLeader, record.isLeader),
        reinsurerId: resolveLookupLabel(reinsurerOptions, form.reinsurerId, record.reinsurerId),
        reinsurerLookupId: resolveLookupValue(form.reinsurerId),
        sharePercentage: parseNumberInput(form.sharePercentage),
        treatyId: resolveLookupLabel(treatyOptions, form.treatyId, record.treatyId),
        treatyLookupId: resolveLookupValue(form.treatyId),
        treatyLayerId: resolveLookupLabel(treatyLayerOptions, form.treatyLayerId, record.treatyLayerId),
        treatyLayerLookupId: resolveLookupValue(form.treatyLayerId),
      })
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save treaty participation.')
    } finally {
      setSaving(false)
    }
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
              <Button disabled={saving} onClick={() => void saveEdit()}>
                {saving ? 'Saving...' : 'Save Participation'}
              </Button>
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
          {saveError ? (
            <div className="lg:col-span-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {saveError}
            </div>
          ) : null}
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Is Leader"><Select value={form.isLeader} onValueChange={(value) => updateForm('isLeader', value)} options={yesNoOptions} /></EditableField>
              <EditableField label="Reinsurer Id">
                <Select
                  value={form.reinsurerId}
                  onValueChange={(value) => updateForm('reinsurerId', value)}
                  options={buildLookupOptions(reinsurerOptions, 'Look for Reinsurer Id')}
                  placeholder="Look for Reinsurer Id"
                />
              </EditableField>
              <EditableField label="Share Percentage"><Input value={form.sharePercentage} onChange={(event) => updateForm('sharePercentage', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id">
                <Select
                  value={form.treatyId}
                  onValueChange={(value) => updateForm('treatyId', value)}
                  options={buildLookupOptions(treatyOptions, 'Look for Treaty Id')}
                  placeholder="Look for Treaty Id"
                />
              </EditableField>
              <EditableField label="Treaty Layer Id">
                <Select
                  value={form.treatyLayerId}
                  onValueChange={(value) => updateForm('treatyLayerId', value)}
                  options={buildLookupOptions(treatyLayerOptions, 'Look for Treaty Layer Id')}
                  placeholder="Look for Treaty Layer Id"
                />
              </EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Is Leader" value={record.isLeader} />
              <ReadOnlyField label="Reinsurer Id" value={getLookupDisplayValue(reinsurerOptions, record.reinsurerLookupId, record.reinsurerId)} />
              <ReadOnlyField label="Share Percentage" value={formatDecimal(record.sharePercentage)} />
              <ReadOnlyField label="Treaty Id" value={getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)} />
              <ReadOnlyField label="Treaty Layer Id" value={getLookupDisplayValue(treatyLayerOptions, record.treatyLayerLookupId, record.treatyLayerId)} />
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
    reinsurerId: record.reinsurerLookupId || 'Select',
    sharePercentage: formatDecimal(record.sharePercentage),
    treatyId: record.treatyLookupId || 'Select',
    treatyLayerId: record.treatyLayerLookupId || 'Select',
  }
}

function toTreatyParticipationSaveInput(record: TreatyParticipationRecord): TreatyParticipationSaveInput {
  return {
    name: record.name,
    isLeader: record.isLeader,
    reinsurerLookupId: record.reinsurerLookupId,
    sharePercentage: record.sharePercentage,
    treatyLookupId: record.treatyLookupId,
    treatyLayerLookupId: record.treatyLayerLookupId,
  }
}

function parseNumberInput(value: string) {
  const normalized = Number.parseFloat(value.replace(/[,\s]/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

function resolveYesNo(value: string, fallback: 'Yes' | 'No'): 'Yes' | 'No' {
  return value === 'Yes' || value === 'No' ? value : fallback
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
  if (!value || value === 'Select') return '---'
  return options.find((option) => option.value === value)?.label ?? fallback
}

function getLookupDisplayValue(options: ReinsuranceLookupOption[], lookupId: string, fallback: string) {
  if (!lookupId) return fallback
  return options.find((option) => option.value.toLowerCase() === lookupId.toLowerCase())?.label ?? fallback
}

function formatDecimal(value: number) {
  return value.toFixed(2)
}
