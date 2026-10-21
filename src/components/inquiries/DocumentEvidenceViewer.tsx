import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, ArrowRight, Check, ChevronLeft, ChevronRight, ExternalLink, FileSearch, FileText, Highlighter, LoaderCircle, Maximize2, PanelLeftClose, PanelLeftOpen, RefreshCw, Sparkles, X, ZoomIn, ZoomOut } from 'lucide-react'
import { getDocument, TextLayer, type PDFDocumentProxy } from 'pdfjs-dist'
import type { TextContent } from 'pdfjs-dist/types/src/display/api'
// Power Apps' runtime proxy does not reliably serve standalone .mjs workers.
// The bundled module registers PDF.js' in-process handler without a worker URL,
// blob scripts, eval, or third-party document uploads.
import 'pdfjs-dist/build/pdf.worker.mjs'
import './DocumentEvidence.css'
import { evidenceMatches, indexPdfText, resolveEvidencePath, type DocumentEvidenceReference } from '../../lib/documentEvidence'
import { getEvidenceDocument } from '../../services/documentEvidenceService'
import { getSharePointSiteUrl } from '../../services/sharePointSiteService'
import { Select } from '../ui/Select'

type Match = { page: number; start: number; end: number; excerpt: number }
type LoadedPdf = { pdf: PDFDocumentProxy; pages: TextContent[]; widths: number[]; matches: Match[] }

function PdfPage({ loaded, pageNumber, zoom, active }: { loaded: LoadedPdf; pageNumber: number; zoom: number; active: Match | undefined }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let stopped = false
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined
    let textLayer: TextLayer | undefined
    const highlights: HTMLElement[] = []
    async function render() {
      const page = await loaded.pdf.getPage(pageNumber)
      if (stopped || !canvas.current || !layer.current || !host.current) return
      const viewport = page.getViewport({ scale: zoom })
      const target = canvas.current
      const container = layer.current
      const wrapper = host.current
      const ratio = window.devicePixelRatio || 1
      target.width = Math.floor(viewport.width * ratio)
      target.height = Math.floor(viewport.height * ratio)
      wrapper.style.width = `${viewport.width}px`
      wrapper.style.height = `${viewport.height}px`
      wrapper.style.setProperty('--scale-factor', String(zoom))
      wrapper.style.setProperty('--total-scale-factor', String(zoom * page.userUnit))
      renderTask = page.render({ canvas: target, viewport, transform: [ratio, 0, 0, ratio, 0, 0] })
      container.replaceChildren()
      textLayer = new TextLayer({ container, viewport, textContentSource: loaded.pages[pageNumber - 1] })
      await Promise.all([renderTask.promise, textLayer.render()])
      if (stopped) return
      const spans = textLayer.textDivs
      const strings = textLayer.textContentItemsStr
      const { starts } = indexPdfText(loaded.pages[pageNumber - 1].items.flatMap((item) => 'str' in item ? [item] : []))
      const bounds = wrapper.getBoundingClientRect()
      for (const match of loaded.matches.filter((entry) => entry.page === pageNumber)) {
        let first: HTMLElement | undefined
        spans.forEach((span, i) => {
          const from = Math.max(0, match.start - starts[i])
          const to = Math.min(strings[i].length, match.end - starts[i])
          if (from >= to || !span.firstChild) return
          const range = document.createRange()
          range.setStart(span.firstChild, from)
          range.setEnd(span.firstChild, to)
          for (const rect of range.getClientRects()) {
            const mark = document.createElement('div')
            mark.className = `evidence-highlight${match === active ? ' evidence-highlight-active' : ''}`
            Object.assign(mark.style, { left: `${rect.left - bounds.left}px`, top: `${rect.top - bounds.top}px`, width: `${rect.width}px`, height: `${rect.height}px` })
            wrapper.append(mark)
            highlights.push(mark)
            first ??= mark
          }
        })
        if (match === active) first?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      }
    }
    void render().catch(() => { if (!stopped) setError('This page could not be rendered. Try another page or open the original document.') })
    return () => { stopped = true; renderTask?.cancel(); textLayer?.cancel(); highlights.forEach((mark) => mark.remove()) }
  }, [loaded, pageNumber, zoom, active])
  return <>{error ? <p role="alert" className="p-4 text-red-600">{error}</p> : null}<div ref={host} className="evidence-pdf-page relative shrink-0 bg-white shadow-md" style={{ '--scale-factor': zoom } as CSSProperties}><canvas ref={canvas} className="h-full w-full" /><div ref={layer} className="textLayer" /></div></>
}

