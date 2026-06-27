import {
  Aur_business_rulesesService,
  Aur_consequencesesService,
  Aur_customdocumenttemplatesesService,
  Cr058_emailtemplatesService,
} from '../generated'
import { Aur_business_rulesesaur_categories } from '../generated/models/Aur_business_rulesesModel'
import type { Aur_consequenceses } from '../generated/models/Aur_consequencesesModel'

export interface BusinessRuleListItem {
  id: string
  name: string
  categoryLabel: string
  parentRuleName: string
  status: string
  identifier: string
  consequenceCount: number
}

export interface BusinessRuleWorkspace {
  rule?: {
    id: string
    name: string
    categoryValue: string
    parentRuleId: string
    parentRuleName: string
    status: string
    createdOn?: string
    modifiedOn?: string
  }
  rules: Array<{
    id: string
    name: string
    categoryValue: string
    categoryLabel: string
    parentRuleId: string
    parentRuleName: string
  }>
  parentRuleOptions: Array<{
    value: string
    label: string
  }>
  documentTemplateOptions: Array<{
    value: string
    label: string
  }>
  emailTemplateOptions: Array<{
    value: string
    label: string
  }>
  consequences: BusinessRuleConsequence[]
}

export interface BusinessRuleConsequence {
  id: string
  name: string
  typeValue: string
  typeLabel: string
  actionValue: string
  actionLabel: string
  notificationText: string
  riskScore: string
  riskSummary: string
  documentTemplateId: string
  documentTemplateName: string
  emailTemplateId: string
  emailTemplateName: string
  businessRuleId: string
  businessRuleName: string
  createdOn?: string
  modifiedOn?: string
}

export interface SaveBusinessRuleInput {
  id?: string
  name: string
  categoryValue?: string
  parentRuleId?: string
}

export interface SaveConsequenceInput {
  id?: string
  businessRuleId: string
  typeValue: string
  actionValue?: string
  notificationText?: string
  riskScore?: string
  riskSummary?: string
  documentTemplateId?: string
  emailTemplateId?: string
}

export const BUSINESS_RULE_CATEGORY_OPTIONS = [
  { value: '1', label: 'Eligibility & Appetite' },
  { value: '2', label: 'Domicile' },
  { value: '3', label: 'Submission Completeness' },
  { value: '4', label: 'Risk' },
  { value: '5', label: 'History' },
  { value: '6', label: 'Financial & Capacity Limits' },
  { value: '7', label: 'Contractual Terms & Clauses' },
] as const

export const CONSEQUENCE_TYPE_OPTIONS = [
  { value: '1', label: 'Case Control' },
  { value: '2', label: 'Notification' },
  { value: '3', label: 'Document' },
  { value: '4', label: 'Risk' },
  { value: '5', label: 'Email' },
] as const

export const CONSEQUENCE_ACTION_OPTIONS = [
  { value: '1', label: 'Decline' },
  { value: '2', label: 'Refer to Underwriter' },
  { value: '3', label: 'Escalate to Head of Aviation' },
  { value: '4', label: 'Property or Reinsurance Team' },
  { value: '5', label: 'Request Missing Information' },
  { value: '6', label: 'Document' },
  { value: '7', label: 'Generate Decline Letter' },
  { value: '8', label: 'Generate Notice of Cancellation' },
  { value: '9', label: 'Update Risk Score' },
  { value: '751820001', label: 'Update Risk Summary' },
  { value: '10', label: 'Email' },
] as const

export const CONSEQUENCE_ACTIONS_BY_TYPE: Record<string, string[]> = {
  '1': ['1', '2', '3', '4'],
  '2': ['5'],
  '3': ['6'],
  '4': ['9', '751820001'],
  '5': ['10'],
}

const PROPERTY_RULE_EXCLUSIONS = new Set([
  'Inclusion Rules',
  'Exclusion Rules',
  'Inquiry',
  'Risk Assessment Score',
])

