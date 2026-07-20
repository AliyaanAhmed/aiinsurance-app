import { type ReactNode, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Animation } from '../../generative-ui/schemas'

gsap.registerPlugin(ScrollTrigger)

type AnimatedSectionProps = {
  animation: Animation
  children: ReactNode
  updated?: boolean
}

const entranceVars = {
  fadeUp: { opacity: 0, y: 34 },
  fadeIn: { opacity: 0 },
  slideInLeft: { opacity: 0, x: -42 },
  zoomIn: { opacity: 0, scale: 0.96 },
  none: { opacity: 1 },
}

export function AnimatedSection({ animation, children, updated }: AnimatedSectionProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = animation.stagger ? Array.from(element.children) : element
    const showTarget = () => gsap.set(target, { opacity: 1, x: 0, y: 0, scale: 1, clearProps: 'transform' })

    if (prefersReducedMotion || animation.entrance === 'none') {
      showTarget()
      return
    }

    if (updated) {
      showTarget()
      gsap.fromTo(element, { outlineColor: 'rgba(242, 184, 75, 0.75)' }, { outlineColor: 'rgba(242, 184, 75, 0)', duration: 0.9 })
      return
    }

    const scrollContainer = element.closest('.preview-stage')
    const tween = gsap.fromTo(target, entranceVars[animation.entrance], {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      stagger: animation.stagger ? 0.08 : 0,
      scrollTrigger: {
        trigger: element,
        scroller: scrollContainer ?? undefined,
        start: 'top 82%',
        once: true,
      },
    })
    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      window.cancelAnimationFrame(refreshFrame)
      tween.kill()
      tween.scrollTrigger?.kill()
      showTarget()
    }
  }, [animation.entrance, animation.stagger, updated])

  return (
    <section ref={ref} className="landing-section outline outline-2 outline-transparent">
      {children}
    </section>
  )
}
