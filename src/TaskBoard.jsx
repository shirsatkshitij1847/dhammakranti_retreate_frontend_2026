import { useEffect, useRef, useState } from 'react'
import './TaskBoard.css'
import PdfReport from './PdfReport'
import { downloadReport } from './downloadReport'

const STORAGE_KEY = 'triratna-akola-timetable'
const INDIA_TIME_ZONE = 'Asia/Kolkata'

function localDateValue() {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const parts = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

function createRow() {
  return { id: crypto.randomUUID(), activity: '', date: localDateValue(), startTime: '', endTime: '', notes: '' }
}

function readTimetable() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { rows: [], error: '' }
    const rows = JSON.parse(stored)
    const valid = Array.isArray(rows) && rows.every((row) =>
      row && typeof row.id === 'string' && typeof row.activity === 'string' &&
      typeof row.date === 'string' && typeof row.startTime === 'string' &&
      typeof row.endTime === 'string' && typeof row.notes === 'string' &&
      ['planned', 'active', 'completed'].includes(row.status)
    )
    return valid
      ? { rows, error: '' }
      : { rows: [], error: 'जतन केलेली वेळापत्रक यादी वाचता आली नाही. नवीन यादी तयार करा.' }
  } catch (error) {
    return {
      rows: [],
      error: error instanceof SyntaxError
        ? 'जतन केलेले वेळापत्रक खराब स्वरूपात आहे; ते आपोआप बदललेले नाही.'
        : 'या ब्राउझरमध्ये वेळापत्रक वाचता आले नाही.',
    }
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('mr-IN', {
      dateStyle: 'medium',
      timeZone: INDIA_TIME_ZONE,
    }).format(date)
}

function formatTime(value) {
  if (!value) return '—'
  const [hours, minutes] = value.split(':').map(Number)
  const indiaOffsetMinutes = 5 * 60 + 30
  const time = new Date(Date.UTC(2000, 0, 1, hours, minutes) - indiaOffsetMinutes * 60_000)
  return new Intl.DateTimeFormat('mr-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: INDIA_TIME_ZONE,
  }).format(time)
}

function TimetableRow({ row, index, editing, onEdit, onSave, onCancel, onStatus, onDelete, onChange }) {
  return (
    <tr>
      <td className="serial-cell">{String(index + 1).padStart(2, '0')}</td>
      {editing ? (
        <>
          <td><input aria-label="Activity" value={editing.activity} onChange={(event) => onChange('activity', event.target.value)} maxLength={100} /></td>
          <td><input aria-label="Date" type="date" value={editing.date} onChange={(event) => onChange('date', event.target.value)} /></td>
          <td><input aria-label="Start Time" type="time" value={editing.startTime} onChange={(event) => onChange('startTime', event.target.value)} /></td>
          <td><input aria-label="End Time" type="time" value={editing.endTime} onChange={(event) => onChange('endTime', event.target.value)} /></td>
          <td><input aria-label="Notes" value={editing.notes} onChange={(event) => onChange('notes', event.target.value)} maxLength={240} /></td>
          <td className="timetable-actions">
            <button type="button" className="table-action" onClick={onSave}>जतन</button>
            <button type="button" className="table-action quiet" onClick={onCancel}>रद्द</button>
            <button type="button" className="table-action table-action-delete" onClick={onDelete}>काढा</button>
          </td>
        </>
      ) : (
        <>
          <td className="activity-cell">{row.activity}</td>
          <td>{formatDate(row.date)}</td>
          <td>{formatTime(row.startTime)}</td>
          <td>{formatTime(row.endTime)}</td>
          <td className="notes-cell">{row.notes || '—'}</td>
          <td className="timetable-actions">
            {row.status !== 'completed' ? (
              <>
                <button type="button" className="table-action quiet" onClick={onEdit}>संपादन</button>
                {row.status === 'planned' && <button type="button" className="table-action quiet" onClick={() => onStatus('active')}>सुरू करा</button>}
                <button type="button" className="table-action" onClick={() => onStatus('completed')}>पूर्ण ✓</button>
              </>
            ) : (
              <>
                <button type="button" className="table-action quiet" onClick={onEdit}>संपादन</button>
                <button type="button" className="table-action table-action-delete" onClick={onDelete}>काढा</button>
              </>
            )}
            {row.status !== 'completed' && (
              <button type="button" className="table-action table-action-delete" onClick={onDelete}>काढा</button>
            )}
          </td>
        </>
      )}
    </tr>
  )
}

