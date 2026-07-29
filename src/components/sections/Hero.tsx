import { ArrowRight, BriefcaseBusiness, Car, Check, ChevronLeft, ChevronRight, HeartPulse, Home, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { z } from 'zod'
import { resolveHeroImage } from '../../generative-ui/normalizeResponse'
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

  const resolvedImageSource = props.media?.src || resolveHeroImage([props.eyebrow, props.headline, props.subheadline, props.media?.altPrompt].filter(Boolean).join(' '))
  const imageStyle = { backgroundImage: `url("${resolvedImageSource.replace(/"/g, '')}")` }
  const overlay = props.overlay ?? { style: 'linear', color: '#07111F', opacity: 0.55, direction: 'full' }
  const useHeroBackgroundImage = props.backgroundStyle === 'image'
  const heroCssVars = {
    '--hero-overlay-color': overlay.color,
    '--hero-overlay-strength': `${Math.round(overlay.opacity * 100)}%`,
    '--hero-bg-image': `url("${resolvedImageSource.replace(/"/g, '')}")`,
  } as CSSProperties

  return (
    <section className={`lp-hero hero-${style?.variant ?? props.visualStyle} background-${props.backgroundStyle} overlay-${overlay.style} overlay-${overlay.direction}${props.quoteForm ? ' has-quote-form' : ''}${useHeroBackgroundImage ? ' hero-bg-image' : ''}`} style={heroCssVars}>
      {useHeroBackgroundImage ? <div className="hero-backdrop" style={imageStyle} aria-label={props.media?.alt ?? 'Insurance brand hero image'} /> : null}
      {props.quoteForm ? (
        <div className="hero-left-column">
          <div className="hero-copy">
            {props.eyebrow ? <p className="eyebrow"><span />{props.eyebrow}</p> : null}
            <h1>{props.headline}</h1>
            {props.subheadline ? <p className="lede">{props.subheadline}</p> : null}
            <div className="hero-assurance"><ShieldCheck size={17} /><span>Secure, guided and built around your needs</span></div>
          </div>
          {!useHeroBackgroundImage ? <div className="hero-image-card" style={imageStyle} aria-label={props.media?.alt ?? 'Insurance brand hero image'} /> : null}
        </div>
      ) : (
        <>
          {!useHeroBackgroundImage ? <div className="hero-backdrop" style={imageStyle} aria-label={props.media?.alt ?? 'Insurance brand hero image'} /> : null}
          <div className="hero-copy">
            {props.eyebrow ? <p className="eyebrow"><span />{props.eyebrow}</p> : null}
            <h1>{props.headline}</h1>
            {props.subheadline ? <p className="lede">{props.subheadline}</p> : null}
            {(props.ctaLabel || props.secondaryCtaLabel) ? (
              <div className="button-row">
                {props.ctaLabel ? <button type="button" className="primary-action">{props.ctaLabel}<ArrowRight size={17} /></button> : null}
                {props.secondaryCtaLabel ? <button type="button" className="text-action">{props.secondaryCtaLabel}</button> : null}
              </div>
            ) : null}
            <div className="hero-assurance"><ShieldCheck size={17} /><span>Secure, guided and built around your needs</span></div>
          </div>
        </>
      )}

      {style?.variant !== 'immersive' ? (
        <div className="hero-experience">
          {props.quoteForm ? <HeroQuoteForm form={props.quoteForm} /> : null}
          {!props.quoteForm ? (
            <>
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
            </>
          ) : null}
        </div>
      ) : null}
      <div className="hero-scroll-cue"><span>Explore</span><i /></div>
    </section>
  )
}

function HeroQuoteForm({ form }: { form: NonNullable<HeroProps['quoteForm']> }) {
  const Icon = quoteFormIcon(form)

  return (
    <form className="hero-quote-form" aria-label={form.headline}>
      <div className="hero-quote-heading">
        <span><Icon size={20} /></span>
        <div>
          <strong>{form.headline}</strong>
          {form.subheadline ? <p>{form.subheadline}</p> : null}
        </div>
      </div>
      <div className="hero-quote-fields">
        {form.fields.map((field) => (
          <label key={field.id} className={field.kind === 'textarea' || field.kind === 'richtext' ? 'wide' : undefined}>
            <span>{field.label}</span>
            {field.kind === 'select' ? (
              <select required={field.required} defaultValue="">
                <option value="" disabled>{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : field.kind === 'textarea' || field.kind === 'richtext' ? (
              <textarea required={field.required} placeholder={field.placeholder} />
            ) : (
              <input
                required={field.required}
                type={field.kind === 'email' || field.kind === 'tel' || field.kind === 'number' || field.kind === 'date' ? field.kind : 'text'}
                placeholder={field.placeholder}
              />
            )}
          </label>
        ))}
      </div>
      <button type="button">{form.submitLabel}</button>
      {form.secureText ? <p className="hero-quote-secure"><ShieldCheck size={14} />{form.secureText}</p> : null}
    </form>
  )
}

function quoteFormIcon(form: NonNullable<HeroProps['quoteForm']>) {
  const text = `${form.headline} ${form.subheadline ?? ''} ${form.fields.map((field) => `${field.label} ${(field.options ?? []).join(' ')}`).join(' ')}`.toLowerCase()
  if (text.includes('fleet') || text.includes('car') || text.includes('auto') || text.includes('vehicle') || text.includes('driver')) return Car
  if (text.includes('home') || text.includes('property') || text.includes('contents')) return Home
  if (text.includes('life') || text.includes('health') || text.includes('medical')) return HeartPulse
  if (text.includes('business') || text.includes('commercial') || text.includes('fleet')) return BriefcaseBusiness
  return ShieldCheck
}
