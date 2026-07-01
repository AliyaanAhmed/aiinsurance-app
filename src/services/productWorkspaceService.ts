import {
  Aur_business_rulesesService,
  Aur_plansService,
  Aur_productsesService,
  Cr058_productrulelink1sService,
} from '../generated'
import type { AdminCatalogItem, ProductWorkspace } from '../domain/app'
import { mapProductSummary } from './dataMappers'

function normalizeId(value?: string | null) {
  return (value ?? '').replace(/[{}]/g, '').trim().toLowerCase()
}

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
  const [productsResult, plansResult, rulesResult, productRuleLinksResult] = await Promise.all([
    Aur_productsesService.getAll(),
    Aur_plansService.getAll(),
    Aur_business_rulesesService.getAll(),
    Cr058_productrulelink1sService.getAll().catch(() => ({ data: [] })),
  ])

  const products = productsResult.data ?? []
  const current = productId ? products.find((product) => product.aur_productsid === productId) : undefined
  const productRuleLinks = productRuleLinksResult.data ?? []
  const normalizedProductId = normalizeId(productId)
  const associatedRuleIds = productId
    ? productRuleLinks
        .filter((link) => normalizeId(link.cr058_productid) === normalizedProductId)
        .map((link) => normalizeId(link.cr058_businessruleid))
        .filter(Boolean)
    : []

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
        applyActionAutomatically: Boolean((current as typeof current & { aur_apply_action_automatically?: boolean | null }).aur_apply_action_automatically),
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
          applyActionAutomatically: false,
        },
    availablePlans: (plansResult.data ?? [])
      .filter((plan) => !productId || plan._aur_product_value === productId)
      .map(mapPlanRecord),
    availableRules: (rulesResult.data ?? []).map(mapRuleRecord),
    associatedRuleIds,
    relationshipNotice: undefined,
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
  applyActionAutomatically?: boolean
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
    aur_apply_action_automatically: payload.applyActionAutomatically ?? false,
  }

  if (payload.id) {
    await Aur_productsesService.update(payload.id, record)
    return
  }

  await Aur_productsesService.create(record as never)
}

export async function updateProductAutoActionSetting(productId: string, applyAutomatically: boolean) {
  await Aur_productsesService.update(
    productId,
    {
      aur_apply_action_automatically: applyAutomatically,
    } as never,
  )
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

export async function saveProductRuleAssociations(input: {
  productId: string
  productName: string
  selectedRuleIds: string[]
}) {
  const [linksResult, rulesResult] = await Promise.all([
    Cr058_productrulelink1sService.getAll(),
    Aur_business_rulesesService.getAll(),
  ])
  const links = linksResult.data ?? []
  const rules = rulesResult.data ?? []
  const normalizedProductId = normalizeId(input.productId)
  const existingLinks = links.filter((link) => normalizeId(link.cr058_productid) === normalizedProductId)
  const existingRuleIds = new Set(existingLinks.map((link) => normalizeId(link.cr058_businessruleid)))
  const selectedRuleIds = Array.from(new Set(input.selectedRuleIds.map((id) => normalizeId(id)).filter(Boolean)))
  const ruleNameMap = new Map(
    rules.map((rule) => [normalizeId(rule.aur_business_rulesid), rule.aur_name]),
  )

  const linksToAdd = selectedRuleIds.filter((ruleId) => !existingRuleIds.has(ruleId))
  const linksToRemove = existingLinks.filter((link) => !selectedRuleIds.includes(normalizeId(link.cr058_businessruleid)))

  for (const ruleId of linksToAdd) {
    await Cr058_productrulelink1sService.create({
      cr058_name: `${input.productName} - ${ruleNameMap.get(ruleId) ?? ruleId}`,
      cr058_productid: input.productId,
      cr058_businessruleid: ruleId,
    } as never)
  }

  for (const link of linksToRemove) {
    await Cr058_productrulelink1sService.delete(link.cr058_productrulelink1id)
  }
}

export async function removeProductRuleAssociation(input: {
  productId: string
  businessRuleId: string
}) {
  const linksResult = await Cr058_productrulelink1sService.getAll()
  const links = linksResult.data ?? []
  const normalizedProductId = normalizeId(input.productId)
  const normalizedRuleId = normalizeId(input.businessRuleId)
  const match = links.find(
    (link) =>
      normalizeId(link.cr058_productid) === normalizedProductId &&
      normalizeId(link.cr058_businessruleid) === normalizedRuleId,
  )

  if (!match) return
  await Cr058_productrulelink1sService.delete(match.cr058_productrulelink1id)
}
