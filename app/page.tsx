'use client'

import { useState, useEffect, Fragment } from 'react'

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  bg:       '#161616',
  surface:  '#1e1e1e',
  surface2: '#252525',
  surface3: '#2c2c2c',
  border:   '#333333',
  borderGold:'#3d3520',
  gold:     '#d4af37',
  goldLight:'#f0d060',
  goldDark: '#a88c25',
  goldGlow: 'rgba(212,175,55,0.15)',
  text:     '#e8e8e8',
  textDim:  '#777777',
  textDark: '#0f0f0f',
  danger:   '#9b2c2c',
  rowEven:  '#1b1b1b',
  rowOdd:   '#202020',
  weekend:  '#191919',
  notesBg:  '#161616',
} as const

// ── Types ─────────────────────────────────────────────────────────────────────
type Task = {
  id: string
  name: string
  startDate: string
  duration: number
  notes: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseLocal(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function endDateOf(startDate: string, duration: number): string {
  const d = parseLocal(startDate)
  d.setDate(d.getDate() + duration - 1)
  return toYMD(d)
}

function fmtShort(ymd: string): string {
  const d = parseLocal(ymd)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function todayYMD(): string {
  return toYMD(new Date())
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED: Task[] = [
  { id: '1', name: 'Planificación del proyecto',      startDate: '2026-07-28', duration: 5,  notes: '' },
  { id: '2', name: 'Análisis de requerimientos',      startDate: '2026-08-02', duration: 7,  notes: '' },
  { id: '3', name: 'Diseño del sistema',              startDate: '2026-08-09', duration: 6,  notes: '' },
  { id: '4', name: 'Desarrollo del módulo principal', startDate: '2026-08-15', duration: 10, notes: '' },
  { id: '5', name: 'Pruebas unitarias',               startDate: '2026-08-25', duration: 5,  notes: '' },
  { id: '6', name: 'Integración y pruebas finales',   startDate: '2026-08-30', duration: 4,  notes: '' },
  { id: '7', name: 'Despliegue y entrega',            startDate: '2026-09-03', duration: 3,  notes: '' },
]

const PASSWORD = 'admin123'

// ── Fixed col widths ──────────────────────────────────────────────────────────
const W = { name: 240, start: 82, days: 58, end: 82 }
const L = { start: W.name, days: W.name + W.start, end: W.name + W.start + W.days }

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', background: P.bg, border: `1px solid ${P.border}`,
  borderRadius: '6px', color: P.text, fontSize: '14px',
  padding: '10px 12px', outline: 'none', boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', color: P.textDim,
  marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px',
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}

const modal: React.CSSProperties = {
  background: P.surface2, border: `1px solid ${P.gold}`,
  borderRadius: '12px', padding: '30px 34px', width: '420px', maxWidth: '93vw',
  boxShadow: `0 0 40px rgba(212,175,55,0.12)`,
}

function btnGold(flex?: boolean): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${P.gold} 0%, ${P.goldDark} 100%)`,
    color: P.textDark, border: 'none', borderRadius: '7px',
    padding: '10px 20px', fontSize: '14px', fontWeight: '700',
    cursor: 'pointer', flex: flex ? 1 : undefined,
  }
}

function btnGhost(flex?: boolean): React.CSSProperties {
  return {
    background: 'transparent', color: P.textDim,
    border: `1px solid ${P.border}`, borderRadius: '7px',
    padding: '10px 20px', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', flex: flex ? 1 : undefined,
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
  const [form,          setForm]          = useState<{ name: string; startDate: string; duration: number | ''; notes: string }>({ name: '', startDate: '', duration: 5, notes: '' })
  const [openNotes,     setOpenNotes]     = useState<Set<string>>(new Set())
  const [mounted,       setMounted]       = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('gantt_v1_tasks')
    setTasks(stored ? JSON.parse(stored) : SEED)
    if (sessionStorage.getItem('gantt_auth') === '1') setIsLoggedIn(true)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem('gantt_v1_tasks', JSON.stringify(tasks))
  }, [tasks, mounted])

  // ── Date range ──────────────────────────────────────────────────────────────
  const allYMDs = tasks.flatMap(t => [t.startDate, endDateOf(t.startDate, t.duration)])
  const minYMD  = allYMDs.length ? allYMDs.reduce((a, b) => a < b ? a : b) : todayYMD()
  const maxYMD  = allYMDs.length ? allYMDs.reduce((a, b) => a > b ? a : b) : todayYMD()

  const dayColumns: string[] = []
  const cur = parseLocal(minYMD)
  const end = parseLocal(maxYMD)
  while (cur <= end) { dayColumns.push(toYMD(cur)); cur.setDate(cur.getDate() + 1) }

  const isWeekend = (ymd: string) => { const d = parseLocal(ymd); return d.getDay() === 0 || d.getDay() === 6 }
  const isToday   = (ymd: string) => ymd === todayYMD()
  const isActive  = (task: Task, ymd: string) => ymd >= task.startDate && ymd <= endDateOf(task.startDate, task.duration)

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsLoggedIn(true); sessionStorage.setItem('gantt_auth', '1')
      setShowLogin(false); setPassword(''); setLoginError('')
    } else { setLoginError('Contraseña incorrecta.') }
  }
  const handleLogout = () => { setIsLoggedIn(false); sessionStorage.removeItem('gantt_auth') }

  // ── Task CRUD ───────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingTask(null); setForm({ name: '', startDate: todayYMD(), duration: 5 as number | '', notes: '' }); setShowTaskModal(true)
  }
  const openEdit = (task: Task) => {
    setEditingTask(task); setForm({ name: task.name, startDate: task.startDate, duration: task.duration, notes: task.notes }); setShowTaskModal(true)
  }
  const saveTask = () => {
    if (!form.name.trim()) return
    const dur = Number(form.duration)
    if (!dur || dur < 1) return
    const data = { ...form, duration: dur }
    if (editingTask) setTasks(p => p.map(t => t.id === editingTask.id ? { ...t, ...data } : t))
    else setTasks(p => [...p, { id: Date.now().toString(), ...data }])
    setShowTaskModal(false)
  }
  const deleteTask = (id: string) => { if (confirm('¿Eliminar esta tarea?')) setTasks(p => p.filter(t => t.id !== id)) }
  const toggleNotes = (id: string) => {
    setOpenNotes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const updateNote = (id: string, note: string) => setTasks(p => p.map(t => t.id === id ? { ...t, notes: note } : t))

  const colCount = 4 + dayColumns.length + (isLoggedIn ? 1 : 0)

  if (!mounted) return null

  return (
    <div style={{ background: P.bg, minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif", color: P.text }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: `linear-gradient(180deg, #1f1c0e 0%, #161616 100%)`,
        borderBottom: `2px solid ${P.gold}`,
        padding: '0 32px',
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
        minHeight: '72px',
      }}>
        {/* Left: title block with gold accent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '14px 0' }}>
          <div style={{ width: '4px', height: '42px', background: `linear-gradient(180deg, ${P.goldLight}, ${P.goldDark})`, borderRadius: '2px', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: P.gold, letterSpacing: '3px', lineHeight: 1.15, textTransform: 'uppercase' }}>
              Diagrama de Gantt
            </h1>
            <p style={{ fontSize: '11px', color: P.textDim, letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '3px' }}>
              Cronograma del Proyecto
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isLoggedIn && (
            <button onClick={openAdd} style={{
              background: `linear-gradient(135deg, ${P.gold}, ${P.goldDark})`,
              color: P.textDark, border: 'none', borderRadius: '7px',
              padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              letterSpacing: '0.3px',
            }}>
              + Agregar tarea
            </button>
          )}
          <button onClick={isLoggedIn ? handleLogout : () => setShowLogin(true)} style={{
            background: isLoggedIn ? 'transparent' : `linear-gradient(135deg, ${P.gold}, ${P.goldDark})`,
            color: isLoggedIn ? P.textDim : P.textDark,
            border: isLoggedIn ? `1px solid ${P.border}` : 'none',
            borderRadius: '7px', padding: '9px 18px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.3px',
          }}>
            {isLoggedIn ? 'Cerrar sesión' : 'Iniciar sesión'}
          </button>
        </div>
      </header>

      {/* ── Legend bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: P.surface, borderBottom: `1px solid ${P.border}`,
        padding: '8px 32px', display: 'flex', flexWrap: 'wrap',
        gap: '20px', alignItems: 'center', fontSize: '12px', color: P.textDim,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '20px', height: '12px', background: `linear-gradient(90deg, ${P.gold}, ${P.goldDark})`, borderRadius: '2px' }} />
          Período activo
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '20px', height: '12px', background: '#2e2800', borderRadius: '2px', border: `1px solid ${P.goldDark}` }} />
          Hoy
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '20px', height: '12px', background: P.weekend, borderRadius: '2px', border: `1px solid ${P.border}` }} />
          Fin de semana
        </div>
        <div>▶ Expandir notas por tarea</div>
        {!isLoggedIn && (
          <div style={{ marginLeft: 'auto', color: P.textDim }}>
            Inicia sesión para editar el cronograma
          </div>
        )}
      </div>

      {/* ── Gantt table wrapper ─────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', padding: '20px 24px 28px' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: `${W.name}px`, minWidth: `${W.name}px` }} />
            <col style={{ width: `${W.start}px`, minWidth: `${W.start}px` }} />
            <col style={{ width: `${W.days}px`, minWidth: `${W.days}px` }} />
            <col style={{ width: `${W.end}px`, minWidth: `${W.end}px` }} />
            {dayColumns.map(ymd => <col key={ymd} style={{ width: '34px', minWidth: '34px' }} />)}
            {isLoggedIn && <col style={{ width: '110px', minWidth: '110px' }} />}
          </colgroup>

          <thead>
            <tr>
              {/* Sticky fixed header cells */}
              {([
                { label: 'Tarea', left: 0, w: W.name, align: 'left' },
                { label: 'Inicio', left: L.start, w: W.start, align: 'center' },
                { label: 'Días', left: L.days, w: W.days, align: 'center' },
                { label: 'Fin', left: L.end, w: W.end, align: 'center' },
              ] as const).map(col => (
                <th key={col.label} style={{
                  position: 'sticky', left: col.left, zIndex: 3,
                  background: '#1a1700',
                  color: P.gold, fontSize: '13px', fontWeight: '700',
                  padding: '11px 12px', textAlign: col.align,
                  borderBottom: `2px solid ${P.gold}`,
                  borderRight: `1px solid ${P.border}`,
                  whiteSpace: 'nowrap', userSelect: 'none',
                }}>
                  {col.label}
                </th>
              ))}

              {/* Date header cells */}
              {dayColumns.map(ymd => {
                const today = isToday(ymd)
                const weekend = isWeekend(ymd)
                return (
                  <th key={ymd} style={{
                    background: today ? '#2e2800' : weekend ? '#171717' : P.bg,
                    color: today ? P.gold : weekend ? '#444' : '#555',
                    fontSize: '10px', fontWeight: today ? '700' : '500',
                    padding: '8px 2px', textAlign: 'center',
                    borderBottom: `2px solid ${today ? P.gold : P.border}`,
                    borderRight: `1px solid ${P.border}`,
                    whiteSpace: 'nowrap', userSelect: 'none',
                    boxShadow: today ? `inset 0 -2px 0 ${P.gold}` : undefined,
                  }}>
                    {fmtShort(ymd)}
                  </th>
                )
              })}

              {isLoggedIn && (
                <th style={{
                  background: '#1a1700', color: P.gold, fontSize: '13px', fontWeight: '700',
                  padding: '11px 12px', textAlign: 'center',
                  borderBottom: `2px solid ${P.gold}`, borderRight: `1px solid ${P.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {tasks.map((task, idx) => {
              const notesOpen = openNotes.has(task.id)
              const rowBg     = idx % 2 === 0 ? P.rowEven : P.rowOdd
              const endYMD    = endDateOf(task.startDate, task.duration)

              return (
                <Fragment key={task.id}>
                  <tr>
                    {/* ── Task name (sticky) ── */}
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 2,
                      background: rowBg,
                      padding: '0', borderBottom: `1px solid ${P.border}`,
                      borderRight: `1px solid ${P.border}`,
                    }}>
                      {/* Gold left accent bar */}
                      <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                        <div style={{
                          width: '3px', height: '100%', flexShrink: 0,
                          background: `linear-gradient(180deg, ${P.gold}88, ${P.goldDark}44)`,
                        }} />
                        <button
                          onClick={() => toggleNotes(task.id)}
                          title={notesOpen ? 'Cerrar notas' : 'Ver notas'}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: task.notes ? P.gold : '#444',
                            fontSize: '10px', padding: '0 8px 0 10px', flexShrink: 0,
                          }}
                        >
                          {notesOpen ? '▼' : '▶'}
                        </button>
                        <span style={{
                          fontSize: '14px', fontWeight: '600', color: P.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, paddingRight: '10px',
                        }}>
                          {task.name}
                        </span>
                        {task.notes && !notesOpen && (
                          <span style={{ color: P.gold, fontSize: '8px', paddingRight: '8px', flexShrink: 0 }}>●</span>
                        )}
                      </div>
                    </td>

                    {/* ── Start (sticky) ── */}
                    <td style={{
                      position: 'sticky', left: L.start, zIndex: 2,
                      background: rowBg, textAlign: 'center',
                      fontSize: '13px', color: P.textDim,
                      padding: '0 8px', height: '42px',
                      borderBottom: `1px solid ${P.border}`, borderRight: `1px solid ${P.border}`,
                    }}>
                      {fmtShort(task.startDate)}
                    </td>

                    {/* ── Duration (sticky) ── */}
                    <td style={{
                      position: 'sticky', left: L.days, zIndex: 2,
                      background: rowBg, textAlign: 'center',
                      fontSize: '13px', color: P.gold, fontWeight: '600',
                      padding: '0 6px', height: '42px',
                      borderBottom: `1px solid ${P.border}`, borderRight: `1px solid ${P.border}`,
                    }}>
                      {task.duration}
                    </td>

                    {/* ── End (sticky) ── */}
                    <td style={{
                      position: 'sticky', left: L.end, zIndex: 2,
                      background: rowBg, textAlign: 'center',
                      fontSize: '13px', color: P.textDim,
                      padding: '0 8px', height: '42px',
                      borderBottom: `1px solid ${P.border}`, borderRight: `1px solid ${P.border}`,
                    }}>
                      {fmtShort(endYMD)}
                    </td>

                    {/* ── Gantt bars ── */}
                    {dayColumns.map((ymd, i) => {
                      const active   = isActive(task, ymd)
                      const today    = isToday(ymd)
                      const weekend  = isWeekend(ymd)
                      const isFirst  = active && (i === 0 || !isActive(task, dayColumns[i - 1]))
                      const isLast   = active && (i === dayColumns.length - 1 || !isActive(task, dayColumns[i + 1]))

                      return (
                        <td key={ymd} style={{
                          height: '42px', padding: 0,
                          background: today
                            ? '#2e2800'
                            : weekend
                              ? P.weekend
                              : rowBg,
                          borderBottom: `1px solid ${P.border}`,
                          borderRight: `1px solid ${P.border}`,
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          {active && (
                            <div style={{
                              position: 'absolute',
                              top: '7px', bottom: '7px',
                              left: isFirst ? '3px' : 0,
                              right: isLast ? '3px' : 0,
                              background: `linear-gradient(135deg, ${P.goldLight} 0%, ${P.gold} 50%, ${P.goldDark} 100%)`,
                              borderRadius: `${isFirst ? '4px' : '0'} ${isLast ? '4px' : '0'} ${isLast ? '4px' : '0'} ${isFirst ? '4px' : '0'}`,
                              boxShadow: `0 1px 4px rgba(212,175,55,0.35)`,
                            }} />
                          )}
                          {today && !active && (
                            <div style={{
                              position: 'absolute', top: 0, bottom: 0,
                              left: '50%', width: '1px',
                              background: `${P.gold}55`,
                            }} />
                          )}
                        </td>
                      )
                    })}

                    {/* ── Actions ── */}
                    {isLoggedIn && (
                      <td style={{
                        height: '42px', padding: '0 10px', textAlign: 'center',
                        background: rowBg,
                        borderBottom: `1px solid ${P.border}`, borderRight: `1px solid ${P.border}`,
                        verticalAlign: 'middle',
                      }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => openEdit(task)} style={{
                            background: P.surface3, color: P.text,
                            border: `1px solid ${P.border}`, borderRadius: '4px',
                            padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
                          }}>
                            Editar
                          </button>
                          <button onClick={() => deleteTask(task.id)} style={{
                            background: P.danger, color: '#fff',
                            border: 'none', borderRadius: '4px',
                            padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
                          }}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* ── Notes row ── */}
                  {notesOpen && (
                    <tr>
                      <td colSpan={colCount} style={{
                        background: P.notesBg,
                        borderBottom: `1px solid ${P.border}`,
                        borderLeft: `3px solid ${P.gold}`,
                        padding: '12px 20px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          <span style={{ color: P.gold, fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', marginTop: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Notas
                          </span>
                          {isLoggedIn ? (
                            <textarea
                              value={task.notes}
                              onChange={e => updateNote(task.id, e.target.value)}
                              placeholder="Escribe notas o cambios para esta tarea..."
                              style={{
                                flex: 1, background: '#111', border: `1px solid ${P.border}`,
                                borderRadius: '6px', color: P.text, fontSize: '13px',
                                padding: '9px 12px', minHeight: '62px', resize: 'vertical',
                                outline: 'none', fontFamily: 'inherit',
                              }}
                            />
                          ) : (
                            <p style={{
                              margin: '6px 0 0', fontSize: '14px',
                              color: task.notes ? P.text : P.textDim,
                              fontStyle: task.notes ? 'normal' : 'italic',
                            }}>
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
          <div style={{ textAlign: 'center', padding: '70px 20px', color: P.textDim }}>
            <p style={{ fontSize: '16px', marginBottom: '22px' }}>No hay tareas registradas.</p>
            {isLoggedIn && (
              <button onClick={openAdd} style={btnGold()}>+ Agregar primera tarea</button>
            )}
          </div>
        )}
      </div>

      {/* ── Login modal ────────────────────────────────────────────────────── */}
      {showLogin && (
        <div style={overlay} onClick={() => { setShowLogin(false); setLoginError(''); setPassword('') }}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '3px', height: '26px', background: `linear-gradient(180deg, ${P.goldLight}, ${P.goldDark})`, borderRadius: '2px' }} />
              <h2 style={{ color: P.gold, fontSize: '18px', fontWeight: '700', letterSpacing: '1px' }}>INICIAR SESIÓN</h2>
            </div>

            <label style={lbl}>Contraseña</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••" style={inp} autoFocus
            />
            {loginError && <p style={{ color: '#e05555', fontSize: '13px', marginTop: '8px' }}>{loginError}</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={handleLogin} style={btnGold(true)}>Entrar</button>
              <button onClick={() => { setShowLogin(false); setLoginError(''); setPassword('') }} style={btnGhost(true)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit modal ───────────────────────────────────────────────── */}
      {showTaskModal && (
        <div style={overlay} onClick={() => setShowTaskModal(false)}>
          <div style={{ ...modal, width: '460px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '3px', height: '26px', background: `linear-gradient(180deg, ${P.goldLight}, ${P.goldDark})`, borderRadius: '2px' }} />
              <h2 style={{ color: P.gold, fontSize: '18px', fontWeight: '700', letterSpacing: '1px' }}>
                {editingTask ? 'EDITAR TAREA' : 'NUEVA TAREA'}
              </h2>
            </div>

            <label style={lbl}>Nombre de la tarea</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Descripción de la tarea..." style={inp} autoFocus />

            <label style={{ ...lbl, marginTop: '14px' }}>Fecha de inicio</label>
            <input type="date" value={form.startDate}
              onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} style={inp} />

            <label style={{ ...lbl, marginTop: '14px' }}>Duración (días)</label>
            <input type="number" min={1} value={form.duration}
              onChange={e => {
                const v = e.target.value
                setForm(p => ({ ...p, duration: v === '' ? '' : parseInt(v) }))
              }} style={inp} />

            <label style={{ ...lbl, marginTop: '14px' }}>Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notas o comentarios..." style={{ ...inp, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button
                onClick={saveTask}
                disabled={!form.name.trim() || !form.duration || Number(form.duration) < 1}
                style={{
                  ...btnGold(true),
                  opacity: (!form.name.trim() || !form.duration || Number(form.duration) < 1) ? 0.4 : 1,
                  cursor: (!form.name.trim() || !form.duration || Number(form.duration) < 1) ? 'not-allowed' : 'pointer',
                }}
              >
                {editingTask ? 'Guardar cambios' : 'Agregar tarea'}
              </button>
              <button onClick={() => setShowTaskModal(false)} style={btnGhost(true)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
