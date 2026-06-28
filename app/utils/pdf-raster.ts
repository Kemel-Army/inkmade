// Рендер первой страницы PDF в PNG-растр на клиенте (pdf.js). PDF нельзя рисовать
// на Konva-холсте напрямую → превращаем в картинку для превью/экспорта, а оригинал
// PDF сохраняем оператору как векторный исходник для печати (см. DesignUpload).
// Загружается только по требованию (динамический импорт) — не утяжеляет бандл.

export interface PdfRaster {
  blob: Blob
  width: number
  height: number
}

/**
 * Растеризовать первую страницу PDF в PNG.
 * @param targetLongSidePx — желаемая длинная сторона результата (качество превью/печати).
 */
export async function rasterizePdfFirstPage(file: File, targetLongSidePx = 2400): Promise<PdfRaster> {
  const pdfjs = await import('pdfjs-dist')
  // воркер как module-URL — Vite сам забандлит и отдаст корректный путь
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default as string
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise
  try {
    const page = await doc.getPage(1)
    const base = page.getViewport({ scale: 1 })
    // не уменьшаем мелкие PDF (scale ≥ 1), но и не раздуваем сверх кэпа
    const scale = Math.max(1, Math.min(6, targetLongSidePx / Math.max(base.width, base.height)))
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context недоступен')
    // белая подложка: прозрачные PDF иначе дадут чёрный фон в PNG
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(b => res(b), 'image/png'))
    if (!blob) throw new Error('не удалось растеризовать PDF')
    return { blob, width: canvas.width, height: canvas.height }
  } finally {
    await loadingTask.destroy() // освобождает документ и воркер (v6 API)
  }
}
