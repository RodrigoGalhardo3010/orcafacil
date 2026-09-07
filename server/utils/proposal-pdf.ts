import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'

type ProposalPdfItem = {
  description?: string | null
  quantity?: number | string | null
  unit_price?: number | string | null
}

export type ProposalPdfData = {
  companyName: string
  number?: string | null
  clientName: string
  title: string
  introduction?: string | null
  validUntil?: string | null
  paymentTerms?: string | null
  notes?: string | null
  subtotal?: number | string | null
  discount?: number | string | null
  total?: number | string | null
  items: ProposalPdfItem[]
  publicUrl: string
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 52
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const CONTENT_BOTTOM = 86
const navy = rgb(0.055, 0.094, 0.165)
const green = rgb(0.086, 0.639, 0.29)
const slate = rgb(0.28, 0.34, 0.43)
const muted = rgb(0.45, 0.5, 0.58)
const line = rgb(0.87, 0.89, 0.92)
const pale = rgb(0.965, 0.975, 0.985)

export function proposalPdfFilename(number?: string | null) {
  const normalized = String(number || 'proposta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `${normalized || 'proposta'}.pdf`
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

function safeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '')
    .replace(/[\t\r]+/g, ' ')
    .trim()
}

function money(value: unknown) {
  const amount = Number(value || 0)
  const fixed = Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
  const [integer = '0', cents = '00'] = fixed.split('.')
  return `R$ ${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`
}

function date(value: unknown) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : safeText(value)
}

function wrapText(text: unknown, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = safeText(text).split('\n')
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate
        continue
      }
      if (current) lines.push(current)
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word
        continue
      }
      let fragment = ''
      for (const character of word) {
        const next = fragment + character
        if (font.widthOfTextAtSize(next, size) > maxWidth && fragment) {
          lines.push(fragment)
          fragment = character
        } else {
          fragment = next
        }
      }
      current = fragment
    }
    if (current) lines.push(current)
  }
  return lines.length ? lines : ['']
}

