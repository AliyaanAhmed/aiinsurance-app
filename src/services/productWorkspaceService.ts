import {
  Aur_business_rulesesService,
  Aur_plansService,
  Aur_productsesService,
} from '../generated'
import type { AdminCatalogItem, ProductWorkspace } from '../domain/app'
import { mapProductSummary } from './dataMappers'

function mapPlanRecord(plan: Awaited<ReturnType<typeof Aur_plansService.getAll>>['data'][number]): AdminCatalogItem {
  return {
    id: plan.aur_planid,
    name: plan.aur_name ?? 'Unnamed plan',
    description: plan.aur_description ?? 'No plan description has been captured yet.',
    status: plan.statuscodename ?? 'Active',
    context: plan.aur_productname ?? 'Unassigned',
    detail: plan.createdon ? `Created ${new Date(plan.createdon).toLocaleDateString('en')}` : 'Product-linked plan',
    productId: plan._aur_product_value,
  }
}

function mapRuleRecord(rule: Awaited<ReturnType<typeof Aur_business_rulesesService.getAll>>['data'][number]): AdminCatalogItem {
  return {
    id: rule.aur_business_rulesid,
    name: rule.aur_name,
    description: rule.aur_categoryname ?? 'No linked category record yet.',
    status: rule.statuscodename ?? 'Active',
    context: rule.aur_categoriesname ?? 'Rule Library',
    detail: 'Underwriting rule',
  }
}

export async function getProductWorkspace(productId?: string): Promise<ProductWorkspace> {
  const [productsResult, plansResult, rulesResult] = await Promise.all([
    Aur_productsesService.getAll(),
    Aur_plansService.getAll(),
    Aur_business_rulesesService.getAll(),
  ])

  const products = productsResult.data ?? []
  const current = productId ? products.find((product) => product.aur_productsid === productId) : undefined

  return {
    summary: current ? mapProductSummary(current) : undefined,
    metadata: current
      ? {
          arabicName: current.aur_product_name_ar ?? '',
          premiumPercentage: current.aur_premium ?? '',
          details: current.aur_details ?? '',
          shortDetails: current.aur_short_details ?? '',
          heading: current.aur_heading ?? '',
          buyHeading: current.aur_buy_heading ?? '',
          buyButton: current.aur_buy_button ?? '',
          slogan: current.aur_slogan ?? '',
          remarks: current.aur_remarks ?? '',
          terms: current.aur_terms_conditions ?? '',
          emailAddress: current.aur_incomingemailaddress ?? '',
          order: current.aur_order ?? '',
          status: current.aur_product_statusname?.toLowerCase().includes('publish') ? 'publish' : 'draft',
        }
      : {
          arabicName: '',
          premiumPercentage: '',
          details: '',
          shortDetails: '',
          heading: '',
          buyHeading: '',
          buyButton: '',
          slogan: '',
          remarks: '',
          terms: '',
          emailAddress: '',
          order: '',
          status: 'draft',
        },
    availablePlans: (plansResult.data ?? [])
      .filter((plan) => !productId || plan._aur_product_value === productId)
      .map(mapPlanRecord),
    availableRules: (rulesResult.data ?? []).map(mapRuleRecord),
    relationshipNotice:
      'Product-to-rule assignment UI is ready, but Dataverse persistence still needs the exact junction-table logical name because product_rule_link1 returned 404 from the environment.',
  }
}

export async function saveProductWorkspace(payload: {
  id?: string
  name: string
  shortDetails?: string
  details?: string
  heading?: string
  slogan?: string
  emailAddress?: string
  buyHeading?: string
  buyButton?: string
  terms?: string
  remarks?: string
  arabicName?: string
  order?: string
  premiumPercentage?: string
  status?: 'draft' | 'publish'
}) {
  const productStatus: 751820000 | 751820001 =
    payload.status === 'publish' ? 751820001 : 751820000
  const statusCode: 1 | 751820001 = payload.status === 'publish' ? 751820001 : 1
  const record = {
    aur_name: payload.name,
    aur_short_details: payload.shortDetails,
    aur_details: payload.details,
    aur_heading: payload.heading,
    aur_slogan: payload.slogan,
    aur_incomingemailaddress: payload.emailAddress,
    aur_buy_heading: payload.buyHeading,
    aur_buy_button: payload.buyButton,
    aur_terms_conditions: payload.terms,
    aur_remarks: payload.remarks,
    aur_product_name_ar: payload.arabicName,
    aur_order: payload.order,
    aur_premium: payload.premiumPercentage,
    aur_product_status: productStatus,
    statuscode: statusCode,
  }

  if (payload.id) {
    await Aur_productsesService.update(payload.id, record)
    return
  }

  await Aur_productsesService.create(record as never)
}

export async function createProductPlan(productId: string, input: { name: string; description: string }) {
  await Aur_plansService.create({
    aur_name: input.name,
    aur_description: input.description,
    'aur_product@odata.bind': `/aur_productses(${productId})`,
  } as never)
}

export async function updateProductPlan(planId: string, input: { name: string; description: string }) {
  await Aur_plansService.update(planId, {
    aur_name: input.name,
    aur_description: input.description,
  })
}

export async function deleteProductPlan(planId: string) {
  await Aur_plansService.delete(planId)
}
