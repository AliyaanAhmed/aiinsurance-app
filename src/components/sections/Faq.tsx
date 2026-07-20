import type { z } from 'zod'
import type { faqPropsSchema } from '../../generative-ui/schemas'

type FaqProps = z.infer<typeof faqPropsSchema>

export function Faq({ props }: { props: FaqProps }) {
  return (
    <div className="lp-band">
      <h2>{props.headline}</h2>
      <div className="faq-list">
        {props.items.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
