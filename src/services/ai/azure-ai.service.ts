import { normalizeAssistantPayload } from '../../generative-ui/normalizeResponse'
import type { AssistantResponse, BlockEnvelope, DesignSystem } from '../../generative-ui/schemas'
import type { ChatMessage } from '../../store/landingPageStore'

type ProxyResponse = {
  id?: string
  message?: string
  assistant_markdown?: string
  suggestions?: string[]
  title?: string
  ui?: unknown
  ui_blocks?: unknown
  stage?: unknown
  design_system?: unknown
  questions?: unknown
  template_recommendations?: unknown
  palette_recommendations?: unknown
}

const proxyUrl = 'http://127.0.0.1:8787/assistant/messages'

async function postMessage(
  conversationId: string,
  message: string,
  messages: ChatMessage[],
  currentPage?: { blocks: BlockEnvelope[]; designSystem: DesignSystem },
): Promise<Response> {
  return fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message, messages, currentPage }),
  })
}

function normalizeProxyResponse(data: ProxyResponse): AssistantResponse {
  return normalizeAssistantPayload(data)
}

export async function sendAssistantMessage(
  conversationId: string,
  message: string,
  messages: ChatMessage[],
  currentPage?: { blocks: BlockEnvelope[]; designSystem: DesignSystem },
) {
  let response = await postMessage(conversationId, message, messages, currentPage)

  if (response.status === 422) {
    response = await postMessage(conversationId, `${message}\n\nSystem note: please repair the last invalid JSON response against the schema and return only valid JSON.`, messages, currentPage)
  }

  if (!response.ok) {
    throw new Error(`Assistant proxy returned ${response.status}`)
  }

  const data = (await response.json()) as ProxyResponse
  return normalizeProxyResponse(data)
}
