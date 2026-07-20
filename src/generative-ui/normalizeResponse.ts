import {
  assistantResponseSchema,
  blockTypes,
  stages,
  type AssistantResponse,
  type Animation,
  type BlockEnvelope,
  type DesignSystem,
  type FormFieldKind,
  type SectionStyle,
  type Stage,
} from './schemas.ts'

type AnyRecord = Record<string, unknown>

const stageFallback: Stage = 'intro'
const blockTypeSet = new Set<string>(blockTypes)
const stageSet = new Set<string>(stages)
const entranceSet = new Set<string>(['fadeUp', 'fadeIn', 'slideInLeft', 'zoomIn', 'none'])
type BlockAction = 'upsert' | 'remove' | 'reorder'

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {}
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function asNullableString(value: unknown, fallback: string | null = null) {
  if (value === null || value === '') return null
  return typeof value === 'string' && value.trim() ? value : fallback
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function hexToHsl(hex: string) {
  const value = hex.slice(1)
  const full = value.length === 3 ? value.split('').map((part) => part + part).join('') : value
  const [r, g, b] = [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: lightness * 100 }
  const delta = max - min
  const saturation = lightness > .5 ? delta / (2 - max - min) : delta / (max + min)
  const hue = max === r ? ((g - b) / delta + (g < b ? 6 : 0)) : max === g ? ((b - r) / delta + 2) : ((r - g) / delta + 4)
  return { h: hue * 60, s: saturation * 100, l: lightness * 100 }
}

function hslToHex(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360
  const saturation = Math.max(0, Math.min(100, s)) / 100
  const lightness = Math.max(0, Math.min(100, l)) / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const segment = hue / 60
  const x = chroma * (1 - Math.abs((segment % 2) - 1))
  const [r1, g1, b1] = segment < 1 ? [chroma, x, 0] : segment < 2 ? [x, chroma, 0] : segment < 3 ? [0, chroma, x] : segment < 4 ? [0, x, chroma] : segment < 5 ? [x, 0, chroma] : [chroma, 0, x]
  const m = lightness - chroma / 2
  return `#${[r1, g1, b1].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function harmonizeRecommendedColors(colors: DesignSystem['colors']): DesignSystem['colors'] {
  const anchor = hexToHsl(colors.primary)
  const page = hexToHsl(colors.background)
  const dark = page.l < 35
  const primarySaturation = Math.max(38, Math.min(68, anchor.s))
  const primaryLightness = dark ? Math.max(58, Math.min(70, anchor.l)) : Math.max(38, Math.min(50, anchor.l))
  return {
    primary: hslToHex(anchor.h, primarySaturation, primaryLightness),
    secondary: hslToHex(anchor.h + 24, Math.max(24, primarySaturation * .58), dark ? 61 : 43),
    accent: hslToHex(anchor.h + 42, Math.max(32, primarySaturation * .62), dark ? 68 : 54),
    background: hslToHex(anchor.h, dark ? 18 : 10, dark ? 8 : 97),
    surface: hslToHex(anchor.h, dark ? 16 : 7, dark ? 12 : 100),
    text: hslToHex(anchor.h, dark ? 12 : 18, dark ? 96 : 16),
    muted: hslToHex(anchor.h, dark ? 10 : 9, dark ? 70 : 43),
  }
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48)
}

const heroImageLibrary = [
  { terms: ['car', 'auto', 'motor', 'vehicle', 'driver', 'fleet'], sources: ['photo-1503376780353-7e6692767b70', 'photo-1549317661-bd32c8ce0db2'] },
  { terms: ['family', 'parent', 'children', 'life insurance'], sources: ['photo-1609220136736-443140cffec6', 'photo-1511895426328-dc8714191300'] },
  { terms: ['home', 'house', 'property', 'landlord'], sources: ['photo-1560518883-ce09059eeffa', 'photo-1600585154340-be6161a56a0c'] },
  { terms: ['pet', 'dog', 'cat'], sources: ['photo-1552053831-71594a27632d', 'photo-1450778869180-41d0601e046e'] },
  { terms: ['travel', 'trip', 'holiday'], sources: ['photo-1488646953014-85cb44e25828', 'photo-1500530855697-b586d89ba3ee'] },
  { terms: ['health', 'medical', 'clinic'], sources: ['photo-1576091160399-112ba8d25d1d', 'photo-1538108149393-fbbd81895907'] },
  { terms: ['marine', 'boat', 'yacht'], sources: ['photo-1500375592092-40eb2168fd21', 'photo-1540946485063-a40da27545f8'] },
  { terms: ['business', 'commercial', 'professional', 'cyber'], sources: ['photo-1556761175-b413da4baf72', 'photo-1521737604893-d14cc237f11d'] },
]

export function resolveHeroImage(context: string, currentSource?: string | null) {
  const normalized = context.toLowerCase()
  const match = heroImageLibrary.find((image) => image.terms.some((term) => normalized.includes(term)))
  const sources = match?.sources ?? ['photo-1450101499163-c8848c66ca85', 'photo-1551836022-d5d88e9218df']
  const source = currentSource?.includes(sources[0]) ? sources[1] : sources[0]
  return `https://images.unsplash.com/${source}?auto=format&fit=crop&w=1800&q=85`
}

function baseBlock(raw: AnyRecord, index: number) {
  const type = asString(raw.type, 'servicesGrid')
  const rawAnimation = asRecord(raw.animation)
  const entrance = asString(rawAnimation.entrance, 'fadeUp')
  const action: BlockAction = raw.action === 'remove' || raw.action === 'reorder' ? raw.action : 'upsert'
  const animation: Animation = {
    entrance: entranceSet.has(entrance) ? (entrance as Animation['entrance']) : 'fadeUp',
    stagger:
      typeof rawAnimation.stagger === 'boolean'
        ? rawAnimation.stagger
        : type === 'servicesGrid' || type === 'testimonials' || type === 'logosBand',
  }

  const rawStyle = asRecord(raw.style)
  const variants = new Set(['editorial', 'split', 'immersive', 'bento', 'carousel', 'minimal'])
  const surfaces = new Set(['light', 'dark', 'brand', 'contrast'])
  const headingSizes = new Set(['sm', 'md', 'lg', 'xl'])
  const radii = new Set(['sharp', 'soft', 'rounded'])
  const columns = rawStyle.columns === 1 || rawStyle.columns === 2 || rawStyle.columns === 4 ? rawStyle.columns : 3

  const style: SectionStyle = {
    variant: variants.has(asString(rawStyle.variant)) ? (rawStyle.variant as SectionStyle['variant']) : 'editorial',
    align: rawStyle.align === 'center' || rawStyle.align === 'right' ? rawStyle.align : 'left',
    headingSize: headingSizes.has(asString(rawStyle.headingSize)) ? (rawStyle.headingSize as SectionStyle['headingSize']) : 'lg',
    width: rawStyle.width === 'full' ? 'full' : 'contained',
    surface: surfaces.has(asString(rawStyle.surface)) ? (rawStyle.surface as SectionStyle['surface']) : 'light',
    columns,
    radius: radii.has(asString(rawStyle.radius)) ? (rawStyle.radius as SectionStyle['radius']) : 'soft',
  }

  return {
    id: asString(raw.id, `${slug(type) || 'block'}-${index + 1}`),
    action,
    animation,
    style,
    index: typeof raw.index === 'number' ? raw.index : undefined,
  }
}

function normalizeDesignSystem(value: unknown): DesignSystem | undefined {
  const raw = asRecord(value)
  if (!Object.keys(raw).length) return undefined
  const colors = asRecord(raw.colors)
  const typography = asRecord(raw.typography)
  const presets = new Set(['horizon', 'pulse', 'signal', 'custom'])
  const displays = new Set(['grotesk', 'humanist', 'geometric', 'editorial'])
  const bodies = new Set(['grotesk', 'humanist', 'geometric'])
  const color = (candidate: unknown, fallback: string) => typeof candidate === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(candidate) ? candidate : fallback
  return {
    name: asString(raw.name, 'Custom direction'),
    preset: presets.has(asString(raw.preset)) ? (raw.preset as DesignSystem['preset']) : 'custom',
    colors: {
      primary: color(colors.primary, '#155EEF'), secondary: color(colors.secondary, '#12B76A'),
      accent: color(colors.accent, '#F79009'), background: color(colors.background, '#F7F9FC'),
      surface: color(colors.surface, '#FFFFFF'), text: color(colors.text, '#101828'), muted: color(colors.muted, '#667085'),
    },
    typography: {
      display: displays.has(asString(typography.display)) ? (typography.display as DesignSystem['typography']['display']) : 'grotesk',
      body: bodies.has(asString(typography.body)) ? (typography.body as DesignSystem['typography']['body']) : 'humanist',
    },
    radius: raw.radius === 'sharp' || raw.radius === 'rounded' ? raw.radius : 'soft',
  }
}

function normalizeFaq(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const rawItems = asArray(props.items ?? raw.items)
  return {
    ...baseBlock(raw, index),
    type: 'faq',
    props: {
      headline: asString(props.headline ?? raw.title, 'Questions, answered'),
      items: rawItems.map((item, itemIndex) => {
        const record = asRecord(item)
        return {
          q: asString(record.q ?? record.question, `Question ${itemIndex + 1}`),
          a: asString(record.a ?? record.answer, 'We can refine this answer as your details come in.'),
        }
      }),
    },
  }
}

function normalizeDynamicChart(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const rawData = asArray(props.data ?? raw.data)
  return {
    ...baseBlock(raw, index),
    type: 'dynamicChart',
    props: {
      title: asString(props.title ?? raw.title, 'Coverage breakdown'),
      chartType: props.chartType === 'bar' || props.chartType === 'line' ? props.chartType : 'pie',
      data: rawData.map((item) => {
        const record = asRecord(item)
        return {
          name: asString(record.name ?? record.label, 'Item'),
          value: typeof record.value === 'number' ? record.value : Number(record.value ?? 0),
        }
      }),
    },
  }
}

function normalizeInsuranceCalculator(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const types = new Set(['auto', 'home', 'life', 'business', 'general'])
  const inputs = asArray(props.inputs).slice(0, 4).map((input, inputIndex) => {
    const record = asRecord(input)
    const min = typeof record.min === 'number' ? record.min : 0
    const max = typeof record.max === 'number' && record.max > min ? record.max : 100
    const defaultValue = typeof record.defaultValue === 'number' ? Math.min(max, Math.max(min, record.defaultValue)) : min
    return {
      id: asString(record.id, `factor-${inputIndex + 1}`),
      label: asString(record.label, `Estimate factor ${inputIndex + 1}`),
      min,
      max,
      step: typeof record.step === 'number' && record.step > 0 ? record.step : 1,
      defaultValue,
      prefix: asString(record.prefix, undefined),
      suffix: asString(record.suffix, undefined),
      weight: typeof record.weight === 'number' ? record.weight : 0,
    }
  })
  return {
    ...baseBlock(raw, index),
    type: 'insuranceCalculator',
    props: {
      eyebrow: asString(props.eyebrow, 'Interactive estimate'),
      headline: asString(props.headline, 'Explore your estimated cover'),
      intro: asString(props.intro, undefined),
      calculatorType: types.has(asString(props.calculatorType)) ? props.calculatorType as 'auto' | 'home' | 'life' | 'business' | 'general' : 'general',
      baseAmount: typeof props.baseAmount === 'number' && props.baseAmount >= 0 ? props.baseAmount : 20,
      currency: typeof props.currency === 'string' && /^[A-Z]{3}$/.test(props.currency) ? props.currency : 'USD',
      resultLabel: asString(props.resultLabel, 'Illustrative monthly estimate'),
      inputs: inputs.length ? inputs : [{ id: 'cover', label: 'Level of cover', min: 1, max: 5, step: 1, defaultValue: 3, weight: 8 }],
      disclaimer: asString(props.disclaimer, 'Illustrative estimate only. Final pricing depends on full underwriting information.'),
      ctaLabel: asNullableString(props.ctaLabel, 'Continue to a full quote'),
    },
  }
}

function normalizeHero(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const rawMedia = asRecord(props.media)
  const rawSlides = asArray(props.slides)
  const backgroundStyle = asString(props.backgroundStyle, 'gradient')
  const visualStyle = asString(props.visualStyle, 'carousel')
  const mediaType = asString(rawMedia.type, 'image')
  const rawOverlay = asRecord(props.overlay)
  const mediaContext = [props.headline, props.subheadline, rawMedia.alt, rawMedia.altPrompt, rawMedia.prompt]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')

  return {
    ...baseBlock(raw, index),
    type: 'hero',
    props: {
      eyebrow: asString(props.eyebrow, undefined),
      headline: asString(props.headline ?? raw.title, 'Family car insurance made simpler'),
      subheadline: asString(
        props.subheadline ?? props.description,
        'A friendly quote path for families who want clear car insurance guidance without the jargon.',
      ),
      ctaLabel: asNullableString(props.ctaLabel, 'Get a quote'),
      secondaryCtaLabel: asNullableString(props.secondaryCtaLabel, 'See coverage options'),
      backgroundStyle:
        backgroundStyle === 'solid' || backgroundStyle === 'gradient' || backgroundStyle === 'image' || backgroundStyle === 'split'
          ? backgroundStyle
          : 'gradient',
      visualStyle:
        visualStyle === 'editorial' || visualStyle === 'carousel' || visualStyle === 'ctaOnly' || visualStyle === 'dashboard'
          ? visualStyle
          : 'carousel',
      slides: rawSlides.map((slide, slideIndex) => {
        const record = asRecord(slide)
        return {
          title: asString(record.title, `Step ${slideIndex + 1}`),
          description: asString(record.description, 'We can refine this panel as the broker details come in.'),
          metric: asString(record.metric, `0${slideIndex + 1}`),
        }
      }),
      media: {
        type: mediaType === 'video' || mediaType === 'illustration' ? mediaType : 'image',
        src: typeof rawMedia.src === 'string' && rawMedia.src.trim() ? rawMedia.src : resolveHeroImage(mediaContext),
        alt: asString(rawMedia.alt, undefined),
        altPrompt: asString(
          rawMedia.altPrompt ?? rawMedia.prompt,
          'Warm photo of a family standing beside their car, insurance landing page hero',
        ),
      },
      overlay: {
        style: rawOverlay.style === 'none' || rawOverlay.style === 'radial' || rawOverlay.style === 'duotone' ? rawOverlay.style : 'linear',
        color: typeof rawOverlay.color === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(rawOverlay.color) ? rawOverlay.color : '#07111F',
        opacity: typeof rawOverlay.opacity === 'number' ? Math.min(0.9, Math.max(0, rawOverlay.opacity)) : 0.55,
        direction: rawOverlay.direction === 'left' || rawOverlay.direction === 'right' || rawOverlay.direction === 'top' || rawOverlay.direction === 'bottom' ? rawOverlay.direction : 'full',
      },
    },
  }
}

function normalizeNavbar(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const rawLinks = asArray(props.links ?? raw.links)
  return {
    ...baseBlock(raw, index),
    type: 'navbar',
    props: {
      logoText: asString(props.logoText ?? props.logo ?? props.brandName, 'OS Broker'),
      links: rawLinks.map((link) => {
        const record = asRecord(link)
        const label = asString(record.label ?? record.title, 'Section')
        return {
          label,
          href: asString(record.href, `#${slug(label)}`),
        }
      }),
      ctaLabel: asNullableString(props.ctaLabel, 'Get a quote'),
      phone: asNullableString(props.phone, null),
      sticky: typeof props.sticky === 'boolean' ? props.sticky : true,
    },
  }
}

function normalizeServicesGrid(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const rawItems = asArray(props.items ?? props.services ?? raw.items)
  const layouts = new Set(['cards', 'bento', 'splitFeature', 'list'])
  const iconSizes = new Set(['sm', 'md', 'lg', 'xl'])
  const spacingValues = new Set(['tight', 'normal', 'airy'])
  const paddingValues = new Set(['compact', 'normal', 'spacious'])
  const appearanceColors = new Set(['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'muted', 'dark', 'light', 'white', 'black', 'transparent'])
  const appearanceColor = (value: unknown, allowed: string[]) => typeof value === 'string'
    && (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value) || (appearanceColors.has(value) && allowed.includes(value)))
    ? value
    : undefined
  return {
    ...baseBlock(raw, index),
    type: 'servicesGrid',
    props: {
      eyebrow: asString(props.eyebrow, 'Coverage options'),
      headline: asString(props.headline ?? props.title ?? raw.title, 'Coverage options for your family car'),
      intro: asString(props.intro ?? props.description, undefined),
      layout: layouts.has(asString(props.layout)) ? props.layout as 'cards' | 'bento' | 'splitFeature' | 'list' : 'cards',
      iconSize: iconSizes.has(asString(props.iconSize)) ? props.iconSize as 'sm' | 'md' | 'lg' | 'xl' : 'md',
      iconColor: appearanceColor(props.iconColor, ['primary', 'secondary', 'accent', 'text', 'muted', 'surface', 'dark', 'light', 'white', 'black']),
      iconBackground: appearanceColor(props.iconBackground, ['primary', 'secondary', 'accent', 'text', 'muted', 'surface', 'dark', 'light', 'white', 'black', 'transparent']),
      cardBackground: appearanceColor(props.cardBackground, ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'dark', 'light', 'white', 'black', 'transparent']),
      cardTextColor: appearanceColor(props.cardTextColor, ['primary', 'secondary', 'accent', 'text', 'muted', 'surface', 'dark', 'light', 'white', 'black']),
      spacing: spacingValues.has(asString(props.spacing)) ? props.spacing as 'tight' | 'normal' | 'airy' : 'normal',
      cardPadding: paddingValues.has(asString(props.cardPadding)) ? props.cardPadding as 'compact' | 'normal' | 'spacious' : 'normal',
      showNumbers: typeof props.showNumbers === 'boolean' ? props.showNumbers : true,
      items: rawItems.length
        ? rawItems.map((item) => {
            const record = asRecord(item)
            return {
              icon: asString(record.icon, ''),
              title: asString(record.title ?? record.label ?? record.name, 'Coverage option'),
              description: asString(
                record.description ?? record.body ?? record.copy,
                'A clear coverage option explained in family-friendly language.',
              ),
            }
          })
        : [
            {
              icon: 'shield',
              title: asString(props.title ?? raw.title, 'Comprehensive cover'),
              description: asString(
                props.description ?? raw.description,
                'Broad protection for your family car, explained clearly before you choose.',
              ),
            },
          ],
    },
  }
}

function normalizeLeadForm(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const rawSteps = asArray(props.steps)
  const rawFields = asArray(props.fields ?? raw.fields)
  const fallbackFields = [
    { id: 'car', kind: 'text', label: 'Car make and model', required: true },
    { id: 'postcode', kind: 'text', label: 'Postcode', required: true },
    { id: 'email', kind: 'email', label: 'Email address', required: true },
  ]

  function normalizeField(field: unknown, fieldIndex: number) {
    const record = asRecord(field)
    const rawKind = asString(record.kind ?? record.type, 'text')
    const kind: FormFieldKind =
      rawKind === 'email' ||
      rawKind === 'tel' ||
      rawKind === 'number' ||
      rawKind === 'date' ||
      rawKind === 'select' ||
      rawKind === 'radio' ||
      rawKind === 'checkbox' ||
      rawKind === 'textarea' ||
      rawKind === 'richtext' ||
      rawKind === 'fileUpload'
        ? rawKind
        : 'text'

    return {
      id: asString(record.id ?? slug(asString(record.label, `field-${fieldIndex + 1}`)), `field-${fieldIndex + 1}`),
      kind,
      label: asString(record.label ?? record.name, `Field ${fieldIndex + 1}`),
      required: typeof record.required === 'boolean' ? record.required : false,
      options: asArray(record.options).filter((option): option is string => typeof option === 'string'),
      placeholder: asString(record.placeholder, ''),
    }
  }

  const steps = rawSteps.length
    ? rawSteps.map((step, stepIndex) => {
        const record = asRecord(step)
        return {
          title: asString(record.title, `Step ${stepIndex + 1}`),
          description: asString(record.description, ''),
          fields: asArray(record.fields).map(normalizeField),
        }
      })
    : [
        {
          title: 'Start your quote',
          fields: (rawFields.length ? rawFields : fallbackFields).map(normalizeField),
        },
      ]

  return {
    ...baseBlock(raw, index),
    type: 'leadForm',
    props: {
      headline: asString(props.headline ?? props.title ?? raw.title, 'Get a family car insurance quote'),
      layout: props.layout === 'singleStep' ? 'singleStep' : 'multiStep',
      steps,
      submitLabel: asString(props.submitLabel ?? props.ctaLabel, 'Get my quote'),
      consentText: asNullableString(props.consentText, null),
    },
  }
}

function normalizeServiceLike(raw: AnyRecord, index: number): BlockEnvelope {
  const props = asRecord(raw.props)
  const title = asString(props.headline ?? raw.title, 'Recommended page section')
  const description = asString(
    props.description ?? raw.description ?? raw.message,
    'A safe generated content block was adapted into this landing-page section.',
  )

  return {
    ...baseBlock(raw, index),
    type: 'servicesGrid',
    props: {
      eyebrow: asString(raw.type, 'Generated UI'),
      headline: title,
      intro: undefined,
      layout: 'cards',
      iconSize: 'md',
      spacing: 'normal',
      cardPadding: 'normal',
      showNumbers: true,
      items: [
        {
          title,
          description,
        },
      ],
    },
  }
}

function normalizeBlock(rawValue: unknown, index: number): BlockEnvelope {
  const raw = asRecord(rawValue)
  const props = asRecord(raw.props)

  if (raw.type === 'hero') return normalizeHero(raw, index)
  if (raw.type === 'navbar') return normalizeNavbar(raw, index)
  if (raw.type === 'servicesGrid') return normalizeServicesGrid(raw, index)
  if (raw.type === 'leadForm') return normalizeLeadForm(raw, index)
  if (raw.type === 'faq') return normalizeFaq(raw, index)
  if (raw.type === 'dynamicChart' || raw.type === 'coverageBreakdown') return normalizeDynamicChart(raw, index)
  if (raw.type === 'insuranceCalculator') return normalizeInsuranceCalculator(raw, index)

  if (typeof raw.type === 'string' && blockTypeSet.has(raw.type) && raw.id && raw.props) {
    return {
      ...baseBlock(raw, index),
      type: raw.type,
      props,
    } as BlockEnvelope
  }

  return normalizeServiceLike(raw, index)
}

export function normalizeAssistantPayload(data: unknown): AssistantResponse {
  const raw = asRecord(data)
  const questions = asArray(raw.questions).slice(0, 6).map((question, index) => {
    const record = asRecord(question)
    const kind = record.kind === 'select' || record.kind === 'radio' || record.kind === 'textarea' ? record.kind : 'text'
    return {
      id: asString(record.id, `question-${index + 1}`),
      label: asString(record.label, `Question ${index + 1}`),
      kind,
      placeholder: asString(record.placeholder, undefined),
      options: asArray(record.options).filter((option): option is string => typeof option === 'string'),
      required: typeof record.required === 'boolean' ? record.required : true,
    }
  })
  const recommendationIds = new Set(['horizon', 'pulse', 'signal', 'meridian', 'canopy', 'northstar', 'current', 'velocity', 'ledger'])
  const templateRecommendations = asArray(raw.template_recommendations ?? raw.templateRecommendations).slice(0, 3).flatMap((recommendation) => {
    const record = asRecord(recommendation)
    const templateId = asString(record.templateId ?? record.template_id)
    if (!recommendationIds.has(templateId)) return []
    const colors = normalizeDesignSystem({ name: 'Recommendation', preset: 'custom', colors: record.colors, typography: {}, radius: 'soft' })?.colors
    return colors ? [{ templateId: templateId as 'horizon', name: asString(record.name, 'Recommended direction'), reason: asString(record.reason, 'A strong fit for your audience and conversion goal.'), colors: harmonizeRecommendedColors(colors) }] : []
  })
  const paletteRecommendations = asArray(raw.palette_recommendations ?? raw.paletteRecommendations).slice(0, 3).flatMap((recommendation) => {
    const record = asRecord(recommendation)
    const colors = normalizeDesignSystem({ name: 'Palette', preset: 'custom', colors: record.colors, typography: {}, radius: 'soft' })?.colors
    return colors ? [{ name: asString(record.name, 'Refined palette'), rationale: asString(record.rationale ?? record.reason, 'A complementary palette tailored to the audience and offer.'), colors: harmonizeRecommendedColors(colors) }] : []
  })
  const candidate = {
    assistant_markdown: asString(raw.assistant_markdown ?? raw.message, "I've updated the landing page draft."),
    questions,
    template_recommendations: templateRecommendations,
    palette_recommendations: paletteRecommendations,
    suggestions: asArray(raw.suggestions).filter((item): item is string => typeof item === 'string'),
    stage: stageSet.has(asString(raw.stage)) ? asString(raw.stage) : stageFallback,
    design_system: normalizeDesignSystem(raw.design_system ?? raw.designSystem),
    ui_blocks: asArray(raw.ui_blocks ?? raw.ui).map(normalizeBlock),
  }

  return assistantResponseSchema.parse(candidate)
}
