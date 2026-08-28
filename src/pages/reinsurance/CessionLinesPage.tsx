import { useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Rows3, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/layout/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createCessionLine,
  listCessionLines,
  listCessionLookupOptions,
  listFacOfferLookupOptions,
  listReinsurers,
  listReinsurerLookupOptions,
  listTreaties,
  listTreatyLookupOptions,
  updateCessionLine,
  type CessionLineRecord,
  type CessionLineSaveInput,
  type ReinsurerRecord,
  type ReinsuranceLookupOption,
  type TreatyRecord,
} from '../../services/reinsuranceService'

interface CessionLineFormState {
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

const emptyCessionLineForm: CessionLineFormState = {
  name: '',
  cededPremium: '',
  cededSumInsured: '',
  cessionBasis: 'Select',
  cessionId: 'Select',
  commissionPercentage: '',
  facOfferId: 'Select',
  netDue: '',
  reinsurerId: 'Select',
  sharePercentage: '',
  treatyId: 'Select',
}

const cessionBasisOptions = [
  { value: 'Select', label: 'Select cession basis' },
  { value: 'Treaty Only', label: 'Treaty Only' },
  { value: 'Facultative Only', label: 'Facultative Only' },
  { value: 'Treaty', label: 'Treaty' },
  { value: 'Facultative', label: 'Facultative' },
]

const tableColumns: Array<{
  key: keyof CessionLineRecord
  label: string
  render?: (record: CessionLineRecord) => string
}> = [
  { key: 'name', label: 'Name' },
  { key: 'cessionBasis', label: 'Cession Basis' },
  { key: 'cessionId', label: 'Cession Id' },
  { key: 'netDue', label: 'Net Due', render: (record) => formatMoney(record.netDue) },
  { key: 'reinsurerId', label: 'Reinsurer Id' },
  { key: 'treatyId', label: 'Treaty Id' },
]

type CessionLineDetailTab = 'details' | 'reinsurer' | 'treaty'

export function CessionLinesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as { selectedId?: string } | null
  const [selectedId, setSelectedId] = useState<string | null>(routeState?.selectedId ?? null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(async () => {
    const [records, cessionOptions, facOfferOptions, reinsurerOptions, treatyOptions, reinsurers, treaties] = await Promise.all([
      listCessionLines(),
      listCessionLookupOptions(),
      listFacOfferLookupOptions(),
      listReinsurerLookupOptions(),
      listTreatyLookupOptions(),
      listReinsurers(),
      listTreaties(),
    ])
    return { records, cessionOptions, facOfferOptions, reinsurerOptions, treatyOptions, reinsurers, treaties }
  }, [refreshKey])
  const records = data?.records ?? []
  const cessionOptions = data?.cessionOptions ?? []
  const facOfferOptions = data?.facOfferOptions ?? []
  const reinsurerOptions = data?.reinsurerOptions ?? []
  const treatyOptions = data?.treatyOptions ?? []
  const reinsurers = data?.reinsurers ?? []
  const treaties = data?.treaties ?? []
  const selected = useMemo(() => records.find((record) => record.id === selectedId), [records, selectedId])

  if (selected) {
    return (
      <CessionLineDetail
        record={selected}
        cessionOptions={cessionOptions}
        facOfferOptions={facOfferOptions}
        reinsurerOptions={reinsurerOptions}
        treatyOptions={treatyOptions}
        reinsurers={reinsurers}
        treaties={treaties}
        onBack={() => setSelectedId(null)}
        onOpenRelatedRecord={(path, relatedId) => navigate(path, { state: { selectedId: relatedId } })}
        onSave={async (updatedRecord) => {
          await updateCessionLine(updatedRecord.id, toCessionLineSaveInput(updatedRecord))
          setRefreshKey((value) => value + 1)
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
        actions={<Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4" />Create Cession Line</Button>}
      />

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading cession lines...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
        <Card padding="none" variant="premium" className="overflow-hidden">
          <div className="scrollbar-sleek overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="bg-surface-muted/90">
                <tr>{tableColumns.map((column) => <TableHeader key={column.key}>{column.label}</TableHeader>)}</tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr className="bg-surface">
                    <td colSpan={tableColumns.length} className="px-6 py-12 text-center">
                      <p className="text-base font-semibold">No cession lines found</p>
                      <p className="mt-1 text-sm text-muted-foreground">The aur_cession_lines datasource is connected, but there are no records for this view yet.</p>
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
                        ) : column.key === 'cessionId' ? (
                          <span className="block max-w-[170px] truncate font-semibold text-primary">{getLookupDisplayValue(cessionOptions, record.cessionLookupId, record.cessionId)}</span>
                        ) : column.key === 'facOfferId' ? (
                          <span className="block max-w-[170px] truncate font-semibold text-primary">{getLookupDisplayValue(facOfferOptions, record.facOfferLookupId, record.facOfferId)}</span>
                        ) : column.key === 'reinsurerId' ? (
                          <span className="block max-w-[170px] truncate font-semibold text-primary">{getLookupDisplayValue(reinsurerOptions, record.reinsurerLookupId, record.reinsurerId)}</span>
                        ) : column.key === 'treatyId' ? (
                          <span className="block max-w-[170px] truncate font-semibold text-primary">{getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)}</span>
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
        <CreateCessionLineModal
          cessionOptions={cessionOptions}
          facOfferOptions={facOfferOptions}
          reinsurerOptions={reinsurerOptions}
          treatyOptions={treatyOptions}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (form) => {
            await createCessionLine(toCessionLineCreateInput(form))
            setRefreshKey((value) => value + 1)
            setIsCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateCessionLineModal({
  cessionOptions,
  facOfferOptions,
  reinsurerOptions,
  treatyOptions,
  onClose,
  onCreate,
}: {
  cessionOptions: ReinsuranceLookupOption[]
  facOfferOptions: ReinsuranceLookupOption[]
  reinsurerOptions: ReinsuranceLookupOption[]
  treatyOptions: ReinsuranceLookupOption[]
  onClose: () => void
  onCreate: (form: CessionLineFormState) => Promise<void>
}) {
  const [form, setForm] = useState<CessionLineFormState>(emptyCessionLineForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const updateForm = <Key extends keyof CessionLineFormState>(key: Key, value: CessionLineFormState[Key]) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onCreate(form)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create cession line.')
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
            <h2 className="mt-1 text-xl font-bold">Create cession line</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add ceded premium, cession basis, net due, reinsurer share, and treaty links.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground">Close</button>
        </div>

        <div className="scrollbar-sleek flex-1 overflow-y-auto px-5 py-4">
          {error ? <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <ModalField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Enter cession line name" /></ModalField>
            <ModalField label="Ceded Premium"><Input value={form.cededPremium} onChange={(event) => updateForm('cededPremium', event.target.value)} placeholder="Enter ceded premium" /></ModalField>
            <ModalField label="Ceded Sum Insured"><Input value={form.cededSumInsured} onChange={(event) => updateForm('cededSumInsured', event.target.value)} placeholder="Enter ceded sum insured" /></ModalField>
            <ModalField label="Cession Basis"><Select value={form.cessionBasis} onValueChange={(value) => updateForm('cessionBasis', value)} options={cessionBasisOptions} /></ModalField>
            <ModalField label="Cession Id"><Select value={form.cessionId} onValueChange={(value) => updateForm('cessionId', value)} options={buildLookupOptions(cessionOptions, 'Look for Cession Id')} /></ModalField>
            <ModalField label="Commission Percentage"><Input value={form.commissionPercentage} onChange={(event) => updateForm('commissionPercentage', event.target.value)} placeholder="Enter commission percentage" /></ModalField>
            <ModalField label="Fac Offer Id"><Select value={form.facOfferId} onValueChange={(value) => updateForm('facOfferId', value)} options={buildLookupOptions(facOfferOptions, 'Look for Fac Offer Id')} /></ModalField>
            <ModalField label="Net Due"><Input value={form.netDue} onChange={(event) => updateForm('netDue', event.target.value)} placeholder="Enter net due" /></ModalField>
            <ModalField label="Reinsurer Id"><Select value={form.reinsurerId} onValueChange={(value) => updateForm('reinsurerId', value)} options={buildLookupOptions(reinsurerOptions, 'Look for Reinsurer Id')} /></ModalField>
            <ModalField label="Share Percentage"><Input value={form.sharePercentage} onChange={(event) => updateForm('sharePercentage', event.target.value)} placeholder="Enter share percentage" /></ModalField>
            <ModalField label="Treaty Id"><Select value={form.treatyId} onValueChange={(value) => updateForm('treatyId', value)} options={buildLookupOptions(treatyOptions, 'Look for Treaty Id')} /></ModalField>
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

function CessionLineDetail({
  record,
  cessionOptions,
  facOfferOptions,
  reinsurerOptions,
  treatyOptions,
  reinsurers,
  treaties,
  onBack,
  onOpenRelatedRecord,
  onSave,
}: {
  record: CessionLineRecord
  cessionOptions: ReinsuranceLookupOption[]
  facOfferOptions: ReinsuranceLookupOption[]
  reinsurerOptions: ReinsuranceLookupOption[]
  treatyOptions: ReinsuranceLookupOption[]
  reinsurers: ReinsurerRecord[]
  treaties: TreatyRecord[]
  onBack: () => void
  onOpenRelatedRecord: (path: string, recordId: string) => void
  onSave: (record: CessionLineRecord) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<CessionLineDetailTab>('details')
  const [form, setForm] = useState<CessionLineFormState>(() => toCessionLineForm(record))
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
  const tabs: Array<{
    id: CessionLineDetailTab
    label: string
    count?: number
    icon: LucideIcon
  }> = [
    { id: 'details', label: 'Cession Line Details', icon: Rows3 },
    { id: 'reinsurer', label: 'Reinsurer', count: relatedReinsurer ? 1 : 0, icon: ShieldCheck },
    { id: 'treaty', label: 'Treaty', count: relatedTreaty ? 1 : 0, icon: FileText },
  ]
  const updateForm = <Key extends keyof CessionLineFormState>(key: Key, value: CessionLineFormState[Key]) => setForm((current) => ({ ...current, [key]: value }))
  const cancelEdit = () => {
    setForm(toCessionLineForm(record))
    setSaveError(null)
    setIsEditing(false)
  }
  const saveEdit = async () => {
    const updatedRecord: CessionLineRecord = {
      ...record,
      name: form.name.trim() || record.name,
      cededPremium: parseMoneyInput(form.cededPremium),
      cededSumInsured: parseMoneyInput(form.cededSumInsured),
      cessionBasis: resolveSelectValue(form.cessionBasis, record.cessionBasis),
      cessionId: resolveLookupLabel(cessionOptions, form.cessionId, record.cessionId),
      cessionLookupId: resolveLookupValue(form.cessionId) || record.cessionLookupId,
      commissionPercentage: parseNumberInput(form.commissionPercentage),
      facOfferId: resolveLookupLabel(facOfferOptions, form.facOfferId, record.facOfferId),
      facOfferLookupId: resolveLookupValue(form.facOfferId) || record.facOfferLookupId,
      netDue: parseMoneyInput(form.netDue),
      reinsurerId: resolveLookupLabel(reinsurerOptions, form.reinsurerId, record.reinsurerId),
      reinsurerLookupId: resolveLookupValue(form.reinsurerId) || record.reinsurerLookupId,
      sharePercentage: parseNumberInput(form.sharePercentage),
      treatyId: resolveLookupLabel(treatyOptions, form.treatyId, record.treatyId),
      treatyLookupId: resolveLookupValue(form.treatyId) || record.treatyLookupId,
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(updatedRecord)
      setIsEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save cession line.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" />Back to Cession Lines</Button>
      <PageHeader
        icon={Rows3}
        eyebrow="Reinsurance"
        title={record.name}
        description="Cession line ceded premium, reinsurer share, net due, treaty, and facultative offer details."
        actions={isEditing ? <div className="flex flex-wrap items-center justify-end gap-2"><Button variant="secondary" onClick={cancelEdit}>Cancel</Button><Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Cession Line'}</Button></div> : <Button onClick={() => setIsEditing(true)}>Edit Cession Line</Button>}
      />

      <div className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-2 shadow-sm lg:grid-cols-3">
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
        {saveError ? <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{saveError}</div> : null}
        <div><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Cession Line Form</p><h2 className="mt-1 text-xl font-bold">{record.name}</h2></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {isEditing ? (
            <>
              <EditableField label="Name"><Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></EditableField>
              <EditableField label="Ceded Premium"><Input value={form.cededPremium} onChange={(event) => updateForm('cededPremium', event.target.value)} /></EditableField>
              <EditableField label="Ceded Sum Insured"><Input value={form.cededSumInsured} onChange={(event) => updateForm('cededSumInsured', event.target.value)} /></EditableField>
              <EditableField label="Cession Basis"><Select value={form.cessionBasis} onValueChange={(value) => updateForm('cessionBasis', value)} options={cessionBasisOptions} /></EditableField>
              <EditableField label="Cession Id"><Select value={form.cessionId} onValueChange={(value) => updateForm('cessionId', value)} options={buildLookupOptions(cessionOptions, 'Look for Cession Id')} /></EditableField>
              <EditableField label="Commission Percentage"><Input value={form.commissionPercentage} onChange={(event) => updateForm('commissionPercentage', event.target.value)} /></EditableField>
              <EditableField label="Fac Offer Id"><Select value={form.facOfferId} onValueChange={(value) => updateForm('facOfferId', value)} options={buildLookupOptions(facOfferOptions, 'Look for Fac Offer Id')} /></EditableField>
              <EditableField label="Net Due"><Input value={form.netDue} onChange={(event) => updateForm('netDue', event.target.value)} /></EditableField>
              <EditableField label="Reinsurer Id"><Select value={form.reinsurerId} onValueChange={(value) => updateForm('reinsurerId', value)} options={buildLookupOptions(reinsurerOptions, 'Look for Reinsurer Id')} /></EditableField>
              <EditableField label="Share Percentage"><Input value={form.sharePercentage} onChange={(event) => updateForm('sharePercentage', event.target.value)} /></EditableField>
              <EditableField label="Treaty Id"><Select value={form.treatyId} onValueChange={(value) => updateForm('treatyId', value)} options={buildLookupOptions(treatyOptions, 'Look for Treaty Id')} /></EditableField>
            </>
          ) : (
            <>
              <ReadOnlyField label="Name" value={record.name} />
              <ReadOnlyField label="Ceded Premium" value={formatMoney(record.cededPremium)} />
              <ReadOnlyField label="Ceded Sum Insured" value={formatMoney(record.cededSumInsured)} />
              <ReadOnlyField label="Cession Basis" value={record.cessionBasis} />
              <ReadOnlyField label="Cession Id" value={getLookupDisplayValue(cessionOptions, record.cessionLookupId, record.cessionId)} />
              <ReadOnlyField label="Commission Percentage" value={formatMoneyLikeDecimal(record.commissionPercentage)} />
              <ReadOnlyField label="Fac Offer Id" value={getLookupDisplayValue(facOfferOptions, record.facOfferLookupId, record.facOfferId)} />
              <ReadOnlyField label="Net Due" value={formatMoney(record.netDue)} />
              <ReadOnlyField label="Reinsurer Id" value={getLookupDisplayValue(reinsurerOptions, record.reinsurerLookupId, record.reinsurerId)} />
              <ReadOnlyField label="Share Percentage" value={formatDecimal(record.sharePercentage)} />
              <ReadOnlyField label="Treaty Id" value={getLookupDisplayValue(treatyOptions, record.treatyLookupId, record.treatyId)} />
            </>
          )}
        </div>
      </Card>
      ) : activeTab === 'reinsurer' ? (
        <RelatedReinsurerGrid
          record={relatedReinsurer}
          onOpen={(recordId) => onOpenRelatedRecord('/reinsurance/reinsurers', recordId)}
        />
      ) : (
        <RelatedTreatyGrid
          record={relatedTreaty}
          onOpen={(recordId) => onOpenRelatedRecord('/reinsurance/treaties', recordId)}
        />
      )}
    </div>
  )
}

function RelatedReinsurerGrid({
  record,
  onOpen,
}: {
  record: ReinsurerRecord | undefined
  onOpen: (recordId: string) => void
}) {
  const columns = ['Name', 'Approved', 'Current Exposure', 'Max Exposure Limit', 'Rating Agency']
  return (
    <RelatedParentGrid
      title="Reinsurer"
      emptyMessage="No reinsurer is linked to this cession line."
      columns={columns}
      row={record ? {
        id: record.id,
        cells: [
          <span className="font-semibold text-primary">{record.name}</span>,
          <Badge variant={record.isApproved === 'Yes' ? 'approved' : 'neutral'}>{record.isApproved}</Badge>,
          formatMoney(record.currentExposure),
          formatMoney(record.maxExposureLimit),
          record.ratingAgency,
        ],
      } : null}
      onOpen={onOpen}
    />
  )
}

function RelatedTreatyGrid({
  record,
  onOpen,
}: {
  record: TreatyRecord | undefined
  onOpen: (recordId: string) => void
}) {
  const columns = ['Treaty Name', 'Inception Date', 'Treaty Capacity', 'Treaty Type', 'Shariah Basis']
  return (
    <RelatedParentGrid
      title="Treaty"
      emptyMessage="No treaty is linked to this cession line."
      columns={columns}
      row={record ? {
        id: record.id,
        cells: [
          <span className="font-semibold text-primary">{record.treatyName}</span>,
          formatDate(record.inceptionDate),
          formatMoney(record.treatyCapacity),
          record.treatyType,
          record.shariahBasis,
        ],
      } : null}
      onOpen={onOpen}
    />
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
          <p className="mt-1 text-sm text-muted-foreground">Linked parent record for this cession line.</p>
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

function toCessionLineForm(record: CessionLineRecord): CessionLineFormState {
  return {
    name: record.name,
    cededPremium: formatMoney(record.cededPremium),
    cededSumInsured: formatMoney(record.cededSumInsured),
    cessionBasis: record.cessionBasis,
    cessionId: record.cessionLookupId || 'Select',
    commissionPercentage: formatMoneyLikeDecimal(record.commissionPercentage),
    facOfferId: record.facOfferLookupId || 'Select',
    netDue: formatMoney(record.netDue),
    reinsurerId: record.reinsurerLookupId || 'Select',
    sharePercentage: formatDecimal(record.sharePercentage),
    treatyId: record.treatyLookupId || 'Select',
  }
}

function toCessionLineCreateInput(form: CessionLineFormState): CessionLineSaveInput {
  return {
    name: form.name.trim() || 'Untitled Cession Line',
    cededPremium: parseMoneyInput(form.cededPremium),
    cededSumInsured: parseMoneyInput(form.cededSumInsured),
    cessionBasis: resolveSelectValue(form.cessionBasis, 'Treaty'),
    cessionLookupId: resolveLookupValue(form.cessionId),
    commissionPercentage: parseNumberInput(form.commissionPercentage),
    facOfferLookupId: resolveLookupValue(form.facOfferId),
    netDue: parseMoneyInput(form.netDue),
    reinsurerLookupId: resolveLookupValue(form.reinsurerId),
    sharePercentage: parseNumberInput(form.sharePercentage),
    treatyLookupId: resolveLookupValue(form.treatyId),
  }
}

function toCessionLineSaveInput(record: CessionLineRecord): CessionLineSaveInput {
  return {
    name: record.name,
    cededPremium: record.cededPremium,
    cededSumInsured: record.cededSumInsured,
    cessionBasis: record.cessionBasis,
    cessionLookupId: record.cessionLookupId,
    commissionPercentage: record.commissionPercentage,
    facOfferLookupId: record.facOfferLookupId,
    netDue: record.netDue,
    reinsurerLookupId: record.reinsurerLookupId,
    sharePercentage: record.sharePercentage,
    treatyLookupId: record.treatyLookupId,
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

function isSameLookupId(left: string, right: string) {
  return normalizeLookupId(left) === normalizeLookupId(right)
}

function normalizeLookupId(value: string) {
  return value.replace(/[{}]/g, '').toLowerCase()
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function formatMoneyLikeDecimal(value: number) {
  return `$${value.toFixed(2)}`
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
