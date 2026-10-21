import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/lib/documentEvidence.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { documentReferences, motorEvidenceRule, resolveEvidencePath, evidenceMatches, indexPdfText } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

assert.deepEqual(documentReferences([null, { sourceType: null }, { sourceType: 'Portal', documentName: 'A', exactText: 'text' }, { sourceType: 'Document', documentName: 'A', exactText: 'text' }]), [{ documentName: 'A', exactText: 'text' }])
assert.deepEqual(documentReferences([{ sourceType: 'Document', documentName: 'A', exactText: ' ' }]), [])
assert.equal(resolveEvidencePath('/aur_quotes/a/Evidence.PDF,/aur_quotes/a/Other.pdf', 'evidence'), '/aur_quotes/a/Evidence.PDF')
assert.equal(resolveEvidencePath('/aur_quotes/a/My%20Evidence.pdf', 'My Evidence'), '/aur_quotes/a/My%20Evidence.pdf')
assert.throws(() => resolveEvidencePath('/aur_quotes/a/Evidence.pdf,/aur_quotes/b/Evidence.pdf', 'Evidence'), /Multiple/)
assert.throws(() => resolveEvidencePath('/aur_quotes/a/EvidenceCopy.pdf', 'Evidence'), /not linked/)
assert.throws(() => resolveEvidencePath('//evil.test/Evidence.pdf', 'Evidence'), /not linked/)
assert.throws(() => resolveEvidencePath('', 'Evidence'), /not linked/)

const source = 'Document checks\n\nFront/back supplied; category and expiry legible'
const matches = evidenceMatches(source, ['Document checks Front/back supplied; category and expiry legible'])
assert.equal(matches.length, 1)
assert.equal(source.slice(matches[0].start, matches[0].end), source)
assert.equal(evidenceMatches('Valid  licence\tValid licence', ['Valid\nlicence']).length, 2)
assert.equal(evidenceMatches('Valid licence', ['invalid licence']).length, 0)
assert.equal(evidenceMatches('', ['text']).length, 0)
assert.equal(evidenceMatches('text', [' ']).length, 0)
assert.equal(evidenceMatches('alpha beta gamma', ['alpha beta', 'gamma']).length, 2)

const rule = { businessRuleId: '{ABC}', businessRuleName: 'Driving Licence', name: 'Driving Licence' }
assert.equal(motorEvidenceRule(JSON.stringify({ businessRuleEvaluation: [{ ruleId: 'abc', ruleName: 'Different name', evidence: 'matched' }] }), rule).evidence, 'matched')
assert.equal(motorEvidenceRule(JSON.stringify({ businessRuleEvaluation: [{ ruleName: ' driving  licence ', evidence: 'matched' }] }), rule).evidence, 'matched')
assert.deepEqual(motorEvidenceRule(JSON.stringify({ businessRuleEvaluation: [{ ruleName: 'Driving Licence' }, { ruleName: 'Driving Licence' }] }), rule), {})
assert.deepEqual(motorEvidenceRule('not json', rule), {})
assert.deepEqual(motorEvidenceRule(JSON.stringify({ businessRuleEvaluation: [{ ruleId: 'different-id', ruleName: 'Driving Licence' }] }), rule), {})
assert.equal(indexPdfText([{ str: 'Lic', width: 15, transform: [1, 0, 0, 1, 0, 0] }, { str: 'ence', transform: [1, 0, 0, 1, 15, 0] }]).text, 'Licence')
assert.equal(indexPdfText([{ str: 'Document checks', hasEOL: true }, { str: 'Front/back supplied' }]).text, 'Document checks Front/back supplied')

const { jsPDF } = await import('jspdf')
const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
const sample = new jsPDF()
sample.text(['Document checks', 'Front/back supplied; category and expiry legible'], 20, 20)
const task = getDocument({ data: new Uint8Array(sample.output('arraybuffer')) })
try {
  const pdf = await task.promise
  const content = await (await pdf.getPage(1)).getTextContent()
  const { text } = indexPdfText(content.items.filter((item) => 'str' in item))
  assert.equal(evidenceMatches(text, ['Document checks\nFront/back supplied; category and expiry legible']).length, 1)
} finally { await task.destroy() }
// Reproduce the hosted environment: no usable standalone worker URL.
await import('pdfjs-dist/build/pdf.worker.mjs')
const hostedPdf = await import('pdfjs-dist/build/pdf.mjs')
hostedPdf.GlobalWorkerOptions.workerSrc = 'https://unavailable.invalid/blocked-worker.mjs'
assert.ok(globalThis.pdfjsWorker?.WorkerMessageHandler)
const hostedTask = hostedPdf.getDocument({ data: new Uint8Array(sample.output('arraybuffer')) })
try {
  const pdf = await hostedTask.promise
  assert.equal(pdf.numPages, 1)
  const content = await (await pdf.getPage(1)).getTextContent()
  assert.equal(evidenceMatches(indexPdfText(content.items.filter((item) => 'str' in item)).text, ['Document checks\nFront/back supplied; category and expiry legible']).length, 1)
} finally { await hostedTask.destroy() }
const serviceBundle = await build({
  entryPoints: ['src/services/documentEvidenceService.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'mock-flow', setup(build) {
    build.onLoad({ filter: /GetInquiryEvidenceDocument_Service\.ts$/ }, () => ({ contents: 'export const GetInquiryEvidenceDocument_Service = { Run: async (input) => { globalThis.flowInput = input; return globalThis.flowResult } }', loader: 'ts' }))
  } }],
})
const { getEvidenceDocument } = await import(`data:text/javascript;base64,${Buffer.from(serviceBundle.outputFiles[0].text).toString('base64')}`)
const valid = { success: true, filename: 'evidence.pdf', mimetype: 'application/pdf', contentbase64: Buffer.from('%PDF-test').toString('base64') }
globalThis.flowResult = { success: true, data: valid }
assert.equal((await getEvidenceDocument('inquiry-guid', '/aur_quotes/evidence.pdf')).fileName, 'evidence.pdf')
assert.deepEqual(globalThis.flowInput, { text: 'inquiry-guid', text_1: '/aur_quotes/evidence.pdf' })
globalThis.flowResult = { success: true, data: { ...valid, success: 'Yes' } }
assert.equal((await getEvidenceDocument('id', '/file')).bytes.length, 9)
globalThis.flowResult = { success: true, data: { ...valid, success: 'false', errormessage: 'Not linked' } }
await assert.rejects(getEvidenceDocument('id', '/file'), /Not linked/)
globalThis.flowResult = { success: false }
await assert.rejects(getEvidenceDocument('id', '/file'), /permissions/)
globalThis.flowResult = { success: true, data: { ...valid, contentbase64: '' } }
await assert.rejects(getEvidenceDocument('id', '/file'), /incomplete/)
globalThis.flowResult = { success: true, data: { ...valid, contentbase64: '%' } }
await assert.rejects(getEvidenceDocument('id', '/file'), /invalid file content/)
delete globalThis.flowInput
delete globalThis.flowResult
console.log('Document evidence: 34 assertions passed, including blocked-worker recovery, searchable PDFs, and flow-response validation.')
