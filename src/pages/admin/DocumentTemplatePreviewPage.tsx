import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Sparkles } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getDocumentTemplatePreview } from '../../services/adminDetailService'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/layout/PageHeader'

export function DocumentTemplatePreviewPage() {
  const { templateId = '' } = useParams()
  const { data, loading, error } = useAsyncData(() => getDocumentTemplatePreview(templateId), [templateId])

  if (loading) return <Card>Loading document template preview...</Card>
  if (error || !data) return <Card>{error ?? 'Document template not found.'}</Card>

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/document-templates">
          <ArrowLeft className="h-4 w-4" />
          Back to templates
        </Link>
      </Button>
      <PageHeader
        icon={FileText}
        eyebrow="Template Preview"
        title={data.name}
        description="Preview the reusable document content and merge-ready structure aligned to quote and servicing workflows."
        actions={
          <Badge variant="info">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Preview Mode
          </Badge>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card variant="premium" className="space-y-4">
          <h2 className="text-xl font-semibold">Merge Guidance</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Use placeholders like inquiry numbers, client names, quote totals, and product names in this template. This preview route is the admin review surface called for in the brief.
          </p>
          <div className="flex flex-wrap gap-2">
            {['{{Quote.Number}}', '{{Inquiry.Client}}', '{{Product.Name}}', '{{Policy.ExpiryDate}}'].map((token) => (
              <Badge key={token} variant="review">{token}</Badge>
            ))}
          </div>
        </Card>
        <Card variant="premium" className="space-y-4">
          <h2 className="text-xl font-semibold">Template Content</h2>
          <div className="rounded-[18px] border border-border-soft bg-surface-soft p-5">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground">
              {data.content || 'No template content has been captured yet.'}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  )
}
