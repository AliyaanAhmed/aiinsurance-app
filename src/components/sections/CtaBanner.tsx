import type { z } from 'zod'
import type { ctaBannerPropsSchema } from '../../generative-ui/schemas'

type CtaBannerProps = z.infer<typeof ctaBannerPropsSchema>

export function CtaBanner({ props }: { props: CtaBannerProps }) {
  return (
    <div className="cta-banner">
      <div>
        <h2>{props.headline}</h2>
        {props.subheadline ? <p>{props.subheadline}</p> : null}
      </div>
      {props.ctaLabel ? <button type="button">{props.ctaLabel}</button> : null}
    </div>
  )
}
