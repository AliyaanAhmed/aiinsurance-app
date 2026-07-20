import { LayoutTemplate } from 'lucide-react'
import { landingTemplates, templateMeta, type TemplateId } from '../../generative-ui/templates'
import type { DesignSystem } from '../../generative-ui/schemas'

export function TemplateGallery({
  designSystem,
  onSelect,
}: {
  designSystem: DesignSystem
  onSelect: (template: (typeof landingTemplates)[TemplateId]) => void
}) {
  return (
    <section className="template-gallery" aria-label="Landing page designs">
      <header className="template-gallery-heading">
        <span className="template-gallery-icon"><LayoutTemplate size={15} /></span>
        <div><strong>Design directions</strong><span>Nine editable full-page starting points</span></div>
      </header>
      <div className="template-list">
        {templateMeta.map((template) => {
          const active = designSystem.name === template.name
          return (
            <button
              key={template.id}
              type="button"
              className={`template-card${active ? ' active' : ''}`}
              onClick={() => onSelect(landingTemplates[template.id])}
              title={`${template.name}: ${template.description}`}
            >
              <span className="template-preview" style={{ background: template.swatches[2] }}>
                <i className="template-nav-line" style={{ background: template.swatches[0] }} />
                <i className="template-title-line" style={{ background: template.swatches[0] }} />
                <i className="template-copy-line" style={{ background: template.swatches[1] }} />
                <i className="template-media-block" style={{ background: `linear-gradient(145deg, ${template.swatches[1]}, ${template.swatches[0]})` }} />
              </span>
              <span className="template-card-copy">
                <strong>{template.name}</strong>
                <small>{template.tag}</small>
              </span>
              <span className="template-swatches" aria-hidden="true">
                {template.swatches.map((color) => <i key={color} style={{ background: color }} />)}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
