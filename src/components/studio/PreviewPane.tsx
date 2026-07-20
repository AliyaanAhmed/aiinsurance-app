import { Maximize2, Minimize2, Redo2, Undo2 } from 'lucide-react'
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
  const cssVars = useMemo(() => designSystemToCssVars(designSystem), [designSystem])
  const blockRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!focusBlockId) return
    blockRefs.current[focusBlockId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusBlockId])

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
    </section>
  )
}
