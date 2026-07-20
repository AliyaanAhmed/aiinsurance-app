import { blockEnvelopeSchema, type AssistantResponse, type BlockEnvelope } from './schemas.ts'
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

function upsertBlock(response: AssistantResponse, block: BlockEnvelope) {
  const index = response.ui_blocks.findIndex((candidate) => candidate.id === block.id || candidate.type === block.type)
  const next = { ...block, action: block.action === 'remove' ? 'remove' as const : 'upsert' as const }
  if (index >= 0) response.ui_blocks[index] = next
  else response.ui_blocks.push(next)
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

  const currentHero = currentBlocks.find((block) => block.type === 'hero')
  const generatedHero = next.ui_blocks.find((block) => block.type === 'hero')
  const heroSource = generatedHero?.type === 'hero' ? generatedHero : currentHero
  const mentionsHero = /\b(hero|headline|heading)\b/.test(lower)

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

    const imageChange = /\b(change|replace|swap|update|use|show|choose|pick)\b/.test(lower)
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
      changed = true
    }

    if (mentionsHero && /\b(gradient|overlay|tint|shade)\b/.test(lower)) {
      const currentOverlay = hero.props.overlay ?? { style: 'linear' as const, color: '#07111F', opacity: 0.55, direction: 'full' as const }
      const hex = message.match(/#[0-9a-fA-F]{3,6}\b/)?.[0]
      const percent = message.match(/\b(\d{1,2})%/)?.[1]
      const opacity = percent ? Math.min(0.9, Number(percent) / 100) : /\b(lighter|subtle|soft)\b/.test(lower) ? 0.3 : /\b(darker|stronger|strong|heavy)\b/.test(lower) ? 0.72 : currentOverlay.opacity
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

  return next
}
