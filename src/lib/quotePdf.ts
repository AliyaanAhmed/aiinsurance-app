import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { QuoteDetail } from '../domain/app'
import type { QuotePlanLinkedSection } from '../services/quotesService'

interface QuotePdfFormValues {
  name: string
  totalPremium: string
  grossPremium: string
  vat: string
  loadingPremium: string
  reason: string
  aiSummary: string
  quoteStatus: 'QuoteWon' | 'QuoteLost' | ''
}

interface GenerateQuotePdfInput {
  detail: QuoteDetail
  form: QuotePdfFormValues
  planSections: QuotePlanLinkedSection[]
  headerImageSrc: string
}

export async function generateQuotePdf({
  detail,
  form,
  planSections,
  headerImageSrc,
}: GenerateQuotePdfInput) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margins = {
    left: 12,
    right: 12,
    top: 58,
    bottom: 14,
  }

  const headerImage = await loadImageData(headerImageSrc)
  const headerWidth = pageWidth - margins.left - margins.right
  const headerHeight = (headerWidth * headerImage.height) / headerImage.width

  const drawHeader = () => {
    doc.addImage(
      headerImage.dataUrl,
      'PNG',
      margins.left,
      8,
      headerWidth,
      headerHeight,
      undefined,
      'FAST',
    )
    doc.setDrawColor(222, 232, 240)
    doc.line(margins.left, 8 + headerHeight + 2, pageWidth - margins.right, 8 + headerHeight + 2)
  }

  const baseTableOptions = {
    margin: margins,
    didDrawPage: drawHeader,
    theme: 'grid' as const,
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [31, 41, 55] as [number, number, number],
      cellPadding: 2.8,
      lineColor: [223, 229, 237] as [number, number, number],
      lineWidth: 0.2,
      overflow: 'linebreak' as const,
      valign: 'middle' as const,
    },
    headStyles: {
      fillColor: [15, 76, 129] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold' as const,
      fontSize: 9,
    },
  }

  const statusLabel =
    form.quoteStatus === 'QuoteWon'
      ? 'Quote Won'
      : form.quoteStatus === 'QuoteLost'
        ? 'Quote Lost'
        : detail.status || 'Open'

  drawHeader()

  let currentY = margins.top
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('Quotation', margins.left, currentY)
  currentY += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(71, 85, 105)
  doc.text(safeText(form.name || detail.name || 'Insurance Quote'), margins.left, currentY)
  currentY += 4

  autoTable(doc, {
    ...baseTableOptions,
    startY: currentY + 3,
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold', textColor: [71, 85, 105] },
      1: { cellWidth: 60 },
      2: { cellWidth: 28, fontStyle: 'bold', textColor: [71, 85, 105] },
      3: { cellWidth: 'auto' },
    },
    body: [
      ['Quote Name', safeText(form.name || detail.name), 'Status', statusLabel],
      ['Inquiry', safeText(detail.inquiry?.name || 'No linked inquiry'), 'Inquiry No.', safeText(detail.inquiry?.inquiryNumber || 'N/A')],
      ['Client', safeText(detail.inquiry?.accountName || 'Valued Client'), 'Product', safeText(detail.productName || 'N/A')],
      ['Plan', safeText(detail.planName || 'N/A'), 'Created On', formatDateForPdf(detail.createdOn)],
    ],
  })
  currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 4

  autoTable(doc, {
    ...baseTableOptions,
    startY: currentY,
    head: [['Gross Premium', 'Loading Premium', 'VAT', 'Total Premium']],
    body: [[
      formatCurrencyForPdf(form.grossPremium),
      formatCurrencyForPdf(form.loadingPremium),
      formatCurrencyForPdf(form.vat),
      formatCurrencyForPdf(form.totalPremium),
    ]],
    styles: {
      ...baseTableOptions.styles,
      halign: 'center' as const,
      fontSize: 10,
    },
    bodyStyles: {
      fillColor: [247, 250, 252] as [number, number, number],
      textColor: [15, 23, 42] as [number, number, number],
      fontStyle: 'bold' as const,
    },
  })
  currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 5

  autoTable(doc, {
    ...baseTableOptions,
    startY: currentY,
    head: [['Quotation Summary']],
    body: [[safeText(form.aiSummary || detail.aiSummary || 'No AI summary available for this quotation.')]],
    styles: {
      ...baseTableOptions.styles,
      minCellHeight: 18,
    },
    bodyStyles: {
      fillColor: [255, 255, 255] as [number, number, number],
      textColor: [51, 65, 85] as [number, number, number],
    },
  })
  currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 5

  if (form.reason?.trim()) {
    autoTable(doc, {
      ...baseTableOptions,
      startY: currentY,
      head: [['Underwriting Notes']],
      body: [[safeText(form.reason)]],
      styles: {
        ...baseTableOptions.styles,
        minCellHeight: 16,
      },
      bodyStyles: {
        fillColor: [255, 255, 255] as [number, number, number],
      },
    })
    currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 5
  }

  if (detail.responses.length > 0) {
    autoTable(doc, {
      ...baseTableOptions,
      startY: currentY,
      head: [['Captured Field', 'Response']],
      body: detail.responses.map((response) => [
        safeText(response.name || response.businessRuleName || 'Field'),
        safeText(response.response || 'No response captured.'),
      ]),
      columnStyles: {
        0: { cellWidth: 62, fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
      },
    })
    currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 5
  }

  planSections.forEach((section) => {
    autoTable(doc, {
      ...baseTableOptions,
      startY: currentY,
      head: [[section.title, `${section.records.length} item${section.records.length === 1 ? '' : 's'}`]],
      body:
        section.records.length > 0
          ? section.records.map((record, index) => [`${index + 1}`, safeText(record.name)])
          : [['-', `No ${section.title.toLowerCase()} records linked to this plan.`]],
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
    })
    currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 4
  })

  doc.save(`${buildPdfFileName(form.name || detail.name)}.pdf`)
}

async function loadImageData(src: string) {
  const dataUrl = src.startsWith('data:')
    ? src
    : await fetch(src)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Unable to load the quotation header image.')
          }
          return response.blob()
        })
        .then(blobToDataUrl)

  const dimensions = await getImageDimensions(dataUrl)
  return {
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to read the quotation header image.'))
    reader.readAsDataURL(blob)
  })
}

function getImageDimensions(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.width, height: image.height })
    image.onerror = () => reject(new Error('Unable to size the quotation header image.'))
    image.src = dataUrl
  })
}

function safeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function formatCurrencyForPdf(value: string) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateForPdf(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function buildPdfFileName(value: string) {
  return safeText(value || 'quotation')
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}
