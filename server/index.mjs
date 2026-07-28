import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeAssistantPayload } from '../src/generative-ui/normalizeResponse.ts'
import { applyIntentOverrides } from '../src/generative-ui/applyIntentOverrides.ts'
import { validateBlockRules } from './validation/blockRules.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const masterPromptPath = resolve(__dirname, 'prompts/landing-page-master.md')
const envPath = resolve(__dirname, '.env')
const port = Number(process.env.PORT ?? 8787)
const backendLogs = []
const maxLogs = 40

function pushLog(entry) {
  backendLogs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  })
  backendLogs.splice(maxLogs)
}

function summarizePage(page) {
  if (!page?.blocks) return undefined
  return {
    blockCount: page.blocks.length,
    blocks: page.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      variant: block.style?.variant,
      radius: block.style?.radius,
      surface: block.style?.surface,
    })),
    designSystem: page.designSystem?.name,
  }
}

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

function sendJson(response, status, payload, methods = 'GET, POST, OPTIONS') {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': methods,
  })
  response.end(Buffer.from(JSON.stringify(payload), 'utf8'))
}

function safeFallback(violations, error) {
  const assistantMarkdown =
    "I couldn't apply that exact page update, but your current design is still intact. Please continue with the same request in one short sentence and I'll retry the patch."
  return {
    message: assistantMarkdown,
    assistant_markdown: assistantMarkdown,
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

function isOutOfScopeQuestion(message) {
  if (typeof message !== 'string' || !message.trim()) return false
  const lower = message.toLowerCase()
  const appScope = /\b(app|application|landing|page|website|site|ui|ux|design|section|component|template|prompt|backend|frontend|llm|log|hero|navbar|footer|faq|service|services|coverage|card|button|color|colour|palette|form|quote|insurance|broker|copy|text|layout|theme|css|react|next|tailwind)\b/
  if (appScope.test(lower)) return false

  const questionLike = /[?؟]\s*$/.test(lower)
    || /^(what|why|how|who|where|when|can|could|should|is|are|do|does|did|tell me|explain|define)\b/.test(lower)
  const clearlyOffTopic = /\b(panadol|paracetamol|tablet|medicine|medication|drug|dose|symptom|recipe|weather|sports|movie|song|celebrity|stock|crypto|homework)\b/.test(lower)
  return questionLike || clearlyOffTopic
}

function outOfScopePayload(message) {
  const assistantMarkdown =
    "I can only help with this insurance landing-page builder application and its generated UI. I can't answer unrelated questions here."
  return {
    id: undefined,
    message: assistantMarkdown,
    assistant_markdown: assistantMarkdown,
    suggestions: ['Edit a section', 'Change the page design', 'Show backend logs'],
    questions: [],
    template_recommendations: [],
    palette_recommendations: [],
    stage: 'review',
    ui: [],
    ui_blocks: [],
    refused_prompt: message,
  }
}

function extractJson(text) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1] : trimmed
}

