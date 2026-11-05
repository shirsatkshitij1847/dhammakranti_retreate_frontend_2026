import './PdfReport.css'

export default function PdfReport({ reportRef, title, subtitle, columns, rows, confidential = false, rowsPerPage = 4, variant }) {
  const pageCount = Math.ceil(rows.length / rowsPerPage)
  return (
    <div className={`print-report${variant === 'timetable' ? ' print-report-timetable' : ''}`} ref={reportRef} aria-hidden="true">
      {Array.from({ length: pageCount }, (_, index) => (
        <section className="print-page" key={index}>
          <div className="print-frame">
            <header className="print-header">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
              <div>
                <p className="print-eyebrow">FRIENDSHIP · WISDOM · COMPASSION</p>
                <h1>Triratna Bauddha Mahasangh, Akola</h1>
                <h2>{title}</h2>
                <p>{subtitle}</p>
              </div>
            </header>
            <div className="print-summary">
              <span>{rows.length} total entries</span>
              <span>{confidential ? 'CONFIDENTIAL · Authorized use only' : 'COMMUNITY ACTIVITY JOURNAL'}</span>
              <span>Generated {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
            </div>
            <table className="print-table">
              <thead><tr><th>No.</th>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
              <tbody>
                {rows.slice(index * rowsPerPage, (index + 1) * rowsPerPage).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{String(index * rowsPerPage + rowIndex + 1).padStart(2, '0')}</td>
                    {row.map((cell, cellIndex) => <td key={cellIndex}>{cell || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <footer className="print-footer">
              <span>{confidential ? 'Contains personal information. Do not share publicly.' : 'Together in practice. Together in community.'}</span>
              <strong>AKOLA</strong>
              <span>Page {index + 1} / {pageCount}</span>
            </footer>
          </div>
        </section>
      ))}
    </div>
  )
}
