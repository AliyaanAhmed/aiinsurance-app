import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PackagePlus, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  createProductPlan,
  deleteProductPlan,
  getProductWorkspace,
  saveProductWorkspace,
  updateProductPlan,
} from '../../services/productWorkspaceService'
import { formatCompactNumber } from '../../lib/formatters'

interface ProductFormState {
  name: string
  arabicName: string
  premiumPercentage: string
  shortDetails: string
  details: string
  heading: string
  slogan: string
  emailAddress: string
  buyHeading: string
  buyButton: string
  terms: string
  remarks: string
  order: string
  status: 'draft' | 'publish'
}

interface PlanDraftState {
  open: boolean
  id?: string
  name: string
  description: string
}

export function ProductEditorPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id || id === 'create'
  const [refreshKey, setRefreshKey] = useState(0)
  const [form, setForm] = useState<ProductFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [planDraft, setPlanDraft] = useState<PlanDraftState>({ open: false, name: '', description: '' })
  const [planBusyId, setPlanBusyId] = useState<string | null>(null)
  const [builderMode, setBuilderMode] = useState<'sectioned' | 'linear'>('sectioned')
  const [showEvaluation, setShowEvaluation] = useState(true)
  const [showEvidence, setShowEvidence] = useState(true)
  const [activeRuleContext, setActiveRuleContext] = useState<string>('All')

  const { data, loading, error } = useAsyncData(async () => {
    const workspace = await getProductWorkspace(isCreate ? undefined : id)
    setForm({
      name: workspace.summary?.name ?? '',
      arabicName: workspace.metadata?.arabicName ?? '',
      premiumPercentage: workspace.metadata?.premiumPercentage ?? '',
      shortDetails: workspace.metadata?.shortDetails ?? '',
      details: workspace.metadata?.details ?? '',
      heading: workspace.metadata?.heading ?? '',
      slogan: workspace.metadata?.slogan ?? '',
      emailAddress: workspace.metadata?.emailAddress ?? '',
      buyHeading: workspace.metadata?.buyHeading ?? '',
      buyButton: workspace.metadata?.buyButton ?? '',
      terms: workspace.metadata?.terms ?? '',
      remarks: workspace.metadata?.remarks ?? '',
      order: workspace.metadata?.order ?? '',
      status: workspace.metadata?.status ?? 'draft',
    })
    return workspace
  }, [id, isCreate, refreshKey])

  const linkedStats = useMemo(() => {
    const planCount = data?.availablePlans.length ?? 0
    const ruleCount = data?.availableRules.length ?? 0
    return [
      { label: 'Linked Plans', value: formatCompactNumber(planCount), helper: 'Plans connected to this product workspace.' },
      { label: 'Rule Library', value: formatCompactNumber(ruleCount), helper: 'Available underwriting rules for future assignment.' },
      { label: 'Status', value: form?.status === 'publish' ? 'Live' : 'Draft', helper: 'Current publishing posture for the product.' },
    ]
  }, [data, form?.status])
  const groupedRules = useMemo(() => {
    const rules = data?.availableRules ?? []
    return rules.reduce((map, rule) => {
      const key = rule.context || 'Rule Library'
      const current = map.get(key) ?? []
      current.push(rule)
      map.set(key, current)
      return map
    }, new Map<string, typeof rules>())
  }, [data?.availableRules])
  const visibleRuleGroups = useMemo(() => {
    const entries = Array.from(groupedRules.entries())
    if (activeRuleContext === 'All') return entries
    return entries.filter(([context]) => context === activeRuleContext)
  }, [activeRuleContext, groupedRules])

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveProductWorkspace({
        id: isCreate ? undefined : id,
        ...form,
      })
      if (isCreate) {
        navigate('/admin/products')
      } else {
        setRefreshKey((value) => value + 1)
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to save product.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePlanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isCreate || !id) {
      setSaveError('Save the product first before managing linked plans.')
      return
    }
    try {
      setPlanBusyId(planDraft.id ?? 'create')
      if (planDraft.id) {
        await updateProductPlan(planDraft.id, {
          name: planDraft.name,
          description: planDraft.description,
        })
      } else {
        await createProductPlan(id, {
          name: planDraft.name,
          description: planDraft.description,
        })
      }
      setPlanDraft({ open: false, name: '', description: '' })
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save plan.')
    } finally {
      setPlanBusyId(null)
    }
  }

  async function handleDeletePlan(planId: string) {
    const confirmed = window.confirm('Delete this plan from the product workspace?')
    if (!confirmed) return
    try {
      setPlanBusyId(planId)
      await deleteProductPlan(planId)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to delete plan.')
    } finally {
      setPlanBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PackagePlus}
        eyebrow="Product Workspace"
        title={isCreate ? 'Create Product' : data?.summary?.name ?? 'Product Editor'}
        description="Premium product setup workspace for metadata, plans, rule-assignment readiness, and future form-builder configuration."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link to="/admin/products">
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Link>
            </Button>
            <Button type="submit" form="product-editor-form" disabled={saving || !form}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {linkedStats.map((stat) => (
          <Card key={stat.label} variant="interactive" className="space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
            <p className="text-4xl font-bold leading-none">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.helper}</p>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading product workspace...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : !form ? (
        <Card className="text-sm text-muted-foreground">Preparing product editor...</Card>
      ) : (
        <form id="product-editor-form" className="space-y-6" onSubmit={handleSave}>
          <Tabs defaultValue="details" className="space-y-5">
            <TabsList>
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="plans">Plan Setup</TabsTrigger>
              <TabsTrigger value="rules">Business Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Product Name">
                    <Input
                      value={form.name}
                      onChange={(event) => setForm((current) => current ? { ...current, name: event.target.value } : current)}
                      placeholder="Enter product name"
                      required
                    />
                  </Field>
                  <Field label="Arabic Name">
                    <Input
                      value={form.arabicName}
                      onChange={(event) => setForm((current) => current ? { ...current, arabicName: event.target.value } : current)}
                      placeholder="Arabic product name"
                    />
                  </Field>
                  <Field label="Incoming Email">
                    <Input
                      value={form.emailAddress}
                      onChange={(event) => setForm((current) => current ? { ...current, emailAddress: event.target.value } : current)}
                      placeholder="product@company.com"
                    />
                  </Field>
                  <Field label="Heading">
                    <Input
                      value={form.heading}
                      onChange={(event) => setForm((current) => current ? { ...current, heading: event.target.value } : current)}
                      placeholder="Workspace hero heading"
                    />
                  </Field>
                  <Field label="Buy Heading">
                    <Input
                      value={form.buyHeading}
                      onChange={(event) => setForm((current) => current ? { ...current, buyHeading: event.target.value } : current)}
                      placeholder="Commercial CTA heading"
                    />
                  </Field>
                  <Field label="Buy Button">
                    <Input
                      value={form.buyButton}
                      onChange={(event) => setForm((current) => current ? { ...current, buyButton: event.target.value } : current)}
                      placeholder="Get Quote"
                    />
                  </Field>
                  <Field label="Short Details">
                    <Input
                      value={form.shortDetails}
                      onChange={(event) => setForm((current) => current ? { ...current, shortDetails: event.target.value } : current)}
                      placeholder="One-line admin summary"
                    />
                  </Field>
                  <Field label="Premium Percentage">
                    <Input
                      value={form.premiumPercentage}
                      onChange={(event) => setForm((current) => current ? { ...current, premiumPercentage: event.target.value } : current)}
                      placeholder="12.5"
                    />
                  </Field>
                  <Field label="Display Order">
                    <Input
                      value={form.order}
                      onChange={(event) => setForm((current) => current ? { ...current, order: event.target.value } : current)}
                      placeholder="1"
                    />
                  </Field>
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        setForm((current) =>
                          current ? { ...current, status: value as ProductFormState['status'] } : current,
                        )
                      }
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'publish', label: 'Publish' },
                      ]}
                    >
                    </Select>
                  </Field>
                </div>

                <Field label="Detailed Description">
                  <textarea
                    className="min-h-32 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.details}
                    onChange={(event) => setForm((current) => current ? { ...current, details: event.target.value } : current)}
                    placeholder="Long-form product positioning and operational detail"
                  />
                </Field>

                <Field label="Slogan">
                  <textarea
                    className="min-h-24 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.slogan}
                    onChange={(event) => setForm((current) => current ? { ...current, slogan: event.target.value } : current)}
                    placeholder="Short premium marketing or internal slogan"
                  />
                </Field>

                <Field label="Remarks">
                  <textarea
                    className="min-h-24 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.remarks}
                    onChange={(event) => setForm((current) => current ? { ...current, remarks: event.target.value } : current)}
                    placeholder="Internal operational notes or product remarks"
                  />
                </Field>

                <Field label="Terms and Conditions">
                  <textarea
                    className="min-h-32 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={form.terms}
                    onChange={(event) => setForm((current) => current ? { ...current, terms: event.target.value } : current)}
                    placeholder="Optional terms, constraints, or underwriting conditions"
                  />
                </Field>

                {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
              </Card>
            </TabsContent>

            <TabsContent value="plans">
              <Card className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Plan Setup</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Plans are live Dataverse records filtered into this product workspace, and can now be created and maintained here.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setPlanDraft({ open: true, name: '', description: '' })} disabled={isCreate}>
                      <Plus className="h-4 w-4" />
                      Add Plan
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/admin/plans">Open Plan Library</Link>
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {(data?.availablePlans ?? []).map((plan) => (
                    <Card key={plan.id} variant="interactive" className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <p className="text-[12px] text-muted-foreground">{plan.detail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{plan.status}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPlanDraft({ open: true, id: plan.id, name: plan.name, description: plan.description })}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                          disabled={planBusyId === plan.id}
                          onClick={() => void handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {(data?.availablePlans.length ?? 0) === 0 ? (
                    <Card className="text-sm text-muted-foreground">
                      No plans are currently linked to this product. Use the Plans page to attach plan records.
                    </Card>
                  ) : null}
                </div>
                {planDraft.open ? (
                  <Card className="space-y-4 border-primary/15 bg-surface-soft">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{planDraft.id ? 'Edit Plan' : 'Create Plan'}</h3>
                        <p className="text-sm text-muted-foreground">Maintain plan records directly from the product setup hub.</p>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => setPlanDraft({ open: false, name: '', description: '' })}>
                        Close
                      </Button>
                    </div>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePlanSubmit}>
                      <Field label="Plan Name">
                        <Input
                          value={planDraft.name}
                          onChange={(event) => setPlanDraft((current) => ({ ...current, name: event.target.value }))}
                          required
                        />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Description">
                          <textarea
                            className="min-h-24 w-full rounded-[16px] border border-border bg-surface px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                            value={planDraft.description}
                            onChange={(event) => setPlanDraft((current) => ({ ...current, description: event.target.value }))}
                          />
                        </Field>
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setPlanDraft({ open: false, name: '', description: '' })}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={planBusyId === (planDraft.id ?? 'create')}>
                          {planBusyId === (planDraft.id ?? 'create') ? 'Saving...' : planDraft.id ? 'Save Plan' : 'Create Plan'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                ) : null}
              </Card>
            </TabsContent>

            <TabsContent value="rules">
              <Card className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Business Rule Assignment</h2>
                  <p className="text-sm text-muted-foreground">
                    The rule library is live. Product-specific rule linking, grouping, and form-builder preview are prepared here while Dataverse persistence awaits the exact junction-table logical name.
                  </p>
                </div>
                {data?.relationshipNotice ? (
                  <div className="rounded-[18px] border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
                    {data.relationshipNotice}
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card variant="interactive" className="space-y-3">
                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Builder Mode</p>
                    <div className="flex gap-2">
                      <Button type="button" variant={builderMode === 'sectioned' ? 'primary' : 'secondary'} size="sm" onClick={() => setBuilderMode('sectioned')}>
                        Sectioned
                      </Button>
                      <Button type="button" variant={builderMode === 'linear' ? 'primary' : 'secondary'} size="sm" onClick={() => setBuilderMode('linear')}>
                        Linear
                      </Button>
                    </div>
                  </Card>
                  <label className="flex items-center gap-3 rounded-[22px] border border-border-soft bg-surface px-5 py-4 text-sm font-medium shadow-soft">
                    <input type="checkbox" checked={showEvaluation} onChange={(event) => setShowEvaluation(event.target.checked)} />
                    Show evaluation state
                  </label>
                  <label className="flex items-center gap-3 rounded-[22px] border border-border-soft bg-surface px-5 py-4 text-sm font-medium shadow-soft">
                    <input type="checkbox" checked={showEvidence} onChange={(event) => setShowEvidence(event.target.checked)} />
                    Show evidence capture
                  </label>
                  <Card variant="interactive" className="space-y-3">
                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Visible Sections</p>
                    <p className="text-3xl font-bold">{visibleRuleGroups.length}</p>
                    <p className="text-sm text-muted-foreground">Grouped sections currently visible in the preview canvas.</p>
                  </Card>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeRuleContext === 'All' ? 'bg-primary text-white shadow-soft' : 'border border-border bg-surface text-muted-foreground hover:border-primary/40'}`} onClick={() => setActiveRuleContext('All')}>
                    All
                  </button>
                  {Array.from(groupedRules.keys()).map((context) => (
                    <button key={context} type="button" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeRuleContext === context ? 'bg-primary text-white shadow-soft' : 'border border-border bg-surface text-muted-foreground hover:border-primary/40'}`} onClick={() => setActiveRuleContext(context)}>
                      {context}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 xl:grid-cols-[1fr_0.9fr]">
                  <div className="space-y-4">
                    {visibleRuleGroups.map(([context, rules]) => (
                      <Card key={context} className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold">{context}</p>
                            <p className="text-sm text-muted-foreground">
                              {builderMode === 'sectioned' ? 'Rendered as a grouped question block.' : 'Rendered in a linear underwriting flow.'}
                            </p>
                          </div>
                          <Badge variant="review">{rules.length} rules</Badge>
                        </div>
                        <div className="grid gap-3">
                          {rules.map((rule) => (
                            <Card key={rule.id} variant="interactive" className="space-y-3 bg-surface-soft">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">{rule.name}</p>
                                <Badge variant="neutral">{rule.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {showEvaluation ? <span className="rounded-full border border-border bg-surface px-3 py-1">Evaluation visible</span> : null}
                                {showEvidence ? <span className="rounded-full border border-border bg-surface px-3 py-1">Evidence input visible</span> : null}
                                <span className="rounded-full border border-border bg-surface px-3 py-1">{builderMode === 'sectioned' ? 'Section card' : 'Inline row'}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Card className="space-y-4 bg-surface-soft">
                    <div>
                      <h3 className="text-lg font-semibold">Form Builder Preview</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Preview how grouped rule sections and product metadata will appear once the relationship table is confirmed.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <PreviewBlock title="Layout Mode" value="Sectioned rule workspace" />
                      <PreviewBlock title="Section Style" value="Category grouped" />
                      <PreviewBlock title="Show Evaluation" value="Enabled" />
                      <PreviewBlock title="Show Evidence" value="Enabled" />
                      <PreviewBlock title="Metadata Order" value="Product → Plan → Rule → Evidence" />
                    </div>
                    <div className="rounded-[18px] border border-border-soft bg-surface p-4">
                      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Preview Surface</p>
                      <div className="mt-3 space-y-3">
                        {(data?.availableRules ?? []).slice(0, 3).map((rule) => (
                          <div key={rule.id} className="rounded-[14px] border border-border-soft bg-surface-soft p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold">{rule.name}</p>
                              <Badge variant="neutral">{rule.context}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{rule.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function PreviewBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-border-soft bg-surface p-3">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  )
}

