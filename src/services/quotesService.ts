import { Aur_benefitsesService } from '../generated/services/Aur_benefitsesService'
import { Aur_coveragesesService } from '../generated/services/Aur_coveragesesService'
import { Aur_customdocumenttemplatesesService } from '../generated/services/Aur_customdocumenttemplatesesService'
import { Aur_deductiblesesService } from '../generated/services/Aur_deductiblesesService'
import { Aur_exclusionsesService } from '../generated/services/Aur_exclusionsesService'
import { Aur_inclusionsesService } from '../generated/services/Aur_inclusionsesService'
import { Aur_plansService } from '../generated/services/Aur_plansService'
import { Aur_productsesService } from '../generated/services/Aur_productsesService'
import { Aur_quotes_detailsesService } from '../generated/services/Aur_quotes_detailsesService'
import { Aur_quotesService } from '../generated/services/Aur_quotesService'
import { Aur_quotesesService } from '../generated/services/Aur_quotesesService'
import { Aur_warrantiesesService } from '../generated/services/Aur_warrantiesesService'
import { Cr058_emailtemplatesService } from '../generated/services/Cr058_emailtemplatesService'
import type {
  DocumentTemplateSummary,
  EmailTemplateSummary,
  QuoteDetail,
  QuoteSummary,
} from '../domain/app'
import { mapInquirySummary, mapQuoteDetail, mapQuoteResponse, mapQuoteSummary } from './dataMappers'

export async function listQuotes(): Promise<QuoteSummary[]> {
  const [quotesResult, productsResult, plansResult] = await Promise.all([
    Aur_quotesService.getAll({
      orderBy: ['createdon desc'],
    }),
    Aur_productsesService.getAll(),
    Aur_plansService.getAll(),
  ])
  const productMap = new Map((productsResult.data ?? []).map((product) => [product.aur_productsid, product.aur_name]))
  const planMap = new Map((plansResult.data ?? []).map((plan) => [plan.aur_planid, plan.aur_name ?? 'Unnamed plan']))
  return (quotesResult.data ?? []).map((quote) => mapQuoteSummary(resolveQuoteRelations(quote, productMap, planMap)))
}

export async function getQuoteDetail(id: string): Promise<QuoteDetail> {
  const [quoteResult, inquiriesResult, detailResult, emailTemplatesResult, documentTemplatesResult, productsResult, plansResult] = await Promise.all([
    Aur_quotesService.get(id),
    Aur_quotesesService.getAll(),
    Aur_quotes_detailsesService.getAll(),
    Cr058_emailtemplatesService.getAll(),
    Aur_customdocumenttemplatesesService.getAll(),
    Aur_productsesService.getAll(),
    Aur_plansService.getAll(),
  ])

  const productMap = new Map((productsResult.data ?? []).map((product) => [product.aur_productsid, product.aur_name]))
  const planMap = new Map((plansResult.data ?? []).map((plan) => [plan.aur_planid, plan.aur_name ?? 'Unnamed plan']))
  const quote = quoteResult.data ? resolveQuoteRelations(quoteResult.data, productMap, planMap) : undefined
  if (!quote) throw new Error('Quote not found.')

  const inquiry = (inquiriesResult.data ?? []).find((item) => item.aur_quotesid === quote._aur_quotes_value)
  const responses = (detailResult.data ?? [])
    .filter((item) => item._aur_quotes_value === id)
    .map(mapQuoteResponse)
  const emailTemplates = (emailTemplatesResult.data ?? [])
    .filter((template) => {
      const category = template.cr058_categoryname?.toLowerCase() ?? ''
      return category === 'quote' || category === 'general'
    })
    .map<EmailTemplateSummary>((template) => ({
      id: template.cr058_emailtemplateid,
      name: template.cr058_templatename,
      subject: template.cr058_subject,
      body: template.cr058_body,
      category: template.cr058_categoryname ?? 'General',
      isActive: template.cr058_isactive ?? false,
    }))
  const documentTemplates = (documentTemplatesResult.data ?? []).map<DocumentTemplateSummary>((template) => ({
    id: template.aur_customdocumenttemplatesid,
    name: template.aur_name,
    content: template.aur_templatecontent ?? '',
  }))

  return mapQuoteDetail(
    quote,
    inquiry ? mapInquirySummary(inquiry) : undefined,
    responses,
    emailTemplates,
    documentTemplates,
  )
}

