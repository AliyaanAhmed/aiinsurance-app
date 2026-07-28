import { z } from 'zod'

export const blockTypes = [
  'navbar',
  'hero',
  'logosBand',
  'servicesGrid',
  'leadForm',
  'testimonials',
  'statsBand',
  'faq',
  'ctaBanner',
  'footer',
  'dynamicChart',
  'insuranceCalculator',
  'pricingCards',
] as const

export const stages = [
  'intro',
  'identity',
  'hero',
  'navbar',
  'services',
  'leadForm',
  'trust',
  'faq',
  'footer',
  'review',
  'enhance',
] as const

const hexColorSchema = z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/)

export const animationSchema = z.object({
  entrance: z.enum(['fadeUp', 'fadeIn', 'slideInLeft', 'zoomIn', 'none']).default('fadeUp'),
  stagger: z.boolean().default(false),
})

export const sectionStyleSchema = z.object({
  variant: z.enum(['editorial', 'split', 'immersive', 'bento', 'carousel', 'minimal']).default('editorial'),
  align: z.enum(['left', 'center', 'right']).default('left'),
  headingSize: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
  width: z.enum(['contained', 'full']).default('contained'),
  surface: z.enum(['light', 'dark', 'brand', 'contrast']).default('light'),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(3),
  radius: z.enum(['sharp', 'soft', 'rounded']).default('soft'),
})

export const designSystemSchema = z.object({
  name: z.string().default('Aurelian'),
  preset: z.enum(['horizon', 'pulse', 'signal', 'custom']).default('horizon'),
  colors: z.object({
    primary: hexColorSchema.default('#155EEF'),
    secondary: hexColorSchema.default('#12B76A'),
    accent: hexColorSchema.default('#F79009'),
    background: hexColorSchema.default('#F7F9FC'),
    surface: hexColorSchema.default('#FFFFFF'),
    text: hexColorSchema.default('#101828'),
    muted: hexColorSchema.default('#667085'),
  }),
  typography: z.object({
    display: z.enum(['grotesk', 'humanist', 'geometric', 'editorial']).default('grotesk'),
    body: z.enum(['grotesk', 'humanist', 'geometric']).default('humanist'),
  }),
  radius: z.enum(['sharp', 'soft', 'rounded']).default('soft'),
})

export const themeOverrideSchema = z
  .object({
    primary: hexColorSchema.optional(),
    secondary: hexColorSchema.optional(),
    accent: hexColorSchema.optional(),
    background: hexColorSchema.optional(),
    text: hexColorSchema.optional(),
  })
  .partial()

const mediaSchema = z.object({
  type: z.enum(['image', 'video', 'illustration']).default('image'),
  src: z.string().nullable().optional(),
  alt: z.string().optional(),
  altPrompt: z.string().optional(),
})

const navLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().default('#'),
})

const heroQuoteFieldSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['text', 'email', 'tel', 'number', 'date', 'select', 'radio', 'checkbox', 'textarea', 'richtext', 'fileUpload']),
  label: z.string().min(1),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
})

export const navbarPropsSchema = z.object({
  logoText: z.string().default('Aurelian Insurance'),
  links: z.array(navLinkSchema).default([]),
  ctaLabel: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  sticky: z.boolean().default(true),
})

export const heroPropsSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  ctaLabel: z.string().nullable().optional(),
  secondaryCtaLabel: z.string().nullable().optional(),
  backgroundStyle: z.enum(['solid', 'gradient', 'image', 'split']).default('gradient'),
  visualStyle: z.enum(['editorial', 'carousel', 'ctaOnly', 'dashboard']).default('carousel'),
  slides: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        metric: z.string().optional(),
      }),
    )
    .optional(),
  media: mediaSchema.optional(),
  quoteForm: z.object({
    headline: z.string().default('Get your free quote'),
    subheadline: z.string().optional(),
    submitLabel: z.string().default('See my quote'),
    secureText: z.string().optional(),
    fields: z.array(heroQuoteFieldSchema).min(1).max(8),
  }).optional(),
  overlay: z.object({
    style: z.enum(['none', 'linear', 'radial', 'duotone']).default('linear'),
    color: hexColorSchema.default('#07111F'),
    opacity: z.number().min(0).max(0.9).default(0.55),
    direction: z.enum(['left', 'right', 'top', 'bottom', 'full']).default('full'),
  }).optional(),
})

export const logosBandPropsSchema = z.object({
  eyebrow: z.string().optional(),
  logos: z.array(z.object({ name: z.string().min(1), src: z.string().optional() })).default([]),
})

