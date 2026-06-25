import { Cr058_emailtemplatesService } from '../generated/services/Cr058_emailtemplatesService'
import { Aur_customdocumenttemplatesesService } from '../generated/services/Aur_customdocumenttemplatesesService'
import { Aur_quotesService } from '../generated/services/Aur_quotesService'
import { Aur_quotesesService } from '../generated/services/Aur_quotesesService'
import type { DashboardMetrics } from '../domain/app'
import {
  countByType,
  isRenewal,
  mapInquirySummary,
  mapQuoteSummary,
} from './dataMappers'

function isPreviewMode() {
  return !window.location.hostname.includes('powerapps.com') &&
    !window.location.hostname.includes('powerplatformusercontent.com')
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [inquiriesResult, quotesResult, emailTemplatesResult, documentTemplatesResult] =
    await Promise.all([
      Aur_quotesesService.getAll({ orderBy: ['createdon desc'] }),
      Aur_quotesService.getAll({ orderBy: ['createdon desc'] }),
      Cr058_emailtemplatesService.getAll().catch(() => ({ data: [] })),
      Aur_customdocumenttemplatesesService.getAll().catch(() => ({ data: [] })),
    ])

  const inquiries = inquiriesResult.data ?? []
  const quotes = quotesResult.data ?? []
  const emailTemplates = emailTemplatesResult.data ?? []
  const documentTemplates = documentTemplatesResult.data ?? []
  const wonQuotes = quotes.filter((quote) => quote.aur_quote_statusname === 'QuoteWon')

  const topProducts = Array.from(
    inquiries.reduce((map, inquiry) => {
      const key = inquiry.aur_productname ?? 'Unassigned Product'
      map.set(key, (map.get(key) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }))

  return {
    previewMode: isPreviewMode(),
    greeting: 'Welcome back, Anees Ur Rehman',
    heroDescription:
      'Monitor inquiry intake, quote conversion, renewal readiness, template health, and live Dataverse-backed insurance records from one premium command center.',
    heroMetrics: [
      {
        label: 'Intake Pipeline',
        value: inquiries.length,
        helper: `${Math.max(inquiries.length - 2, 0)} active submissions and ${quotes.length} linked quote records`,
        tone: 'primary',
      },
      {
        label: 'Renewal Watch',
        value: inquiries.filter(isRenewal).length,
        helper: 'Renewal-focused records tracked from the inquiry dataset',
        tone: 'success',
      },
      {
        label: 'Template Readiness',
        value: emailTemplates.length + documentTemplates.length,
        helper: `${emailTemplates.length} email templates and ${documentTemplates.length} document templates`,
        tone: 'secondary',
      },
    ],
    inquiryKpis: [
      {
        label: 'Total Inquiries',
        value: inquiries.length,
        helper: 'All intake submissions captured in Dataverse',
        tone: 'primary',
      },
      {
        label: 'Awaiting Review',
        value: inquiries.filter((item) => (item.statuscodename ?? '').includes('Ready')).length,
        helper: 'Items progressing toward quote generation',
        tone: 'warning',
      },
      {
        label: 'Average Risk Score',
        value:
          inquiries.length === 0
            ? 0
            : Math.round(
                inquiries.reduce((sum, item) => sum + (item.aur_risk_score ?? 0), 0) /
                  inquiries.length,
              ),
        helper: 'Live average across inquiry records',
        tone: 'secondary',
      },
    ],
    quoteKpis: [
      {
        label: 'Quotes Generated',
        value: quotes.length,
        helper: `${wonQuotes.length} marked won`,
        tone: 'success',
      },
      {
        label: 'Premium Total',
        value: Math.round(quotes.reduce((sum, item) => sum + (item.aur_total_premium ?? 0), 0)),
        helper: 'Quoted premium across the portfolio',
        tone: 'info',
      },
      {
        label: 'Lost Quotes',
        value: quotes.filter((item) => item.aur_quote_statusname === 'QuoteLost').length,
        helper: 'Outcome reasons remain visible for review',
        tone: 'danger',
      },
    ],
    renewalKpis: [
      {
        label: 'Renewal Due',
        value: inquiries.filter(isRenewal).length,
        helper: 'Renewal workload derived from inquiry type',
        tone: 'warning',
      },
      {
        label: 'Template Library',
        value: documentTemplates.length,
        helper: 'Dataverse-backed custom document templates',
        tone: 'info',
      },
      {
        label: 'Email Templates',
        value: emailTemplates.length,
        helper: 'Communication templates ready for workflows',
        tone: 'secondary',
      },
    ],
    inquiryMix: countByType(inquiries),
    quoteStatusMix: Array.from(
      quotes.reduce((map, quote) => {
        const key = quote.aur_quote_statusname ?? 'Open'
        map.set(key, (map.get(key) ?? 0) + 1)
        return map
      }, new Map<string, number>()),
    ).map(([label, value]) => ({ label, value })),
    topProducts,
    recentInquiries: inquiries.slice(0, 5).map(mapInquirySummary),
    recentQuotes: quotes.slice(0, 5).map(mapQuoteSummary),
    insightCards: [
      {
        title: 'Preview-safe home fallback',
        text: isPreviewMode()
          ? 'This route is rendering in preview mode outside the hosted Power Apps player, so the shell remains visible instead of showing a blank screen.'
          : 'Hosted runtime detected. Dashboard widgets are reading live Dataverse-backed records.',
        tone: 'info',
      },
      {
        title: 'Underwriting posture',
        text: `${inquiries.filter((item) => item.aur_risk_score && item.aur_risk_score >= 70).length} inquiries currently carry higher risk scores and should be watched closely.`,
        tone: 'warning',
      },
      {
        title: 'Conversion focus',
        text: `${wonQuotes.length} quotes are already marked won while ${quotes.length - wonQuotes.length} remain open or lost.`,
        tone: 'success',
      },
    ],
  }
}
