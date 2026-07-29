import { blockEnvelopeSchema, type AssistantResponse, type BlockEnvelope, type FormField } from './schemas.ts'
import { resolveHeroImage } from './normalizeResponse.ts'

type CurrentPage = {
  blocks?: unknown[]
}

function parsedBlocks(page?: CurrentPage) {
  return (page?.blocks ?? []).flatMap((block) => {
    const parsed = blockEnvelopeSchema.safeParse(block)
    return parsed.success ? [parsed.data] : []
  })
}

function cloneBlock<T extends BlockEnvelope>(block: T): T {
  return structuredClone(block)
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function quotedPhrases(message: string) {
  const phrases = [...message.matchAll(/["“”']([^"“”']{3,})["“”']/g)]
    .map((match) => normalizeText(match[1]))
    .filter(Boolean)
  const afterColon = message.match(/:\s*([^"\n]{6,})$/)?.[1]
  if (afterColon) phrases.push(normalizeText(afterColon))
  const afterSection = message.match(/\b(?:this|the)?\s*section\s+([^"\n]{6,})$/i)?.[1]
  if (afterSection) phrases.push(normalizeText(afterSection))
  return [...new Set(phrases)]
}

function blockIncludes(block: BlockEnvelope, phrases: string[]) {
  const text = normalizeText(JSON.stringify(block.props))
  return phrases.some((phrase) => text.includes(phrase))
}

function removePhrasesFromValue(value: unknown, phrases: string[], removeWholeItems: boolean): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const normalized = normalizeText(value)
    const matched = phrases.some((phrase) => normalized.includes(phrase))
    return matched ? { value: '', changed: true } : { value, changed: false }
  }

  if (Array.isArray(value)) {
    let changed = false
    const next = value.flatMap((item) => {
      const itemText = normalizeText(JSON.stringify(item))
      if (removeWholeItems && phrases.some((phrase) => itemText.includes(phrase))) {
        changed = true
        return []
      }
      const result = removePhrasesFromValue(item, phrases, removeWholeItems)
      if (result.changed) changed = true
      return [result.value]
    })
    return { value: next, changed }
  }

  if (value && typeof value === 'object') {
    let changed = false
    const next: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      const result = removePhrasesFromValue(child, phrases, removeWholeItems)
      const isButtonProp = /^(ctaLabel|primaryLabel|secondaryLabel|submitLabel|buttonLabel)$/i.test(key)
      next[key] = isButtonProp && result.changed ? null : result.value
      if (result.changed) changed = true
    }
    return { value: next, changed }
  }

  return { value, changed: false }
}

function upsertBlock(response: AssistantResponse, block: BlockEnvelope) {
  const index = response.ui_blocks.findIndex((candidate) => candidate.id === block.id || candidate.type === block.type)
  const next = { ...block, action: block.action === 'remove' ? 'remove' as const : block.action === 'reorder' ? 'reorder' as const : 'upsert' as const }
  if (index >= 0) response.ui_blocks[index] = next
  else response.ui_blocks.push(next)
}

function sectionStyle(block: BlockEnvelope, surface: 'light' | 'dark' | 'brand' | 'contrast') {
  return {
    variant: block.style?.variant ?? 'editorial' as const,
    align: block.style?.align ?? 'left' as const,
    headingSize: block.style?.headingSize ?? 'lg' as const,
    width: block.style?.width ?? 'contained' as const,
    surface,
    columns: block.style?.columns ?? 3 as 1 | 2 | 3 | 4,
    radius: block.style?.radius ?? 'rounded' as const,
  }
}

function quoteFieldToFormField(field: NonNullable<Extract<BlockEnvelope, { type: 'hero' }>['props']['quoteForm']>['fields'][number]): FormField {
  return {
    id: field.id,
    kind: field.kind,
    label: field.label,
    required: field.required,
    options: field.options ?? undefined,
    placeholder: field.placeholder ?? undefined,
  }
}

function splitFieldsIntoSteps(fields: FormField[]) {
  const safeFields = fields.length ? fields : [
    { id: 'name', kind: 'text' as const, label: 'Full name', required: true, placeholder: 'Your name' },
    { id: 'email', kind: 'email' as const, label: 'Email', required: true, placeholder: 'you@email.com' },
  ]
  const midpoint = Math.max(1, Math.ceil(safeFields.length / 2))
  return [
    {
      title: 'Your details',
      description: 'Start with the basics so the quote journey feels personal.',
      fields: safeFields.slice(0, midpoint),
    },
    {
      title: 'Cover preferences',
      description: 'Add the details we need to shape the right insurance options.',
      fields: safeFields.slice(midpoint).length ? safeFields.slice(midpoint) : safeFields.slice(0, 1),
    },
  ]
}

function leadFormFromHero(hero: Extract<BlockEnvelope, { type: 'hero' }>, index: number, multiStep: boolean): Extract<BlockEnvelope, { type: 'leadForm' }> {
  const quoteForm = hero.props.quoteForm
  const fields = (quoteForm?.fields ?? []).map(quoteFieldToFormField)
  return {
    id: 'lead-form',
    type: 'leadForm',
    action: 'upsert',
    index,
    animation: { entrance: 'fadeUp', stagger: false },
    style: {
      variant: 'split',
      align: 'left',
      headingSize: 'lg',
      width: 'full',
      surface: 'light',
      columns: 2,
      radius: 'rounded',
    },
    props: {
      headline: quoteForm?.headline ?? 'Start your quote',
      layout: multiStep ? 'multiStep' : 'singleStep',
      steps: multiStep
        ? splitFieldsIntoSteps(fields)
        : [{ title: quoteForm?.headline ?? 'Start your quote', description: quoteForm?.subheadline, fields: fields.length ? fields : splitFieldsIntoSteps([])[0].fields }],
      submitLabel: quoteForm?.submitLabel ?? 'Submit request',
      consentText: quoteForm?.secureText ?? 'Your information is encrypted and handled securely.',
    },
  }
}

const movableSectionTypes = new Set<BlockEnvelope['type']>([
  'logosBand',
  'servicesGrid',
  'pricingCards',
  'leadForm',
  'testimonials',
  'statsBand',
  'faq',
  'ctaBanner',
  'insuranceCalculator',
])

const sectionAliasPatterns: Array<[BlockEnvelope['type'], RegExp]> = [
  ['leadForm', /\b(form|lead form|quote form)\b/g],
  ['servicesGrid', /\b(services?|benefits?|coverage options?)\b/g],
  ['pricingCards', /\b(pricing|prices?|plans?|packages?|coverage cards?)\b/g],
  ['testimonials', /\b(testimonials?|reviews?|stories)\b/g],
  ['faq', /\b(faq|faqs|questions?)\b/g],
  ['ctaBanner', /\b(cta|call to action|banner)\b/g],
  ['statsBand', /\b(stats?|numbers?|metrics?)\b/g],
  ['logosBand', /\b(logos?|logo band|clients?)\b/g],
  ['insuranceCalculator', /\b(calculator|estimate)\b/g],
  ['navbar', /\b(navbar|navigation|header)\b/g],
  ['hero', /\bhero\b/g],
  ['footer', /\bfooter\b/g],
]

function sectionTypeFromText(text: string): BlockEnvelope['type'] | undefined {
  if (/\b(form|lead form|quote form)\b/.test(text)) return 'leadForm'
  if (/\b(services?|benefits?|coverage options?)\b/.test(text)) return 'servicesGrid'
  if (/\b(pricing|prices?|plans?|packages?|coverage cards?)\b/.test(text)) return 'pricingCards'
  if (/\b(testimonials?|reviews?|stories)\b/.test(text)) return 'testimonials'
  if (/\b(faq|faqs|questions?)\b/.test(text)) return 'faq'
  if (/\b(cta|call to action|banner)\b/.test(text)) return 'ctaBanner'
  if (/\b(stats?|numbers?|metrics?)\b/.test(text)) return 'statsBand'
  if (/\b(logos?|logo band|clients?)\b/.test(text)) return 'logosBand'
  if (/\b(calculator|estimate)\b/.test(text)) return 'insuranceCalculator'
  if (/\b(navbar|navigation|header)\b/.test(text)) return 'navbar'
  if (/\bhero\b/.test(text)) return 'hero'
  if (/\bfooter\b/.test(text)) return 'footer'
  return undefined
}

function reorderTargetFromMessage(lower: string, currentBlocks: BlockEnvelope[]) {
  const movement = lower.match(/\b(?:move|place|put|bring|send|switch|reorder|make|want)\b[\s\S]{0,80}?\b(after|before|above|below)\b/i)
  const relation = movement?.[1] === 'below' ? 'after' : movement?.[1] === 'above' ? 'before' : movement?.[1]
  if (!relation) return undefined

  const relationIndex = movement?.index ?? lower.search(/\b(after|before|above|below)\b/)
  const beforeRelation = relationIndex >= 0 ? lower.slice(0, relationIndex) : lower
  const afterRelation = relationIndex >= 0 ? lower.slice(relationIndex) : lower
  const movingType = sectionTypeFromText(beforeRelation) ?? sectionTypeFromText(lower)
  const referenceType = sectionTypeFromText(afterRelation.replace(/\b(after|before|above|below)\b/, ''))
  if (!movingType || !referenceType || !movableSectionTypes.has(movingType)) return undefined

  const movingBlock = currentBlocks.find((block) => block.type === movingType)
  const referenceIndex = currentBlocks.findIndex((block) => block.type === referenceType)
  if (!movingBlock || referenceIndex < 0) return undefined

  const targetIndex = relation === 'after' ? referenceIndex + 1 : referenceIndex
  return { movingBlock, targetIndex }
}

function swapTargetsFromMessage(lower: string, currentBlocks: BlockEnvelope[]) {
  if (!/\b(swap|switch|exchange)\b/.test(lower)) return undefined
  const mentions = sectionAliasPatterns
    .flatMap(([type, pattern]) => {
      pattern.lastIndex = 0
      return [...lower.matchAll(pattern)].map((match) => ({ type, index: match.index ?? 0 }))
    })
    .filter((mention) => movableSectionTypes.has(mention.type))
    .sort((a, b) => a.index - b.index)

  const firstType = mentions[0]?.type
  const secondType = mentions.find((mention) => mention.type !== firstType)?.type
  if (!firstType || !secondType) return undefined
  const firstIndex = currentBlocks.findIndex((block) => block.type === firstType)
  const secondIndex = currentBlocks.findIndex((block) => block.type === secondType)
  const firstBlock = currentBlocks[firstIndex]
  const secondBlock = currentBlocks[secondIndex]
  if (!firstBlock || !secondBlock || firstIndex < 0 || secondIndex < 0) return undefined
  return [
    { block: firstBlock, index: secondIndex },
    { block: secondBlock, index: firstIndex },
  ]
}

function scopedTargetTypes(lower: string, currentBlocks: BlockEnvelope[], phrases: string[]) {
  const targets = new Set<BlockEnvelope['type']>()
  const phraseMatch = currentBlocks.find((block) => blockIncludes(block, phrases))
  if (phraseMatch) targets.add(phraseMatch.type)
  if (/\bhero\b/.test(lower)) targets.add('hero')
  if (/\bnavbar|navigation|header\b/.test(lower)) targets.add('navbar')
  if (/\bfaq|faqs|questions?\b/.test(lower)) targets.add('faq')
  if (/\bservices?|benefits?\b/.test(lower)) targets.add('servicesGrid')
  if (/\bcoverage|pricing|plans?\b/.test(lower)) targets.add('pricingCards')
  if (/\btestimonial|review\b/.test(lower)) targets.add('testimonials')
  if (/\bcta|call to action\b/.test(lower)) targets.add('ctaBanner')
  if (/\bfooter\b/.test(lower)) targets.add('footer')
  if (/\blead form|form section\b/.test(lower)) targets.add('leadForm')
  if (/\bcalculator\b/.test(lower)) targets.add('insuranceCalculator')
  return targets
}

function isScopedEdit(lower: string, phrases: string[]) {
  const generalPageIntent = /\b(whole|entire|full|complete|all|every|overall|global|sitewide|website|landing page|page)\b/.test(lower)
  const sectionIntent = /\b(this|that|specific|current)\s+(section|block|component|card|button|text)\b/.test(lower)
    || /\b(section|block|component)\b/.test(lower)
    || phrases.length > 0
  return sectionIntent && !generalPageIntent
}

export function applyIntentOverrides(
  response: AssistantResponse,
  message: unknown,
  currentPage?: CurrentPage,
): AssistantResponse {
  if (typeof message !== 'string' || !message.trim()) return response

  const next = structuredClone(response)
  const lower = message.toLowerCase()
  const currentBlocks = parsedBlocks(currentPage)
  const removeIntent = /\b(remove|delete|hide|take out|get rid of)\b/.test(lower)
  const phrasesToRemove = quotedPhrases(message)
  const targetPhrases = quotedPhrases(message)
  const backgroundIntent = /\b(bg|background|surface|section color)\b/.test(lower)
  const darkIntent = /\b(dark|black|navy|primary)\b/.test(lower)
  const reorderTarget = reorderTargetFromMessage(lower, currentBlocks)
  const swapTargets = swapTargetsFromMessage(lower, currentBlocks)

  if (reorderTarget) {
    upsertBlock(next, {
      ...reorderTarget.movingBlock,
      action: 'reorder',
      index: reorderTarget.targetIndex,
    })
    next.stage = reorderTarget.movingBlock.type === 'leadForm'
      ? 'leadForm'
      : reorderTarget.movingBlock.type === 'faq'
        ? 'faq'
        : reorderTarget.movingBlock.type === 'footer'
          ? 'footer'
          : 'enhance'
  }

  if (swapTargets) {
    for (const target of swapTargets) {
      upsertBlock(next, {
        ...target.block,
        action: 'reorder',
        index: target.index,
      })
    }
    next.stage = 'enhance'
  }

  if (backgroundIntent && darkIntent) {
    const match = currentBlocks.find((block) => blockIncludes(block, targetPhrases))
      ?? (/\bfaq|questions?\b/.test(lower) ? currentBlocks.find((block) => block.type === 'faq') : undefined)
      ?? (/\bcoverage|pricing\b/.test(lower) ? currentBlocks.find((block) => block.type === 'pricingCards') : undefined)
      ?? (/\bservice|benefit\b/.test(lower) ? currentBlocks.find((block) => block.type === 'servicesGrid') : undefined)
      ?? (/\btestimonial|review\b/.test(lower) ? currentBlocks.find((block) => block.type === 'testimonials') : undefined)
    if (match) {
      const edited = cloneBlock(match)
      edited.style = sectionStyle(edited, 'dark')
      upsertBlock(next, edited)
    }
  }

  if (removeIntent && phrasesToRemove.length) {
    const wantsWholeSection = /\b(section|component|block|banner|card)\b/.test(lower)
    const wantsOnlyButton = /\b(button|cta|call to action)\b/.test(lower) && !wantsWholeSection
    const match = currentBlocks.find((block) => blockIncludes(block, phrasesToRemove))
    if (match) {
      if (wantsWholeSection && !wantsOnlyButton) {
        upsertBlock(next, { ...match, action: 'remove' })
      } else {
        const edited = cloneBlock(match)
        const result = removePhrasesFromValue(edited.props, phrasesToRemove, /\b(card|item|row)\b/.test(lower))
        if (result.changed) {
          edited.props = result.value as typeof edited.props
          upsertBlock(next, edited)
        }
      }
    }
  }

  const currentHero = currentBlocks.find((block) => block.type === 'hero')
  const generatedHero = next.ui_blocks.find((block) => block.type === 'hero')
  const heroSource = generatedHero?.type === 'hero' ? generatedHero : currentHero
  const mentionsHero = /\b(hero|headline|heading)\b/.test(lower)
  const dislikesCurrentLayout = /\b(not looking good|doesn'?t look good|doesnt look good|looks bad|looks awful|looks shit|bad layout|ugly|not good|still not)\b/.test(lower)
  const asksHeroLayoutChange = (mentionsHero && /\b(change|switch|update|improve|different|another|new|layout|template|style)\b/.test(lower))
    || (next.stage === 'hero' && dislikesCurrentLayout)

  if (heroSource?.type === 'hero') {
    const hero = cloneBlock(heroSource)
    let changed = false

    if (removeIntent && mentionsHero && /\b(buttons?|ctas?|call to action)\b/.test(lower)) {
      if (/\b(secondary|second|outline|text)\b/.test(lower)) {
        hero.props.secondaryCtaLabel = null
      } else if (/\b(all|both|buttons|ctas)\b/.test(lower)) {
        hero.props.ctaLabel = null
        hero.props.secondaryCtaLabel = null
      } else {
        hero.props.ctaLabel = null
      }
      changed = true
    }

    const alignment = lower.match(/\b(left|right|center|centre)\b/)?.[1]
    if (mentionsHero && alignment && /\b(align|alignment|move|place|position|heading|headline|content|copy)\b/.test(lower)) {
      hero.style = {
        variant: hero.style?.variant ?? 'editorial',
        align: alignment === 'centre' ? 'center' : alignment as 'left' | 'center' | 'right',
        headingSize: hero.style?.headingSize ?? 'lg',
        width: hero.style?.width ?? 'contained',
        surface: hero.style?.surface ?? 'light',
        columns: hero.style?.columns ?? 2,
        radius: hero.style?.radius ?? 'soft',
      }
      changed = true
    }

    if (asksHeroLayoutChange) {
      const currentBackground = hero.props.backgroundStyle
      const hasSeparateForm = !hero.props.quoteForm && currentBlocks.some((block) => block.type === 'leadForm')
      const shouldUseFullImage = currentBackground !== 'image'
        || hasSeparateForm
        || dislikesCurrentLayout

      hero.props.media = {
        ...hero.props.media,
        type: 'image',
        src: hero.props.media?.src ?? resolveHeroImage([message, hero.props.headline, hero.props.subheadline, hero.props.media?.altPrompt].filter(Boolean).join(' ')),
        altPrompt: hero.props.media?.altPrompt ?? message,
      }

      if (shouldUseFullImage) {
        hero.props.backgroundStyle = 'image'
        hero.props.overlay = {
          style: 'linear',
          color: hero.props.overlay?.color ?? '#101828',
          opacity: Math.max(hero.props.overlay?.opacity ?? 0.68, 0.62),
          direction: 'full',
        }
        hero.style = {
          variant: 'split',
          align: 'left',
          headingSize: 'xl',
          width: 'full',
          surface: 'dark',
          columns: 2,
          radius: 'rounded',
        }
      } else {
        hero.props.backgroundStyle = 'split'
        hero.props.overlay = {
          style: 'none',
          color: '#101828',
          opacity: 0,
          direction: 'full',
        }
        hero.style = {
          variant: 'split',
          align: 'left',
          headingSize: 'xl',
          width: 'full',
          surface: 'dark',
          columns: 2,
          radius: 'rounded',
        }
      }
      changed = true
    }

    const heroImageMissing = mentionsHero
      && /\b(no|not|missing|isn'?t|is not|without|blank|empty|having)\b/.test(lower)
      && /\b(image|picture|photo|visual|media)\b/.test(lower)
    const wantsImageCard = mentionsHero
      && /\b(image|picture|photo|visual|media)\b/.test(lower)
      && /\b(card|box|below|under|left column|separate)\b/.test(lower)
    const wantsFullBackgroundHero = mentionsHero
      && /\b(bg|background|backdrop|behind|full width|full-width|full)\b/.test(lower)
      && /\b(image|picture|photo|visual|photograph|media)\b/.test(lower)
    const imageChange = (/\b(add|change|replace|swap|update|use|show|choose|pick|make|set|have|having|turn|convert)\b/.test(lower) || heroImageMissing || wantsImageCard || wantsFullBackgroundHero)
      && /\b(image|picture|photo|visual|photograph)\b/.test(lower)
    if (imageChange) {
      const suppliedUrl = message.match(/https?:\/\/[^\s)]+/)?.[0]
      const context = [message, hero.props.headline, hero.props.subheadline, hero.props.media?.altPrompt].filter(Boolean).join(' ')
      hero.props.media = {
        ...hero.props.media,
        type: 'image',
        src: suppliedUrl ?? resolveHeroImage(context, hero.props.media?.src),
        altPrompt: hero.props.media?.altPrompt ?? message,
      }
      if (wantsImageCard || (heroImageMissing && !/\b(bg|background|backdrop|behind|full width|full-width)\b/.test(lower))) {
        hero.props.backgroundStyle = 'split'
        hero.props.overlay = {
          style: 'none',
          color: '#101828',
          opacity: 0,
          direction: 'left',
        }
        hero.style = {
          variant: hero.style?.variant ?? 'split',
          align: 'left',
          headingSize: hero.style?.headingSize ?? 'xl',
          width: 'full',
          surface: 'dark',
          columns: 2,
          radius: hero.style?.radius ?? 'rounded',
        }
      } else if (wantsFullBackgroundHero || /\b(bg|background|backdrop|behind|full width|full-width)\b/.test(lower)) {
        hero.props.backgroundStyle = 'image'
        hero.props.overlay = {
          style: 'linear',
          color: '#101828',
          opacity: 0.68,
          direction: 'full',
        }
        hero.style = {
          variant: hero.style?.variant ?? 'split',
          align: 'left',
          headingSize: hero.style?.headingSize ?? 'xl',
          width: 'full',
          surface: 'dark',
          columns: 2,
          radius: hero.style?.radius ?? 'rounded',
        }
      }
      changed = true
    }

    if (mentionsHero && (/\b(6\/6|col\s*6|column\s*6|half\s+half|50\/50|equal split)\b/.test(lower) || /\b(form|quote form)\b/.test(lower) && /\b(right|col|column)\b/.test(lower))) {
      hero.style = {
        variant: hero.style?.variant ?? 'split',
        align: 'left',
        headingSize: hero.style?.headingSize ?? 'xl',
        width: 'full',
        surface: 'dark',
        columns: 2,
        radius: hero.style?.radius ?? 'rounded',
      }
      changed = true
    }

    if (mentionsHero && /\b(gradient|overlay|tint|shade)\b/.test(lower)) {
      const currentOverlay = hero.props.overlay ?? { style: 'linear' as const, color: '#07111F', opacity: 0.55, direction: 'full' as const }
      const hex = message.match(/#[0-9a-fA-F]{3,6}\b/)?.[0]
      const percent = message.match(/\b(\d{1,2})%/)?.[1]
      const opacity = percent ? Math.min(0.9, Number(percent) / 100) : /\b(lighter|subtle|soft)\b/.test(lower) ? 0.3 : /\b(darker|stronger|strong|heavy)\b/.test(lower) ? 0.72 : currentOverlay.opacity > 0 ? currentOverlay.opacity : 0.62
      const direction = lower.match(/\b(left|right|top|bottom|full)\b/)?.[1] as 'left' | 'right' | 'top' | 'bottom' | 'full' | undefined
      const removeOverlay = /\b(remove|delete|hide)\s+(the\s+)?(image\s+)?(gradient|overlay|tint|shade)\b/.test(lower)
        || /\b(without|no)\s+(an?\s+|the\s+)?(gradient|overlay|tint|shade)\b/.test(lower)
      const overlayStyle = removeOverlay
        ? 'none'
        : /\bradial\b/.test(lower)
          ? 'radial'
          : /\bduotone\b/.test(lower)
            ? 'duotone'
            : 'linear'
      hero.props.overlay = {
        style: overlayStyle,
        color: hex ?? currentOverlay.color,
        opacity,
        direction: direction ?? currentOverlay.direction,
      }
      changed = true
    }

    if (changed) upsertBlock(next, hero)
  }

  const currentNavbar = currentBlocks.find((block) => block.type === 'navbar')
  const generatedNavbar = next.ui_blocks.find((block) => block.type === 'navbar')
  const navbarSource = generatedNavbar?.type === 'navbar' ? generatedNavbar : currentNavbar
  if (navbarSource?.type === 'navbar' && removeIntent && /\b(navbar|navigation|header)\b/.test(lower) && /\b(button|cta)\b/.test(lower)) {
    const navbar = cloneBlock(navbarSource)
    navbar.props.ctaLabel = null
    upsertBlock(next, navbar)
  }

  const currentServices = currentBlocks.find((block) => block.type === 'servicesGrid')
  const generatedServices = next.ui_blocks.find((block) => block.type === 'servicesGrid')
  const servicesSource = generatedServices?.type === 'servicesGrid' ? generatedServices : currentServices
  const mentionsServices = /\b(service|services|coverage|cover options|products|cards?)\b/.test(lower)
  if (servicesSource?.type === 'servicesGrid' && mentionsServices) {
    const services = cloneBlock(servicesSource)
    let changed = false

    const style = () => ({
      variant: services.style?.variant ?? 'editorial' as const,
      align: services.style?.align ?? 'left' as const,
      headingSize: services.style?.headingSize ?? 'lg' as const,
      width: services.style?.width ?? 'contained' as const,
      surface: services.style?.surface ?? 'light' as const,
      columns: services.style?.columns ?? 3 as 1 | 2 | 3 | 4,
      radius: services.style?.radius ?? 'soft' as const,
    })

    if (/\b(single|one)\s+row\b|\ball\s+(four|4)\b|\b(four|4)\s+(columns?|cards?)\b/.test(lower)) {
      services.props.layout = 'cards'
      services.style = { ...style(), variant: 'editorial', columns: 4 }
      changed = true
    } else if (/\b(two|2)\s+columns?\b/.test(lower)) {
      services.props.layout = 'cards'
      services.style = { ...style(), columns: 2 }
      changed = true
    } else if (/\b(three|3)\s+columns?\b/.test(lower)) {
      services.props.layout = 'cards'
      services.style = { ...style(), columns: 3 }
      changed = true
    } else if (/\bbento\b|\bmosaic\b|\bmixed[- ]size\b/.test(lower)) {
      services.props.layout = 'bento'
      services.style = { ...style(), variant: 'bento', columns: 4 }
      changed = true
    } else if (/\b(split|featured|feature one|large first)\b/.test(lower) && /\b(layout|service|card)\b/.test(lower)) {
      services.props.layout = 'splitFeature'
      services.style = { ...style(), variant: 'split', columns: 3 }
      changed = true
    } else if (/\b(list|rows|horizontal cards?|compact rows?)\b/.test(lower)) {
      services.props.layout = 'list'
      services.style = { ...style(), variant: 'minimal', columns: 2 }
      changed = true
      } else if (/\b(change|switch|update)\s+(the\s+)?(service(s)?\s+)?layout\b/.test(lower)) {
        services.props.layout = services.props.layout === 'bento' ? 'cards' : 'bento'
        services.style = { ...style(), variant: services.props.layout === 'bento' ? 'bento' : 'editorial', columns: 4 }
        changed = true
      }

      if (/\b(image|picture|photo|visual|photograph)\b/.test(lower)) {
        const suppliedUrl = message.match(/https?:\/\/[^\s)]+/)?.[0]
        const context = [message, services.props.headline, services.props.intro, services.props.media?.altPrompt].filter(Boolean).join(' ')
        services.props.media = {
          ...services.props.media,
          type: 'image',
          src: suppliedUrl ?? resolveHeroImage(context, services.props.media?.src),
          alt: services.props.media?.alt ?? 'Business-relevant services image',
          altPrompt: services.props.media?.altPrompt ?? message,
        }
        if (/\b(add|show|use|with|featured|split)\b/.test(lower)) {
          services.props.layout = 'splitFeature'
          services.style = { ...style(), variant: 'split', columns: 2 }
        }
        changed = true
      }

    if (/\b(icon|icons)\b/.test(lower)) {
      if (/\b(very large|extra large|huge|bigger)\b/.test(lower)) services.props.iconSize = 'xl'
      else if (/\b(big|large|increase|larger)\b/.test(lower)) services.props.iconSize = 'lg'
      else if (/\b(small|smaller|reduce)\b/.test(lower)) services.props.iconSize = 'sm'

      const iconHex = message.match(/#[0-9a-fA-F]{3,6}\b/)?.[0]
      if (iconHex) services.props.iconColor = iconHex
      else if (/\bwhite\b/.test(lower)) services.props.iconColor = 'white'
      else if (/\bblack\b/.test(lower)) services.props.iconColor = 'black'
      else if (/\baccent\b/.test(lower)) services.props.iconColor = 'accent'
      else if (/\bprimary\b/.test(lower)) services.props.iconColor = 'primary'

      if (/\b(no|without|remove|transparent)\s+(icon\s+)?background\b/.test(lower)) services.props.iconBackground = 'transparent'
      else if (/\bwhite\s+(icon\s+)?background\b/.test(lower)) services.props.iconBackground = 'white'
      else if (/\bdark\s+(icon\s+)?background\b/.test(lower)) services.props.iconBackground = 'text'
      else if (services.props.iconColor === 'white' && /\b(background|cards?|section)\b/.test(lower) && /\bdark\b/.test(lower)) services.props.iconBackground = 'transparent'
      changed = true
    }

    if (/\b(all\s+)?cards?\b/.test(lower) && /\b(dark|black)\b/.test(lower)
      && (/\b(background|theme|surface)\b/.test(lower) || /\b(dark|black)\s+cards?\b/.test(lower))) {
      services.props.cardBackground = /\bblack\b/.test(lower) ? 'black' : 'dark'
      services.props.cardTextColor = 'light'
      changed = true
    }

    if (/\b(bg|background|surface|section color|dark|primary)\b/.test(lower) && /\b(section|background|bg|surface)\b/.test(lower)) {
      services.style = { ...style(), surface: 'dark' }
      services.props.cardBackground = 'surface'
      services.props.cardTextColor = 'text'
      services.props.iconColor = 'primary'
      services.props.iconBackground = 'white'
      changed = true
    }

    if (/\b(increase|more|larger|spacious|breathing room|too tight|airy)\b/.test(lower) && /\b(spacing|gap|padding|room|cards?|row)\b/.test(lower)) {
      services.props.spacing = 'airy'
      services.props.cardPadding = 'spacious'
      changed = true
    } else if (/\b(reduce|less|smaller|compact|tighter)\b/.test(lower) && /\b(spacing|gap|padding|room|cards?|row)\b/.test(lower)) {
      services.props.spacing = 'tight'
      services.props.cardPadding = 'compact'
      changed = true
    }

    if (/\b(hide|remove|without|no)\s+(the\s+)?(card\s+)?numbers?\b/.test(lower)) {
      services.props.showNumbers = false
      changed = true
    } else if (/\b(show|add|include)\s+(the\s+)?(card\s+)?numbers?\b/.test(lower)) {
      services.props.showNumbers = true
      changed = true
    }

    if (changed) upsertBlock(next, services)
  }

  const currentPricing = currentBlocks.find((block) => block.type === 'pricingCards')
  const generatedPricing = next.ui_blocks.find((block) => block.type === 'pricingCards')
  const pricingSource = generatedPricing?.type === 'pricingCards' ? generatedPricing : currentPricing
  const mentionsPricing = /\b(coverage|coverages|pricing|price|prices|plans?|package|packages|programme|programmes)\b/.test(lower)
  const asksToCenterCards = /\b(center|centre|middle|align center|centered|centred)\b/.test(lower) && /\b(cards?|plans?|heading|title|section)\b/.test(lower)
  if (pricingSource?.type === 'pricingCards' && (mentionsPricing || asksToCenterCards)) {
    const pricing = cloneBlock(pricingSource)
    let changed = false

    const currentStyle = () => ({
      variant: pricing.style?.variant ?? 'editorial' as const,
      align: pricing.style?.align ?? 'left' as const,
      headingSize: pricing.style?.headingSize ?? 'lg' as const,
      width: pricing.style?.width ?? 'contained' as const,
      surface: pricing.style?.surface ?? 'light' as const,
      columns: pricing.style?.columns ?? 3 as 1 | 2 | 3 | 4,
      radius: pricing.style?.radius ?? 'rounded' as const,
    })

    const wantsTwoPlans = /\b(only\s*)?(two|2)\s+(cards?|plans?|coverages?|packages?)\b/.test(lower)
      || (/\bcore protection\b/.test(lower) && /\b(balance|balanced) cover\b/.test(lower))
    if (wantsTwoPlans) {
      const existing = pricing.props.plans
      const first = existing[0]
      const second = existing[1] ?? existing[0]
      pricing.props.plans = [
        {
          name: /\bcore protection\b/.test(lower) ? 'Core Protection' : first?.name ?? 'Core Protection',
          description: first?.description ?? 'Essential cover for everyday business risks and required protection.',
          price: first?.price ?? 'Illustrative',
          period: first?.period ?? '',
          features: first?.features?.length ? first.features : ['Core liability support', 'Property and asset protection', 'Quote guidance'],
          ctaLabel: first?.ctaLabel ?? 'Choose Core Protection',
        },
        {
          name: /\b(balance|balanced) cover\b/.test(lower) ? 'Balanced Cover' : second?.name ?? 'Balanced Cover',
          description: second?.description ?? 'A broader option for businesses that want stronger all-round protection.',
          price: second?.price ?? 'Illustrative',
          period: second?.period ?? '',
          badge: second?.badge,
          features: second?.features?.length ? second.features : ['Everything in Core Protection', 'Business interruption options', 'Priority advisory support'],
          ctaLabel: second?.ctaLabel ?? 'Choose Balanced Cover',
        },
      ]
      pricing.style = { ...currentStyle(), align: 'center', columns: 2 }
      changed = true
    }

    const alignment = lower.match(/\b(left|right|center|centre)\b/)?.[1]
    if (alignment && /\b(align|alignment|center|centre|middle|heading|title|cards?|plans?|section)\b/.test(lower)) {
      pricing.style = {
        ...currentStyle(),
        align: alignment === 'centre' ? 'center' : alignment as 'left' | 'center' | 'right',
        columns: Math.min(pricing.props.plans.length, pricing.style?.columns ?? pricing.props.plans.length, 4) as 1 | 2 | 3 | 4,
      }
      changed = true
    }

    if (changed) upsertBlock(next, pricing)
  }

  const currentLeadForm = currentBlocks.find((block) => block.type === 'leadForm')
  const generatedLeadForm = next.ui_blocks.find((block) => block.type === 'leadForm')
  const leadFormSource = generatedLeadForm?.type === 'leadForm' ? generatedLeadForm : currentLeadForm
  const formIntent = /\b(form|quote form|lead form|fields?|dropdown|select|button|submit|multi[- ]?step|stepper)\b/.test(lower)
  const asksSeparateForm = formIntent && /\b(separate|new|own|complete|full|standalone)\b/.test(lower) && /\b(section|block|form)\b/.test(lower)
  const asksMultiStep = formIntent && /\b(multi[- ]?step|multiple steps?|stepper|wizard|progress)\b/.test(lower)
  const asksHeroFormRemoval = asksSeparateForm || (formIntent && /\b(remove|move|take)\b/.test(lower) && /\b(hero)\b/.test(lower))

  if (formIntent) {
    const currentHeroIndex = currentBlocks.findIndex((block) => block.type === 'hero')
    const heroForForm = (next.ui_blocks.find((block) => block.type === 'hero') ?? currentHero) as BlockEnvelope | undefined
    let changedForm = false

    if ((asksSeparateForm || asksMultiStep) && heroForForm?.type === 'hero') {
      const editedHero = cloneBlock(heroForForm)
      const leadForm = leadFormFromHero(editedHero, currentHeroIndex >= 0 ? currentHeroIndex + 1 : 2, asksMultiStep || asksSeparateForm)
      if (asksHeroFormRemoval || asksMultiStep) {
        editedHero.props.quoteForm = undefined
        upsertBlock(next, editedHero)
      }
      upsertBlock(next, leadForm)
      changedForm = true
    } else if (leadFormSource?.type === 'leadForm') {
      const leadForm = cloneBlock(leadFormSource)
      if (asksSeparateForm || /\b(after|below)\s+(the\s+)?hero\b/.test(lower)) {
        leadForm.index = currentHeroIndex >= 0 ? currentHeroIndex + 1 : 1
        changedForm = true
      }
      if (asksMultiStep && leadForm.props.layout !== 'multiStep') {
        const fields = leadForm.props.steps.flatMap((step) => step.fields)
        leadForm.props.layout = 'multiStep'
        leadForm.props.steps = splitFieldsIntoSteps(fields)
        changedForm = true
      }

      const submitLabelMatch = message.match(/\b(?:button|submit|cta)(?:\s+text|\s+label)?\s*(?:to|as|:)\s*["']?([^"'\n]{3,48})["']?/i)
      if (submitLabelMatch) {
        leadForm.props.submitLabel = submitLabelMatch[1].trim()
        changedForm = true
      }

      const addField = /\b(add|include|create)\b/.test(lower) && /\b(field|dropdown|select|input)\b/.test(lower)
      if (addField) {
        const fieldLabel = message.match(/\b(?:field|dropdown|select|input)\s+(?:called|named|for|labelled|labeled)?\s*["']?([^"'\n]{3,44})["']?/i)?.[1]?.trim()
        const kind = /\b(dropdown|select)\b/.test(lower)
          ? 'select'
          : /\b(email)\b/.test(lower)
            ? 'email'
            : /\b(phone|mobile|tel)\b/.test(lower)
              ? 'tel'
              : /\b(textarea|message|notes?)\b/.test(lower)
                ? 'textarea'
                : 'text'
        const options = kind === 'select'
          ? (message.match(/\boptions?\s*(?:are|:)\s*([^.\n]+)/i)?.[1]?.split(/,|\bor\b/i).map((option) => option.trim()).filter(Boolean) ?? ['Option 1', 'Option 2'])
          : undefined
        const targetStep = leadForm.props.steps[leadForm.props.steps.length - 1]
        targetStep.fields.push({
          id: normalizeText(fieldLabel ?? `field ${targetStep.fields.length + 1}`).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `field-${targetStep.fields.length + 1}`,
          kind,
          label: fieldLabel ?? (kind === 'select' ? 'Select option' : 'Additional detail'),
          required: /\brequired|mandatory\b/.test(lower),
          options,
          placeholder: kind === 'select' ? undefined : `Enter ${fieldLabel?.toLowerCase() ?? 'details'}`,
        })
        changedForm = true
      }

      if (changedForm) upsertBlock(next, leadForm)
    }

    if (changedForm) next.stage = 'leadForm'
  }

  const sectionNames: Array<[RegExp, BlockEnvelope['type']]> = [
    [/\bservices? section\b/, 'servicesGrid'],
    [/\bform section\b|\blead form\b/, 'leadForm'],
    [/\bfaq section\b|\bfaqs section\b/, 'faq'],
    [/\btestimonial(s)? section\b/, 'testimonials'],
    [/\bstats? section\b/, 'statsBand'],
    [/\bcta section\b|\bcall to action section\b/, 'ctaBanner'],
    [/\bfooter section\b|\bfooter\b/, 'footer'],
    [/\binsurance calculator\b|\bcalculator section\b/, 'insuranceCalculator'],
  ]
  if (removeIntent) {
    for (const [pattern, type] of sectionNames) {
      if (!pattern.test(lower)) continue
      const current = currentBlocks.find((block) => block.type === type)
      if (current) upsertBlock(next, { ...current, action: 'remove' })
    }
  }

  if (asksHeroLayoutChange && !formIntent && !reorderTarget && !swapTargets) {
    next.ui_blocks = next.ui_blocks.filter((block) => block.type === 'hero')
    next.design_system = undefined
  } else if (!formIntent && !reorderTarget && !swapTargets && isScopedEdit(lower, targetPhrases)) {
    const targetTypes = scopedTargetTypes(lower, currentBlocks, targetPhrases)
    if (targetTypes.size) {
      next.ui_blocks = next.ui_blocks.filter((block) => targetTypes.has(block.type))
      next.design_system = undefined
    }
  }

  return next
}
