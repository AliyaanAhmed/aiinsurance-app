import type { AssistantResponse, BlockEnvelope } from '../../src/generative-ui/schemas.ts'

export type RuleViolation = {
  path: string
  message: string
}

const guaranteePhrases = [
  'guaranteed lowest price',
  'always beat any quote',
  'guaranteed savings',
  'risk-free coverage',
  'fully guaranteed',
]

const competitorNames = ['geico', 'progressive', 'state farm', 'allstate', 'liberty mutual']

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function visitStrings(value: unknown, path: string, visitor: (text: string, path: string) => void) {
  if (typeof value === 'string') {
    visitor(value, path)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => visitStrings(item, `${path}.${index}`, visitor))
    return
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => visitStrings(item, `${path}.${key}`, visitor))
  }
}

function checkTextSafety(block: BlockEnvelope, violations: RuleViolation[]) {
  visitStrings(block.props, `blocks.${block.id}.props`, (text, path) => {
    const lower = text.toLowerCase()
    if (/<\/?[a-z][\s\S]*>/i.test(text) || lower.includes('<script') || lower.includes('javascript:')) {
      violations.push({ path, message: 'Raw HTML, scripts, and javascript URLs are not allowed.' })
    }

    if (guaranteePhrases.some((phrase) => lower.includes(phrase))) {
      violations.push({ path, message: 'Insurance guarantee or absolute-price language is not allowed.' })
    }

    if (competitorNames.some((name) => lower.includes(name))) {
      violations.push({ path, message: 'Competitor names should not be introduced by the model.' })
    }
  })
}

function checkWordCounts(block: BlockEnvelope, violations: RuleViolation[]) {
  if (block.type === 'hero' && words(block.props.headline) > 14) {
    violations.push({ path: `blocks.${block.id}.props.headline`, message: 'Hero headline should be 14 words or fewer.' })
  }

  if (block.type === 'ctaBanner' && words(block.props.headline) > 12) {
    violations.push({ path: `blocks.${block.id}.props.headline`, message: 'CTA headline should be 12 words or fewer.' })
  }

  if ('subheadline' in block.props && typeof block.props.subheadline === 'string' && words(block.props.subheadline) > 34) {
    violations.push({ path: `blocks.${block.id}.props.subheadline`, message: 'Subheadline should be 34 words or fewer.' })
  }
}

function checkLeadForm(block: BlockEnvelope, violations: RuleViolation[]) {
  if (block.type !== 'leadForm') return

  const fields = block.props.steps.flatMap((step) => step.fields)
  if (!fields.some((field) => field.required)) {
    violations.push({ path: `blocks.${block.id}.props.steps`, message: 'Lead forms need at least one required field.' })
  }

  if (!fields.some((field) => field.kind === 'email' || field.kind === 'tel')) {
    violations.push({ path: `blocks.${block.id}.props.steps`, message: 'Lead forms need an email or phone field.' })
  }
}

function luminance(hex: string) {
  const normalized = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const rgb = [1, 3, 5].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255)
  const linear = rgb.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrastRatio(a: string, b: string) {
  const light = Math.max(luminance(a), luminance(b))
  const dark = Math.min(luminance(a), luminance(b))
  return (light + 0.05) / (dark + 0.05)
}

function checkThemeContrast(block: BlockEnvelope, violations: RuleViolation[]) {
  const background = block.themeOverride?.background
  const text = block.themeOverride?.text
  if (background && text && contrastRatio(background, text) < 4.5) {
    violations.push({ path: `blocks.${block.id}.themeOverride`, message: 'Theme override text/background contrast must pass WCAG AA.' })
  }
}

function checkPaletteContrast(
  colors: { background: string; surface: string; text: string; muted: string },
  path: string,
  violations: RuleViolation[],
) {
  if (contrastRatio(colors.background, colors.text) < 4.5) {
    violations.push({ path: `${path}.text`, message: 'Palette text must pass WCAG AA against the page background.' })
  }
  if (contrastRatio(colors.surface, colors.text) < 4.5) {
    violations.push({ path: `${path}.surface`, message: 'Palette text must pass WCAG AA against the surface color.' })
  }
  if (contrastRatio(colors.background, colors.muted) < 3) {
    violations.push({ path: `${path}.muted`, message: 'Muted text needs sufficient contrast against the page background.' })
  }
}

export function validateBlockRules(response: AssistantResponse) {
  const violations: RuleViolation[] = []

  if (response.design_system) checkPaletteContrast(response.design_system.colors, 'design_system.colors', violations)
  response.palette_recommendations.forEach((recommendation, index) => {
    checkPaletteContrast(recommendation.colors, `palette_recommendations.${index}.colors`, violations)
  })

  response.ui_blocks.forEach((block) => {
    checkTextSafety(block, violations)
    checkWordCounts(block, violations)
    checkLeadForm(block, violations)
    checkThemeContrast(block, violations)
  })

  return violations
}
