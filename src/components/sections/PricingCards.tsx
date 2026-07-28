import { Check } from 'lucide-react'
import type { z } from 'zod'
import type { pricingCardsPropsSchema } from '../../generative-ui/schemas'

type PricingCardsProps = z.infer<typeof pricingCardsPropsSchema>

export function PricingCards({ props }: { props: PricingCardsProps }) {
  return (
    <section className="lp-band pricing-section">
      <header className="section-heading">
        <div>
          {props.eyebrow ? <p className="eyebrow"><span />{props.eyebrow}</p> : null}
          <h2>{props.headline}</h2>
        </div>
        {props.intro ? <p>{props.intro}</p> : null}
      </header>
      <div className="pricing-grid">
        {props.plans.map((plan) => (
          <article key={plan.name} className={plan.badge ? 'pricing-card featured' : 'pricing-card'}>
            {plan.badge ? <span className="pricing-badge">{plan.badge}</span> : null}
            <div>
              <h3>{plan.name}</h3>
              {plan.description ? <p>{plan.description}</p> : null}
            </div>
            <div className="pricing-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}><Check size={16} />{feature}</li>
              ))}
            </ul>
            <button type="button">{plan.ctaLabel}</button>
          </article>
        ))}
      </div>
    </section>
  )
}
