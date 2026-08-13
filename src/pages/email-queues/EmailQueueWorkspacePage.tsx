import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Inbox, Link2, Mail, Save, Sparkles } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getEmailQueueDetail, saveEmailQueue } from '../../services/emailQueuesService'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { formatDate } from '../../lib/formatters'

interface EmailQueueFormState {
  name: string
  mailbox: string
  emailBody: string
}

export function EmailQueueWorkspacePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useAsyncData(() => getEmailQueueDetail(id), [id])
  const [form, setForm] = useState<EmailQueueFormState>({ name: '', mailbox: '', emailBody: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setForm({
      name: data.name,
      mailbox: data.mailbox === 'No mailbox captured' ? '' : data.mailbox,
      emailBody: data.emailBody,
    })
    setSaveError(null)
    setSaveSuccess(null)
  }, [data])

  const previewHtml = useMemo(() => getEmailBodyHtml(form.emailBody), [form.emailBody])

  async function handleSave() {
    if (!data) return

    try {
      setSaving(true)
      setSaveError(null)
      setSaveSuccess(null)
      const updated = await saveEmailQueue(data.id, form)
      setForm({
        name: updated.name,
        mailbox: updated.mailbox === 'No mailbox captured' ? '' : updated.mailbox,
        emailBody: updated.emailBody,
      })
      setSaveSuccess('Email queue saved successfully.')
      window.setTimeout(() => setSaveSuccess(null), 2500)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Unable to save email queue.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <EmailQueueSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="space-y-4 border-danger/20 bg-danger/5">
        <p className="font-semibold text-danger">{error ?? 'Email queue record not found.'}</p>
        <Button type="button" variant="secondary" onClick={() => navigate('/email-queues')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Email Queues
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Inbox}
        title={data.name}
        eyebrow="Email Queue Workspace"
        description="Review the captured email body, mailbox source, and linked inquiry before downstream conversion."
        actions={
          <>
            <Button type="button" variant="secondary" className="bg-white dark:bg-surface" onClick={() => navigate('/email-queues')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Queue'}
            </Button>
          </>
        }
      />

      {saveError ? (
        <div className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {saveError}
        </div>
      ) : null}
      {saveSuccess ? (
        <div className="rounded-[18px] border border-primary/20 bg-primary/8 px-4 py-3 text-sm font-medium text-primary">
          {saveSuccess}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <div className="space-y-5">
          <Card className="rounded-[28px]">
            <div className="flex items-start justify-between gap-3 border-b border-border-soft pb-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Queue Details</p>
                <h2 className="mt-1 text-xl font-bold">Captured source metadata</h2>
              </div>
              <Badge variant="info">{data.status}</Badge>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Queue Name">
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </Field>
              <Field label="Mailbox">
                <Input value={form.mailbox} onChange={(event) => setForm((current) => ({ ...current, mailbox: event.target.value }))} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoTile label="Created" value={formatDate(data.createdOn)} />
                <InfoTile label="Modified" value={formatDate(data.modifiedOn)} />
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border-primary/10 bg-[linear-gradient(135deg,rgba(40,108,255,0.08),rgba(255,255,255,0.98)_48%,rgba(79,152,255,0.08))] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(40,108,255,0.16),rgba(15,23,42,0.98)_46%,rgba(30,41,59,0.96))]">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow dark:bg-[#4F98FF]">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground dark:text-slate-300">Linked Inquiry</p>
                {data.inquiryId ? (
                  <>
                    <Link
                      to={`/inquiries/${data.inquiryId}`}
                      className="mt-1 block truncate text-xl font-bold text-primary transition hover:text-primary/80 hover:underline dark:text-[#93C5FD] dark:hover:text-white"
                    >
                      {data.inquiryName}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-slate-300">
                      This queue item is already associated with an inquiry record.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="mt-1 text-xl font-bold dark:text-white">No inquiry linked</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-slate-300">
                      The queue email is available for review but has not been matched to an inquiry yet.
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Message Source</p>
                <h2 className="text-lg font-bold">Review and refine the captured email</h2>
              </div>
            </div>
            <textarea
              className="form-field-surface mt-4 min-h-[260px] w-full rounded-[20px] border border-border-soft px-4 py-3 text-sm leading-7 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={form.emailBody}
              onChange={(event) => setForm((current) => ({ ...current, emailBody: event.target.value }))}
              placeholder="Paste or edit captured email body..."
            />
          </Card>
        </div>

        <Card className="overflow-hidden rounded-[30px] p-0">
          <div className="border-b border-border-soft bg-surface-soft/80 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Message View</p>
                  <h2 className="mt-1 text-xl font-bold">Email content</h2>
                </div>
              </div>
              <Badge variant="neutral">Rich Text</Badge>
            </div>
          </div>

          <div className="bg-white px-6 py-6 dark:bg-surface">
            <div className="mx-auto max-w-3xl rounded-[26px] border border-border-soft bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:bg-[#0F172A]">
              <div className="border-b border-border-soft px-5 py-4">
                <p className="text-sm font-semibold">{form.name || data.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">From mailbox: {form.mailbox || 'No mailbox captured'}</p>
              </div>
              <div
                className="prose prose-sm max-w-none px-5 py-5 text-foreground dark:prose-invert prose-p:leading-7 prose-div:leading-7 prose-li:leading-7"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-border-soft bg-surface-soft/80 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function EmailQueueSkeleton() {
  return (
    <>
      <Card className="h-32 animate-pulse bg-surface-soft" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <Card className="h-[520px] animate-pulse bg-surface-soft" />
        <Card className="h-[520px] animate-pulse bg-surface-soft" />
      </div>
    </>
  )
}

function getEmailBodyHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return '<p>No email body captured.</p>'
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed
  return `<p>${escapeHtml(trimmed).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br />')}</p>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
