import { useState } from 'react'
import { ChatPanel } from './components/studio/ChatPanel'
import { PreviewPane } from './components/studio/PreviewPane'
import { useLandingPageStore } from './store/landingPageStore'
import './App.css'

function App() {
  const [fullscreen, setFullscreen] = useState(false)
  const hasGeneratedPage = useLandingPageStore((state) => {
    const hasUserPrompt = state.messages.some((message) => message.role === 'user')
    const assistantReplies = state.messages.filter((message) => message.role === 'assistant').length
    return hasUserPrompt && assistantReplies > 1
  })

  return (
    <main className={hasGeneratedPage ? 'app-shell workspace-mode' : 'app-shell welcome-mode'}>
      {!fullscreen ? <ChatPanel /> : null}
      {hasGeneratedPage || fullscreen ? <PreviewPane fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((value) => !value)} /> : null}
    </main>
  )
}

export default App
