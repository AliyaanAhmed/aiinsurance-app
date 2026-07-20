import { Palette, Send, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { sendAssistantMessage } from '../../services/ai/azure-ai.service'
import { useLandingPageStore } from '../../store/landingPageStore'
import { MessageBubble } from './MessageBubble'
import { SuggestionChips } from './SuggestionChips'
import { DesignSystemPanel } from './DesignSystemPanel'
import { landingTemplates } from '../../generative-ui/templates'
import type { TemplateRecommendation } from '../../generative-ui/schemas'

export function ChatPanel() {
  const { messages, suggestions, stage, blocks, designSystem, addMessage, applyServerResponse, loadTemplate, applyPaletteRecommendation, setError, lastError } = useLandingPageStore()
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [showDesignSystem, setShowDesignSystem] = useState(false)
  const conversationId = useMemo(() => crypto.randomUUID(), [])
  const messageListRef = useRef<HTMLDivElement>(null)
  const designSystemAutoOpened = useRef(false)
  const stageOrder = ['intro', 'identity', 'hero', 'navbar', 'services', 'leadForm', 'trust', 'faq', 'footer', 'review', 'enhance']
  const stageIndex = Math.max(0, stageOrder.indexOf(stage))
  const stageProgress = Math.round(((stageIndex + 1) / stageOrder.length) * 100)
  const recommendationCount = [...messages].reverse().find((message) => message.paletteRecommendations?.length || message.templateRecommendations?.length)
  const themeCount = recommendationCount?.paletteRecommendations?.length ?? recommendationCount?.templateRecommendations?.length ?? 1

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

  return (
    <aside className="chat-panel">
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
      {showDesignSystem ? <DesignSystemPanel designSystem={designSystem} onPrompt={sendMessage} /> : null}
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