function TimetableTable({ rows, editingId, editingRow, onEdit, onSave, onCancel, onStatus, onDelete, onChange }) {
  return (
    <div className="timetable-scroll">
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Activity</th>
            <th>Date (IST)</th>
            <th>Start Time (IST)</th>
            <th>End Time (IST)</th>
            <th>Notes</th>
            <th>स्थिती / कृती</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <TimetableRow
              key={row.id}
              row={row}
              index={index}
              editing={editingId === row.id ? editingRow : null}
              onEdit={() => onEdit(row)}
              onSave={onSave}
              onCancel={onCancel}
              onStatus={(status) => onStatus(row, status)}
              onDelete={() => onDelete(row)}
              onChange={onChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TaskBoard() {
  const initialData = useState(readTimetable)[0]
  const [indiaNow, setIndiaNow] = useState(() => new Date())
  const [rows, setRows] = useState(initialData.rows)
  const [drafts, setDrafts] = useState(() => [createRow()])
  const [editingId, setEditingId] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [workspaceMode, setWorkspaceMode] = useState('both')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [notice, setNotice] = useState(initialData.error)
  const pdfReportRef = useRef(null)

  useEffect(() => {
    const clockInterval = window.setInterval(() => setIndiaNow(new Date()), 30_000)
    return () => window.clearInterval(clockInterval)
  }, [])

  const saveRows = (nextRows, message) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRows))
      setRows(nextRows)
      setNotice(message)
      return true
    } catch {
      setNotice('बदल जतन झाले नाहीत: या ब्राउझरमध्ये साठवण उपलब्ध नाही.')
      return false
    }
  }

  const updateDraft = (id, field, value) => {
    setDrafts((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  const addDraft = () => setDrafts((current) => [...current, createRow()])

  const submitTimetable = (event) => {
    event.preventDefault()
    const filledRows = drafts.filter((row) => row.activity.trim())
    if (!filledRows.length) {
      setNotice('वेळापत्रकात जोडण्यासाठी Activity भरा.')
      return
    }
    const incompleteRow = filledRows.find((row) => !row.date || !row.startTime)
    if (incompleteRow) {
      setNotice('प्रत्येक Activity साठी Date आणि Start Time भरा. End Time ऐच्छिक आहे.')
      return
    }
    const invalidRange = filledRows.find((row) => row.endTime && row.endTime <= row.startTime)
    if (invalidRange) {
      setNotice('End Time ही Start Time नंतरची असावी.')
      return
    }

    const newRows = filledRows.map((row) => ({
      ...row,
      activity: row.activity.trim(),
      notes: row.notes.trim(),
      status: 'planned',
    }))
    if (saveRows([...rows, ...newRows], `${newRows.length} वेळापत्रक नोंदी जतन केल्या.`)) {
      setDrafts([createRow()])
    }
  }

  const removeDraft = (id) => {
    setDrafts((current) => current.length > 1
      ? current.filter((row) => row.id !== id)
      : [createRow()])
  }

  const setStatus = (row, status) => {
    const nextRows = rows.map((item) => item.id === row.id
      ? { ...item, status, completedAt: status === 'completed' ? new Date().toISOString() : '' }
      : item)
    saveRows(nextRows, status === 'completed' ? 'नोंद पूर्ण म्हणून जतन केली.' : 'नोंदीची स्थिती जतन केली.')
  }

  const deleteRow = (row) => {
    if (!window.confirm(`"${row.activity}" ही नोंद कायमची काढायची आहे का?`)) return

    const nextRows = rows.filter((item) => item.id !== row.id)
    if (saveRows(nextRows, 'वेळापत्रकातील नोंद काढली.')) {
      if (editingId === row.id) {
        setEditingId(null)
        setEditingRow(null)
      }
    }
  }

  const beginEdit = (row) => {
    setEditingId(row.id)
    setEditingRow({ activity: row.activity, date: row.date, startTime: row.startTime, endTime: row.endTime, notes: row.notes })
  }

  const updateEdit = (field, value) => setEditingRow((current) => ({ ...current, [field]: value }))

  const saveEdit = () => {
    if (!editingRow?.activity.trim() || !editingRow.date || !editingRow.startTime) {
      setNotice('Activity, Date आणि Start Time आवश्यक आहेत. End Time ऐच्छिक आहे.')
      return
    }
    if (editingRow.endTime && editingRow.endTime <= editingRow.startTime) {
      setNotice('End Time ही Start Time नंतरची असावी.')
      return
    }
    const nextRows = rows.map((row) => row.id === editingId
      ? { ...row, ...editingRow, activity: editingRow.activity.trim(), notes: editingRow.notes.trim() }
      : row)
    if (saveRows(nextRows, 'वेळापत्रकातील बदल जतन केले.')) {
      setEditingId(null)
      setEditingRow(null)
    }
  }

  const visibleRows = rows
    .filter((row) => showCompleted ? row.status === 'completed' : row.status !== 'completed')
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
  const completedCount = rows.filter((row) => row.status === 'completed').length

  const downloadPdf = async () => {
    if (!visibleRows.length || !pdfReportRef.current || pdfBusy) return

    setPdfBusy(true)
    try {
      await downloadReport(pdfReportRef.current, {
        title: 'Dhammakranti Shibir 2026 Activity Timetable',
        filename: `dhammakranti-shibir-2026-${showCompleted ? 'completed' : 'timetable'}.pdf`,
      })
      setNotice('PDF डाउनलोड झाले.')
    } catch (error) {
      console.error('Unable to generate timetable PDF.', error)
      setNotice('PDF डाउनलोड करता आले नाही. कृपया पुन्हा प्रयत्न करा.')
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <main className="tasks-page" id="tasks">
      <header className="tasks-heading">
        <p className="tasks-eyebrow">त्रिरत्न बौद्ध महासंघ · अकोला</p>
        <h1>कार्य वेळापत्रक निर्माता</h1>
        <p>तुमचा दिवस नियोजित करा, वेळापत्रक जतन करा आणि पूर्ण झालेल्या नोंदी पाहा.</p>
      </header>

      {notice && (
        <p className={`task-notice${notice.includes('भरा') || notice.includes('असावी') || notice.includes('आवश्यक') || notice.includes('जतन झाले नाहीत') || notice.includes('PDF डाउनलोड करता आले नाही') ? ' is-warning' : ''}`} role="status">
          {notice}
        </p>
      )}

      <div className="workspace-toolbar" role="group" aria-label="वेळापत्रक दृश्य निवडा">
        <div className="workspace-mode-switch">
          <button type="button" className={workspaceMode === 'editor' ? 'is-selected' : ''} aria-pressed={workspaceMode === 'editor'} onClick={() => setWorkspaceMode('editor')}>फक्त Editor</button>
          <button type="button" className={workspaceMode === 'table' ? 'is-selected' : ''} aria-pressed={workspaceMode === 'table'} onClick={() => setWorkspaceMode('table')}>फक्त Table</button>
          <button type="button" className={workspaceMode === 'both' ? 'is-selected' : ''} aria-pressed={workspaceMode === 'both'} onClick={() => setWorkspaceMode('both')}>दोन्ही</button>
        </div>
        <button type="button" className="task-button task-button-primary pdf-download" onClick={downloadPdf} disabled={!visibleRows.length || pdfBusy}>
          {pdfBusy ? 'PDF तयार होत आहे…' : 'PDF डाउनलोड'}
        </button>
      </div>

      <div className={`task-workspace view-${workspaceMode}`}>
        {workspaceMode !== 'table' && (
        <section className="task-composer" aria-labelledby="composer-title">
          <div className="task-section-heading">
            <div>
              <span className="task-step">01</span>
              <h2 id="composer-title">वेळापत्रक तयार करा</h2>
            </div>
            <span className="task-date-label">
              <span>{new Intl.DateTimeFormat('mr-IN', {
                dateStyle: 'full',
                timeZone: INDIA_TIME_ZONE,
              }).format(indiaNow)}</span>
              <strong>{new Intl.DateTimeFormat('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: INDIA_TIME_ZONE,
              }).format(indiaNow)} IST</strong>
            </span>
          </div>

          <form onSubmit={submitTimetable}>
            <div className="composer-table-scroll">
              <table className="composer-table">
                <thead>
                  <tr><th>Sr. No.</th><th>Activity</th><th>Date (IST)</th><th>Start Time (IST)</th><th>End Time (IST, optional)</th><th>Notes</th><th>काढा</th></tr>
                </thead>
                <tbody>
                  {drafts.map((row, index) => (
                    <tr key={row.id}>
                      <td className="serial-cell">{String(index + 1).padStart(2, '0')}</td>
                      <td><input aria-label={`Activity ${index + 1}`} value={row.activity} onChange={(event) => updateDraft(row.id, 'activity', event.target.value)} placeholder="कार्य" maxLength={100} /></td>
                      <td><input aria-label={`Date ${index + 1}`} type="date" value={row.date} onChange={(event) => updateDraft(row.id, 'date', event.target.value)} /></td>
                      <td><input aria-label={`Start Time ${index + 1}`} type="time" value={row.startTime} onChange={(event) => updateDraft(row.id, 'startTime', event.target.value)} /></td>
                      <td><input aria-label={`End Time ${index + 1}`} type="time" value={row.endTime} onChange={(event) => updateDraft(row.id, 'endTime', event.target.value)} /></td>
                      <td><input aria-label={`Notes ${index + 1}`} value={row.notes} onChange={(event) => updateDraft(row.id, 'notes', event.target.value)} placeholder="ऐच्छिक" maxLength={240} /></td>
                      <td><button className="draft-remove" type="button" onClick={() => removeDraft(row.id)} aria-label={`नोंद ${index + 1} काढा`}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="composer-actions">
              <button className="task-button task-button-quiet" type="button" onClick={addDraft}>
                <span aria-hidden="true">＋</span> ओळ जोडा
              </button>
              <button className="task-button task-button-primary" type="submit">
                वेळापत्रक जतन करा <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        </section>
        )}

        {workspaceMode !== 'editor' && (
        <section className="task-board" aria-labelledby="board-title">
          <div className="task-section-heading board-heading">
            <div>
              <span className="task-step">02</span>
              <h2 id="board-title">{showCompleted ? 'पूर्ण वेळापत्रक' : 'तुमचे वेळापत्रक'}</h2>
            </div>
            <button type="button" className="completed-toggle" onClick={() => setShowCompleted((current) => !current)}>
              {showCompleted ? '← वेळापत्रक' : `पूर्ण झाले · ${completedCount}`}
            </button>
          </div>

          {visibleRows.length ? (
            <TimetableTable
              rows={visibleRows}
              editingId={editingId}
              editingRow={editingRow}
              onEdit={beginEdit}
              onSave={saveEdit}
              onCancel={() => { setEditingId(null); setEditingRow(null) }}
              onStatus={setStatus}
              onDelete={deleteRow}
              onChange={updateEdit}
            />
          ) : (
            <div className="task-empty">
              <span>{showCompleted ? '○' : '✦'}</span>
              <strong>{showCompleted ? 'अजून पूर्ण झालेली नोंद नाही' : 'तुमचा वेळापत्रक फलक तयार आहे'}</strong>
              <small>{showCompleted ? 'पूर्ण केलेल्या नोंदी येथे दिसतील.' : 'डावीकडे ओळी भरा आणि वेळापत्रक जतन करा.'}</small>
            </div>
          )}
        </section>
        )}
      </div>
      <p className="task-storage-note">वेळापत्रक या ब्राउझरमध्ये आपोआप जतन होते.</p>

      <PdfReport
        reportRef={pdfReportRef}
        title="Dhammakranti Shibir 2026"
        subtitle={showCompleted ? 'Completed Timetable' : 'Activity Timetable'}
        columns={['Activity', 'Date (IST)', 'Start (IST)', 'End (IST)', 'Notes']}
        rows={visibleRows.map((row) => [row.activity, formatDate(row.date), formatTime(row.startTime), formatTime(row.endTime), row.notes])}
      />
    </main>
  )
}

export default TaskBoard