export const servicesGridPropsSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().default('Coverage designed around you'),
  intro: z.string().optional(),
  media: mediaSchema.optional(),
  layout: z.enum(['cards', 'bento', 'splitFeature', 'list']).default('cards'),
  iconSize: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  iconColor: z.union([hexColorSchema, z.enum(['primary', 'secondary', 'accent', 'text', 'muted', 'surface', 'dark', 'light', 'white', 'black'])]).optional(),
  iconBackground: z.union([hexColorSchema, z.enum(['primary', 'secondary', 'accent', 'text', 'muted', 'surface', 'dark', 'light', 'white', 'black', 'transparent'])]).optional(),
  cardBackground: z.union([hexColorSchema, z.enum(['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'dark', 'light', 'white', 'black', 'transparent'])]).optional(),
  cardTextColor: z.union([hexColorSchema, z.enum(['primary', 'secondary', 'accent', 'text', 'muted', 'surface', 'dark', 'light', 'white', 'black'])]).optional(),
  spacing: z.enum(['tight', 'normal', 'airy']).default('normal'),
  cardPadding: z.enum(['compact', 'normal', 'spacious']).default('normal'),
  showNumbers: z.boolean().default(true),
  items: z
    .array(
      z.object({
        icon: z.string().optional(),
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .default([]),
})

export const formFieldKindSchema = z.enum([
  'text',
  'email',
  'tel',
  'number',
  'date',
  'select',
  'radio',
  'checkbox',
  'textarea',
  'richtext',
  'fileUpload',
])

export const formFieldSchema = z.object({
  id: z.string().min(1),
  kind: formFieldKindSchema,
  label: z.string().min(1),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
})

export const formStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1),
})

export const leadFormPropsSchema = z.object({
  headline: z.string().default('Start your quote'),
  layout: z.enum(['singleStep', 'multiStep']).default('singleStep'),
  steps: z.array(formStepSchema).min(1),
  submitLabel: z.string().default('Submit'),
  consentText: z.string().nullable().optional(),
})

export const testimonialsPropsSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().default('Clients choose us with confidence'),
  items: z
    .array(
      z.object({
        quote: z.string().min(1),
        name: z.string().min(1),
        role: z.string().optional(),
        avatar: z.string().optional(),
      }),
    )
    .default([]),
})

export const statsBandPropsSchema = z.object({
  stats: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).default([]),
})

export const faqPropsSchema = z.object({
  headline: z.string().default('Questions, answered'),
  items: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),
})

export const ctaBannerPropsSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  ctaLabel: z.string().nullable().default('Get started'),
})

export const footerPropsSchema = z.object({
  logoText: z.string().default('Aurelian Insurance'),
  columns: z
    .array(
      z.object({
        title: z.string().min(1),
        links: z.array(navLinkSchema).default([]),
      }),
    )
    .default([]),
  social: z.array(navLinkSchema).default([]),
  disclaimer: z.string().optional(),
})

export const dynamicChartPropsSchema = z.object({
  title: z.string().min(1),
  chartType: z.enum(['pie', 'bar', 'line']).default('pie'),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).default([]),
})

export const insuranceCalculatorPropsSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().default('Explore your estimated cover'),
  intro: z.string().optional(),
  calculatorType: z.enum(['auto', 'home', 'life', 'business', 'general']).default('general'),
  baseAmount: z.number().nonnegative().default(20),
  currency: z.string().regex(/^[A-Z]{3}$/).default('USD'),
  resultLabel: z.string().default('Illustrative monthly estimate'),
  inputs: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    min: z.number(),
    max: z.number(),
    step: z.number().positive().default(1),
    defaultValue: z.number(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    weight: z.number().default(0),
  })).min(1).max(4),
  disclaimer: z.string().default('Illustrative estimate only. Final pricing depends on full underwriting information.'),
  ctaLabel: z.string().nullable().optional(),
})

export const pricingCardsPropsSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().default('Coverage that fits your life'),
  intro: z.string().optional(),
  plans: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.string().min(1),
    period: z.string().default('/month'),
    badge: z.string().optional(),
    features: z.array(z.string()).min(1),
    ctaLabel: z.string().default('Choose plan'),
  })).min(1).max(4),
})

const blockBaseSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['upsert', 'remove', 'reorder']).default('upsert'),
  animation: animationSchema.default({ entrance: 'fadeUp', stagger: false }),
  themeOverride: themeOverrideSchema.optional(),
  style: sectionStyleSchema.optional(),
  index: z.number().int().nonnegative().optional(),
  isNew: z.boolean().optional(),
  isUpdated: z.boolean().optional(),
})

