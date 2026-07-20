import { create } from 'zustand'
import { temporal } from 'zundo'
import type { AssistantResponse, BlockEnvelope, ChatQuestion, DesignSystem, PaletteRecommendation, Stage, TemplateRecommendation } from '../generative-ui/schemas'
import { fixtureResponse } from '../generative-ui/fixture'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  questions?: ChatQuestion[]
  templateRecommendations?: TemplateRecommendation[]
  paletteRecommendations?: PaletteRecommendation[]
}

type LandingPageState = {
  stage: Stage
  blocks: BlockEnvelope[]
  messages: ChatMessage[]
  suggestions: string[]
  designSystem: DesignSystem
  templateRecommendations: TemplateRecommendation[]
  paletteRecommendations: PaletteRecommendation[]
  focusBlockId?: string
  lastError?: string
  addMessage: (message: ChatMessage) => void
  setError: (message?: string) => void
  focusCurrentSection: () => void
  setFocusBlockId: (blockId?: string) => void
  applyServerResponse: (response: AssistantResponse) => void
  loadTemplate: (response: AssistantResponse) => void
  applyPaletteRecommendation: (recommendation: PaletteRecommendation) => void
}

const stageToBlockType: Partial<Record<Stage, BlockEnvelope['type']>> = {
  hero: 'hero',
  navbar: 'navbar',
  services: 'servicesGrid',
  leadForm: 'leadForm',
  trust: 'testimonials',
  faq: 'faq',
  footer: 'footer',
  review: 'hero',
  enhance: 'hero',
}

const replaceByType = new Set<BlockEnvelope['type']>([
  'navbar',
  'hero',
  'logosBand',
  'servicesGrid',
  'leadForm',
  'testimonials',
  'statsBand',
  'faq',
  'ctaBanner',
  'footer',
  'insuranceCalculator',
])

function focusBlockForStage(blocks: BlockEnvelope[], stage: Stage) {
  const type = stageToBlockType[stage]
  return blocks.find((block) => block.type === type)?.id ?? blocks[0]?.id
}

function mergeBlocks(currentBlocks: BlockEnvelope[], incomingBlocks: BlockEnvelope[]) {
  let nextBlocks = currentBlocks.map((block) => ({ ...block, isNew: false, isUpdated: false }))

  for (const incoming of incomingBlocks) {
    let currentIndex = nextBlocks.findIndex((block) => block.id === incoming.id)
    if (currentIndex < 0 && incoming.action === 'upsert' && replaceByType.has(incoming.type)) {
      currentIndex = nextBlocks.findIndex((block) => block.type === incoming.type)
    }

    if (incoming.action === 'remove') {
      nextBlocks = nextBlocks.filter((block) => block.id !== incoming.id)
      continue
    }

    if (incoming.action === 'reorder') {
      if (currentIndex < 0) continue
      const [moved] = nextBlocks.splice(currentIndex, 1)
      const targetIndex = Math.min(incoming.index ?? nextBlocks.length, nextBlocks.length)
      nextBlocks.splice(targetIndex, 0, { ...moved, isUpdated: true })
      continue
    }

    if (currentIndex >= 0) {
      nextBlocks[currentIndex] = { ...incoming, isUpdated: true, isNew: false }
    } else {
      nextBlocks.push({ ...incoming, isNew: true, isUpdated: false })
    }
  }

  return nextBlocks
}

export const useLandingPageStore = create<LandingPageState>()(
  temporal(
    (set) => ({
      stage: 'intro',
      blocks: fixtureResponse.ui_blocks.map((block) => ({ ...block, isNew: true })),
      messages: [
        {
          role: 'assistant',
          content: fixtureResponse.assistant_markdown,
          questions: fixtureResponse.questions,
          templateRecommendations: fixtureResponse.template_recommendations,
          paletteRecommendations: fixtureResponse.palette_recommendations,
        },
      ],
      suggestions: fixtureResponse.suggestions,
      designSystem: fixtureResponse.design_system!,
      templateRecommendations: fixtureResponse.template_recommendations,
      paletteRecommendations: fixtureResponse.palette_recommendations,
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setError: (message) => set({ lastError: message }),
      setFocusBlockId: (blockId) => set({ focusBlockId: blockId }),
      focusCurrentSection: () =>
        set((state) => ({
          focusBlockId: focusBlockForStage(state.blocks, state.stage),
        })),
      applyServerResponse: (response) =>
        set((state) => {
          const blocks = mergeBlocks(state.blocks, response.ui_blocks)
          const changedFocus = response.ui_blocks.find((block) => block.action !== 'remove')?.id
          return {
            stage: response.stage,
            designSystem: response.design_system ?? state.designSystem,
            blocks,
            focusBlockId: changedFocus ?? focusBlockForStage(blocks, response.stage),
            messages: [
              ...state.messages,
              { role: 'assistant', content: response.assistant_markdown, questions: response.questions, templateRecommendations: response.template_recommendations, paletteRecommendations: response.palette_recommendations },
            ],
            suggestions: response.suggestions,
            templateRecommendations: response.template_recommendations.length ? response.template_recommendations : state.templateRecommendations,
            paletteRecommendations: response.palette_recommendations.length ? response.palette_recommendations : state.paletteRecommendations,
            lastError: undefined,
          }
        }),
      loadTemplate: (response) =>
        set((state) => ({
          stage: response.stage,
          designSystem: response.design_system ?? state.designSystem,
          blocks: response.ui_blocks.map((block) => ({ ...block, isNew: true, isUpdated: false })),
          focusBlockId: response.ui_blocks.find((block) => block.type === 'hero')?.id,
          messages: [...state.messages, { role: 'assistant', content: response.assistant_markdown, questions: response.questions, templateRecommendations: response.template_recommendations, paletteRecommendations: response.palette_recommendations }],
          suggestions: response.suggestions,
          templateRecommendations: response.template_recommendations.length ? response.template_recommendations : state.templateRecommendations,
          paletteRecommendations: response.palette_recommendations.length ? response.palette_recommendations : state.paletteRecommendations,
          lastError: undefined,
        })),
      applyPaletteRecommendation: (recommendation) =>
        set((state) => ({
          designSystem: {
            ...state.designSystem,
            name: recommendation.name,
            preset: 'custom',
            colors: recommendation.colors,
          },
          messages: [...state.messages, { role: 'assistant', content: `**${recommendation.name} applied.** The complete page now uses this palette while preserving its content and layout.` }],
          lastError: undefined,
        })),
    }),
    {
      partialize: (state) => ({
        blocks: state.blocks,
        stage: state.stage,
        designSystem: state.designSystem,
        templateRecommendations: state.templateRecommendations,
        paletteRecommendations: state.paletteRecommendations,
      }),
    },
  ),
)

export function undoLandingPageChange() {
  useLandingPageStore.temporal.getState().undo()
}

export function redoLandingPageChange() {
  useLandingPageStore.temporal.getState().redo()
}
