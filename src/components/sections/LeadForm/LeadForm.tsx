import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, type FieldValues } from 'react-hook-form'
import { z } from 'zod'
import type { FormField, LeadFormProps, SectionStyle } from '../../../generative-ui/schemas'
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react'
import { FormField as RenderFormField } from './FormField'
import { StepIndicator } from './StepIndicator'

function fieldValidator(field: FormField) {
  if (field.kind === 'email') {
    const email = z.string().email('Enter a valid email')
    return field.required ? email.min(1, 'Required') : email.optional().or(z.literal(''))
  }

  if (field.kind === 'number') {
    const numberValue = z.coerce.number()
    return field.required ? numberValue : numberValue.optional()
  }

  if (field.kind === 'checkbox') {
    return field.required ? z.literal(true) : z.boolean().optional()
  }

  if (field.kind === 'fileUpload') {
    return z.unknown().optional()
  }

  const text = z.string()
  return field.required ? text.min(1, 'Required') : text.optional()
}

function buildSchema(fields: FormField[]) {
  return z.object(
    Object.fromEntries(fields.map((field) => [field.id, fieldValidator(field)])) as Record<string, z.ZodType>,
  )
}

export function LeadForm({ props, style }: { props: LeadFormProps; style?: SectionStyle }) {
  const [stepIndex, setStepIndex] = useState(0)
  const fields = props.steps.flatMap((step) => step.fields)
  const schema = useMemo(() => buildSchema(fields), [fields])
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: Object.fromEntries(fields.map((field) => [field.id, field.kind === 'checkbox' ? false : ''])),
  })
  const currentStep = props.steps[stepIndex]
  const isLastStep = stepIndex === props.steps.length - 1

  async function advance() {
    const valid = await form.trigger(currentStep.fields.map((field) => field.id))
    if (valid) setStepIndex((index) => Math.min(index + 1, props.steps.length - 1))
  }

  function submit(values: FieldValues) {
    form.reset(values)
  }

  return (
    <section className={`lead-form-wrap form-variant-${style?.variant ?? 'editorial'}`}>
      <div className="lead-form-intro">
        <p className="eyebrow"><span />Personal quote journey</p>
        <h2>{props.headline}</h2>
        <p>Share only what is useful. The experience stays focused, transparent and easy to complete.</p>
        <ul className="form-benefits">
          <li><CheckCircle2 size={17} />Clear progress at every step</li>
          <li><CheckCircle2 size={17} />Questions shaped around your cover</li>
          <li><LockKeyhole size={17} />Your details stay protected</li>
        </ul>
      </div>
      <form className="lead-form" onSubmit={form.handleSubmit(submit)}>
        <div className="form-card-accent" aria-hidden="true" />
        {props.steps.length > 1 ? <StepIndicator currentStep={stepIndex} totalSteps={props.steps.length} /> : null}
        <div className="form-step-label"><span>Step {stepIndex + 1} of {props.steps.length}</span><i>{Math.round(((stepIndex + 1) / props.steps.length) * 100)}%</i></div>
        <h3>{currentStep.title}</h3>
        {currentStep.description ? <p>{currentStep.description}</p> : null}
        <div className="form-grid">
          {currentStep.fields.map((field) => (
            <RenderFormField key={field.id} field={field} register={form.register} control={form.control} />
          ))}
        </div>
        {props.consentText ? <p className="consent">{props.consentText}</p> : null}
        <div className="button-row">
          {stepIndex > 0 ? (
            <button type="button" className="ghost" onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : null}
          {isLastStep ? (
            <button type="submit">{props.submitLabel}<ArrowRight size={16} /></button>
          ) : (
            <button type="button" onClick={advance}>
              Continue <ArrowRight size={16} />
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
