import type { LucideIcon } from 'lucide-react'

export type AppRole = 'underwriter' | 'seniorUnderwriter' | 'administrator'

export type AccessBucket = 'leads' | 'products' | 'admin'

export interface RouteDefinition {
  path: string
  label: string
  bucket?: AccessBucket
  icon: LucideIcon
  group: string
  disabled?: boolean
}

export interface AppUser {
  name: string
  initials: string
  role: AppRole
  roleLabel: string
  email?: string
  phone?: string
}

export interface TableQueryState {
  search: string
  sortBy?: string
  descending?: boolean
}

export interface ProductSummary {
  id: string
  name: string
  shortDetails: string
  status: string
  inquiryVolume: number
  premiumTotal: number
  insuredTotal: number
  emailAddress: string
  heading: string
}

export type AdminEntityKey =
  | 'policies'
  | 'plans'
  | 'coverages'
  | 'benefits'
  | 'inclusions'
  | 'exclusions'
  | 'warranties'
  | 'deductibles'
  | 'business-rules'
  | 'accounts'
  | 'contacts'
  | 'brokers'
  | 'business-units'
  | 'users'
  | 'email-templates'
  | 'document-templates'

export interface AdminCatalogItem {
  id: string
  name: string
  description: string
  status: string
  context: string
  contextTone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  detail?: string
  productId?: string
  planId?: string
}

export interface AdminCatalogStats {
  total: number
  active: number
  linked: number
  unassigned: number
}

export interface AdminCatalogDataset {
  entity: AdminEntityKey
  title: string
  description: string
  createLabel: string
  records: AdminCatalogItem[]
  stats: AdminCatalogStats
}

export interface ProductWorkspace {
  summary?: ProductSummary
  metadata?: {
    arabicName: string
    premiumPercentage: string
    details: string
    shortDetails: string
    heading: string
    buyHeading: string
    buyButton: string
    slogan: string
    remarks: string
    terms: string
    emailAddress: string
    order: string
    status: 'draft' | 'publish'
  }
  availablePlans: AdminCatalogItem[]
  availableRules: AdminCatalogItem[]
  relationshipNotice?: string
}

export interface InquirySummary {
  id: string
  name: string
  inquiryNumber: string
  inquiryType: string
  status: string
  inquiryStatusValue?: number
  accountId?: string
  accountName: string
  contactName: string
  brokerId?: string
  brokerName: string
  productId?: string
  productName: string
  planId?: string
  planName: string
  riskScore: number
  grossPremium: number
  totalInsured: number
  createdOn: string
  summary: string
  sharepointUrl: string
}

export interface InquiryDetail extends InquirySummary {
  riskDescription: string
  paymentTerm: string
  territorialScope: string
  coverType: string
  fee: number
  declaredValue: number
  totalCharge: number
  aiSummary: string
  account?: RelatedParty
  contact?: RelatedParty
  broker?: RelatedParty
  quotes: QuoteSummary[]
  quoteDetails: QuoteResponse[]
  readiness: ReadinessMetric[]
  workflow: WorkflowStep[]
  consequences: ConsequenceDefinition[]
  consequenceResults: ConsequenceResultSummary[]
  aiRuleGroups: InquiryRuleGroup[]
  productRuleLinkNotice?: string
  emailTimeline: InquiryEmailSummary[]
}

export interface InquiryRuleGroup {
  category: string
  rules: Array<{
    id: string
    name: string
    response: string
    evidence: string
    conditionMet: string
  }>
}

export interface InquiryEmailSummary {
  id: string
  subject: string
  body: string
  sender: string
  toRecipients: string
  regardingId?: string
  status: string
  direction: 'sent' | 'received'
  createdOn?: string
  attachments: InquiryEmailAttachment[]
}

export interface InquiryEmailAttachment {
  id: string
  name: string
  mimeType?: string
  sizeLabel?: string
}

