import { Building2, MapPin, Palette, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { sendAssistantMessage } from '../../services/ai/azure-ai.service'
import { useLandingPageStore } from '../../store/landingPageStore'
import { MessageBubble } from './MessageBubble'
import { SuggestionChips } from './SuggestionChips'
import { DesignSystemPanel } from './DesignSystemPanel'
import { landingTemplates } from '../../generative-ui/templates'
import type { TemplateRecommendation } from '../../generative-ui/schemas'

export function ChatPanel() {
  const { messages, suggestions, stage, blocks, designSystem, templateRecommendations, paletteRecommendations, addMessage, applyServerResponse, loadTemplate, applyPaletteRecommendation, setError, lastError } = useLandingPageStore()
  const [draft, setDraft] = useState('')
  const [intakeName, setIntakeName] = useState('')
  const [intakeLocation, setIntakeLocation] = useState('')
  const [intakeProduct, setIntakeProduct] = useState('Business insurance')
  const [intakeAudience, setIntakeAudience] = useState('')
  const [pending, setPending] = useState(false)
  const [showDesignSystem, setShowDesignSystem] = useState(false)
  const conversationId = useMemo(() => crypto.randomUUID(), [])
  const messageListRef = useRef<HTMLDivElement>(null)
  const designSystemAutoOpened = useRef(false)
  const stageOrder = ['intro', 'identity', 'hero', 'navbar', 'services', 'leadForm', 'trust', 'faq', 'footer', 'review', 'enhance']
  const stageIndex = Math.max(0, stageOrder.indexOf(stage))
  const stageProgress = Math.round(((stageIndex + 1) / stageOrder.length) * 100)
  const themeCount = templateRecommendations.length || paletteRecommendations.length
  const hasStarted = messages.some((message) => message.role === 'user')
  const hasGeneratedPage = hasStarted && messages.filter((message) => message.role === 'assistant').length > 1

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length, pending, lastError])

  useEffect(() => {
    if (stage === 'identity' && !designSystemAutoOpened.current) {
      designSystemAutoOpened.current = true
      setShowDesignSystem(true)
    }
  }, [stage, messages.length])

  async function sendMessage(content: string) {
    const message = content.trim()
    if (!message || pending) return

    addMessage({ role: 'user', content: message })
    setDraft('')
    setPending(true)

    try {
      const response = await sendAssistantMessage(conversationId, message, [...messages, { role: 'user', content: message }], { blocks, designSystem })
      applyServerResponse(response)
    } catch (error) {
      console.error(error)
      setError('I could not safely apply that response. The studio kept your current page intact; try the request again in simpler terms.')
    } finally {
      setPending(false)
    }
  }

  function buildWelcomePrompt() {
    return buildPromptWithDetails(draft.trim() || 'Create a premium, interactive insurance landing page with a high-end AI feel, strong hero, quote form, service sections, coverage cards, FAQ and CTA.')
  }

  function buildPromptWithDetails(basePrompt: string) {
    const details = [
      intakeName ? `Business/brand name: ${intakeName}` : '',
      intakeLocation ? `Market/location: ${intakeLocation}` : '',
      intakeProduct ? `Insurance product: ${intakeProduct}` : '',
      intakeAudience ? `Target audience: ${intakeAudience}` : '',
    ].filter(Boolean)
    return [basePrompt, details.length ? `\nUse these details:\n${details.join('\n')}` : ''].join('\n').trim()
  }

  function selectRecommendation(recommendation: TemplateRecommendation) {
    const template = structuredClone(landingTemplates[recommendation.templateId])
    template.assistant_markdown = `**${recommendation.name} applied.** I have used the recommended composition and business-specific palette. Continue by changing any section, image, copy, form field, or calculator.`
    template.questions = []
    template.template_recommendations = []
    template.palette_recommendations = []
    if (template.design_system) {
      template.design_system = {
        ...template.design_system,
        name: recommendation.name,
        preset: 'custom',
        colors: recommendation.colors,
      }
    }
    loadTemplate(template)
  }

  if (!hasGeneratedPage) {
    return (
      <aside className={`chat-panel welcome-panel${pending ? ' is-generating' : ''}`}>
        <div className="welcome-shell">
          <div className="welcome-light-rig" aria-hidden="true">
            <span />
            <i />
            <b />
          </div>
          <section className="welcome-hero">
            <h1>Describe the landing page you want to launch.</h1>
            <p>Start with a prompt, add a few business details, and Aurelian will open the live editor with your generated page on the right.</p>
          </section>

          <form
            className="welcome-composer"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage(buildWelcomePrompt())
            }}
          >
            <div className="welcome-input-wrap">
              {pending ? (
                <div className="welcome-thinking-field" role="status" aria-live="polite">
                  <span className="thinking-orbit"><Sparkles size={18} /></span>
                  <div>
                    <strong>Designing your landing page</strong>
                    <p>Reading your brief, choosing sections, tuning the theme, and preparing the live preview.</p>
                  </div>
                </div>
              ) : (
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void sendMessage(buildWelcomePrompt())
                    }
                  }}
                  placeholder="Build a dark premium UAE business insurance landing page with a background-image hero, quote form, coverage cards and FAQ..."
                />
              )}
              {!pending ? (
                <button type="submit" aria-label="Generate landing page">
                  <Send size={18} />
                </button>
              ) : null}
            </div>

            <div className="welcome-fields">
              <label>
                <span><Building2 size={15} />Name</span>
                <input value={intakeName} onChange={(event) => setIntakeName(event.target.value)} placeholder="Insurance AI" />
              </label>
              <label>
                <span><MapPin size={15} />Market</span>
                <input value={intakeLocation} onChange={(event) => setIntakeLocation(event.target.value)} placeholder="UAE, Pakistan, UK..." />
              </label>
              <label>
                <span><ShieldCheck size={15} />Product</span>
                <select value={intakeProduct} onChange={(event) => setIntakeProduct(event.target.value)}>
                  <option>Business insurance</option>
                  <option>Motor car insurance</option>
                  <option>Home insurance</option>
                  <option>Fleet insurance</option>
                  <option>Health and life insurance</option>
                  <option>Travel insurance</option>
                </select>
              </label>
              <label>
                <span><Sparkles size={15} />Audience</span>
                <input value={intakeAudience} onChange={(event) => setIntakeAudience(event.target.value)} placeholder="Families, SMEs, fleet managers..." />
              </label>
            </div>

            <div className="welcome-suggestions">
              {[
                'Create a dark AI-style insurance landing page',
                'Make a hero with background image, gradient and quote form',
                'Build a premium fleet insurance page with two centered coverage cards',
              ].map((prompt) => (
                <button key={prompt} type="button" onClick={() => void sendMessage(buildPromptWithDetails(prompt))}>
                  {prompt}
                </button>
              ))}
            </div>
          </form>

          {lastError ? <div className="welcome-error">{lastError}</div> : null}
        </div>
      </aside>
    )
  }

  return (
    <aside className="chat-panel workspace-chat">
      <div className="chat-header">
        <div className="chat-orb" aria-hidden="true"><Sparkles size={18} /></div>
        <div>
          <p>Landing Studio</p>
          <h1>Aurelian Studio</h1>
        </div>
      </div>
      <div className="studio-progress">
        <div><span>Build progress</span><strong>{stage.replace(/([A-Z])/g, ' $1')}</strong></div>
        <span>{stageProgress}%</span>
        <i><b style={{ width: `${stageProgress}%` }} /></i>
      </div>
      <div className="chat-tools">
        <button type="button" className={showDesignSystem ? 'active' : ''} onClick={() => setShowDesignSystem((value) => !value)}>
          <Palette size={16} />
          Theme
          <span>{themeCount}</span>
        </button>
      </div>
      {showDesignSystem ? (
        <DesignSystemPanel
          designSystem={designSystem}
          templateRecommendations={templateRecommendations}
          paletteRecommendations={paletteRecommendations}
          onSelectTemplate={selectRecommendation}
          onSelectPalette={applyPaletteRecommendation}
          onPrompt={sendMessage}
        />
      ) : null}
      <div className="message-list" ref={messageListRef}>
        {messages.map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} message={message} onAnswer={sendMessage} onSelectTemplate={selectRecommendation} onSelectPalette={applyPaletteRecommendation} />
        ))}
        {pending ? <ThinkingIndicator /> : null}
        {lastError ? <div className="message-bubble error">{lastError}</div> : null}
      </div>
      <SuggestionChips suggestions={suggestions} onPick={sendMessage} />
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          void sendMessage(draft)
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void sendMessage(draft)
            }
          }}
          placeholder="Describe the broker, offer, or change you want..."
        />
        <button type="submit" disabled={pending || !draft.trim()} aria-label="Send">
          <Send size={18} />
        </button>
      </form>
    </aside>
  )
}

function ThinkingIndicator() {
  return (
    <div className="thinking-indicator" role="status" aria-live="polite">
      <span className="thinking-pulse" />
      <div>
        <strong>Aurelian is analyzing</strong>
        <p>Reading the brief, checking the schema, and shaping the next UI patch.</p>
      </div>
      <span className="thinking-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  )
}
