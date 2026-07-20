import { useState } from 'react'
import { ChatPanel } from './components/studio/ChatPanel'
import { PreviewPane } from './components/studio/PreviewPane'
import './App.css'

function App() {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <main className="app-shell">
      {!fullscreen ? <ChatPanel /> : null}
      <PreviewPane fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((value) => !value)} />
    </main>
  )
}

export default App
