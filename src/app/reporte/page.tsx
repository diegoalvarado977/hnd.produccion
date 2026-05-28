'use client'

import { useState, useEffect, useCallback } from 'react'
import { inicioSemana, semanaLabel } from '@/lib/calculos'
import { KpiTooltip } from '@/components/KpiTooltip'

type Puntaje = { pts: number | null; pond: number | null; peso: number; resultado: number | string | null }
type Rangos  = { piso: number; techo: number }
type ReporteData = {
  otsRecibidas: number; otsCerradas: number; comebacks: number; tasaComeback: number
  otsATiempo: number; tasaATiempo: number; ventas: number; ticketPromedio: number
  hrsCerradas: number; hrsEnProceso: number; hrsProducidas: number; capacidad: number; eficiencia: number
  evaluacion: { cabina: number; inventario: number; limpieza: number; notas: string | null } | null
  puntajes: Record<string, Puntaje>
  puntajeTotal: number | null; bono: number | null; manualesCompletos: boolean
  rangos: { eficiencia: Rangos; comeback: Rangos; aTiempo: Rangos }
}

function toDate(d: Date) { return d.toISOString().split('T')[0] }
function pct(n: number) { return `${n.toFixed(1)}%` }
function peso(n: number) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n) }

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function PtsBar({ pts }: { pts: number | null }) {
  if (pts === null) return <span className="text-gray-400 text-sm">—</span>
  const color = pts >= 80 ? 'bg-[#70AD47]' : pts >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pts}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-900 w-10 text-right">{pts.toFixed(0)}</span>
    </div>
  )
}

