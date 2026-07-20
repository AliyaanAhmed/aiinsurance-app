import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeAssistantPayload } from '../src/generative-ui/normalizeResponse.ts'
import { applyIntentOverrides } from '../src/generative-ui/applyIntentOverrides.ts'
import { validateBlockRules } from './validation/blockRules.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const systemPromptPath = resolve(__dirname, 'prompts/aurelian-system.md')
const generativeUiSkillPath = resolve(__dirname, 'prompts/generative-ui-skill.md')
const envPath = resolve(__dirname, '.env')
const port = Number(process.env.PORT ?? 8787)

async function loadLocalEnv() {
  try {
    const env = await readFile(envPath, 'utf8')
    env.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const [key, ...valueParts] = trimmed.split('=')
      if (key && !process.env[key]) process.env[key] = valueParts.join('=')
    })
  } catch {
    // .env is optional; local fixture mode works without it.
  }
}

async function readJsonBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })
  response.end(Buffer.from(JSON.stringify(payload), 'utf8'))
}

function safeFallback(violations, error) {
  return {
    assistant_markdown:
      "I couldn't apply that exact page update, but your current design is still intact. Please continue with the same request in one short sentence and I'll retry the patch.",
    suggestions: ['Retry this section', 'Show current page', 'Continue intake'],
    questions: [],
    template_recommendations: [],
    palette_recommendations: [],
    stage: 'enhance',
    ui_blocks: [],
    violations,
    debug: process.env.NODE_ENV === 'production' ? undefined : error instanceof Error ? error.message : String(error ?? ''),
  }
}

function extractJson(text) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1] : trimmed
}

async function callFoundry({ systemPrompt, body, correctiveViolations }) {
  if (!process.env.FOUNDRY_RESPONSES_URL || !process.env.FOUNDRY_API_KEY) {
    return {
      assistant_markdown:
        'Proxy is running in local fixture mode. Add Foundry credentials to enable live generation.',
      suggestions: ['Refine the hero', 'Add testimonials', 'Adjust the lead form'],
      questions: [],
      template_recommendations: [],
      palette_recommendations: [],
      stage: 'intro',
      ui_blocks: [],
    }
  }

  const recentConversation = (body.messages ?? [])
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n')

  let input = `Recent conversation:\n${recentConversation || 'No prior conversation.'}\n\nLatest user prompt:\n${body.message ?? ''}`
  if (body.currentPage) {
    input += `\n\nCURRENT RENDERED PAGE STATE (authoritative; patch this exact state):\n${JSON.stringify(body.currentPage)}`
  }
  if (correctiveViolations?.length) {
    input += `\n\nYour previous JSON failed validation. Fix only these issues and return valid JSON: ${JSON.stringify(correctiveViolations)}`
  }

  const foundryResponse = await fetch(process.env.FOUNDRY_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.FOUNDRY_API_KEY,
      Authorization: `Bearer ${process.env.FOUNDRY_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.FOUNDRY_MODEL ?? 'gpt-5.1',
      instructions: systemPrompt,
      input,
      text: {
        format: {
          type: 'text',
        },
        verbosity: 'medium',
      },
      temperature: 0.35,
    }),
  })

  if (!foundryResponse.ok) {
    throw new Error(`Foundry returned ${foundryResponse.status}`)
  }

  const data = await foundryResponse.json()
  const text =
    data.output_text ??
    data.choices?.[0]?.message?.content ??
    data.output?.[0]?.content?.[0]?.text ??
    ''

  return JSON.parse(extractJson(text))
}

async function generateValidResponse(body) {
  await loadLocalEnv()
  const systemPrompt = await readFile(systemPromptPath, 'utf8')
  const generativeUiSkill = await readFile(generativeUiSkillPath, 'utf8')
  const combinedInstructions = `${systemPrompt}\n\n${generativeUiSkill}`
  const firstResponse = applyIntentOverrides(
    normalizeAssistantPayload(await callFoundry({ systemPrompt: combinedInstructions, body })),
    body.message,
    body.currentPage,
  )
  const firstViolations = validateBlockRules(firstResponse)
  if (firstViolations.length === 0) return firstResponse

  const secondResponse = applyIntentOverrides(
    normalizeAssistantPayload(await callFoundry({ systemPrompt: combinedInstructions, body, correctiveViolations: firstViolations })),
    body.message,
    body.currentPage,
  )
  const secondViolations = validateBlockRules(secondResponse)
  if (secondViolations.length === 0) return secondResponse

  const error = new Error('Validation failed after correction')
  error.violations = secondViolations
  throw error
}

createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.method !== 'POST' || request.url !== '/assistant/messages') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  try {
    const body = await readJsonBody(request)
    const payload = await generateValidResponse(body)
    sendJson(response, 200, {
      id: body.conversationId,
      message: payload.assistant_markdown,
      suggestions: payload.suggestions,
      questions: payload.questions,
      template_recommendations: payload.template_recommendations,
      palette_recommendations: payload.palette_recommendations,
      title: 'Landing Studio',
      ui: payload.ui_blocks,
      stage: payload.stage,
      design_system: payload.design_system,
      assistant_markdown: payload.assistant_markdown,
      ui_blocks: payload.ui_blocks,
    })
  } catch (error) {
    const violations = error && typeof error === 'object' && 'violations' in error ? error.violations : []
    console.error(error)
    sendJson(response, 200, safeFallback(violations, error))
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Landing Studio proxy listening on http://127.0.0.1:${port}`)
})
