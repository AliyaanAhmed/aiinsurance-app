import type { z } from 'zod'
import type { statsBandPropsSchema } from '../../generative-ui/schemas'

type StatsBandProps = z.infer<typeof statsBandPropsSchema>

export function StatsBand({ props }: { props: StatsBandProps }) {
  if (!props.stats.length) return null

  return (
    <div className="stats-band">
      {props.stats.map((stat) => (
        <div key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