export default function ReportePage() {
  const [semana,   setSemana]   = useState<Date>(() => inicioSemana(new Date()))
  const [data,     setData]     = useState<ReporteData | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [cabina,   setCabina]   = useState<number | ''>('')
  const [inventario, setInv]    = useState<number | ''>('')
  const [limpieza, setLimp]     = useState<number | ''>('')
  const [notas,    setNotas]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [savMsg,   setSavMsg]   = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/reporte?semana=${toDate(semana)}`)
    const d: ReporteData = await res.json()
    setData(d)
    if (d.evaluacion) {
      setCabina(d.evaluacion.cabina)
      setInv(d.evaluacion.inventario)
      setLimp(d.evaluacion.limpieza)
      setNotas(d.evaluacion.notas ?? '')
    } else {
      setCabina(''); setInv(''); setLimp(''); setNotas('')
    }
    setLoading(false)
  }, [semana])

  useEffect(() => { fetchData() }, [fetchData])

  function changeWeek(n: number) {
    const d = new Date(semana); d.setDate(d.getDate() + n * 7); setSemana(d)
  }

  async function saveEval() {
    if (!cabina || !inventario || !limpieza) return
    setSaving(true)
    await fetch('/api/evaluacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ semana: toDate(semana), cabina, inventario, limpieza, notas }),
    })
    setSavMsg('✓ Guardado')
    setTimeout(() => setSavMsg(''), 3000)
    setSaving(false)
    fetchData()
  }

  const kpis = data
  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4472C4]'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporte Semanal</h1>
        <p className="text-sm text-gray-600 mt-0.5">KPIs del taller y cálculo de bono del coordinador</p>
      </div>

      {/* Selector de semana */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex items-center justify-between">
        <button onClick={() => changeWeek(-1)} className="px-3 py-1.5 text-sm text-gray-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-50">← Anterior</button>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{semanaLabel(semana)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Lunes {toDate(semana)}</p>
        </div>
        <button onClick={() => changeWeek(1)} className="px-3 py-1.5 text-sm text-gray-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Siguiente →</button>
      </div>

      {loading && <p className="text-center text-gray-500 py-12">Calculando KPIs...</p>}

      {!loading && kpis && (<>
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <KpiCard label="OTs Recibidas"   value={kpis.otsRecibidas} />
          <KpiCard label="OTs Cerradas"    value={kpis.otsCerradas} />
          <KpiCard label="Comebacks"       value={kpis.comebacks}   sub={`Tasa: ${pct(kpis.tasaComeback)}`} />
          <KpiCard label="A Tiempo"        value={kpis.otsATiempo}  sub={`Tasa: ${pct(kpis.tasaATiempo)}`} />
          <KpiCard label="Ventas"          value={peso(kpis.ventas)} sub={`Ticket: ${peso(kpis.ticketPromedio)}`} />
        </div>

        {/* Eficiencia */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
          <div className="px-4 py-3 bg-[#1F497D] text-white">
            <p className="text-sm font-semibold">Eficiencia del Taller</p>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            {[
              { label: 'Hrs Cerradas',   val: `${kpis.hrsCerradas} hrs` },
              { label: 'Hrs En Proceso', val: `${kpis.hrsEnProceso} hrs` },
              { label: 'Hrs Producidas', val: `${kpis.hrsProducidas} hrs` },
              { label: 'Eficiencia',     val: `${pct(kpis.eficiencia)}` },
            ].map(({ label, val }) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{val}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0%</span>
              <span>Capacidad: {kpis.capacidad} hrs</span>
              <span>100%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${kpis.eficiencia >= 75 ? 'bg-[#70AD47]' : kpis.eficiencia >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(100, kpis.eficiencia)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Evaluación manual */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
          <div className="px-4 py-3 bg-[#703090] text-white flex items-center justify-between">
            <p className="text-sm font-semibold">Evaluación de Calidad — Manuales</p>
            {kpis.evaluacion && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Ya registrada</span>}
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            {[
              { label: 'Cabina / Pintura', val: cabina,     set: setCabina },
              { label: 'Inventario',       val: inventario, set: setInv },
              { label: 'Limpieza',         val: limpieza,   set: setLimp },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="number" min={1} max={10} placeholder="1-10"
                  value={val}
                  onChange={(e) => set(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm font-bold text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea rows={2} className={inp} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </div>
          <div className="px-4 pb-4 flex justify-end">
            <button onClick={saveEval} disabled={saving || !cabina || !inventario || !limpieza}
              className="px-5 py-2 bg-[#703090] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40">
              {savMsg || 'Guardar Evaluación'}
            </button>
          </div>
        </div>

        {/* BONO */}
        <div className="bg-white rounded-xl border-2 border-[#1F497D] overflow-hidden">
          <div className="px-4 py-3 bg-[#1F497D] text-white">
            <p className="text-sm font-bold uppercase tracking-wide">Cálculo de Bono Semanal</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#4472C4] text-white text-xs font-semibold">
                <th className="px-4 py-2 text-left">KPI</th>
                <th className="px-4 py-2 text-center">Resultado</th>
                <th className="px-4 py-2 text-center w-48">Puntaje (0-100)</th>
                <th className="px-4 py-2 text-center">Peso</th>
                <th className="px-4 py-2 text-center">Pts. Pond.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kpis && [
                {
                  key: 'eficiencia', label: 'Eficiencia del Taller',
                  tip: <><p className="font-semibold mb-1">¿Qué mide?</p><p>Horas producidas (cerradas + en proceso con avance) ÷ capacidad total según asistencia.</p><p className="mt-2 text-gray-300">Rango: {kpis.rangos.eficiencia.piso}% → {kpis.rangos.eficiencia.techo}% = 100 pts</p></>
                },
                {
                  key: 'comeback', label: 'Tasa de Comeback',
                  tip: <><p className="font-semibold mb-1">¿Qué mide?</p><p>Unidades rechazadas o retrabajo como % de OTs cerradas. Menos es mejor.</p><p className="mt-2 text-yellow-300">≤{kpis.rangos.comeback.piso}% = 100 pts · ≥{kpis.rangos.comeback.techo}% = 0 pts</p></>
                },
                {
                  key: 'aTiempo', label: 'Entrega A Tiempo',
                  tip: <><p className="font-semibold mb-1">¿Qué mide?</p><p>OTs entregadas en o antes de la fecha promesa ÷ total cerradas.</p><p className="mt-2 text-gray-300">Rango: {kpis.rangos.aTiempo.piso}% → {kpis.rangos.aTiempo.techo}% = 100 pts</p></>
                },
                {
                  key: 'cabina', label: 'Cabina / Pintura',
                  tip: <><p className="font-semibold mb-1">¿Qué mide?</p><p>Inspección visual del estado y limpieza de la cabina de pintura y zona de preparación.</p><p className="mt-2 text-gray-300">Calificación 1-10 → cada punto = 10 pts</p></>
                },
                {
                  key: 'inventario', label: 'Inventario de Materiales',
                  tip: <><p className="font-semibold mb-1">¿Qué mide?</p><p>Control, orden y suficiencia del inventario de pinturas, insumos y materiales.</p><p className="mt-2 text-gray-300">Calificación 1-10 → cada punto = 10 pts</p></>
                },
                {
                  key: 'limpieza', label: 'Limpieza General',
                  tip: <><p className="font-semibold mb-1">¿Qué mide?</p><p>Estado de limpieza del piso, herramientas, zonas de trabajo y área de entrega.</p><p className="mt-2 text-gray-300">Calificación 1-10 → cada punto = 10 pts</p></>
                },
              ].map(({ key, label, tip }) => {
                const p = kpis.puntajes[key]
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <KpiTooltip label={label}>{tip}</KpiTooltip>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-800 font-semibold">
                      {p.resultado !== null ? p.resultado : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3"><PtsBar pts={p.pts} /></td>
                    <td className="px-4 py-3 text-center text-gray-700">{p.peso}%</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">
                      {p.pond !== null ? p.pond.toFixed(1) : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Totales */}
          <div className="grid grid-cols-2 border-t-2 border-[#1F497D]">
            <div className="px-4 py-4 bg-[#D9E2F3] flex items-center justify-end font-bold text-gray-800 text-base">
              PUNTAJE TOTAL
            </div>
            <div className="px-4 py-4 bg-[#4472C4] text-white text-center font-bold text-2xl flex items-center justify-center">
              {kpis.puntajeTotal !== null ? kpis.puntajeTotal.toFixed(1) : (
                <span className="text-sm font-normal opacity-70">Llena evaluación de calidad</span>
              )}
            </div>
            <div className="px-4 py-5 bg-[#1F497D] flex items-center justify-end font-bold text-white text-lg">
              BONO CALCULADO
            </div>
            <div className={`px-4 py-5 text-white text-center font-bold text-4xl flex items-center justify-center ${
              kpis.bono !== null
                ? kpis.bono >= 1500 ? 'bg-[#70AD47]' : kpis.bono >= 800 ? 'bg-amber-500' : 'bg-red-500'
                : 'bg-gray-400'
            }`}>
              {kpis.bono !== null ? peso(kpis.bono) : (
                <span className="text-sm font-normal opacity-70">Pendiente evaluación</span>
              )}
            </div>
          </div>
        </div>
      </>)}
    </div>
  )
}
