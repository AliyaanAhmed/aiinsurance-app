import { lazy, Suspense, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { FileText, LoaderCircle } from 'lucide-react'
import { documentReferences } from '../../lib/documentEvidence'

const EvidenceDialog = lazy(() => import('./DocumentEvidenceViewer'))

export function DocumentEvidence({ inquiryId, documentsUrl, evidence, references }: { inquiryId: string; documentsUrl?: string; evidence: string; references?: unknown }) {
  const [open, setOpen] = useState(false)
  const documents = documentReferences(references)
  if (!documents.length) return null
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button type="button" title="View evidence" aria-label="View evidence" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface text-muted-foreground transition hover:border-secondary/40 hover:text-secondary"><FileText className="h-3.5 w-3.5" /></button></Dialog.Trigger>
    {open ? <Suspense fallback={<Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[190] bg-slate-950/55 backdrop-blur-sm" /><Dialog.Content className="fixed inset-x-6 top-1/3 z-[200] mx-auto max-w-sm rounded-2xl border border-border-soft bg-surface p-6 text-center text-foreground shadow-xl"><LoaderCircle className="mx-auto mb-4 h-6 w-6 animate-spin text-secondary" /><Dialog.Title className="text-sm font-semibold">Opening evidence</Dialog.Title><Dialog.Description className="mt-2 text-xs text-muted-foreground">Preparing your secure document preview...</Dialog.Description><Dialog.Close className="mt-4 text-xs text-secondary">Cancel</Dialog.Close></Dialog.Content></Dialog.Portal>}>
      <EvidenceDialog inquiryId={inquiryId} documentsUrl={documentsUrl} evidence={evidence} references={documents} />
    </Suspense> : null}
  </Dialog.Root>
}
