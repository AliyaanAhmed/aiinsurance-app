import { Check, LayoutTemplate, Palette, Type } from 'lucide-react'
import type { DesignSystem, PaletteRecommendation, TemplateRecommendation } from '../../generative-ui/schemas'

export function DesignSystemPanel({
  designSystem,
  templateRecommendations,
  paletteRecommendations,
  onSelectTemplate,
  onSelectPalette,
  onPrompt,
}: {
  designSystem: DesignSystem
  templateRecommendations: TemplateRecommendation[]
  paletteRecommendations: PaletteRecommendation[]
  onSelectTemplate: (recommendation: TemplateRecommendation) => void
  onSelectPalette: (recommendation: PaletteRecommendation) => void
  onPrompt: (prompt: string) => void
}) {
  const palette = Object.entries(designSystem.colors)

  return (
    <section className="design-system-panel" aria-label="Generated design system">
      <header>
        <span className="design-system-icon"><Palette size={16} /></span>
        <div>
          <strong>{designSystem.name}</strong>
          <span>Generated brand direction</span>
        </div>
        <Check size={15} />
      </header>
      <div className="generated-palette" aria-label="Current color palette">
        {palette.map(([name, color]) => (
          <button
            key={name}
            type="button"
            title={`${name}: ${color}`}
            style={{ backgroundColor: color }}
            onClick={() => onPrompt(`Suggest three complete, complementary palettes that improve the current ${name} color for this business and audience. Preserve the page and wait for my selection.`)}
          >
            <span>{name}</span>
          </button>
        ))}
      </div>
      <div className="type-summary">
        <Type size={15} />
        <span><strong>{designSystem.typography.display}</strong> display</span>
        <span><strong>{designSystem.typography.body}</strong> body</span>
      </div>
      {templateRecommendations.length ? (
        <div className="theme-recommendations">
          <div className="theme-recommendations-heading">
            <LayoutTemplate size={14} />
            <span>Recommended for your business</span>
            <strong>{templateRecommendations.length}</strong>
          </div>
          <div className="theme-recommendation-list">
            {templateRecommendations.map((recommendation) => (
              <button key={`${recommendation.templateId}-${recommendation.name}`} type="button" onClick={() => onSelectTemplate(recommendation)}>
                <span className="theme-preview" style={{ background: recommendation.colors.background }}>
                  <i style={{ background: recommendation.colors.primary }} />
                  <i style={{ background: recommendation.colors.secondary }} />
                  <i style={{ background: recommendation.colors.accent }} />
                </span>
                <span><strong>{recommendation.name}</strong><small>{recommendation.reason}</small></span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {!templateRecommendations.length && paletteRecommendations.length ? (
        <div className="theme-recommendations">
          <div className="theme-recommendations-heading">
            <Palette size={14} />
            <span>Recommended palettes</span>
            <strong>{paletteRecommendations.length}</strong>
          </div>
          <div className="theme-recommendation-list palette-options">
            {paletteRecommendations.map((recommendation) => (
              <button key={recommendation.name} type="button" onClick={() => onSelectPalette(recommendation)}>
                <span className="theme-preview palette-only">
                  <i style={{ background: recommendation.colors.primary }} />
                  <i style={{ background: recommendation.colors.secondary }} />
                  <i style={{ background: recommendation.colors.accent }} />
                </span>
                <span><strong>{recommendation.name}</strong><small>{recommendation.rationale}</small></span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="theme-actions">
        <button type="button" onClick={() => onPrompt('Suggest three next-level color palettes based on my company, insurance products, audience and current page. Do not apply one until I select it.')}>New direction</button>
        <button type="button" onClick={() => onPrompt('Suggest three refined, complementary color palettes for this business with strong contrast. Preserve the page and wait for my selection.')}>Refine palette</button>
      </div>
    </section>
  )
}
