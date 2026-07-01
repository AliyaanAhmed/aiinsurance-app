import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Mail, Pencil, Phone, Save, UserRound, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getContactWorkspace, saveContactWorkspace } from '../../services/accountContactWorkspaceService'

interface ContactFormState {
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  businessPhone: string
  mobilePhone: string
  linkedAccountId: string
}

export function ContactWorkspacePage() {
  const { id = '' } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<ContactFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, loading, error } = useAsyncData(async () => getContactWorkspace(id), [id, refreshKey])

  useEffect(() => {
    if (!data) return
    setForm({
      firstName: data.firstName,
      lastName: data.lastName,
      jobTitle: data.jobTitle,
      email: data.email,
      businessPhone: data.businessPhone,
      mobilePhone: data.mobilePhone,
      linkedAccountId: data.linkedAccountId,
    })
  }, [data])

  if (loading) return <Card>Loading contact workspace...</Card>
  if (error || !data || !form) return <Card>{error ?? 'Contact not found.'}</Card>
  const workspace = data
  const draft = form

  const fullNamePreview = `${draft.firstName} ${draft.lastName}`.trim() || 'Unnamed contact'

  async function handleSave() {
    if (!draft) return
    try {
      setSaving(true)
      setErrorMessage(null)
      setMessage(null)
      await saveContactWorkspace(id, draft)
      setMessage('Contact updated successfully.')
      setIsEditing(false)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : 'Unable to save contact.')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setForm({
      firstName: workspace.firstName,
      lastName: workspace.lastName,
      jobTitle: workspace.jobTitle,
      email: workspace.email,
      businessPhone: workspace.businessPhone,
      mobilePhone: workspace.mobilePhone,
      linkedAccountId: workspace.linkedAccountId,
    })
    setIsEditing(false)
    setErrorMessage(null)
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/contacts">
          <ArrowLeft className="h-4 w-4" />
          Back to contacts
        </Link>
      </Button>

      <PageHeader
        icon={UserRound}
        eyebrow="Contact Workspace"
        title={workspace.fullName}
        description={workspace.jobTitle || 'Insurance platform contact record'}
        actions={
          isEditing ? (
            <>
              <Button type="button" variant="secondary" className="bg-white dark:bg-[#1E293B]" onClick={resetForm}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Contact'}
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" className="bg-white dark:bg-[#1E293B]" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit Contact
            </Button>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Linked Account" value={workspace.linkedAccountName} />
        <MetricCard icon={Mail} label="Email" value={workspace.email || 'Not set'} />
        <MetricCard icon={Phone} label="Business Phone" value={workspace.businessPhone || 'Not set'} />
        <MetricCard icon={Phone} label="Mobile Phone" value={workspace.mobilePhone || 'Not set'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-5">
          <SectionHeader title="Basic Information" description="Identity and role details for this contact record." />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First Name">
              {isEditing ? (
                <Input value={draft.firstName} onChange={(event) => setForm({ ...draft, firstName: event.target.value })} />
              ) : (
                <ReadValue value={workspace.firstName || 'Not set'} />
              )}
            </Field>
            <Field label="Last Name">
              {isEditing ? (
                <Input value={draft.lastName} onChange={(event) => setForm({ ...draft, lastName: event.target.value })} />
              ) : (
                <ReadValue value={workspace.lastName || 'Not set'} />
              )}
            </Field>
            <Field label="Job Title">
              {isEditing ? (
                <Input value={draft.jobTitle} onChange={(event) => setForm({ ...draft, jobTitle: event.target.value })} />
              ) : (
                <ReadValue value={workspace.jobTitle || 'Not set'} />
              )}
            </Field>
            <Field label="Full Name Preview">
              <ReadValue value={fullNamePreview} accent />
            </Field>
          </div>
        </Card>

        <Card className="space-y-5">
          <SectionHeader title="Contact Channels" description="Primary communication information used in workflows and outreach." />
          <div className="grid gap-4">
            <Field label="Email">
              {isEditing ? (
                <Input value={draft.email} onChange={(event) => setForm({ ...draft, email: event.target.value })} />
              ) : (
                <ReadValue value={workspace.email || 'Not set'} />
              )}
            </Field>
            <Field label="Business Phone">
              {isEditing ? (
                <Input value={draft.businessPhone} onChange={(event) => setForm({ ...draft, businessPhone: event.target.value })} />
              ) : (
                <ReadValue value={workspace.businessPhone || 'Not set'} />
              )}
            </Field>
            <Field label="Mobile Phone">
              {isEditing ? (
                <Input value={draft.mobilePhone} onChange={(event) => setForm({ ...draft, mobilePhone: event.target.value })} />
              ) : (
                <ReadValue value={workspace.mobilePhone || 'Not set'} />
              )}
            </Field>
          </div>
        </Card>
      </div>

      <Card className="space-y-5">
        <SectionHeader title="Account Relationship" description="Linked account used for account-aware inquiry and relationship workflows." />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Linked Account">
            {isEditing ? (
              <Select
                value={draft.linkedAccountId}
                onValueChange={(value) => setForm({ ...draft, linkedAccountId: value })}
                options={workspace.availableAccounts.map((account) => ({
                  value: account.id,
                  label: `${account.name}${account.type ? ` · ${account.type}` : ''}`,
                }))}
                placeholder="Select account"
              />
            ) : (
              <ReadValue value={workspace.linkedAccountName} />
            )}
          </Field>
        </div>
      </Card>

      {message ? <Card className="border-success/20 bg-success/5 text-sm text-success">{message}</Card> : null}
      {errorMessage ? <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{errorMessage}</Card> : null}
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <Card className="space-y-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </Card>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
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

function ReadValue({ value, accent = false }: { value: string; accent?: boolean }) {
  return (
    <div className={`rounded-[16px] border px-3 py-3 text-sm font-medium ${accent ? 'border-primary/15 bg-primary/5 text-primary' : 'form-field-surface border-border-soft text-foreground'}`}>
      {value}
    </div>
  )
}
