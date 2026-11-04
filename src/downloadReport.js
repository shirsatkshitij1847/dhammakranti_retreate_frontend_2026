export async function downloadReport(report, { title, filename }) {
  if (!report) throw new Error('Report is not available.')
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  await document.fonts.ready
  await Promise.all([...report.querySelectorAll('img')].map((image) => image.decode()))
  const pages = [...report.querySelectorAll('.print-page')]
  if (!pages.length) throw new Error('There are no entries to export.')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  pdf.setProperties({ title, author: 'Triratna Bauddha Mahasangh, Akola' })
  for (const [index, page] of pages.entries()) {
    const captureWidth = Math.max(page.offsetWidth, (page.querySelector('table')?.scrollWidth || 0) + 64)
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fffdf6',
      width: captureWidth,
      windowWidth: captureWidth,
      onclone: (clonedDocument) => {
        clonedDocument.querySelectorAll('.print-report').forEach((element) => {
          Object.assign(element.style, { position: 'static', visibility: 'visible', zIndex: 'auto' })
        })
        clonedDocument.querySelectorAll('.print-page').forEach((element) => {
          element.style.width = `${captureWidth}px`
        })
      },
    })
    if (!canvas.width || !canvas.height) throw new Error('PDF rendered with empty dimensions.')
    const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data
    let visible = false
    for (let pixel = 0; pixels && pixel < pixels.length; pixel += 256) {
      if (pixels[pixel] < 200 || pixels[pixel + 1] < 200 || pixels[pixel + 2] < 200) {
        visible = true
        break
      }
    }
    if (!visible) throw new Error('PDF rendered without visible content.')
    if (index) pdf.addPage()
    const ratio = Math.min(289 / canvas.width, 202 / canvas.height)
    const width = canvas.width * ratio
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', (297 - width) / 2, 4, width, canvas.height * ratio)
  }
  pdf.save(filename)
}
