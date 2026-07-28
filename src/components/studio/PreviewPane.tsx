import { FileText, Maximize2, Minimize2, RefreshCw, Redo2, Undo2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { componentRegistry } from '../../generative-ui/registry/componentRegistry'
import { designSystemToCssVars } from '../../theme/tokens'
import { redoLandingPageChange, undoLandingPageChange, useLandingPageStore } from '../../store/landingPageStore'
import { AnimatedSection } from '../sections/AnimatedSection'
import { DeviceFrameToggle, type DeviceSize } from './DeviceFrameToggle'

const frameWidths: Record<DeviceSize, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
}

type BackendLog = {
  id: string
  timestamp: string
  status: 'success' | 'fallback'
  request?: {
    message?: string
    messageCount?: number
    currentPage?: {
      blockCount?: number
      blocks?: Array<{ id?: string; type?: string; variant?: string; radius?: string; surface?: string }>
      designSystem?: string
    }
  }
  calls?: Array<{
    mode?: string
    status?: number
    model?: string
    endpointHost?: string
    input?: string
    rawText?: string
  }>
  firstPass?: {
    stage?: string
    blockTypes?: string[]
    violations?: unknown[]
  }
  secondPass?: {
    stage?: string
    blockTypes?: string[]
    violations?: unknown[]
  }
  response?: {
    assistantMarkdown?: string
    stage?: string
    uiBlocks?: unknown[]
    designSystem?: unknown
  }
  error?: string
  violations?: unknown[]
}

export function PreviewPane({
  fullscreen,
  onToggleFullscreen,
}: {
  fullscreen: boolean
  onToggleFullscreen: () => void
}) {
  const blocks = useLandingPageStore((state) => state.blocks)
  const focusBlockId = useLandingPageStore((state) => state.focusBlockId)
  const setFocusBlockId = useLandingPageStore((state) => state.setFocusBlockId)
  const designSystem = useLandingPageStore((state) => state.designSystem)
  const [device, setDevice] = useState<DeviceSize>('desktop')
  const [logsOpen, setLogsOpen] = useState(false)
  const [logs, setLogs] = useState<BackendLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState<string>()
  const cssVars = useMemo(() => designSystemToCssVars(designSystem), [designSystem])
  const blockRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!focusBlockId) return
    blockRefs.current[focusBlockId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusBlockId])

  async function refreshLogs() {
    setLogsLoading(true)
    setLogsError(undefined)
    try {
      const response = await fetch('http://127.0.0.1:8787/assistant/logs')
      if (!response.ok) throw new Error(`Logs endpoint returned ${response.status}`)
      const data = (await response.json()) as { logs?: BackendLog[] }
      setLogs(data.logs ?? [])
    } catch (error) {
      setLogsError(error instanceof Error ? error.message : 'Could not load backend logs')
    } finally {
      setLogsLoading(false)
    }
  }

  function openLogs() {
    setLogsOpen(true)
    void refreshLogs()
  }

  return (
    <section className={fullscreen ? 'preview-pane fullscreen' : 'preview-pane'}>
      <div className="preview-toolbar">
        <div className="preview-toolbar-title">
          <span className="live-dot" />
          <div><strong>Live canvas</strong><small>{designSystem.name} direction</small></div>
        </div>
        <label className="section-jump">
          <span>Section</span>
          <select value={focusBlockId ?? ''} onChange={(event) => setFocusBlockId(event.target.value)}>
            <option value="">Whole page</option>
            {blocks.map((block) => <option key={block.id} value={block.id}>{block.type.replace(/([A-Z])/g, ' $1')}</option>)}
          </select>
        </label>
        <DeviceFrameToggle value={device} onChange={setDevice} />
        <div className="toolbar-actions">
          <button type="button" onClick={undoLandingPageChange} title="Undo" aria-label="Undo">
            <Undo2 size={18} />
          </button>
          <button type="button" onClick={redoLandingPageChange} title="Redo" aria-label="Redo">
            <Redo2 size={18} />
          </button>
          <button type="button" onClick={openLogs} title="Backend logs" aria-label="Backend logs">
            <FileText size={18} />
          </button>
          <button type="button" onClick={onToggleFullscreen} title="Fullscreen" aria-label="Fullscreen">
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      <div className="preview-stage">
        <div className={`preview-frame ${device} theme-${designSystem.preset}`} style={{ ...cssVars, width: frameWidths[device] }}>
          {blocks.map((block) => {
            const Component = componentRegistry[block.type]
            if (!Component) {
              return import.meta.env.DEV ? (
                <div key={block.id} className="dev-warning">
                  Unsupported block: {block.type}
                </div>
              ) : null
            }

            return (
              <div
                key={block.id}
                ref={(element) => {
                  blockRefs.current[block.id] = element
                }}
                className={`preview-block section-${block.type} variant-${block.style?.variant ?? 'editorial'} align-${block.style?.align ?? 'left'} heading-${block.style?.headingSize ?? 'lg'} width-${block.style?.width ?? 'contained'} surface-${block.style?.surface ?? 'light'} columns-${block.style?.columns ?? 3} radius-${block.style?.radius ?? 'soft'}${focusBlockId === block.id ? ' focused' : ''}`}
              >
              <AnimatedSection animation={block.animation} updated={block.isUpdated}>
                <Component props={block.props} style={block.style} />
              </AnimatedSection>
              </div>
            )
          })}
        </div>
      </div>
      {logsOpen ? (
        <BackendLogsDrawer
          logs={logs}
          loading={logsLoading}
          error={logsError}
          onRefresh={refreshLogs}
          onClose={() => setLogsOpen(false)}
        />
      ) : null}
    </section>
  )
}

