import type { CSSProperties } from 'react'
import type { DesignSystem, ThemeOverride } from '../generative-ui/schemas'

const displayFonts: Record<DesignSystem['typography']['display'], string> = {
  grotesk: '"Segoe UI Variable Display", "Aptos Display", "Segoe UI", sans-serif',
  humanist: '"Aptos Display", "Segoe UI Variable Display", "Segoe UI", sans-serif',
  geometric: '"Segoe UI Variable Display", "Aptos Display", "Century Gothic", sans-serif',
  editorial: '"Iowan Old Style", "Palatino Linotype", Georgia, serif',
}

const bodyFonts: Record<DesignSystem['typography']['body'], string> = {
  grotesk: '"Segoe UI Variable Text", Aptos, "Segoe UI", sans-serif',
  humanist: 'Aptos, "Segoe UI Variable Text", "Segoe UI", sans-serif',
  geometric: '"Segoe UI Variable Text", Aptos, "Century Gothic", sans-serif',
}

function luminance(hex: string) {
  const normalized = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const channels = [1, 3, 5].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255)
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function readableText(background: string) {
  return luminance(background) > 0.46 ? '#07111F' : '#FFFFFF'
}

export function designSystemToCssVars(system: DesignSystem, override?: ThemeOverride): CSSProperties {
  const background = override?.background ?? system.colors.background
  const text = override?.text ?? system.colors.text
  const primary = override?.primary ?? system.colors.primary
  const secondary = override?.secondary ?? system.colors.secondary
  const [dark, light] = luminance(background) < luminance(text) ? [background, text] : [text, background]

  return {
    '--brand-primary': primary,
    '--brand-secondary': secondary,
    '--brand-accent': override?.accent ?? system.colors.accent,
    '--brand-bg': background,
    '--brand-surface': system.colors.surface,
    '--brand-ink': text,
    '--brand-muted': system.colors.muted,
    '--brand-dark': dark,
    '--brand-light': light,
    '--brand-on-primary': readableText(primary),
    '--brand-on-secondary': readableText(secondary),
    '--font-display': displayFonts[system.typography.display],
    '--font-body': bodyFonts[system.typography.body],
    '--page-radius': system.radius === 'sharp' ? '10px' : system.radius === 'rounded' ? '22px' : '16px',
  } as CSSProperties
}
