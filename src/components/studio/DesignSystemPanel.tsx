import { Check, Palette, Type } from 'lucide-react'
import type { DesignSystem } from '../../generative-ui/schemas'

export function DesignSystemPanel({
  designSystem,
  onPrompt,
}: {
  designSystem: DesignSystem
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
      <div className="theme-actions">
        <button type="button" onClick={() => onPrompt('Suggest three next-level color palettes based on my company, insurance products, audience and current page. Do not apply one until I select it.')}>New direction</button>
        <button type="button" onClick={() => onPrompt('Suggest three refined, complementary color palettes for this business with strong contrast. Preserve the page and wait for my selection.')}>Refine palette</button>
      </div>
    </section>
  )
}
