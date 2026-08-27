import { useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Layers3, Network, Plus, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createTreatyParticipation,
  listReinsurers,
  listReinsurerLookupOptions,
  listTreaties,
  listTreatyLayers,
  listTreatyLayerLookupOptions,
  listTreatyLookupOptions,
  listTreatyParticipations,
  updateTreatyParticipation,
  type ReinsurerRecord,
  type ReinsuranceLookupOption,
  type TreatyLayerRecord,
  type TreatyParticipationRecord,
  type TreatyParticipationSaveInput,
  type TreatyRecord,
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

type TreatyParticipationDetailTab = 'details' | 'reinsurer' | 'treaty' | 'treatyLayer'

export function TreatyParticipationsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as { selectedId?: string } | null
  const [selectedId, setSelectedId] = useState<string | null>(routeState?.selectedId ?? null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, reinsurerOptions, treatyOptions, treatyLayerOptions, reinsurers, treaties, treatyLayers] = await Promise.all([
      listTreatyParticipations(),
      listReinsurerLookupOptions(),
      listTreatyLookupOptions(),
      listTreatyLayerLookupOptions(),
      listReinsurers(),
      listTreaties(),
      listTreatyLayers(),
    ])
    return { records, reinsurerOptions, treatyOptions, treatyLayerOptions, reinsurers, treaties, treatyLayers }
  }, [refreshKey])
  const records = data?.records ?? []
  const reinsurerOptions = data?.reinsurerOptions ?? []
  const treatyOptions = data?.treatyOptions ?? []
  const treatyLayerOptions = data?.treatyLayerOptions ?? []
  const reinsurers = data?.reinsurers ?? []
  const treaties = data?.treaties ?? []
  const treatyLayers = data?.treatyLayers ?? []
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
        reinsurers={reinsurers}
        treaties={treaties}
        treatyLayers={treatyLayers}
        onBack={() => setSelectedId(null)}
        onOpenRelatedRecord={(path, relatedId) => navigate(path, { state: { selectedId: relatedId } })}
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
        <div className="scrollbar-sleek overflow-x-auto">
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
  reinsurers,
  treaties,
  treatyLayers,
  onBack,
  onOpenRelatedRecord,
  onSave,
}: {
  record: TreatyParticipationRecord
  reinsurerOptions: ReinsuranceLookupOption[]
  treatyOptions: ReinsuranceLookupOption[]
  treatyLayerOptions: ReinsuranceLookupOption[]
  reinsurers: ReinsurerRecord[]
  treaties: TreatyRecord[]
  treatyLayers: TreatyLayerRecord[]
  onBack: () => void
  onOpenRelatedRecord: (path: string, recordId: string) => void
  onSave: (record: TreatyParticipationRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<TreatyParticipationDetailTab>('details')
  const [form, setForm] = useState<TreatyParticipationCreateFormState>(() => toTreatyParticipationForm(record))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const relatedReinsurer = useMemo(
    () => reinsurers.find((item) => isSameLookupId(item.id, record.reinsurerLookupId)),
    [record.reinsurerLookupId, reinsurers],
  )
  const relatedTreaty = useMemo(
    () => treaties.find((item) => isSameLookupId(item.id, record.treatyLookupId)),
    [record.treatyLookupId, treaties],
  )
  const relatedTreatyLayer = useMemo(
    () => treatyLayers.find((item) => isSameLookupId(item.id, record.treatyLayerLookupId)),
    [record.treatyLayerLookupId, treatyLayers],
  )
  const tabs: Array<{
    id: TreatyParticipationDetailTab
    label: string
    count?: number
    icon: LucideIcon
  }> = [
    { id: 'details', label: 'Treaty Participation Details', icon: Network },
    { id: 'reinsurer', label: 'Reinsurer', count: relatedReinsurer ? 1 : 0, icon: ShieldCheck },
    { id: 'treaty', label: 'Treaty', count: relatedTreaty ? 1 : 0, icon: FileText },
    { id: 'treatyLayer', label: 'Treaty Layer', count: relatedTreatyLayer ? 1 : 0, icon: Layers3 },
  ]

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

      <div className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-2 shadow-sm lg:grid-cols-4">
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
      ) : activeTab === 'reinsurer' ? (
        <RelatedParentGrid
          title="Reinsurer"
          emptyMessage="No reinsurer is linked to this treaty participation."
          columns={['Name', 'Approved', 'Current Exposure', 'Max Exposure Limit', 'Rating Agency']}
          row={relatedReinsurer ? {
            id: relatedReinsurer.id,
            cells: [
              <span className="font-semibold text-primary">{relatedReinsurer.name}</span>,
              <Badge variant={relatedReinsurer.isApproved === 'Yes' ? 'approved' : 'neutral'}>{relatedReinsurer.isApproved}</Badge>,
              formatMoney(relatedReinsurer.currentExposure),
              formatMoney(relatedReinsurer.maxExposureLimit),
              relatedReinsurer.ratingAgency,
            ],
          } : null}
          onOpen={(recordId) => onOpenRelatedRecord('/reinsurance/reinsurers', recordId)}
        />
      ) : activeTab === 'treaty' ? (
        <RelatedParentGrid
          title="Treaty"
          emptyMessage="No treaty is linked to this treaty participation."
          columns={['Treaty Name', 'Inception Date', 'Treaty Capacity', 'Treaty Type', 'Shariah Basis']}
          row={relatedTreaty ? {
            id: relatedTreaty.id,
            cells: [
              <span className="font-semibold text-primary">{relatedTreaty.treatyName}</span>,
              formatDate(relatedTreaty.inceptionDate),
              formatMoney(relatedTreaty.treatyCapacity),
              relatedTreaty.treatyType,
              relatedTreaty.shariahBasis,
            ],
          } : null}
          onOpen={(recordId) => onOpenRelatedRecord('/reinsurance/treaties', recordId)}
        />
      ) : (
        <RelatedParentGrid
          title="Treaty Layer"
          emptyMessage="No treaty layer is linked to this treaty participation."
          columns={['Name', 'Attachment Point', 'Layer Capacity', 'Layer Limit', 'Lines Count']}
          row={relatedTreatyLayer ? {
            id: relatedTreatyLayer.id,
            cells: [
              <span className="font-semibold text-primary">{relatedTreatyLayer.name}</span>,
              formatOptionalMoney(relatedTreatyLayer.attachmentPoint),
              formatMoney(relatedTreatyLayer.layerCapacity),
              formatMoney(relatedTreatyLayer.layerLimit),
              formatNumber(relatedTreatyLayer.linesCount),
            ],
          } : null}
          onOpen={(recordId) => onOpenRelatedRecord('/reinsurance/treaty-layers', recordId)}
        />
      )}
    </div>
  )
}

function RelatedParentGrid({
  title,
  emptyMessage,
  columns,
  row,
  onOpen,
}: {
  title: string
  emptyMessage: string
  columns: string[]
  row: { id: string; cells: ReactNode[] } | null
  onOpen: (recordId: string) => void
}) {
  return (
    <Card padding="none" variant="premium" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border-soft px-5 py-4">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Linked parent record for this treaty participation.</p>
        </div>
        <Badge variant="info">{row ? 1 : 0}</Badge>
      </div>
      <div className="scrollbar-sleek overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-surface-muted/90">
            <tr>{columns.map((column) => <TableHeader key={column}>{column}</TableHeader>)}</tr>
          </thead>
          <tbody>
            {row ? (
              <tr
                onClick={() => onOpen(row.id)}
                className="cursor-pointer border-b border-border-soft/80 bg-surface transition hover:bg-primary/5"
              >
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 align-middle text-[13px] text-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ) : (
              <tr className="bg-surface">
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage}
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

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
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

function formatDecimal(value: number) {
  return value.toFixed(2)
}
