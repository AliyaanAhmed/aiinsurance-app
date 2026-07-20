import type { z } from 'zod'
import type { testimonialsPropsSchema } from '../../generative-ui/schemas'

type TestimonialsProps = z.infer<typeof testimonialsPropsSchema>

export function Testimonials({ props }: { props: TestimonialsProps }) {
  return (
    <div className="lp-band muted">
      {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
      <h2>{props.headline}</h2>
      <div className="quote-grid">
        {props.items.map((item) => (
          <figure key={`${item.name}-${item.quote}`}>
            <blockquote>{item.quote}</blockquote>
            <figcaption>
              <strong>{item.name}</strong>
              {item.role ? <span>{item.role}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
