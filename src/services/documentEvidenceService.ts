import { GetInquiryEvidenceDocument_Service } from '../generated/services/GetInquiryEvidenceDocument_Service'

interface EvidenceFlowOutput {
  success?: boolean | string
  filename?: string
  mimetype?: string
  contentbase64?: string
  errormessage?: string
}

// The trigger's wire keys are text/text_1, not its display labels.
export async function getEvidenceDocument(inquiryId: string, documentPath: string) {
  const result = await GetInquiryEvidenceDocument_Service.Run({ text: inquiryId, text_1: documentPath })
  const data = result.data as EvidenceFlowOutput | undefined
  const success = data?.success === true || (typeof data?.success === 'string' && /^(true|yes)$/i.test(data.success.trim()))
  if (!result.success || !success) throw new Error(data?.errormessage || 'The document could not be retrieved. Check your Inquiry and SharePoint permissions, then try again.')
  if (typeof data?.filename !== 'string' || !data.filename.trim() || typeof data.mimetype !== 'string' || !data.mimetype.trim() || typeof data.contentbase64 !== 'string' || !data.contentbase64.trim()) throw new Error('The document flow returned an incomplete response.')
  let bytes: Uint8Array
  try { bytes = Uint8Array.from(atob(data.contentbase64.replace(/\s/g, '')), (char) => char.charCodeAt(0)) }
  catch { throw new Error('The document flow returned invalid file content.') }
  return { bytes, fileName: data.filename, mimeType: data.mimetype }
}
