import { Aur_email_queuesesService } from '../generated/services/Aur_email_queuesesService'
import type { Aur_email_queueses } from '../generated/models/Aur_email_queuesesModel'
import type { EmailQueueDetail, EmailQueueSummary } from '../domain/app'

export interface EmailQueueSaveInput {
  name: string
  mailbox: string
  emailBody: string
}

export async function listEmailQueues(): Promise<EmailQueueSummary[]> {
  const result = await Aur_email_queuesesService.getAll({ orderBy: ['createdon desc'] })
  return (result.data ?? []).map(mapEmailQueueSummary)
}

export async function getEmailQueueDetail(id: string): Promise<EmailQueueDetail> {
  const result = await Aur_email_queuesesService.get(id)
  const record = result.data
  if (!record) throw new Error('Email queue record not found.')

  return mapEmailQueueDetail(record)
}

export async function saveEmailQueue(id: string, input: EmailQueueSaveInput): Promise<EmailQueueDetail> {
  await Aur_email_queuesesService.update(id, {
    aur_name: input.name,
    aur_mail_box: input.mailbox,
    aur_email_body: input.emailBody,
  })

  return getEmailQueueDetail(id)
}

function mapEmailQueueSummary(record: Aur_email_queueses): EmailQueueSummary {
  const body = record.aur_email_body ?? ''
  return {
    id: record.aur_email_queuesid,
    name: record.aur_name || 'Untitled email queue',
    mailbox: record.aur_mail_box || 'No mailbox captured',
    inquiryId: readLookupId(record, '_aur_inquiry_value'),
    inquiryName: readFormattedValue(record, '_aur_inquiry_value') || record.aur_inquiryname || 'No inquiry linked',
    bodyPreview: htmlToPlainText(body) || 'No email body captured.',
    status: record.statuscodename || record.statecodename || 'Active',
    createdOn: record.createdon,
    modifiedOn: record.modifiedon,
  }
}

function mapEmailQueueDetail(record: Aur_email_queueses): EmailQueueDetail {
  return {
    ...mapEmailQueueSummary(record),
    emailBody: record.aur_email_body ?? '',
  }
}

function readLookupId(record: object, key: string) {
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' ? normalizeDataverseId(value) : undefined
}

function readFormattedValue(record: object, key: string) {
  const value = (record as Record<string, unknown>)[`${key}@OData.Community.Display.V1.FormattedValue`]
  return typeof value === 'string' ? value : ''
}

function normalizeDataverseId(value?: string | null) {
  return value?.replace(/[{}]/g, '').toLowerCase() ?? ''
}

function htmlToPlainText(value: string) {
  if (!value.trim()) return ''
  if (typeof DOMParser === 'undefined') return value.replace(/<[^>]+>/g, ' ')

  const document = new DOMParser().parseFromString(value, 'text/html')
  return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}
