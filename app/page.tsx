'use client'

import { useState, useEffect, Fragment } from 'react'

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:        '#161616',
  surface:   '#1e1e1e',
  surface2:  '#252525',
  surface3:  '#2c2c2c',
  border:    '#2e2e2e',
  gold:      '#d4af37',
  goldLight: '#f0d060',
  goldDark:  '#a88c25',
  text:      '#e4e4e4',
  textDim:   '#686868',
  textDark:  '#0f0f0f',
  danger:    '#9b2c2c',
  rowEven:   '#1a1a1a',
  rowOdd:    '#1f1f1f',
  mA:        '#191919',
  mAWknd:    '#272727',
  mB:        '#1e1c12',
  mBWknd:    '#2c2a18',
  todayBg:   '#2a2200',
  todayLine: '#d4af3755',
  notesBg:   '#160f28',
  noteBorder:'#5b21b6',
  noteAccent:'#7c3aed',
  noteText:  '#c4b5fd',
} as const

// ── Row heights (px) — MUST be equal in both panels ───────────────────────────
const ROW_H   = 42
const NOTES_H = 90
const HDR1_H  = 24   // month label row
const DAY_COL = 32   // each date column width

// ── Types ─────────────────────────────────────────────────────────────────────
type Task = {
  id: string
  name: string
  startDate: string
  duration: number
  notes: string
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseLocal(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function endDateOf(start: string, dur: number): string {
  const d = parseLocal(start); d.setDate(d.getDate() + dur - 1); return toYMD(d)
}
function todayYMD(): string { return toYMD(new Date()) }

const MONTH_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTH_AB = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAY_AB   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function fmtCol(ymd: string, fmt: 'short'|'long'): string {
  const d = parseLocal(ymd)
  if (fmt === 'short')
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`
  return `${DAY_AB[d.getDay()]}/${MONTH_AB[d.getMonth()]}/${d.getFullYear()}`
}
function fmtCell(ymd: string, fmt: 'short'|'long'): string {
  const d = parseLocal(ymd)
  if (fmt === 'short')
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`
  return `${d.getDate()} ${MONTH_AB[d.getMonth()]} ${d.getFullYear()}`
}

const PASSWORD = 'admin123'

// ── Left-panel column widths ───────────────────────────────────────────────────
const W = { num: 40, name: 220, start: 100, days: 56, end: 100, actions: 120 }

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width:'100%', background:P.bg, border:`1px solid #3a3a3a`,
  borderRadius:'6px', color:P.text, fontSize:'14px',
  padding:'10px 12px', outline:'none', boxSizing:'border-box',
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'12px', color:P.textDim,
  marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px',
}
const overlay: React.CSSProperties = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.82)',
  display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
}
const modal: React.CSSProperties = {
  background:P.surface2, border:`1px solid ${P.gold}`,
  borderRadius:'12px', padding:'30px 34px', width:'420px', maxWidth:'93vw',
  boxShadow:`0 0 40px rgba(212,175,55,0.10)`,
}
function btnGold(flex?: boolean): React.CSSProperties {
  return {
    background:`linear-gradient(135deg,${P.gold},${P.goldDark})`,
    color:P.textDark, border:'none', borderRadius:'7px',
    padding:'10px 20px', fontSize:'14px', fontWeight:'700',
    cursor:'pointer', flex: flex ? 1 : undefined,
  }
}
function btnGhost(flex?: boolean): React.CSSProperties {
  return {
    background:'transparent', color:P.textDim, border:`1px solid #3a3a3a`,
    borderRadius:'7px', padding:'10px 20px', fontSize:'14px',
    fontWeight:'600', cursor:'pointer', flex: flex ? 1 : undefined,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GanttPage() {
  const [tasks,         setTasks]         = useState<Task[]>([])
  const [isLoggedIn,    setIsLoggedIn]    = useState(false)
  const [showLogin,     setShowLogin]     = useState(false)
  const [password,      setPassword]      = useState('')
  const [loginError,    setLoginError]    = useState('')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask,   setEditingTask]   = useState<Task | null>(null)
  const [form,          setForm]          = useState<{name:string;startDate:string;duration:number|'';notes:string}>({name:'',startDate:'',duration:5,notes:''})
  const [openNotes,     setOpenNotes]     = useState<Set<string>>(new Set())
  const [mounted,       setMounted]       = useState(false)
  const [dateFormat,    setDateFormat]    = useState<'short'|'long'>('short')

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('gantt_auth') === '1') setIsLoggedIn(true)
    fetch('/api/tasks')
      .then(r => r.json())
      .then(setTasks)
      .catch(() => setTasks([]))
  }, [])

  // ── Date columns ────────────────────────────────────────────────────────────
  const allYMDs = tasks.flatMap(t => [t.startDate, endDateOf(t.startDate, t.duration)])
  const minYMD  = allYMDs.length ? allYMDs.reduce((a,b) => a<b?a:b) : todayYMD()
  const maxYMD  = allYMDs.length ? allYMDs.reduce((a,b) => a>b?a:b) : todayYMD()

  const dayColumns: string[] = []
  const cur = parseLocal(minYMD), endD = parseLocal(maxYMD)
  while (cur <= endD) { dayColumns.push(toYMD(cur)); cur.setDate(cur.getDate()+1) }

  // ── Month color helpers ─────────────────────────────────────────────────────
  const monthIndexMap = new Map<string, number>()
  let mSeq = 0, prevMKey = ''
  for (const ymd of dayColumns) {
    const d = parseLocal(ymd)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key !== prevMKey) { monthIndexMap.set(key, mSeq++); prevMKey = key }
  }
  const mKey = (ymd: string) => { const d = parseLocal(ymd); return `${d.getFullYear()}-${d.getMonth()}` }
  const isEvenMonth = (ymd: string) => (monthIndexMap.get(mKey(ymd)) ?? 0) % 2 === 0
  const cellBg = (ymd: string) => {
    if (isToday(ymd)) return P.todayBg
    const even = isEvenMonth(ymd)
    return isWeekend(ymd) ? (even ? P.mAWknd : P.mBWknd) : (even ? P.mA : P.mB)
  }

  // ── Month groups ────────────────────────────────────────────────────────────
  const monthGroups: { label: string; count: number; firstYmd: string }[] = []
  let curMKey = ''
  for (const ymd of dayColumns) {
    const key = mKey(ymd)
    if (key !== curMKey) {
      curMKey = key
      const d = parseLocal(ymd)
      monthGroups.push({ label: `${MONTH_ES[d.getMonth()]} ${d.getFullYear()}`, count: 1, firstYmd: ymd })
    } else {
      monthGroups[monthGroups.length-1].count++
    }
  }

  const isWeekend = (ymd: string) => { const d = parseLocal(ymd); return d.getDay()===0||d.getDay()===6 }
  const isToday   = (ymd: string) => ymd === todayYMD()
  const isActive  = (task: Task, ymd: string) => ymd >= task.startDate && ymd <= endDateOf(task.startDate, task.duration)

  // ── Auth & CRUD ──────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsLoggedIn(true); sessionStorage.setItem('gantt_auth','1')
      setShowLogin(false); setPassword(''); setLoginError('')
    } else { setLoginError('Contraseña incorrecta.') }
  }
  const handleLogout = () => { setIsLoggedIn(false); sessionStorage.removeItem('gantt_auth') }
  const openAdd = () => { setEditingTask(null); setForm({name:'',startDate:todayYMD(),duration:5 as number|'',notes:''}); setShowTaskModal(true) }
  const openEdit = (t: Task) => { setEditingTask(t); setForm({name:t.name,startDate:t.startDate,duration:t.duration,notes:t.notes}); setShowTaskModal(true) }
  const saveTask = async () => {
    if (!form.name.trim()) return
    const dur = Number(form.duration)
    if (!dur || dur < 1) return
    const payload = { name: form.name, startDate: form.startDate, duration: dur, notes: form.notes }
    if (editingTask) {
      await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    const updated = await fetch('/api/tasks').then(r => r.json())
    setTasks(updated)
    setShowTaskModal(false)
  }
  const deleteTask = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }
  const toggleNotes = (id: string) => { setOpenNotes(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n }) }
  const updateNote = (id: string, note: string) => setTasks(p => p.map(t => t.id===id ? {...t, notes:note} : t))
  const saveNote = (task: Task) => {
    fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: task.name, startDate: task.startDate, duration: task.duration, notes: task.notes }),
    })
  }

  if (!mounted) return null

  // Derived widths
  const hdr2H = dateFormat === 'long' ? 90 : 64
  const leftW = W.num + W.name + W.start + W.days + W.end + (isLoggedIn ? W.actions : 0)

  // Header cell style for left panel
  const lHdr = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#181600', color: P.gold, fontSize: '12px', fontWeight: '700',
    borderBottom: `2px solid ${P.gold}`, borderRight: `1px solid #2a2a2a`,
    padding: '0 10px', whiteSpace: 'nowrap', userSelect: 'none',
    verticalAlign: 'middle',
    ...extra,
  })
  // Body cell style for left panel
  const lCell = (rowBg: string, extra?: React.CSSProperties): React.CSSProperties => ({
    background: rowBg, height: `${ROW_H}px`,
    borderBottom: `1px solid #242424`, borderRight: `1px solid #2a2a2a`,
    verticalAlign: 'middle', padding: '0 10px',
    ...extra,
  })

  return (
    <div style={{ background:P.bg, minHeight:'100vh', fontFamily:"'Segoe UI',Arial,sans-serif", color:P.text }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        background:'linear-gradient(180deg,#1c190a 0%,#161616 100%)',
        borderBottom:`2px solid ${P.gold}`,
        padding:'0 28px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        minHeight:'68px', gap:'12px',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ width:'4px', height:'40px', background:`linear-gradient(180deg,${P.goldLight},${P.goldDark})`, borderRadius:'2px', flexShrink:0 }} />
          <div>
            <h1 style={{ fontSize:'21px', fontWeight:'800', color:P.gold, letterSpacing:'3px', textTransform:'uppercase', lineHeight:1.2 }}>
              Cronograma
            </h1>
            <p style={{ fontSize:'11px', color:P.textDim, letterSpacing:'2px', textTransform:'uppercase', marginTop:'3px' }}>
              Equipo de TI · MB Signature Properties
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {isLoggedIn && (
            <button onClick={openAdd} style={{
              background:`linear-gradient(135deg,${P.gold},${P.goldDark})`,
              color:P.textDark, border:'none', borderRadius:'7px',
              padding:'9px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer',
            }}>+ Nueva tarea</button>
          )}
          <button onClick={isLoggedIn ? handleLogout : ()=>setShowLogin(true)} style={{
            background: isLoggedIn ? 'transparent' : `linear-gradient(135deg,${P.gold},${P.goldDark})`,
            color: isLoggedIn ? P.textDim : P.textDark,
            border: isLoggedIn ? '1px solid #3a3a3a' : 'none',
            borderRadius:'7px', padding:'9px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer',
          }}>
            {isLoggedIn ? 'Cerrar sesión' : 'Iniciar sesión'}
          </button>
        </div>
      </header>

      {/* ── Legend / info bar ──────────────────────────────────────────────── */}
      <div style={{
        background:P.surface, borderBottom:`1px solid ${P.border}`,
        padding:'9px 28px', display:'flex', flexWrap:'wrap',
        gap:'6px 22px', alignItems:'center',
      }}>
        <span style={{ fontSize:'12px', color:P.textDim, marginRight:'6px' }}>
          {tasks.length} {tasks.length===1?'tarea':'tareas'}
          {dayColumns.length > 0 && ` · ${fmtCell(minYMD,'short')} → ${fmtCell(maxYMD,'short')}`}
        </span>
        <div style={{ width:'1px', height:'14px', background:'#333', flexShrink:0 }} />
        {([
          { color:`linear-gradient(90deg,${P.goldLight},${P.goldDark})`, label:'Período activo' },
          { color:P.todayBg, label:'Hoy', border:`1px solid ${P.goldDark}` },
          { color:P.mAWknd,  label:'Fin de semana', border:`1px solid ${P.border}` },
        ] as const).map(it => (
          <div key={it.label} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:P.textDim }}>
            <div style={{ width:'18px', height:'11px', background:it.color, borderRadius:'2px', border:(it as {border?:string}).border, flexShrink:0 }} />
            {it.label}
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:'7px', marginLeft:'4px' }}>
          <span style={{ fontSize:'11px', color: dateFormat==='short' ? P.gold : P.textDim, fontWeight:'600' }}>28/07/26</span>
          <button
            onClick={() => setDateFormat(f => f==='short'?'long':'short')}
            style={{ position:'relative', width:'36px', height:'19px', background: dateFormat==='long' ? P.noteAccent : '#3a3a3a', border:'none', borderRadius:'10px', cursor:'pointer', flexShrink:0 }}
          >
            <span style={{ position:'absolute', top:'2.5px', left: dateFormat==='long'?'19px':'2.5px', width:'14px', height:'14px', background:'#fff', borderRadius:'50%', display:'block' }} />
          </button>
          <span style={{ fontSize:'11px', color: dateFormat==='long' ? P.noteAccent : P.textDim, fontWeight:'600' }}>Mar/Jul/2026</span>
        </div>
        {!isLoggedIn && (
          <button onClick={()=>setShowLogin(true)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:P.textDim, fontSize:'12px', textDecoration:'underline' }}>
            Inicia sesión para editar
          </button>
        )}
      </div>

      {/* ── Two-panel Gantt ────────────────────────────────────────────────── */}
      <div style={{ padding:'16px 20px 32px' }}>
        <div style={{
          display:'flex',
          border:`1px solid #2a2a2a`,
          borderRadius:'6px',
          overflow:'hidden',
        }}>

          {/* ══ LEFT PANEL — task info (no scroll) ══════════════════════════ */}
          <div style={{
            flexShrink: 0,
            width: `${leftW}px`,
            borderRight: `2px solid ${P.gold}`,
            overflow: 'hidden',
          }}>
            <table style={{ borderCollapse:'separate', borderSpacing:0, tableLayout:'fixed', width:`${leftW}px` }}>
              <colgroup>
                <col style={{ width:`${W.num}px` }} />
                <col style={{ width:`${W.name}px` }} />
                <col style={{ width:`${W.start}px` }} />
                <col style={{ width:`${W.days}px` }} />
                <col style={{ width:`${W.end}px` }} />
                {isLoggedIn && <col style={{ width:`${W.actions}px` }} />}
              </colgroup>
              <thead>
                {/* Row 1: placeholder matching month-label height */}
                <tr style={{ height:`${HDR1_H}px` }}>
                  <th colSpan={isLoggedIn ? 6 : 5} style={{ background:'#181600', borderBottom:`1px solid #252500`, borderRight:`1px solid #2a2a2a`, padding:0 }} />
                </tr>
                {/* Row 2: column labels */}
                <tr style={{ height:`${hdr2H}px` }}>
                  <th style={lHdr({ textAlign:'center', fontSize:'11px', color:P.textDim })}>#</th>
                  <th style={lHdr({ textAlign:'left', paddingLeft:'14px' })}>Actividad / Tarea</th>
                  <th style={lHdr({ textAlign:'center' })}>Inicio</th>
                  <th style={lHdr({ textAlign:'center' })}>Días</th>
                  <th style={lHdr({ textAlign:'center', borderRight: isLoggedIn ? `1px solid #2a2a2a` : 'none' })}>Fin</th>
                  {isLoggedIn && <th style={lHdr({ textAlign:'center', borderRight:'none' })}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => {
                  const notesOpen = openNotes.has(task.id)
                  const rowBg = idx % 2 === 0 ? P.rowEven : P.rowOdd
                  const endYMD = endDateOf(task.startDate, task.duration)
                  const num = String(idx+1).padStart(2,'0')
                  return (
                    <Fragment key={task.id}>
                      <tr style={{ height:`${ROW_H}px` }}>
                        {/* # */}
                        <td style={lCell(rowBg, { textAlign:'center', fontSize:'12px', color:P.textDim })}>{num}</td>

                        {/* Task name + notes button */}
                        <td style={lCell(rowBg, { padding:0 })}>
                          <div style={{ display:'flex', alignItems:'center', height:`${ROW_H}px` }}>
                            <div style={{ width:'3px', height:'100%', background:`linear-gradient(180deg,${P.gold}99,${P.goldDark}33)`, flexShrink:0 }} />
                            <span style={{ fontSize:'14px', fontWeight:'600', color:P.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, padding:'0 8px' }}>
                              {task.name}
                            </span>
                            <button
                              onClick={() => toggleNotes(task.id)}
                              style={{
                                flexShrink:0, marginRight:'8px',
                                background: notesOpen ? `${P.noteAccent}25` : task.notes ? `${P.noteAccent}12` : 'transparent',
                                border:`1px solid ${notesOpen||task.notes ? P.noteAccent+'88' : '#333'}`,
                                borderRadius:'10px', padding:'2px 7px',
                                color: notesOpen||task.notes ? P.noteAccent : P.textDim,
                                fontSize:'10px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap',
                              }}
                            >
                              {notesOpen ? '▼ Notas' : '▶ Notas'}
                            </button>
                          </div>
                        </td>

                        {/* Start */}
                        <td style={lCell(rowBg, { textAlign:'center', fontSize: dateFormat==='long'?'11px':'13px', color:P.textDim, whiteSpace:'nowrap' })}>
                          {fmtCell(task.startDate, dateFormat)}
                        </td>

                        {/* Days */}
                        <td style={lCell(rowBg, { textAlign:'center', fontSize:'13px', color:P.gold, fontWeight:'700' })}>
                          {task.duration}
                        </td>

                        {/* End */}
                        <td style={lCell(rowBg, { textAlign:'center', fontSize: dateFormat==='long'?'11px':'13px', color:P.textDim, whiteSpace:'nowrap', borderRight: isLoggedIn ? `1px solid #2a2a2a` : 'none' })}>
                          {fmtCell(endYMD, dateFormat)}
                        </td>

                        {/* Actions */}
                        {isLoggedIn && (
                          <td style={lCell(rowBg, { textAlign:'center', borderRight:'none' })}>
                            <div style={{ display:'flex', gap:'6px', justifyContent:'center' }}>
                              <button onClick={()=>openEdit(task)} style={{ background:P.surface3, color:P.text, border:`1px solid #3a3a3a`, borderRadius:'4px', padding:'4px 10px', fontSize:'12px', cursor:'pointer' }}>
                                Editar
                              </button>
                              <button onClick={()=>deleteTask(task.id)} style={{ background:P.danger, color:'#fff', border:'none', borderRadius:'4px', padding:'4px 10px', fontSize:'12px', cursor:'pointer' }}>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Notes row — left panel shows content */}
                      {notesOpen && (
                        <tr style={{ height:`${NOTES_H}px` }}>
                          <td colSpan={isLoggedIn ? 6 : 5} style={{
                            background:P.notesBg, height:`${NOTES_H}px`,
                            borderBottom:`1px solid ${P.noteBorder}44`,
                            borderLeft:`3px solid ${P.noteAccent}`,
                            padding:'10px 16px', verticalAlign:'top',
                          }}>
                            <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'4px', flexShrink:0 }}>
                                <span style={{ fontSize:'13px' }}>📝</span>
                                <span style={{ color:P.noteAccent, fontWeight:'700', fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase' }}>Notas</span>
                              </div>
                              {isLoggedIn ? (
                                <textarea
                                  value={task.notes}
                                  onChange={e => updateNote(task.id, e.target.value)}
                                  onBlur={() => saveNote(task)}
                                  placeholder="Escribe notas o cambios..."
                                  style={{
                                    flex:1, background:'#0f0b1e',
                                    border:`1px solid ${P.noteBorder}`,
                                    borderRadius:'6px', color:P.noteText, fontSize:'13px',
                                    padding:'7px 10px', height:`${NOTES_H - 24}px`,
                                    resize:'none', outline:'none', fontFamily:'inherit',
                                  }}
                                />
                              ) : (
                                <p style={{ margin:'4px 0 0', fontSize:'13px', color: task.notes ? P.noteText : `${P.noteAccent}66`, fontStyle: task.notes?'normal':'italic' }}>
                                  {task.notes || 'Sin notas.'}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>

            {tasks.length === 0 && (
              <div style={{ padding:'50px 20px', textAlign:'center', color:P.textDim }}>
                <p style={{ fontSize:'15px', marginBottom:'18px' }}>No hay tareas.</p>
                {isLoggedIn && <button onClick={openAdd} style={btnGold()}>+ Agregar tarea</button>}
              </div>
            )}
          </div>

          {/* ══ RIGHT PANEL — gantt (scrollable) ════════════════════════════ */}
          <div style={{ flex:1, overflowX:'auto', minWidth:0 }}>
            <table style={{ borderCollapse:'separate', borderSpacing:0, tableLayout:'fixed' }}>
              <colgroup>
                {dayColumns.map(y => <col key={y} style={{ width:`${DAY_COL}px`, minWidth:`${DAY_COL}px` }} />)}
              </colgroup>
              <thead>
                {/* Row 1: month labels */}
                <tr style={{ height:`${HDR1_H}px` }}>
                  {monthGroups.map(grp => {
                    const even = isEvenMonth(grp.firstYmd)
                    return (
                      <th key={grp.firstYmd} colSpan={grp.count} style={{
                        background: even ? '#1f1f1f' : '#231f10',
                        color: even ? '#7a7a7a' : '#b09840',
                        fontSize:'10px', fontWeight:'700', textAlign:'center',
                        padding:'3px 4px', letterSpacing:'1.2px', textTransform:'uppercase',
                        borderBottom:`1px solid #2a2a2a`, borderRight:`1px solid #2a2a2a`,
                        whiteSpace:'nowrap',
                      }}>
                        {grp.label}
                      </th>
                    )
                  })}
                </tr>
                {/* Row 2: day cells */}
                <tr style={{ height:`${hdr2H}px` }}>
                  {dayColumns.map(ymd => {
                    const today   = isToday(ymd)
                    const weekend = isWeekend(ymd)
                    const even    = isEvenMonth(ymd)
                    return (
                      <th key={ymd} style={{
                        background: today ? P.todayBg : weekend
                          ? (even ? P.mAWknd : P.mBWknd)
                          : (even ? P.mA     : P.mB),
                        color:      today ? P.gold : weekend ? '#555' : '#4a4a4a',
                        fontSize:   '10px', fontWeight: today ? '700' : '400',
                        padding:    '4px 0', textAlign:'center', verticalAlign:'bottom',
                        borderBottom:`2px solid ${today ? P.gold : P.border}`,
                        borderRight:`1px solid #222`,
                        userSelect:'none',
                      }}>
                        <div style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', display:'inline-block', paddingBottom:'3px' }}>
                          {fmtCol(ymd, dateFormat)}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => {
                  const notesOpen = openNotes.has(task.id)
                  const rowBg     = idx % 2 === 0 ? P.rowEven : P.rowOdd
                  return (
                    <Fragment key={task.id}>
                      {/* Gantt bar row */}
                      <tr style={{ height:`${ROW_H}px` }}>
                        {dayColumns.map((ymd, i) => {
                          const active  = isActive(task, ymd)
                          const today   = isToday(ymd)
                          const isFirst = active && (i===0 || !isActive(task, dayColumns[i-1]))
                          const isLast  = active && (i===dayColumns.length-1 || !isActive(task, dayColumns[i+1]))
                          return (
                            <td key={ymd} style={{
                              height:`${ROW_H}px`, padding:0,
                              background: cellBg(ymd),
                              borderBottom:`1px solid #222`,
                              borderRight:`1px solid #222`,
                              position:'relative', overflow:'hidden',
                            }}>
                              {active && (
                                <div style={{
                                  position:'absolute', top:'8px', bottom:'8px',
                                  left: isFirst ? '2px' : 0,
                                  right: isLast  ? '2px' : 0,
                                  background:`linear-gradient(135deg,${P.goldLight},${P.gold} 50%,${P.goldDark})`,
                                  borderRadius:`${isFirst?'4px':'0'} ${isLast?'4px':'0'} ${isLast?'4px':'0'} ${isFirst?'4px':'0'}`,
                                  boxShadow:`0 1px 6px rgba(212,175,55,0.3)`,
                                }} />
                              )}
                              {today && (
                                <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:'1px', background:P.todayLine }} />
                              )}
                            </td>
                          )
                        })}
                      </tr>

                      {/* Notes row — right panel shows empty matching row */}
                      {notesOpen && (
                        <tr style={{ height:`${NOTES_H}px` }}>
                          <td colSpan={dayColumns.length} style={{
                            height:`${NOTES_H}px`,
                            background: P.notesBg,
                            borderBottom:`1px solid ${P.noteBorder}22`,
                          }} />
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ── Login modal ────────────────────────────────────────────────────── */}
      {showLogin && (
        <div style={overlay} onClick={()=>{setShowLogin(false);setLoginError('');setPassword('')}}>
          <div style={modal} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
              <div style={{ width:'3px', height:'26px', background:`linear-gradient(180deg,${P.goldLight},${P.goldDark})`, borderRadius:'2px' }} />
              <h2 style={{ color:P.gold, fontSize:'18px', fontWeight:'700', letterSpacing:'1px' }}>INICIAR SESIÓN</h2>
            </div>
            <label style={lbl}>Contraseña</label>
            <input type="password" value={password}
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()}
              placeholder="••••••••" style={inp} autoFocus />
            {loginError && <p style={{ color:'#e05555', fontSize:'13px', marginTop:'8px' }}>{loginError}</p>}
            <div style={{ display:'flex', gap:'10px', marginTop:'22px' }}>
              <button onClick={handleLogin} style={btnGold(true)}>Entrar</button>
              <button onClick={()=>{setShowLogin(false);setLoginError('');setPassword('')}} style={btnGhost(true)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task modal ─────────────────────────────────────────────────────── */}
      {showTaskModal && (
        <div style={overlay} onClick={()=>setShowTaskModal(false)}>
          <div style={{ ...modal, width:'460px' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
              <div style={{ width:'3px', height:'26px', background:`linear-gradient(180deg,${P.goldLight},${P.goldDark})`, borderRadius:'2px' }} />
              <h2 style={{ color:P.gold, fontSize:'18px', fontWeight:'700', letterSpacing:'1px' }}>
                {editingTask ? 'EDITAR TAREA' : 'NUEVA TAREA'}
              </h2>
            </div>
            <label style={lbl}>Nombre de la tarea</label>
            <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
              placeholder="Descripción de la tarea..." style={inp} autoFocus />
            <label style={{...lbl,marginTop:'14px'}}>Fecha de inicio</label>
            <input type="date" value={form.startDate}
              onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} style={inp} />
            <label style={{...lbl,marginTop:'14px'}}>Duración (días)</label>
            <input type="number" min={1} value={form.duration}
              onChange={e=>{const v=e.target.value;setForm(p=>({...p,duration:v===''?'':parseInt(v)}))}}
              style={inp} />
            <label style={{...lbl,marginTop:'14px'}}>Notas</label>
            <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
              placeholder="Notas o comentarios..."
              style={{...inp,minHeight:'70px',resize:'vertical',fontFamily:'inherit'}} />
            <div style={{ display:'flex', gap:'10px', marginTop:'22px' }}>
              <button
                onClick={saveTask}
                disabled={!form.name.trim()||!form.duration||Number(form.duration)<1}
                style={{
                  ...btnGold(true),
                  opacity:(!form.name.trim()||!form.duration||Number(form.duration)<1)?0.4:1,
                  cursor:(!form.name.trim()||!form.duration||Number(form.duration)<1)?'not-allowed':'pointer',
                }}
              >
                {editingTask ? 'Guardar cambios' : 'Agregar tarea'}
              </button>
              <button onClick={()=>setShowTaskModal(false)} style={btnGhost(true)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
