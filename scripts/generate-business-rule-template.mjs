import fs from 'node:fs/promises'
import path from 'node:path'
import * as XLSX from 'xlsx'

const outputDir = path.resolve('public', 'templates')
const outputPath = path.join(outputDir, 'business-rule-ai-template.xlsx')

const templateRows = [
  {
    'Rule Name': 'UAE Appetite Screening',
    Category: 'Eligibility & Appetite',
    'Category Value': 1,
    'Property Rule Name': 'Conditional Rules',
    'Inquiry Type': 'New',
    'Inquiry Type Value': 1,
  },
  {
    'Rule Name': 'Claims History Validation',
    Category: 'History',
    'Category Value': 5,
    'Property Rule Name': 'Mandatory Fields',
    'Inquiry Type': 'Renewal',
    'Inquiry Type Value': 2,
  },
  {
    'Rule Name': 'Registration Card Requirement',
    Category: 'Submission Completeness',
    'Category Value': 3,
    'Property Rule Name': 'Required Document',
    'Inquiry Type': 'Endorsement',
    'Inquiry Type Value': 3,
  },
  {
    'Rule Name': 'Property Survey Escalation',
    Category: 'Risk',
    'Category Value': 4,
    'Property Rule Name': 'Conditional Rules',
    'Inquiry Type': 'Claims',
    'Inquiry Type Value': 4,
  },
]

const referenceRows = [
  {
    'Field Name': 'Rule Name',
    Requirement: 'Required',
    Notes: 'Business rule display name that will be stored in aur_name.',
  },
  {
    'Field Name': 'Category',
    Requirement: 'Optional',
    Notes: 'Use the label or the numeric Category Value column.',
  },
  {
    'Field Name': 'Property Rule Name',
    Requirement: 'Optional',
    Notes: 'Must match an existing property rule name in the app, such as Conditional Rules, Mandatory Fields, or Required Document.',
  },
  {
    'Field Name': 'Inquiry Type',
    Requirement: 'Optional',
    Notes: 'Use the label or the numeric Inquiry Type Value column.',
  },
]

const categoryOptions = [
  ['Eligibility & Appetite', 1],
  ['Domicile', 2],
  ['Submission Completeness', 3],
  ['Risk', 4],
  ['History', 5],
  ['Financial & Capacity Limits', 6],
  ['Contractual Terms & Clauses', 7],
]

const inquiryTypeOptions = [
  ['New', 1],
  ['Renewal', 2],
  ['Endorsement', 3],
  ['Claims', 4],
]

const workbook = XLSX.utils.book_new()
const templateSheet = XLSX.utils.json_to_sheet(templateRows)
const referenceSheet = XLSX.utils.json_to_sheet(referenceRows)
const categorySheet = XLSX.utils.aoa_to_sheet([['Category Label', 'Category Value'], ...categoryOptions])
const inquirySheet = XLSX.utils.aoa_to_sheet([['Inquiry Type Label', 'Inquiry Type Value'], ...inquiryTypeOptions])

templateSheet['!cols'] = [
  { wch: 32 },
  { wch: 28 },
  { wch: 16 },
  { wch: 28 },
  { wch: 18 },
  { wch: 18 },
]
referenceSheet['!cols'] = [
  { wch: 22 },
  { wch: 16 },
  { wch: 90 },
]
categorySheet['!cols'] = [{ wch: 34 }, { wch: 18 }]
inquirySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]

XLSX.utils.book_append_sheet(workbook, templateSheet, 'Template')
XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Reference')
XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Options')
XLSX.utils.book_append_sheet(workbook, inquirySheet, 'Inquiry Type Options')

await fs.mkdir(outputDir, { recursive: true })
XLSX.writeFile(workbook, outputPath)

console.log(`Business rule template created at ${outputPath}`)
