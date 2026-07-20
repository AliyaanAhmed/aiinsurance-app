import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { ChatQuestion, PaletteRecommendation, TemplateRecommendation } from '../../generative-ui/schemas'
import type { ChatMessage } from '../../store/landingPageStore'

export function MessageBubble({
  message,
  onAnswer,
  onSelectTemplate,
  onSelectPalette,
}: {
  message: ChatMessage
  onAnswer?: (answer: string) => void
  onSelectTemplate?: (recommendation: TemplateRecommendation) => void
  onSelectPalette?: (recommendation: PaletteRecommendation) => void
}) {
  return (
    <div className={`message-bubble ${message.role}`}>
      <FormattedMessage content={message.content} />
      {message.questions?.length && onAnswer ? <ChatQuestionForm questions={message.questions} onSubmit={onAnswer} /> : null}
      {message.templateRecommendations?.length && onSelectTemplate ? (
        <div className="chat-template-recommendations">
          {message.templateRecommendations.map((recommendation) => (
            <button key={`${recommendation.templateId}-${recommendation.name}`} type="button" onClick={() => onSelectTemplate(recommendation)}>
              <span className="recommendation-swatches" aria-hidden="true">
                {[recommendation.colors.primary, recommendation.colors.secondary, recommendation.colors.accent].map((color) => <i key={color} style={{ background: color }} />)}
              </span>
              <span><strong>{recommendation.name}</strong><small>{recommendation.reason}</small></span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      ) : null}
      {message.paletteRecommendations?.length && onSelectPalette ? (
        <div className="chat-palette-recommendations">
          {message.paletteRecommendations.map((recommendation) => (
            <button key={recommendation.name} type="button" onClick={() => onSelectPalette(recommendation)}>
              <span className="palette-strip" aria-hidden="true">
                {Object.values(recommendation.colors).map((color, index) => <i key={`${color}-${index}`} style={{ background: color }} />)}
              </span>
              <span><strong>{recommendation.name}</strong><small>{recommendation.rationale}</small></span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ChatQuestionForm({ questions, onSubmit }: { questions: ChatQuestion[]; onSubmit: (answer: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const answer = questions.map((question) => `${question.label}: ${values[question.id] ?? ''}`).join('\n')
    setSubmitted(true)
    onSubmit(answer)
  }

  if (submitted) return <div className="chat-form-submitted"><Check size={14} />Answers sent</div>

  return (
    <form className="chat-question-form" onSubmit={submit}>
      {questions.map((question) => (
        <label key={question.id} className={`chat-question chat-question-${question.kind}`}>
          <span>{question.label}</span>
          {question.kind === 'textarea' ? (
            <textarea required={question.required} placeholder={question.placeholder} value={values[question.id] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [question.id]: event.target.value }))} />
          ) : question.kind === 'select' ? (
            <select required={question.required} value={values[question.id] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [question.id]: event.target.value }))}>
              <option value="">Select an option</option>
              {question.options?.map((option) => <option key={option}>{option}</option>)}
            </select>
          ) : question.kind === 'radio' ? (
            <span className="chat-radio-group">
              {question.options?.map((option) => (
                <span key={option}><input type="radio" name={question.id} value={option} required={question.required} checked={values[question.id] === option} onChange={() => setValues((current) => ({ ...current, [question.id]: option }))} />{option}</span>
              ))}
            </span>
          ) : (
            <input required={question.required} placeholder={question.placeholder} value={values[question.id] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [question.id]: event.target.value }))} />
          )}
        </label>
      ))}
      <button type="submit"><Sparkles size={14} />Use these answers<ArrowRight size={14} /></button>
    </form>
  )
}

function FormattedMessage({ content }: { content: string }) {
  const readableContent = content
    .replace(/\s(?=\d{2}\.\s)/g, '\n')
    .replace(/\s(?=\d\.\s[A-Z])/g, '\n')

  const blocks = readableContent
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
        const isList = lines.every((line) => /^(-|\d+\.)\s+/.test(line))

        if (isList) {
          return (
            <ul key={index} className="message-list-markdown">
              {lines.map((line) => (
                <li key={line}>{renderInline(line.replace(/^(-|\d+\.)\s+/, ''))}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={index} className="message-paragraph">
            {renderInline(lines.join(' '))}
          </p>
        )
      })}
    </>
  )
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>
    }

    return part
  })
}
