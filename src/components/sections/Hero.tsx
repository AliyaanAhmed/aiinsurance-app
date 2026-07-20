import { ArrowRight, Check, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { z } from 'zod'
import type { heroPropsSchema, SectionStyle } from '../../generative-ui/schemas'

type HeroProps = z.infer<typeof heroPropsSchema>

export function Hero({ props, style }: { props: HeroProps; style?: SectionStyle }) {
  const slides = props.slides?.length ? props.slides : [{ title: 'Clear guidance', description: 'A simpler route to the right cover.', metric: '01' }]
  const [activeSlide, setActiveSlide] = useState(0)
  const isCarousel = style?.variant === 'carousel' || props.visualStyle === 'carousel'

  useEffect(() => {
    if (!isCarousel || slides.length < 2) return
    const timer = window.setInterval(() => setActiveSlide((index) => (index + 1) % slides.length), 4600)
    return () => window.clearInterval(timer)
  }, [isCarousel, slides.length])

  const imageStyle = props.media?.src ? { backgroundImage: `url("${props.media.src.replace(/"/g, '')}")` } : undefined
  const overlay = props.overlay ?? { style: 'linear', color: '#07111F', opacity: 0.55, direction: 'full' }
  const heroCssVars = {
    '--hero-overlay-color': overlay.color,
    '--hero-overlay-strength': `${Math.round(overlay.opacity * 100)}%`,
  } as CSSProperties

  return (
    <section className={`lp-hero hero-${style?.variant ?? props.visualStyle} overlay-${overlay.style} overlay-${overlay.direction}`} style={heroCssVars}>
      <div className="hero-backdrop" style={imageStyle} aria-label={props.media?.alt ?? 'Insurance brand hero image'} />
      <div className="hero-copy">
        {props.eyebrow ? <p className="eyebrow"><span />{props.eyebrow}</p> : null}
        <h1>{props.headline}</h1>
        {props.subheadline ? <p className="lede">{props.subheadline}</p> : null}
        <div className="button-row">
          {props.ctaLabel ? <button type="button" className="primary-action">{props.ctaLabel}<ArrowRight size={17} /></button> : null}
          {props.secondaryCtaLabel ? <button type="button" className="text-action">{props.secondaryCtaLabel}</button> : null}
        </div>
        <div className="hero-assurance"><ShieldCheck size={17} /><span>Secure, guided and built around your needs</span></div>
      </div>

      {style?.variant !== 'immersive' ? (
        <div className="hero-experience">
          <div className="hero-feature-card">
            <span className="feature-index">{slides[activeSlide].metric ?? `0${activeSlide + 1}`}</span>
            <strong>{slides[activeSlide].title}</strong>
            <p>{slides[activeSlide].description}</p>
            {slides.length > 1 ? (
              <div className="hero-controls">
                <button type="button" onClick={() => setActiveSlide((activeSlide - 1 + slides.length) % slides.length)} aria-label="Previous slide"><ChevronLeft size={16} /></button>
                <span>{activeSlide + 1} / {slides.length}</span>
                <button type="button" onClick={() => setActiveSlide((activeSlide + 1) % slides.length)} aria-label="Next slide"><ChevronRight size={16} /></button>
              </div>
            ) : null}
          </div>
          <div className="hero-mini-proof"><Check size={15} /><span>Quote journey ready</span></div>
        </div>
      ) : null}
      <div className="hero-scroll-cue"><span>Explore</span><i /></div>
    </section>
  )
}