function BackendLogsDrawer({
  logs,
  loading,
  error,
  onRefresh,
  onClose,
}: {
  logs: BackendLog[]
  loading: boolean
  error?: string
  onRefresh: () => void
  onClose: () => void
}) {
  return (
    <div className="backend-logs-panel" role="dialog" aria-label="Backend logs">
      <header>
        <div>
          <span>Backend trace</span>
          <strong>LLM response and UI generation logs</strong>
        </div>
        <div className="backend-log-actions">
          <button type="button" onClick={onRefresh} disabled={loading} title="Refresh logs" aria-label="Refresh logs">
            <RefreshCw size={16} />
          </button>
          <button type="button" onClick={onClose} title="Close logs" aria-label="Close logs">
            <X size={16} />
          </button>
        </div>
      </header>
      {error ? <div className="backend-log-error">{error}</div> : null}
      <div className="backend-log-list">
        {logs.length ? logs.map((log) => <BackendLogCard key={log.id} log={log} />) : (
          <div className="backend-log-empty">
            {loading ? 'Loading backend logs...' : 'No backend calls yet. Send a message to the assistant to capture the full trace.'}
          </div>
        )}
      </div>
    </div>
  )
}

function BackendLogCard({ log }: { log: BackendLog }) {
  const firstCall = log.calls?.[0]
  const pass = log.secondPass ?? log.firstPass
  return (
    <article className="backend-log-card">
      <header>
        <span className={`backend-status ${log.status}`}>{log.status}</span>
        <time>{new Date(log.timestamp).toLocaleString()}</time>
      </header>
      <section>
        <h3>Prompt</h3>
        <p>{log.request?.message ?? 'No prompt captured'}</p>
        <dl>
          <div><dt>Mode</dt><dd>{firstCall?.mode ?? 'unknown'}</dd></div>
          <div><dt>Model</dt><dd>{firstCall?.model ?? 'fixture'}</dd></div>
          <div><dt>Blocks</dt><dd>{pass?.blockTypes?.join(', ') || 'none'}</dd></div>
          <div><dt>Validation</dt><dd>{pass?.violations?.length ? `${pass.violations.length} issue(s)` : 'passed'}</dd></div>
        </dl>
      </section>
      <details>
        <summary>LLM input</summary>
        <pre>{firstCall?.input ?? 'Local fixture mode did not call the live model.'}</pre>
      </details>
      <details>
        <summary>Raw LLM / fixture output</summary>
        <pre>{firstCall?.rawText ?? 'No raw output captured.'}</pre>
      </details>
      <details>
        <summary>Normalized UI response</summary>
        <pre>{JSON.stringify(log.response, null, 2)}</pre>
      </details>
      {log.error ? <p className="backend-log-error inline">{log.error}</p> : null}
    </article>
  )
}