export async function getBusinessRulesCatalog() {
  const [rulesResult, consequencesResult] = await Promise.all([
    Aur_business_rulesesService.getAll(),
    Aur_consequencesesService.getAll(),
  ])

  const rules = rulesResult.data ?? []
  const consequences = consequencesResult.data ?? []
  const consequenceCountByRule = consequences.reduce((map, consequence) => {
    const ruleId = normalizeDataverseId(consequence._aur_business_rule_value)
    if (!ruleId) return map
    map.set(ruleId, (map.get(ruleId) ?? 0) + 1)
    return map
  }, new Map<string, number>())

  return rules
    .map((rule) => ({
      id: rule.aur_business_rulesid,
      name: rule.aur_name,
      categoryLabel: resolveRuleCategoryLabel(rule.aur_categories),
      parentRuleName: rule.aur_categoryname ?? '',
      status: rule.statuscodename ?? 'Active',
      identifier: shortIdentifier(rule.aur_business_rulesid),
      consequenceCount: consequenceCountByRule.get(normalizeDataverseId(rule.aur_business_rulesid)) ?? 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export async function getBusinessRuleWorkspace(ruleId?: string): Promise<BusinessRuleWorkspace> {
  const [rulesResult, consequencesResult, documentTemplatesResult, emailTemplatesResult] = await Promise.all([
    Aur_business_rulesesService.getAll(),
    Aur_consequencesesService.getAll(),
    Aur_customdocumenttemplatesesService.getAll().catch(() => ({ data: [] })),
    Cr058_emailtemplatesService.getAll().catch(() => ({ data: [] })),
  ])

  const rules = rulesResult.data ?? []
  const consequences = consequencesResult.data ?? []
  const documentTemplates = documentTemplatesResult.data ?? []
  const emailTemplates = emailTemplatesResult.data ?? []
  const currentRule = ruleId
    ? rules.find((rule) => normalizeDataverseId(rule.aur_business_rulesid) === normalizeDataverseId(ruleId))
    : undefined

  const normalizedRules = rules
    .map((rule) => ({
      id: rule.aur_business_rulesid,
      name: rule.aur_name,
      categoryValue: rule.aur_categories ? String(rule.aur_categories) : '',
      categoryLabel: resolveRuleCategoryLabel(rule.aur_categories),
      parentRuleId: rule._aur_category_value ?? '',
      parentRuleName: rule.aur_categoryname ?? '',
    }))
    .sort((left, right) => left.name.localeCompare(right.name))

  const parentRuleOptions = normalizedRules
    .filter((rule) => rule.id !== currentRule?.aur_business_rulesid)
    .filter((rule) => !rule.parentRuleId)
    .filter((rule) => !PROPERTY_RULE_EXCLUSIONS.has(rule.name))
    .map((rule) => ({
      value: rule.id,
      label: rule.name,
    }))

  const workspaceConsequences = consequences
    .filter(
      (consequence) =>
        normalizeDataverseId(consequence._aur_business_rule_value) ===
        normalizeDataverseId(currentRule?.aur_business_rulesid),
    )
    .map((consequence) => mapConsequence(consequence))
    .sort((left, right) => left.name.localeCompare(right.name))

  return {
    rule: currentRule
      ? {
          id: currentRule.aur_business_rulesid,
          name: currentRule.aur_name,
          categoryValue: currentRule.aur_categories ? String(currentRule.aur_categories) : '',
          parentRuleId: currentRule._aur_category_value ?? '',
          parentRuleName: currentRule.aur_categoryname ?? '',
          status: currentRule.statuscodename ?? 'Active',
          createdOn: currentRule.createdon,
          modifiedOn: currentRule.modifiedon,
        }
      : undefined,
    rules: normalizedRules,
    parentRuleOptions,
    documentTemplateOptions: documentTemplates
      .filter((item) => Number(item.statuscode ?? 1) === 1)
      .map((item) => ({
        value: item.aur_customdocumenttemplatesid,
        label: item.aur_name,
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    emailTemplateOptions: emailTemplates
      .filter((item) => Number(item.statuscode ?? 1) === 1)
      .map((item) => ({
        value: item.cr058_emailtemplateid,
        label: item.cr058_templatename,
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    consequences: workspaceConsequences,
  }
}

export async function saveBusinessRule(input: SaveBusinessRuleInput) {
  const payload = {
    aur_name: input.name.trim(),
    ...(input.categoryValue ? { aur_categories: Number(input.categoryValue) as keyof typeof Aur_business_rulesesaur_categories } : {}),
    ...(input.parentRuleId ? { 'aur_category@odata.bind': `/aur_business_ruleses(${input.parentRuleId})` } : { 'aur_category@odata.bind': null }),
  }

  if (input.id) {
    await Aur_business_rulesesService.update(input.id, payload as never)
    return input.id
  }

  const created = await Aur_business_rulesesService.create(payload as never)
  const createdId = created.data?.aur_business_rulesid
  if (!createdId) {
    throw new Error('Business rule was created, but no record id was returned.')
  }
  return createdId
}

export async function saveBusinessRuleConsequence(input: SaveConsequenceInput) {
  const effectiveActionValue =
    input.typeValue === '3'
      ? '6'
      : input.typeValue === '5'
        ? '10'
        : input.actionValue

  const actionLabel = resolveConsequenceActionLabel(effectiveActionValue)
  const payload: Record<string, unknown> = {
    aur_name: actionLabel,
    ...(effectiveActionValue ? { aur_action: Number(effectiveActionValue) } : {}),
    aur_type: Number(input.typeValue) as never,
    aur_notification_text: requiresNotificationText(effectiveActionValue)
      ? input.notificationText?.trim() || undefined
      : undefined,
    aur_riskscore:
      effectiveActionValue === '9' && input.riskScore?.trim()
        ? Number(input.riskScore)
        : null,
    aur_risksummary:
      effectiveActionValue === '751820001'
        ? input.riskSummary?.trim() || null
        : null,
    'aur_DocumentTemplate@odata.bind':
      input.typeValue === '3' && input.documentTemplateId
        ? `/aur_customdocumenttemplateses(${input.documentTemplateId})`
        : null,
    'aur_EmailTemplate@odata.bind':
      input.typeValue === '5' && input.emailTemplateId
        ? `/cr058_emailtemplates(${input.emailTemplateId})`
        : null,
    ...(input.id ? {} : { 'aur_business_rule@odata.bind': `/aur_business_ruleses(${input.businessRuleId})` }),
  }

  if (input.id) {
    await Aur_consequencesesService.update(input.id, payload as never)
    return input.id
  }

  const created = await Aur_consequencesesService.create({
    ...payload,
    'aur_business_rule@odata.bind': `/aur_business_ruleses(${input.businessRuleId})`,
  } as never)
  const createdId = created.data?.aur_consequencesid
  if (!createdId) {
    throw new Error('Consequence was created, but no record id was returned.')
  }
  return createdId
}

export async function deleteBusinessRuleConsequence(id: string) {
  await Aur_consequencesesService.delete(id)
}

export function resolveRuleCategoryLabel(value?: string | number) {
  if (value === undefined || value === null || value === '') return 'Uncategorized'
  const match = BUSINESS_RULE_CATEGORY_OPTIONS.find((option) => option.value === String(value))
  return match?.label ?? humanizeToken(Aur_business_rulesesaur_categories[value as keyof typeof Aur_business_rulesesaur_categories] ?? String(value))
}

export function resolveConsequenceTypeLabel(value?: string | number) {
  if (value === undefined || value === null || value === '') return 'Unknown type'
  return (
    CONSEQUENCE_TYPE_OPTIONS.find((option) => option.value === String(value))?.label ??
    humanizeToken(String(value))
  )
}

export function resolveConsequenceActionLabel(value?: string | number) {
  if (value === undefined || value === null || value === '') return 'Unknown action'
  return (
    CONSEQUENCE_ACTION_OPTIONS.find((option) => option.value === String(value))?.label ??
    humanizeToken(String(value))
  )
}

export function requiresNotificationText(actionValue?: string) {
  return actionValue === '5'
}

function mapConsequence(consequence: Aur_consequenceses): BusinessRuleConsequence {
  const consequenceRecord = consequence as Aur_consequenceses & {
    aur_riskscore?: number | string | null
    aur_risksummary?: string | null
    aur_emailtemplatename?: string
    _aur_emailtemplate_value?: string
  }
  return {
    id: consequence.aur_consequencesid,
    name: consequence.aur_name || resolveConsequenceActionLabel(consequence.aur_action),
    typeValue: consequence.aur_type ? String(consequence.aur_type) : '',
    typeLabel: consequence.aur_typename || resolveConsequenceTypeLabel(consequence.aur_type),
    actionValue: consequence.aur_action ? String(consequence.aur_action) : '',
    actionLabel: consequence.aur_actionname || resolveConsequenceActionLabel(consequence.aur_action),
    notificationText: consequence.aur_notification_text ?? '',
    riskScore:
      consequenceRecord.aur_riskscore === undefined || consequenceRecord.aur_riskscore === null
        ? ''
        : String(consequenceRecord.aur_riskscore),
    riskSummary: consequenceRecord.aur_risksummary ?? '',
    documentTemplateId: consequence._aur_documenttemplate_value ?? '',
    documentTemplateName: consequence.aur_documenttemplatename ?? '',
    emailTemplateId: consequenceRecord._aur_emailtemplate_value ?? '',
    emailTemplateName: consequenceRecord.aur_emailtemplatename ?? '',
    businessRuleId: consequence._aur_business_rule_value ?? '',
    businessRuleName: consequence.aur_business_rulename ?? 'Business Rule',
    createdOn: consequence.createdon,
    modifiedOn: consequence.modifiedon,
  }
}

function shortIdentifier(id: string) {
  return id.replace(/[{}]/g, '').slice(0, 8).toUpperCase()
}

function humanizeToken(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeDataverseId(value?: string | null) {
  return value?.replace(/[{}]/g, '').toLowerCase() ?? ''
}
