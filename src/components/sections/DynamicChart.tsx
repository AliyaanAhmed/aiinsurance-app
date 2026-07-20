import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { z } from 'zod'
import type { dynamicChartPropsSchema } from '../../generative-ui/schemas'

type DynamicChartProps = z.infer<typeof dynamicChartPropsSchema>

export function DynamicChart({ props }: { props: DynamicChartProps }) {
  return (
    <div className="lp-band muted">
      <h2>{props.title}</h2>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={props.data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86}>
              {props.data.map((_, index) => (
                <Cell key={index} fill={index % 2 === 0 ? 'var(--brand-primary)' : 'var(--brand-secondary)'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
