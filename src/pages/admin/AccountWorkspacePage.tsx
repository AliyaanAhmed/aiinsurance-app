import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Globe, Mail, MapPin, Pencil, Save, Users, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  getAccountTypeOptions,
  getAccountWorkspace,
  getIndustryOptions,
  getOwnershipOptions,
  saveAccountWorkspace,
} from '../../services/accountContactWorkspaceService'

interface AccountFormState {
  name: string
  accountType: string
  industry: string
  ownership: string
  employeeCount: string
  email: string
  mainPhone: string
  otherPhone: string
  website: string
  street1: string
  street2: string
  city: string
  stateProvince: string
  zipPostalCode: string
  countryRegion: string
  creditLimit: string
  creditHold: boolean
}

export function AccountWorkspacePage() {
  const { id = '' } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [form, setForm] = useState<AccountFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { data, loading, error } = useAsyncData(async () => getAccountWorkspace(id), [id, refreshKey])

  useEffect(() => {
    if (!data) return
    setForm({
      name: data.name,
      accountType: data.accountType,
      industry: data.industry,
      ownership: data.ownership,
      employeeCount: data.employeeCount,
      email: data.email,
      mainPhone: data.mainPhone,
      otherPhone: data.otherPhone,
      website: data.website,
      street1: data.street1,
      street2: data.street2,
      city: data.city,
      stateProvince: data.stateProvince,
      zipPostalCode: data.zipPostalCode,
      countryRegion: data.countryRegion,
      creditLimit: data.creditLimit,
      creditHold: data.creditHold,
    })
  }, [data])

  const accountTypeOptions = useMemo(() => getAccountTypeOptions(), [])
  const industryOptions = useMemo(() => getIndustryOptions(), [])
  const ownershipOptions = useMemo(() => getOwnershipOptions(), [])

  const filteredContacts = useMemo(() => {
    const items = data?.contacts ?? []
    if (!contactSearch.trim()) return items
    const query = contactSearch.toLowerCase()
    return items.filter((contact) =>
      [contact.fullName, contact.email, contact.jobTitle].join(' ').toLowerCase().includes(query),
    )
  }, [contactSearch, data?.contacts])

  if (loading) return <Card>Loading account workspace...</Card>
  if (error || !data || !form) return <Card>{error ?? 'Account not found.'}</Card>
  const workspace = data
  const draft = form

  async function handleSave() {
    if (!draft) return
    try {
      setSaving(true)
      setErrorMessage(null)
      setMessage(null)
      await saveAccountWorkspace(id, draft)
      setMessage('Account updated successfully.')
      setIsEditing(false)
      setRefreshKey((value) => value + 1)
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : 'Unable to save account.')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setForm({
      name: workspace.name,
      accountType: workspace.accountType,
      industry: workspace.industry,
      ownership: workspace.ownership,
      employeeCount: workspace.employeeCount,
      email: workspace.email,
      mainPhone: workspace.mainPhone,
      otherPhone: workspace.otherPhone,
      website: workspace.website,
      street1: workspace.street1,
      street2: workspace.street2,
      city: workspace.city,
      stateProvince: workspace.stateProvince,
      zipPostalCode: workspace.zipPostalCode,
      countryRegion: workspace.countryRegion,
      creditLimit: workspace.creditLimit,
      creditHold: workspace.creditHold,
    })
    setIsEditing(false)
    setErrorMessage(null)
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/accounts">
          <ArrowLeft className="h-4 w-4" />
          Back to accounts
        </Link>
      </Button>

      <PageHeader
        icon={Building2}
        eyebrow="Account Workspace"
        title={workspace.name}
        description={workspace.accountType || workspace.industry || 'Insurance platform account record'}
        actions={
          isEditing ? (
            <>
              <Button type="button" variant="secondary" className="bg-white dark:bg-[#1E293B]" onClick={resetForm}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Account'}
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" className="bg-white dark:bg-[#1E293B]" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit Account
            </Button>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Account Type" value={workspace.accountType || 'Not set'} />
        <MetricCard icon={Mail} label="Email" value={workspace.email || 'Not set'} />
        <MetricCard icon={MapPin} label="City" value={workspace.city || 'Not set'} />
        <MetricCard icon={Globe} label="Account Number / Industry" value={workspace.accountNumber || workspace.industry || 'Not set'} />
      </div>

      <Tabs defaultValue="details" className="space-y-5">
        <TabsList>
          <TabsTrigger value="details" icon={Building2}>Account Details</TabsTrigger>
          <TabsTrigger value="contacts" icon={Users}>Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card className="space-y-5">
            <SectionHeader title="Basic Information" description="Primary account identity, classification, and staffing detail." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Account Name">
                {isEditing ? <Input value={draft.name} onChange={(event) => setForm({ ...draft, name: event.target.value })} /> : <ReadValue value={workspace.name} />}
              </Field>
              <Field label="Account Type">
                {isEditing ? (
                  <Select value={draft.accountType} onValueChange={(value) => setForm({ ...draft, accountType: value })} options={accountTypeOptions} placeholder="Select type" />
                ) : (
                  <ReadValue value={workspace.accountType || 'Not set'} />
                )}
              </Field>
              <Field label="Industry">
                {isEditing ? (
                  <Select value={draft.industry} onValueChange={(value) => setForm({ ...draft, industry: value })} options={industryOptions} placeholder="Select industry" />
                ) : (
                  <ReadValue value={workspace.industry || 'Not set'} />
                )}
              </Field>
              <Field label="Ownership">
                {isEditing ? (
                  <Select value={draft.ownership} onValueChange={(value) => setForm({ ...draft, ownership: value })} options={ownershipOptions} placeholder="Select ownership" />
                ) : (
                  <ReadValue value={workspace.ownership || 'Not set'} />
                )}
              </Field>
              <Field label="Number of Employees">
                {isEditing ? (
                  <Input value={draft.employeeCount} onChange={(event) => setForm({ ...draft, employeeCount: event.target.value })} />
                ) : (
                  <ReadValue value={workspace.employeeCount || 'Not set'} />
                )}
              </Field>
              <Field label="Account Number">
                <ReadValue value={workspace.accountNumber || 'Not set'} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionHeader title="Contact Information" description="Primary account communication channels used by internal and servicing teams." />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">
                {isEditing ? <Input value={draft.email} onChange={(event) => setForm({ ...draft, email: event.target.value })} /> : <ReadValue value={workspace.email || 'Not set'} />}
              </Field>
              <Field label="Main Phone">
                {isEditing ? <Input value={draft.mainPhone} onChange={(event) => setForm({ ...draft, mainPhone: event.target.value })} /> : <ReadValue value={workspace.mainPhone || 'Not set'} />}
              </Field>
              <Field label="Other Phone">
                {isEditing ? <Input value={draft.otherPhone} onChange={(event) => setForm({ ...draft, otherPhone: event.target.value })} /> : <ReadValue value={workspace.otherPhone || 'Not set'} />}
              </Field>
              <Field label="Website">
                {isEditing ? <Input value={draft.website} onChange={(event) => setForm({ ...draft, website: event.target.value })} /> : <ReadValue value={workspace.website || 'Not set'} />}
              </Field>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionHeader title="Address Information" description="Location data used for servicing, mailing, and operational context." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Street 1">
                {isEditing ? <Input value={draft.street1} onChange={(event) => setForm({ ...draft, street1: event.target.value })} /> : <ReadValue value={workspace.street1 || 'Not set'} />}
              </Field>
              <Field label="Street 2">
                {isEditing ? <Input value={draft.street2} onChange={(event) => setForm({ ...draft, street2: event.target.value })} /> : <ReadValue value={workspace.street2 || 'Not set'} />}
              </Field>
              <Field label="City">
                {isEditing ? <Input value={draft.city} onChange={(event) => setForm({ ...draft, city: event.target.value })} /> : <ReadValue value={workspace.city || 'Not set'} />}
              </Field>
              <Field label="State / Province">
                {isEditing ? <Input value={draft.stateProvince} onChange={(event) => setForm({ ...draft, stateProvince: event.target.value })} /> : <ReadValue value={workspace.stateProvince || 'Not set'} />}
              </Field>
              <Field label="ZIP / Postal Code">
                {isEditing ? <Input value={draft.zipPostalCode} onChange={(event) => setForm({ ...draft, zipPostalCode: event.target.value })} /> : <ReadValue value={workspace.zipPostalCode || 'Not set'} />}
              </Field>
              <Field label="Country / Region">
                {isEditing ? <Input value={draft.countryRegion} onChange={(event) => setForm({ ...draft, countryRegion: event.target.value })} /> : <ReadValue value={workspace.countryRegion || 'Not set'} />}
              </Field>
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionHeader title="Operational Summary" description="Commercial readiness and credit posture for the account." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Type">
                <ReadValue value={workspace.accountType || 'Not set'} />
              </Field>
              <Field label="Industry">
                <ReadValue value={workspace.industry || 'Not set'} />
              </Field>
              <Field label="Credit Limit">
                {isEditing ? <Input value={draft.creditLimit} onChange={(event) => setForm({ ...draft, creditLimit: event.target.value })} /> : <ReadValue value={workspace.creditLimit || 'Not set'} />}
              </Field>
              <Field label="Credit Status">
                {isEditing ? (
                  <Select
                    value={draft.creditHold ? 'On Hold' : 'Available'}
                    onValueChange={(value) => setForm({ ...draft, creditHold: value === 'On Hold' })}
                    options={[
                      { value: 'Available', label: 'Available' },
                      { value: 'On Hold', label: 'On Hold' },
                    ]}
                  />
                ) : (
                  <ReadValue value={workspace.creditHold ? 'On Hold' : 'Available'} />
                )}
              </Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionHeader title="Associated Contacts" description="Contacts linked to this account through the managing-partner relationship." />
              <div className="w-full max-w-sm">
                <Field label="Search Contacts">
                  <Input value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Search by name, email, or title" />
                </Field>
              </div>
            </div>

            {filteredContacts.length === 0 ? (
              <Card className="border-dashed border-border bg-surface-soft/70 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold">No linked contacts</h4>
                <p className="mt-2 text-sm text-muted-foreground">Contacts linked through the account relationship will appear here.</p>
              </Card>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-border-soft">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-surface-muted/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Contact</th>
                        <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Job Title</th>
                        <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Phone</th>
                        <th className="px-4 py-3 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="border-b border-border-soft/80 bg-surface transition duration-150 hover:bg-primary/5">
                          <td className="px-4 py-4">
                            <Link to={`/admin/contacts/${contact.id}`} className="font-semibold text-primary transition hover:text-primary/80 hover:underline">
                              {contact.fullName}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{contact.jobTitle}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{contact.phone}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{contact.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

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

function ReadValue({ value }: { value: string }) {
  return <div className="form-field-surface rounded-[16px] border border-border-soft px-3 py-3 text-sm font-medium">{value}</div>
}