export default function EvidenceDialog({ inquiryId, documentsUrl, evidence, references }: { inquiryId: string; documentsUrl?: string; evidence: string; references: DocumentEvidenceReference[] }) {
  const descriptionId = useId()
  const previewRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(0)
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('Retrieving file')
  const [error, setError] = useState('')
  const [originalUrl, setOriginalUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [page, setPage] = useState(1)
  const [manualZoom, setManualZoom] = useState(1)
  const [fit, setFit] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(640)
  const [matchIndex, setMatchIndex] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [showEvidence, setShowEvidence] = useState(() => window.innerWidth >= 768)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const names = [...new Set(references.map((ref) => ref.documentName))]
  const name = names[selected]
  const excerptKey = JSON.stringify(references.filter((ref) => ref.documentName === name).map((ref) => ref.exactText))
  useEffect(() => {
    const element = previewRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setPreviewWidth(Math.max(160, element.clientWidth - 48)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!name) return
    let stopped = false
    let task: ReturnType<typeof getDocument> | undefined
    setLoaded(null); setBusy(true); setError(''); setOriginalUrl(''); setFileName('')
    setPage(1); setMatchIndex(0); setExpanded({}); setManualZoom(1); setFit(false); setPhase('Retrieving file')
    async function load() {
      const path = resolveEvidencePath(documentsUrl, name)
      const site = await getSharePointSiteUrl()
      if (stopped) return
      setOriginalUrl(`${site}/${path.replace(/^\//, '').split('/').map((part) => encodeURIComponent(part)).join('/')}`)
      const file = await getEvidenceDocument(inquiryId, path)
      if (stopped) return
      setFileName(file.fileName)
      if (file.mimeType.split(';')[0].toLowerCase() !== 'application/pdf' || new TextDecoder().decode(file.bytes.slice(0, 5)) !== '%PDF-') {
        throw new Error('This file is not a searchable PDF. Open the original document to review its evidence.')
      }
      setPhase('Reading file')
      task = getDocument({ data: file.bytes })
      const pdf = await task.promise
      const pages: TextContent[] = []
      const widths: number[] = []
      const matches: Match[] = []
      for (let number = 1; number <= pdf.numPages; number++) {
        if (stopped) return
        setPhase(`Finding evidence · page ${number} of ${pdf.numPages}`)
        // Yield between pages when running the hosted-compatible in-process parser.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        if (stopped) return
        const pdfPage = await pdf.getPage(number)
        const content = await pdfPage.getTextContent()
        pages.push(content)
        widths.push(pdfPage.getViewport({ scale: 1 }).width)
        const { text } = indexPdfText(content.items.flatMap((item) => 'str' in item ? [item] : []))
        matches.push(...evidenceMatches(text, JSON.parse(excerptKey) as string[]).map((match) => ({ ...match, page: number })))
      }
      if (stopped) return
      setLoaded({ pdf, pages, widths, matches })
      setPage(matches[0]?.page ?? 1)
    }
    void load().catch((reason: unknown) => {
      if (!stopped) {
        const message = reason instanceof Error ? reason.message : ''
        // Keep technical URLs/stack traces out of the user-facing workspace.
        setError(/not linked|Multiple linked|not a searchable|permissions|incomplete|invalid file content/i.test(message)
          ? message : 'We could not display this PDF. Please retry, or open the original document to review the evidence.')
      }
    }).finally(() => { if (!stopped) setBusy(false) })
    return () => { stopped = true; void task?.destroy().catch(() => undefined) }
  }, [inquiryId, documentsUrl, name, excerptKey, attempt])

  function navigateMatch(delta: number) {
    if (!loaded?.matches.length) return
    const index = (matchIndex + delta + loaded.matches.length) % loaded.matches.length
    setMatchIndex(index); setPage(loaded.matches[index].page)
  }
  function selectExcerpt(index: number) {
    const first = loaded?.matches.findIndex((match) => match.excerpt === index) ?? -1
    if (loaded && first >= 0) {
      setMatchIndex(first)
      setPage(loaded.matches[first].page)
    }
  }
  const active = loaded?.matches[matchIndex]
  const excerpts = JSON.parse(excerptKey) as string[]
  const matchedExcerpts = new Set(loaded?.matches.map((match) => match.excerpt))
  const zoom = fit && loaded ? Math.min(2, Math.max(0.25, previewWidth / loaded.widths[page - 1])) : manualZoom
  function changeZoom(delta: number) { setManualZoom(Math.max(0.25, Math.min(3, zoom + delta))); setFit(false) }

  return <Dialog.Portal>
    <Dialog.Overlay className="evidence-overlay fixed inset-0 z-[190] bg-slate-950/55 backdrop-blur-sm" />
    <Dialog.Content className="evidence-workspace fixed z-[200] flex flex-col overflow-hidden border border-border-soft bg-surface text-foreground shadow-2xl" aria-describedby={descriptionId}>
      <header className="evidence-header flex shrink-0 items-center justify-between gap-3 border-b border-border-soft px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-secondary/15 bg-secondary/[0.07] text-secondary"><FileSearch className="h-4 w-4" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><Dialog.Title className="text-sm font-semibold sm:text-base">Evidence workspace</Dialog.Title><span className="hidden rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary sm:inline">AI SOURCE</span></div>
            <Dialog.Description id={descriptionId} className="mt-1 truncate text-xs text-muted-foreground">{(fileName || name || 'Supporting evidence').replace(/_/g, ' ')}</Dialog.Description>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {originalUrl ? <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="evidence-original"><ExternalLink className="h-3.5 w-3.5" /><span className="hidden sm:inline">Open original</span></a> : null}
          <Dialog.Close aria-label="Close evidence" className="evidence-tool"><X className="h-4 w-4" /></Dialog.Close>
        </div>
      </header>
      {!names.length ? <div className="min-h-0 overflow-auto p-6"><div className="mx-auto max-w-2xl rounded-xl border border-border-soft bg-surface-soft/50 p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-secondary" />Evidence note</div><p className="mb-4 text-xs text-muted-foreground">No linked document reference was supplied for this evidence.</p><p className="whitespace-pre-wrap text-sm leading-7">{evidence || 'No evidence text was supplied.'}</p></div></div> :
        <div className={`evidence-body min-h-0 flex-1 ${showEvidence ? 'evidence-body-with-sidebar' : ''}`}>
          {showEvidence ? <aside className="evidence-sidebar min-h-0 overflow-auto border-border-soft bg-surface">
            <div className="space-y-5 p-4">
              <section>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Source document</h3><span className="text-[10px] text-muted-foreground">{names.length} file{names.length === 1 ? '' : 's'}</span></div>
                <Select showSelectionIndicator={false} aria-label="Evidence document" value={String(selected)} onValueChange={(value) => setSelected(Number(value))} className="h-11 min-w-0 gap-2 rounded-lg border-border-soft !bg-surface text-xs shadow-none focus:border-secondary/40 focus:ring-secondary/20 [&>span:first-child]:min-w-0 [&>span:first-child]:truncate [&>span:last-child]:shrink-0" contentClassName="evidence-document-menu z-[220] rounded-lg border-border-soft bg-surface p-1 shadow-xl" options={names.map((value, index) => ({ value: String(index), label: <span className="flex min-w-0 items-center gap-2"><FileText className="h-3.5 w-3.5 shrink-0 text-secondary" /><span className="truncate">{value.replace(/_/g, ' ')}</span></span> }))} />
              </section>
              <section>
                <div className="mb-2 flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-secondary" />Evidence passages</h3><span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px]">{excerpts.length}</span></div>
                <p className="mb-3 text-[11px] leading-5 text-muted-foreground">Select a passage to locate its exact words in the document.</p>
                <div className="space-y-2">{excerpts.map((text, index) => {
                  const selectedExcerpt = active?.excerpt === index
                  const found = matchedExcerpts.has(index)
                  const location = loaded?.matches.find((match) => match.excerpt === index)
                  return <article key={index} className={`evidence-passage rounded-xl border p-3 transition-colors ${selectedExcerpt ? 'border-secondary/40 bg-secondary/[0.06]' : 'border-border-soft bg-surface hover:border-secondary/25'}`}>
                    <button type="button" onClick={() => selectExcerpt(index)} disabled={!found} aria-pressed={selectedExcerpt} className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-secondary/30">
                      <div className="mb-2 flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-[11px] font-semibold"><span className={`flex h-6 w-6 items-center justify-center rounded-md ${selectedExcerpt ? 'bg-secondary text-white' : 'bg-surface-muted text-muted-foreground'}`}>{String(index + 1).padStart(2, '0')}</span>Passage {index + 1}</span>{loaded ? <span className={`inline-flex items-center gap-1 text-[10px] ${found ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{found ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}{found ? `Page ${location?.page}` : 'Not found'}</span> : null}</div>
                      <p className={`whitespace-pre-wrap text-xs leading-6 text-muted-foreground ${expanded[index] ? '' : 'line-clamp-4'}`}>{text}</p>
                    </button>
                    {text.length > 160 || text.split('\n').length > 4 ? <button type="button" onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))} className="mt-2 text-[11px] font-medium text-secondary hover:underline">{expanded[index] ? 'Show less' : 'Read full passage'}</button> : null}
                    {found ? <button type="button" onClick={() => selectExcerpt(index)} className="mt-3 flex items-center gap-1 border-t border-border-soft pt-2 text-[11px] font-medium text-secondary">Locate in document<ArrowRight className="h-3 w-3" /></button> : null}
                  </article>
                })}</div>
              </section>
              <p className="flex items-start gap-2 rounded-lg bg-surface-soft p-3 text-[10px] leading-5 text-muted-foreground"><Highlighter className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />Only exact text matches are highlighted. Your original document is never changed.</p>
            </div>
          </aside> : null}
          <main className="flex min-h-0 min-w-0 flex-col">
            <div className="evidence-toolbar flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-soft bg-surface px-3 py-2.5">
              <div className="flex items-center gap-2"><button type="button" className="evidence-tool" aria-label={showEvidence ? 'Hide evidence passages' : 'Show evidence passages'} title={showEvidence ? 'Hide evidence passages' : 'Show evidence passages'} aria-expanded={showEvidence} onClick={() => setShowEvidence(!showEvidence)}>{showEvidence ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</button><div className="evidence-control-group"><button type="button" className="evidence-tool" aria-label="Previous page" disabled={!loaded || page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-16 text-center text-[11px] tabular-nums">{loaded ? `${page} / ${loaded.pdf.numPages}` : '-- / --'}</span><button type="button" className="evidence-tool" aria-label="Next page" disabled={!loaded || page === loaded.pdf.numPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></button></div></div>
              <div className="flex items-center gap-2"><div className="evidence-control-group"><button type="button" className="evidence-tool" aria-label="Zoom out" disabled={!loaded || zoom <= 0.25} onClick={() => changeZoom(-0.25)}><ZoomOut className="h-4 w-4" /></button><span className="min-w-10 text-center text-[11px] tabular-nums">{loaded ? `${Math.round(zoom * 100)}%` : '--'}</span><button type="button" className="evidence-tool" aria-label="Zoom in" disabled={!loaded || zoom >= 3} onClick={() => changeZoom(0.25)}><ZoomIn className="h-4 w-4" /></button></div><button type="button" disabled={!loaded} className="evidence-tool" aria-label="Fit document to width" title="Fit to width" aria-pressed={fit} onClick={() => setFit(true)}><Maximize2 className="h-4 w-4" /></button></div>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-soft bg-secondary/[0.035] px-4 py-2">
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground"><Highlighter className="h-3.5 w-3.5 text-secondary" /><span aria-live="polite">{loaded ? loaded.matches.length ? `${loaded.matches.length} exact match${loaded.matches.length === 1 ? '' : 'es'} found` : 'No exact matches found' : busy ? 'Locating supporting evidence' : 'Document preview'}</span></span>
              {loaded && loaded.matches.length > 0 ? <div className="flex items-center gap-1"><span className="mr-1 text-[10px] tabular-nums text-muted-foreground">{matchIndex + 1} of {loaded.matches.length}</span><button type="button" className="evidence-tool evidence-tool-small" aria-label="Previous match" onClick={() => navigateMatch(-1)}><ChevronLeft className="h-3.5 w-3.5" /></button><button type="button" className="evidence-tool evidence-tool-small" aria-label="Next match" onClick={() => navigateMatch(1)}><ChevronRight className="h-3.5 w-3.5" /></button></div> : null}
            </div>
            <div ref={previewRef} className="evidence-preview min-h-0 flex-1 overflow-auto p-6">
              {busy ? <div className="evidence-empty" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface px-5 py-4 shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/[0.07]"><LoaderCircle className="h-4 w-4 animate-spin text-secondary motion-reduce:animate-none" /></span><div><p className="text-xs font-medium">{phase}</p><p className="mt-1 text-[11px] text-muted-foreground">Preparing evidence preview</p></div></div></div> :
                error ? <div className="evidence-empty"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600"><AlertCircle className="h-6 w-6" /></span><h3 className="mt-4 text-sm font-semibold">Preview unavailable</h3><p role="alert" className="mt-2 max-w-sm text-center text-xs leading-6 text-muted-foreground">{error}</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => setAttempt(attempt + 1)} className="evidence-retry"><RefreshCw className="h-3.5 w-3.5" />Try again</button>{originalUrl ? <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="evidence-original">Open original<ExternalLink className="h-3.5 w-3.5" /></a> : null}</div></div> :
                  loaded ? <><PdfPage key={`${selected}-${page}`} loaded={loaded} pageNumber={page} zoom={zoom} active={active} />{matchedExcerpts.size < excerpts.length ? <p role="status" className="mx-auto mt-4 max-w-xl rounded-lg border border-amber-500/20 bg-surface p-3 text-xs leading-5 text-muted-foreground">Some passages could not be found exactly. Scanned pages require OCR; review the original where needed.</p> : null}</> : null}
            </div>
            <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border-soft bg-surface px-4 py-2 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-secondary" />Read-only source document</span><span>{loaded ? `PDF · ${loaded.pdf.numPages} page${loaded.pdf.numPages === 1 ? '' : 's'}` : 'Secure document preview'}</span></footer>
          </main>
        </div>}
    </Dialog.Content>
  </Dialog.Portal>
}