export async function getQuoteEditorOptions() {
  const [
    productsResult,
    plansResult,
    coveragesResult,
    benefitsResult,
    inclusionsResult,
    exclusionsResult,
    deductiblesResult,
    warrantiesResult,
  ] = await Promise.all([
    Aur_productsesService.getAll(),
    Aur_plansService.getAll(),
    Aur_coveragesesService.getAll(),
    Aur_benefitsesService.getAll(),
    Aur_inclusionsesService.getAll(),
    Aur_exclusionsesService.getAll(),
    Aur_deductiblesesService.getAll(),
    Aur_warrantiesesService.getAll(),
  ])

  return {
    products: (productsResult.data ?? []).map((record) => ({ id: record.aur_productsid, name: record.aur_name })),
    plans: (plansResult.data ?? []).map((record) => ({ id: record.aur_planid, name: record.aur_name ?? 'Unnamed plan' })),
    coverages: (coveragesResult.data ?? []).map((record) => ({ id: record.aur_coveragesid, name: record.aur_name })),
    benefits: (benefitsResult.data ?? []).map((record) => ({ id: record.aur_benefitsid, name: record.aur_name })),
    inclusions: (inclusionsResult.data ?? []).map((record) => ({ id: record.aur_inclusionsid, name: record.aur_name })),
    exclusions: (exclusionsResult.data ?? []).map((record) => ({ id: record.aur_exclusionsid, name: record.aur_name })),
    deductibles: (deductiblesResult.data ?? []).map((record) => ({ id: record.aur_deductiblesid, name: record.aur_name })),
    warranties: (warrantiesResult.data ?? []).map((record) => ({ id: record.aur_warrantiesid, name: record.aur_name })),
  }
}

export async function saveQuoteDetail(
  id: string,
  payload: {
    name: string
    totalPremium: number
    grossPremium: number
    vat: number
    loadingPremium: number
    reason: string
    aiSummary: string
    productId?: string
    planId?: string
    coverageId?: string
    benefitsId?: string
    inclusionsId?: string
    exclusionsId?: string
    deductiblesId?: string
    warrantiesId?: string
    quoteStatus?: 'QuoteWon' | 'QuoteLost'
  },
) {
  await Aur_quotesService.update(id, {
    aur_name: payload.name,
    aur_total_premium: payload.totalPremium,
    aur_gross_premium: payload.grossPremium,
    aur_vat: payload.vat,
    aur_loading_premium: payload.loadingPremium,
    aur_reason: payload.reason,
    aur_ai_generated_summary: payload.aiSummary,
    ...(payload.productId ? { 'aur_product@odata.bind': `/aur_productses(${payload.productId})` } : {}),
    ...(payload.planId ? { 'aur_plan@odata.bind': `/aur_plans(${payload.planId})` } : {}),
    ...(payload.coverageId ? { 'aur_coverage@odata.bind': `/aur_coverageses(${payload.coverageId})` } : {}),
    ...(payload.benefitsId ? { 'aur_benefits@odata.bind': `/aur_benefitses(${payload.benefitsId})` } : {}),
    ...(payload.inclusionsId ? { 'aur_inclusions@odata.bind': `/aur_inclusionses(${payload.inclusionsId})` } : {}),
    ...(payload.exclusionsId ? { 'aur_exclusions@odata.bind': `/aur_exclusionses(${payload.exclusionsId})` } : {}),
    ...(payload.deductiblesId ? { 'aur_deductibles@odata.bind': `/aur_deductibleses(${payload.deductiblesId})` } : {}),
    ...(payload.warrantiesId ? { 'aur_warranties@odata.bind': `/aur_warrantieses(${payload.warrantiesId})` } : {}),
    ...(payload.quoteStatus
      ? { aur_quote_status: payload.quoteStatus === 'QuoteWon' ? 751820000 : 751820001 }
      : {}),
  })
}

function resolveQuoteRelations(
  quote: Awaited<ReturnType<typeof Aur_quotesService.get>>['data'] extends infer T ? NonNullable<T> : never,
  productMap: Map<string, string>,
  planMap: Map<string, string>,
) {
  return {
    ...quote,
    aur_productname:
      quote.aur_productname || !quote._aur_product_value
        ? quote.aur_productname
        : productMap.get(quote._aur_product_value) ?? quote.aur_productname,
    aur_planname:
      quote.aur_planname || !quote._aur_plan_value
        ? quote.aur_planname
        : planMap.get(quote._aur_plan_value) ?? quote.aur_planname,
  }
}