export const navbarBlockSchema = blockBaseSchema.extend({
  type: z.literal('navbar'),
  props: navbarPropsSchema,
})

export const heroBlockSchema = blockBaseSchema.extend({
  type: z.literal('hero'),
  props: heroPropsSchema,
})

export const logosBandBlockSchema = blockBaseSchema.extend({
  type: z.literal('logosBand'),
  props: logosBandPropsSchema,
})

export const servicesGridBlockSchema = blockBaseSchema.extend({
  type: z.literal('servicesGrid'),
  props: servicesGridPropsSchema,
})

export const leadFormBlockSchema = blockBaseSchema.extend({
  type: z.literal('leadForm'),
  props: leadFormPropsSchema,
})

export const testimonialsBlockSchema = blockBaseSchema.extend({
  type: z.literal('testimonials'),
  props: testimonialsPropsSchema,
})

export const statsBandBlockSchema = blockBaseSchema.extend({
  type: z.literal('statsBand'),
  props: statsBandPropsSchema,
})

export const faqBlockSchema = blockBaseSchema.extend({
  type: z.literal('faq'),
  props: faqPropsSchema,
})

export const ctaBannerBlockSchema = blockBaseSchema.extend({
  type: z.literal('ctaBanner'),
  props: ctaBannerPropsSchema,
})

export const footerBlockSchema = blockBaseSchema.extend({
  type: z.literal('footer'),
  props: footerPropsSchema,
})

export const dynamicChartBlockSchema = blockBaseSchema.extend({
  type: z.literal('dynamicChart'),
  props: dynamicChartPropsSchema,
})

export const insuranceCalculatorBlockSchema = blockBaseSchema.extend({
  type: z.literal('insuranceCalculator'),
  props: insuranceCalculatorPropsSchema,
})

export const pricingCardsBlockSchema = blockBaseSchema.extend({
  type: z.literal('pricingCards'),
  props: pricingCardsPropsSchema,
})

export const blockEnvelopeSchema = z.discriminatedUnion('type', [
  navbarBlockSchema,
  heroBlockSchema,
  logosBandBlockSchema,
  servicesGridBlockSchema,
  leadFormBlockSchema,
  testimonialsBlockSchema,
  statsBandBlockSchema,
  faqBlockSchema,
  ctaBannerBlockSchema,
  footerBlockSchema,
  dynamicChartBlockSchema,
  insuranceCalculatorBlockSchema,
  pricingCardsBlockSchema,
])

export const chatQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['text', 'select', 'radio', 'textarea']).default('text'),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
})

export const templateRecommendationSchema = z.object({
  templateId: z.enum(['horizon', 'pulse', 'signal', 'meridian', 'canopy', 'northstar', 'current', 'velocity', 'ledger']),
  name: z.string().min(1),
  reason: z.string().min(1),
  colors: designSystemSchema.shape.colors,
})

export const paletteRecommendationSchema = z.object({
  name: z.string().min(1),
  rationale: z.string().min(1),
  colors: designSystemSchema.shape.colors,
})

export const assistantResponseSchema = z.object({
  assistant_markdown: z.string(),
  questions: z.array(chatQuestionSchema).max(6).default([]),
  template_recommendations: z.array(templateRecommendationSchema).max(3).default([]),
  palette_recommendations: z.array(paletteRecommendationSchema).max(3).default([]),
  suggestions: z.array(z.string()).default([]),
  stage: z.enum(stages).default('intro'),
  design_system: designSystemSchema.optional(),
  ui_blocks: z.array(blockEnvelopeSchema).default([]),
})

export type BlockType = (typeof blockTypes)[number]
export type Stage = (typeof stages)[number]
export type Animation = z.infer<typeof animationSchema>
export type ThemeOverride = z.infer<typeof themeOverrideSchema>
export type SectionStyle = z.infer<typeof sectionStyleSchema>
export type DesignSystem = z.infer<typeof designSystemSchema>
export type FormFieldKind = z.infer<typeof formFieldKindSchema>
export type FormField = z.infer<typeof formFieldSchema>
export type FormStep = z.infer<typeof formStepSchema>
export type ChatQuestion = z.infer<typeof chatQuestionSchema>
export type TemplateRecommendation = z.infer<typeof templateRecommendationSchema>
export type PaletteRecommendation = z.infer<typeof paletteRecommendationSchema>
export type LeadFormProps = z.infer<typeof leadFormPropsSchema>
export type BlockEnvelope = z.infer<typeof blockEnvelopeSchema>
export type AssistantResponse = z.infer<typeof assistantResponseSchema>
