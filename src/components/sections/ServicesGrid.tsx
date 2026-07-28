import { ArrowUpRight, BriefcaseBusiness, Car, Clock3, HeartPulse, Home, ShieldCheck, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { z } from 'zod'
import type { SectionStyle, servicesGridPropsSchema } from '../../generative-ui/schemas'

type ServicesGridProps = z.infer<typeof servicesGridPropsSchema>
type ServiceCssProperties = CSSProperties & Record<`--${string}`, string | number | undefined>

const iconMap = {
  car: Car,
  home: Home,
  heart: HeartPulse,
  business: BriefcaseBusiness,
  shield: ShieldCheck,
  sparkles: Sparkles,
  clock: Clock3,
}

const iconSizes = { sm: 18, md: 22, lg: 30, xl: 38 }
const gaps = { tight: 8, normal: 14, airy: 24 }
const paddings = { compact: 18, normal: 26, spacious: 36 }

function colorValue(color?: string) {
  if (!color) return undefined
  if (color.startsWith('#')) return color
  const tokens: Record<string, string> = {
    primary: 'var(--brand-primary)',
    secondary: 'var(--brand-secondary)',
    accent: 'var(--brand-accent)',
    background: 'var(--brand-bg)',
    surface: 'var(--brand-surface)',
    text: 'var(--brand-ink)',
    muted: 'var(--brand-muted)',
    dark: 'var(--brand-dark)',
    light: 'var(--brand-light)',
    white: '#ffffff',
    black: '#05070b',
    transparent: 'transparent',
  }
  return tokens[color]
}

export function ServicesGrid({ props, style }: { props: ServicesGridProps; style?: SectionStyle }) {
  const layout = props.layout ?? (style?.variant === 'bento' ? 'bento' : 'cards')
  const spacing = props.spacing ?? 'normal'
  const cardPadding = props.cardPadding ?? 'normal'
  const iconSize = props.iconSize ?? 'md'
  const cssVariables: ServiceCssProperties = {
    '--section-columns': style?.columns ?? 3,
    '--service-gap': `${gaps[spacing]}px`,
    '--service-card-padding': `${paddings[cardPadding]}px`,
    '--service-icon-size': `${iconSizes[iconSize]}px`,
    '--service-icon-box': `${iconSizes[iconSize] + 24}px`,
    '--service-icon-color': colorValue(props.iconColor),
    '--service-icon-bg': colorValue(props.iconBackground),
    '--service-card-bg': colorValue(props.cardBackground),
    '--service-card-text': colorValue(props.cardTextColor),
    '--service-feature-image': props.media?.src ? `url("${props.media.src.replace(/"/g, '')}")` : undefined,
  }

  const cards = (
    <div className="service-grid" style={cssVariables}>
      {props.items.map((item, index) => {
        const Icon = iconMap[(item.icon ?? '') as keyof typeof iconMap] ?? [Car, Home, ShieldCheck, BriefcaseBusiness][index % 4]
        return (
          <article key={item.title}>
            <div className="service-card-top">
              <span className="service-icon"><Icon aria-hidden="true" /></span>
              {props.showNumbers !== false ? <span className="service-number">{String(index + 1).padStart(2, '0')}</span> : null}
            </div>
            <div className="service-card-copy"><h3>{item.title}</h3><p>{item.description}</p></div>
            <ArrowUpRight className="service-card-arrow" aria-hidden="true" />
          </article>
        )
      })}
    </div>
  )

  return (
    <section className={`lp-band services-section services-layout-${layout} spacing-${spacing} padding-${cardPadding}`}>
      {layout === 'splitFeature' ? (
        <div className="services-split-shell">
          <header className={`services-feature-intro${props.media?.src ? ' has-media' : ''}`} style={cssVariables}>
            {props.media?.src ? <div className="services-feature-media" role="img" aria-label={props.media.alt ?? 'Featured insurance service'} /> : null}
            <div className="services-feature-copy">
              {props.eyebrow ? <p className="eyebrow"><span />{props.eyebrow}</p> : null}
              <h2>{props.headline}</h2>
              <p>{props.intro ?? 'Explore the cover and guidance designed around the moments that matter.'}</p>
              <span className="services-feature-index">{String(props.items.length).padStart(2, '0')} services</span>
            </div>
          </header>
          {cards}
        </div>
      ) : (
        <>
          <header className="section-heading">
            <div>
              {props.eyebrow ? <p className="eyebrow"><span />{props.eyebrow}</p> : null}
              <h2>{props.headline}</h2>
            </div>
            <p>{props.intro ?? 'Explore the cover and guidance designed around the moments that matter.'}</p>
          </header>
          {cards}
        </>
      )}
    </section>
  )
}
