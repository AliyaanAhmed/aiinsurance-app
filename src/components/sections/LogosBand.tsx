import type { z } from 'zod'
import type { logosBandPropsSchema } from '../../generative-ui/schemas'

type LogosBandProps = z.infer<typeof logosBandPropsSchema>

export function LogosBand({ props }: { props: LogosBandProps }) {
  return (
    <div className="logos-band">
      {props.eyebrow ? <p>{props.eyebrow}</p> : null}
      <div>
        {props.logos.map((logo) => (
          <span key={logo.name}>{logo.name}</span>
        ))}
      </div>
    </div>
  )
}
