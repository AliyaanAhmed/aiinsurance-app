import type { QuoteResponse } from '../domain/app'
import { evaluationObject, evaluationRows } from './healthAiEvaluation'

export interface DocumentEvidenceReference { documentName: string; exactText: string }

export function documentReferences(value: unknown): DocumentEvidenceReference[] {
  return evaluationRows(value).flatMap((row) =>
    typeof row.sourceType === 'string' && row.sourceType.toLowerCase() === 'document' &&
    typeof row.documentName === 'string' && row.documentName.trim() &&
    typeof row.exactText === 'string' && row.exactText.trim()
      ? [{ documentName: row.documentName.trim(), exactText: row.exactText.trim() }] : [])
}

const normalizeName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
const normalizeId = (value: string) => value.replace(/[{}]/g, '').toLowerCase()

export function motorEvidenceRule(raw: string | undefined, rule: QuoteResponse): Record<string, unknown> {
  let candidates: Record<string, unknown>[]
  try { candidates = evaluationRows(evaluationObject(JSON.parse(raw ?? '')).businessRuleEvaluation) } catch { return {} }
  const byId = rule.businessRuleId ? candidates.filter((row) =>
    [row.businessRuleId, row.ruleId, row.businessRuleID].some((id) => typeof id === 'string' && normalizeId(id) === normalizeId(rule.businessRuleId!))) : []
  if (byId.length) return byId.length === 1 ? byId[0] : {}
  const names = [rule.businessRuleName, rule.name].filter(Boolean).map(normalizeName)
  const byName = candidates.filter((row) =>
    (!rule.businessRuleId || ![row.businessRuleId, row.ruleId, row.businessRuleID].some((id) => typeof id === 'string' && id.trim())) &&
    typeof row.ruleName === 'string' && names.includes(normalizeName(row.ruleName)))
  return byName.length === 1 ? byName[0] : {}
}

function basename(path: string) {
  let name = path.split('/').pop() ?? ''
  try { name = decodeURIComponent(name) } catch { /* Keep a literal filename if encoding is invalid. */ }
  return name.replace(/\.[^.]+$/, '').trim().toLowerCase()
}

export function resolveEvidencePath(urls: string | undefined, name: string): string {
  const matches = [...new Set((urls ?? '').split(',').map((path) => path.trim()).filter(Boolean))]
    .filter((path) => path.startsWith('/') && !path.startsWith('//') && !path.includes('..') && basename(path) === basename(name))
  if (!matches.length) throw new Error('This evidence document is not linked to the inquiry.')
  if (matches.length > 1) throw new Error('Multiple linked documents have this name. The evidence cannot be resolved safely.')
  return matches[0]
}

export interface NormalizedText { text: string; offsets: number[] }
export interface PdfTextRun { str: string; hasEOL?: boolean; width?: number; transform?: number[] }

// Preserve adjacent chunks within a word, but separate lines and positioned words.
export function indexPdfText(runs: PdfTextRun[]) {
  let text = ''
  const starts: number[] = []
  runs.forEach((run, index) => {
    starts.push(text.length)
    text += run.str
    const next = runs[index + 1]
    if (!next) return
    const a = run.transform
    const b = next.transform
    const contiguous = a && b && typeof run.width === 'number' &&
      Math.abs(a[5] - b[5]) < 0.5 && Math.abs(b[4] - a[4] - run.width) < 0.5
    if (run.hasEOL || !contiguous) text += ' '
  })
  return { text, starts }
}

export function normalizeEvidenceText(value: string): NormalizedText {
  let text = ''
  const offsets: number[] = []
  for (let i = 0; i < value.length; i++) {
    const char = /\s/u.test(value[i]) ? ' ' : value[i]
    if (char === ' ' && (!text || text.endsWith(' '))) continue
    text += char
    offsets.push(i)
  }
  if (text.endsWith(' ')) { text = text.slice(0, -1); offsets.pop() }
  return { text, offsets }
}

export function evidenceMatches(source: string, excerpts: string[]) {
  const normalized = normalizeEvidenceText(source)
  const matches: { start: number; end: number; excerpt: number }[] = []
  excerpts.forEach((excerpt, index) => {
    const needle = normalizeEvidenceText(excerpt).text
    if (!needle) return
    let offset = 0
    while ((offset = normalized.text.indexOf(needle, offset)) !== -1) {
      matches.push({ start: normalized.offsets[offset], end: normalized.offsets[offset + needle.length - 1] + 1, excerpt: index })
      offset += needle.length
    }
  })
  return matches.sort((a, b) => a.start - b.start)
}