async function repairJsonWithFoundry({ systemPrompt, badJson, parseError }) {
  const repairResponse = await fetch(process.env.FOUNDRY_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.FOUNDRY_API_KEY,
      Authorization: `Bearer ${process.env.FOUNDRY_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.FOUNDRY_MODEL ?? 'gpt-5.1',
      instructions: `${systemPrompt}\n\nRepair task: return ONLY valid JSON. Do not add markdown, comments, or explanations. Preserve the intended landing-page content and schema.`,
      input: `The previous response was invalid JSON.\n\nParse error:\n${parseError instanceof Error ? parseError.message : String(parseError)}\n\nInvalid JSON text:\n${badJson}`,
      text: { format: { type: 'text' }, verbosity: 'low' },
      temperature: 0,
    }),
  })

  if (!repairResponse.ok) {
    throw new Error(`Foundry JSON repair returned ${repairResponse.status}`)
  }

  const data = await repairResponse.json()
  return data.output_text ?? data.choices?.[0]?.message?.content ?? data.output?.[0]?.content?.[0]?.text ?? ''
}

async function callFoundry({ systemPrompt, body, correctiveViolations }) {
  if (!process.env.FOUNDRY_RESPONSES_URL || !process.env.FOUNDRY_API_KEY) {
    const fixturePayload = {
      assistant_markdown:
        'Proxy is running in local fixture mode. Add Foundry credentials to enable live generation.',
      suggestions: ['Refine the hero', 'Add testimonials', 'Adjust the lead form'],
      questions: [],
      template_recommendations: [],
      palette_recommendations: [],
      stage: 'intro',
      ui_blocks: [],
    }
    return { payload: fixturePayload, trace: { mode: 'fixture', rawText: JSON.stringify(fixturePayload) } }
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

  const trace = {
    mode: 'foundry',
    status: foundryResponse.status,
    model: process.env.FOUNDRY_MODEL ?? 'gpt-5.1',
    endpointHost: new URL(process.env.FOUNDRY_RESPONSES_URL).host,
    input,
    rawText: text,
  }

  try {
    return {
      payload: JSON.parse(extractJson(text)),
      trace,
    }
  } catch (parseError) {
    const repairedText = await repairJsonWithFoundry({ systemPrompt, badJson: text, parseError })
    trace.repairRawText = repairedText
    return {
      payload: JSON.parse(extractJson(repairedText)),
      trace,
    }
  }
}

async function generateValidResponse(body) {
  await loadLocalEnv()
  const combinedInstructions = await readFile(masterPromptPath, 'utf8')
  const trace = {
    request: {
      conversationId: body.conversationId,
      message: body.message,
      messageCount: body.messages?.length ?? 0,
      currentPage: summarizePage(body.currentPage),
    },
    calls: [],
  }
  const firstCall = await callFoundry({ systemPrompt: combinedInstructions, body })
  trace.calls.push(firstCall.trace)
  const firstResponse = applyIntentOverrides(
    normalizeAssistantPayload(firstCall.payload),
    body.message,
    body.currentPage,
  )
  const firstViolations = validateBlockRules(firstResponse)
  trace.firstPass = {
    stage: firstResponse.stage,
    blockTypes: firstResponse.ui_blocks.map((block) => block.type),
    violations: firstViolations,
  }
  if (firstViolations.length === 0) return { payload: firstResponse, trace }

  const secondCall = await callFoundry({ systemPrompt: combinedInstructions, body, correctiveViolations: firstViolations })
  trace.calls.push(secondCall.trace)
  const secondResponse = applyIntentOverrides(
    normalizeAssistantPayload(secondCall.payload),
    body.message,
    body.currentPage,
  )
  const secondViolations = validateBlockRules(secondResponse)
  trace.secondPass = {
    stage: secondResponse.stage,
    blockTypes: secondResponse.ui_blocks.map((block) => block.type),
    violations: secondViolations,
  }
  if (secondViolations.length === 0) return { payload: secondResponse, trace }

  const error = new Error('Validation failed after correction')
  error.violations = secondViolations
  error.trace = trace
  throw error
}

createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.method === 'GET' && request.url === '/assistant/logs') {
    sendJson(response, 200, { logs: backendLogs })
    return
  }

  if (request.method !== 'POST' || request.url !== '/assistant/messages') {
    sendJson(response, 404, { error: 'Not found' })
    return
  }

  try {
    const body = await readJsonBody(request)
    if (isOutOfScopeQuestion(body.message)) {
      const payload = outOfScopePayload(body.message)
      payload.id = body.conversationId
      pushLog({
        status: 'out_of_scope',
        request: {
          conversationId: body.conversationId,
          message: body.message,
          messageCount: body.messages?.length ?? 0,
          currentPage: summarizePage(body.currentPage),
        },
        calls: [],
        response: {
          assistantMarkdown: payload.assistant_markdown,
          stage: payload.stage,
          uiBlocks: [],
          designSystem: undefined,
        },
      })
      sendJson(response, 200, payload)
      return
    }
    const { payload, trace } = await generateValidResponse(body)
    const responsePayload = {
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
    }
    pushLog({
      status: 'success',
      ...trace,
      response: {
        assistantMarkdown: payload.assistant_markdown,
        stage: payload.stage,
        uiBlocks: payload.ui_blocks,
        designSystem: payload.design_system,
      },
    })
    sendJson(response, 200, responsePayload)
  } catch (error) {
    const violations = error && typeof error === 'object' && 'violations' in error ? error.violations : []
    console.error(error)
    const fallback = safeFallback(violations, error)
    pushLog({
      status: 'fallback',
      request: error?.trace?.request,
      calls: error?.trace?.calls ?? [],
      violations,
      error: error instanceof Error ? error.message : String(error ?? ''),
      response: fallback,
    })
    sendJson(response, 200, fallback)
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Landing Studio proxy listening on http://127.0.0.1:${port}`)
})