export interface QuoteSummary {
  id: string
  inquiryId: string
  name: string
  status: string
  productName: string
  planName: string
  totalPremium: number
  grossPremium: number
  vat: number
  aiSummary: string
  reason: string
  createdOn: string
}

export interface QuoteDetail extends QuoteSummary {
  loadingPremium: number
  benefitsName: string
  coverageName: string
  deductibleName: string
  exclusionName: string
  inclusionName: string
  warrantyName: string
  inquiry?: InquirySummary
  responses: QuoteResponse[]
  emailTemplates: EmailTemplateSummary[]
  documentTemplates: DocumentTemplateSummary[]
}

export interface QuoteResponse {
  id: string
  businessRuleId?: string
  businessRuleName: string
  businessRuleCategory: string
  name: string
  response: string
  evidence: string
  conditionMet: string
  status: string
}

export interface RenewalSummary {
  id: string
  policyNumber: string
  client: string
  product: string
  expiryDate: string
  daysRemaining: number
  status: string
  reminderCount: number
  premiumTotal: number
  reminderSent?: boolean
  inquiryId?: string
  quoteId?: string
}

export interface PolicyWorkspace {
  id: string
  policyNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  productName: string
  productId?: string
  issueDate: string
  expiryDate: string
  daysRemaining: number
  premiumAmount: number
  status: string
  reminderSent: boolean
  reminderCount: number
  notes: string
  inquiryId?: string
  inquiryName?: string
  quoteId?: string
  quoteName?: string
}

export interface RelatedParty {
  id: string
  name: string
  email?: string
  phone?: string
  subtitle?: string
}

export interface ReadinessMetric {
  label: string
  value: number
  description: string
}

export interface WorkflowStep {
  label: string
  complete: boolean
  tone?: 'primary' | 'success' | 'warning' | 'secondary' | 'info'
}

export interface ConsequenceDefinition {
  id: string
  businessRuleId?: string
  businessRuleName: string
  name: string
  action: string
  type: string
  notificationText: string
  documentTemplateName?: string
}

export interface ConsequenceResultSummary {
  id: string
  consequenceId?: string
  consequenceName: string
  name: string
  action: string
  type: string
  createdOn?: string
}

export interface EmailTemplateSummary {
  id: string
  name: string
  subject: string
  body: string
  category: string
  isActive: boolean
}

export interface DocumentTemplateSummary {
  id: string
  name: string
  content: string
}

export interface AdminDetailField {
  label: string
  value: string
}

export interface AdminDetailRecord {
  id: string
  title: string
  description: string
  status: string
  eyebrow: string
  fields: AdminDetailField[]
}

export interface KpiMetric {
  label: string
  value: number
  helper: string
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info'
}

export interface ChartDatum {
  label: string
  value: number
}

export interface DashboardMetrics {
  previewMode: boolean
  greeting: string
  heroDescription: string
  heroMetrics: KpiMetric[]
  inquiryKpis: KpiMetric[]
  quoteKpis: KpiMetric[]
  renewalKpis: KpiMetric[]
  inquiryMix: ChartDatum[]
  quoteStatusMix: ChartDatum[]
  topProducts: ChartDatum[]
  recentInquiries: InquirySummary[]
  recentQuotes: QuoteSummary[]
  insightCards: Array<{
    title: string
    text: string
    tone: KpiMetric['tone']
  }>
}

export interface AnalyticsSnapshot {
  totalPremium: number
  averageRiskScore: number
  renewalLoad: number
  quoteWinRate: number
  inquiryTrend: ChartDatum[]
  premiumTrend: ChartDatum[]
  productDistribution: ChartDatum[]
  statusDistribution: ChartDatum[]
  riskDistribution: ChartDatum[]
  drilldown: Array<{
    label: string
    inquiries: number
    quotes: number
    premium: number
  }>
  conversionFunnel: Array<{
    label: string
    value: number
    helper: string
    tone: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'info'
  }>
}
