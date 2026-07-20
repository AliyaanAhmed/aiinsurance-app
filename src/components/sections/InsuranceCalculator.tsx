import { ArrowRight, Calculator, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { z } from 'zod'
import type { insuranceCalculatorPropsSchema } from '../../generative-ui/schemas'

type InsuranceCalculatorProps = z.infer<typeof insuranceCalculatorPropsSchema>

export function InsuranceCalculator({ props }: { props: InsuranceCalculatorProps }) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(props.inputs.map((input) => [input.id, input.defaultValue])),
  )
  const estimate = useMemo(
    () => Math.max(0, props.baseAmount + props.inputs.reduce((total, input) => total + (values[input.id] ?? input.defaultValue) * input.weight, 0)),
    [props.baseAmount, props.inputs, values],
  )
  const low = Math.max(0, estimate * .88)
  const high = estimate * 1.12
  const money = (value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: props.currency, maximumFractionDigits: 0 }).format(value)

  return (
    <section className="lp-band calculator-section">
      <div className="calculator-intro">
        {props.eyebrow ? <p className="eyebrow"><span />{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        {props.intro ? <p>{props.intro}</p> : null}
        <div className="calculator-assurance"><ShieldCheck size={18} /><span>Adjust the details to explore how different factors can affect the estimate.</span></div>
      </div>
      <div className="calculator-tool">
        <header><span><Calculator size={18} /></span><strong>{props.calculatorType} estimate</strong></header>
        <div className="calculator-inputs">
          {props.inputs.map((input) => {
            const value = values[input.id] ?? input.defaultValue
            return (
              <label key={input.id}>
                <span><strong>{input.label}</strong><output>{input.prefix}{value.toLocaleString()}{input.suffix}</output></span>
                <input type="range" min={input.min} max={input.max} step={input.step} value={value} onChange={(event) => setValues((current) => ({ ...current, [input.id]: Number(event.target.value) }))} />
                <small><span>{input.prefix}{input.min.toLocaleString()}{input.suffix}</span><span>{input.prefix}{input.max.toLocaleString()}{input.suffix}</span></small>
              </label>
            )
          })}
        </div>
        <div className="calculator-result">
          <span>{props.resultLabel}</span>
          <strong>{money(low)} - {money(high)}</strong>
          <small>{props.disclaimer}</small>
        </div>
        {props.ctaLabel ? <button type="button">{props.ctaLabel}<ArrowRight size={16} /></button> : null}
      </div>
    </section>
  )
}