export async function createProposalPdf(data: ProposalPdfData) {
  const document = await PDFDocument.create()
  const regular = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  document.setTitle(safeText(`${data.number || 'Proposta'} - ${data.title}`))
  document.setAuthor(safeText(data.companyName))
  document.setSubject('Proposta comercial')
  document.setCreator('OrçaFácil')
  document.setProducer('OrçaFácil')

  let page!: PDFPage
  let y = 0

  function addPage() {
    page = document.addPage()
    page.setSize(PAGE_WIDTH, PAGE_HEIGHT)
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: green })
    page.drawText(safeText(data.companyName), { x: MARGIN, y: PAGE_HEIGHT - 40, size: 9, font: bold, color: navy })
    const number = safeText(data.number || 'Proposta comercial')
    page.drawText(number, {
      x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(number, 9),
      y: PAGE_HEIGHT - 40,
      size: 9,
      font: bold,
      color: muted
    })
    y = PAGE_HEIGHT - 70
    return page
  }

  function ensureSpace(height: number) {
    if (y - height < CONTENT_BOTTOM) addPage()
  }

  function drawRight(text: string, right: number, baseline: number, size: number, font: PDFFont, color: RGB) {
    page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y: baseline, size, font, color })
  }

  function drawLines(lines: string[], options: { x?: number; width?: number; size?: number; lineHeight?: number; font?: PDFFont; color?: RGB } = {}) {
    const x = options.x ?? MARGIN
    const width = options.width ?? CONTENT_WIDTH
    const size = options.size ?? 10
    const lineHeight = options.lineHeight ?? 14
    const selectedFont = options.font ?? regular
    const color = options.color ?? slate
    for (const rawLine of lines) {
      const wrapped = wrapText(rawLine, selectedFont, size, width)
      for (const wrappedLine of wrapped) {
        ensureSpace(lineHeight)
        if (wrappedLine) page.drawText(wrappedLine, { x, y, size, font: selectedFont, color })
        y -= lineHeight
      }
    }
  }

  function drawSectionTitle(title: string) {
    ensureSpace(30)
    y -= 6
    page.drawText(safeText(title).toUpperCase(), { x: MARGIN, y, size: 8, font: bold, color: green })
    y -= 28
  }

  addPage()
  page.drawText('PROPOSTA COMERCIAL', { x: MARGIN, y, size: 10, font: bold, color: green })
  y -= 31
  const titleLines = wrapText(data.title, bold, 23, CONTENT_WIDTH)
  drawLines(titleLines, { size: 23, lineHeight: 28, font: bold, color: navy })
  y -= 4
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: line })
  y -= 25

  page.drawText('PREPARADA PARA', { x: MARGIN, y, size: 8, font: bold, color: muted })
  page.drawText('VALIDADE', { x: 404, y, size: 8, font: bold, color: muted })
  y -= 18
  const client = safeText(data.clientName) || 'Cliente'
  page.drawText(client, { x: MARGIN, y, size: 14, font: bold, color: navy })
  page.drawText(date(data.validUntil) || 'A combinar', { x: 404, y, size: 11, font: regular, color: slate })
  y -= 31

  if (data.introduction) {
    drawLines(wrapText(data.introduction, regular, 10, CONTENT_WIDTH), { size: 10, lineHeight: 15 })
    y -= 9
  }

  drawSectionTitle('Serviços e materiais')

  function drawTableHeader() {
    ensureSpace(30)
    page.drawRectangle({ x: MARGIN, y: y - 5, width: CONTENT_WIDTH, height: 24, color: navy })
    page.drawText('DESCRIÇÃO', { x: MARGIN + 10, y: y + 3, size: 7.5, font: bold, color: rgb(1, 1, 1) })
    page.drawText('QTD.', { x: 365, y: y + 3, size: 7.5, font: bold, color: rgb(1, 1, 1) })
    page.drawText('VALOR', { x: 419, y: y + 3, size: 7.5, font: bold, color: rgb(1, 1, 1) })
    page.drawText('TOTAL', { x: 499, y: y + 3, size: 7.5, font: bold, color: rgb(1, 1, 1) })
    y -= 27
  }

  drawTableHeader()
  const items = Array.isArray(data.items) ? data.items : []
  for (const [index, item] of items.entries()) {
    const descriptionLines = wrapText(item.description || 'Item', regular, 8.5, 284)
    const rowHeight = Math.max(27, descriptionLines.length * 11 + 12)
    if (y - rowHeight < CONTENT_BOTTOM) {
      addPage()
      drawTableHeader()
    }
    if (index % 2 === 1) page.drawRectangle({ x: MARGIN, y: y - rowHeight + 7, width: CONTENT_WIDTH, height: rowHeight, color: pale })
    let descriptionY = y - 5
    for (const text of descriptionLines) {
      page.drawText(text, { x: MARGIN + 10, y: descriptionY, size: 8.5, font: regular, color: slate })
      descriptionY -= 11
    }
    const quantity = safeText(item.quantity || 0)
    const unitPrice = money(item.unit_price)
    const itemTotal = money(Number(item.quantity || 0) * Number(item.unit_price || 0))
    drawRight(quantity, 394, y - 5, 8.5, regular, slate)
    drawRight(unitPrice, 474, y - 5, 8.5, regular, slate)
    drawRight(itemTotal, PAGE_WIDTH - MARGIN - 10, y - 5, 8.5, bold, navy)
    y -= rowHeight
    page.drawLine({ start: { x: MARGIN, y: y + 7 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 7 }, thickness: 0.5, color: line })
  }

  ensureSpace(92)
  y -= 12
  const totalsX = 365
  page.drawText('Subtotal', { x: totalsX, y, size: 9, font: regular, color: muted })
  drawRight(money(data.subtotal), PAGE_WIDTH - MARGIN, y, 9, bold, navy)
  y -= 18
  if (Number(data.discount || 0) > 0) {
    page.drawText('Desconto', { x: totalsX, y, size: 9, font: regular, color: muted })
    drawRight(`- ${money(data.discount)}`, PAGE_WIDTH - MARGIN, y, 9, bold, navy)
    y -= 18
  }
  page.drawLine({ start: { x: totalsX, y: y + 7 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 7 }, thickness: 1, color: line })
  page.drawText('TOTAL', { x: totalsX, y: y - 7, size: 11, font: bold, color: navy })
  drawRight(money(data.total), PAGE_WIDTH - MARGIN, y - 7, 12, bold, green)
  y -= 38

  drawSectionTitle('Condições de pagamento')
  drawLines(wrapText(data.paymentTerms || 'A combinar.', regular, 10, CONTENT_WIDTH), { size: 10, lineHeight: 15 })
  if (data.notes) {
    drawSectionTitle('Observações')
    drawLines(wrapText(data.notes, regular, 10, CONTENT_WIDTH), { size: 10, lineHeight: 15 })
  }

  const pages = document.getPages()
  for (const [index, pdfPage] of pages.entries()) {
    pdfPage.drawLine({ start: { x: MARGIN, y: 66 }, end: { x: PAGE_WIDTH - MARGIN, y: 66 }, thickness: 0.5, color: line })
    pdfPage.drawText('Este PDF é uma cópia para consulta e arquivo.', { x: MARGIN, y: 48, size: 7.5, font: bold, color: slate })
    pdfPage.drawText('Para visualizar a versão atual e aceitar ou recusar, acesse:', { x: MARGIN, y: 36, size: 7.5, font: regular, color: muted })
    pdfPage.drawText(safeText(data.publicUrl), { x: MARGIN, y: 24, size: 7, font: regular, color: green })
    const pageNumber = `${index + 1}/${pages.length}`
    pdfPage.drawText(pageNumber, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageNumber, 7), y: 24, size: 7, font: regular, color: muted })
  }

  return await document.save()
}
