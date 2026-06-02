'use client'

import { useState, useEffect, useCallback } from 'react'
import { inicioSemana, semanaLabel } from '@/lib/calculos'

type OTAvance = {
  id: number
  numero: string
  unidad: string
  tecnicos: string
  hrsCalc: number
  hrsYaContadas: number
  hrsDisponibles: number
  hrsEstaSemana: number
  registrado: boolean
}

function toDate(d: Date) { return d.toISOString().split('T')[0] }

export default function AvancePage() {
  const [semana,  setSemana]  = useState<Date>(() => inicioSemana(new Date()))
  const [ots,     setOts]     = useState<OTAvance[]>([])
  const [inputs,  setInputs]  = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setSaved(false)
    const res = await fetch(`/api/avance?semana=${toDate(semana)}`)
    const data: OTAvance[] = await res.json()
    setOts(data)
    // Pre-cargar valores ya registrados
    const initial: Record<number, number> = {}
    data.forEach((o) => { initial[o.id] = o.hrsEstaSemana })
    setInputs(initial)
    setLoading(false)
  }, [semana])

  useEffect(() => { fetchData() }, [fetchData])

  function changeWeek(offset: number) {
    const d = new Date(semana)
    d.setDate(d.getDate() + offset * 7)
    setSemana(d)
  }

  function setHrs(otId: number, val: number) {
    setInputs((prev) => ({ ...prev, [otId]: val }))
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    await fetch('/api/avance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        semana: toDate(semana),
        avances: ots.map((o) => ({
          otId:          o.id,
          hrsEstaSemana: inputs[o.id] ?? 0,
          hrsCalc:       o.hrsCalc,
          hrsYaContadas: o.hrsYaContadas,
        })),
      }),
    })
    setSaved(true)
    setLoading(false)
    fetchData()
  }

  const totalAvance = ots.reduce((s, o) => {
    const hrs = inputs[o.id] ?? 0
    return s + Math.min(hrs, o.hrsDisponibles)
  }, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Avance Semanal</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Registra las horas trabajadas en cada OT en proceso esta semana.
          Las horas se acreditan proporcionalmente al taller — con cap en las horas estimadas del trabajo.
        </p>
      </div>

      {/* Selector de semana */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex items-center justify-between">
        <button onClick={() => changeWeek(-1)}
          className="px-3 py-1.5 text-sm text-gray-700 font-medium hover:text-gray-900 border border-gray-200 rounded-lg">
          ← Anterior
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{semanaLabel(semana)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Lunes {toDate(semana)}</p>
        </div>
        <button onClick={() => changeWeek(1)}
          className="px-3 py-1.5 text-sm text-gray-700 font-medium hover:text-gray-900 border border-gray-200 rounded-lg">
          Siguiente →
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-[#4472C4] text-white flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">OTs en Proceso</p>
          {ots.some((o) => o.registrado) && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Semana ya registrada</span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Cargando...</div>
        ) : ots.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="font-medium">Sin OTs en proceso</p>
            <p className="text-xs mt-1 text-gray-400">Todas las OTs están cerradas o no hay OTs registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">N° OT</th>
                <th className="px-4 py-3 text-left">Unidad</th>
                <th className="px-4 py-3 text-left">Técnicos</th>
                <th className="px-4 py-3 text-center">Hrs Totales</th>
                <th className="px-4 py-3 text-center">Ya Contadas</th>
                <th className="px-4 py-3 text-center">Disponibles</th>
                <th className="px-4 py-3 text-center text-[#1F497D]">Hrs Esta Semana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ots.map((ot) => {
                const val = inputs[ot.id] ?? 0
                const excede = val > ot.hrsDisponibles
                const capVal = Math.min(val, ot.hrsDisponibles)
                return (
                  <tr key={ot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#1F497D]">{ot.numero}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{ot.unidad}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{ot.tecnicos}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-800">{ot.hrsCalc}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {ot.hrsYaContadas > 0
                        ? <span className="text-amber-600 font-semibold">{ot.hrsYaContadas}</span>
                        : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${ot.hrsDisponibles === 0 ? 'text-gray-400' : 'text-[#70AD47]'}`}>
                        {ot.hrsDisponibles}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={ot.hrsDisponibles}
                          step={0.5}
                          value={val || ''}
                          onChange={(e) => setHrs(ot.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          disabled={ot.hrsDisponibles === 0}
                          className={`w-20 border rounded-lg px-3 py-1.5 text-center font-bold text-gray-900 focus:outline-none focus:ring-2 ${
                            excede
                              ? 'border-amber-400 bg-amber-50 focus:ring-amber-400'
                              : 'border-[#4472C4] bg-blue-50 focus:ring-[#4472C4]'
                          } disabled:bg-gray-100 disabled:text-gray-400`}
                        />
                        {excede && (
                          <span className="text-xs text-amber-600 font-medium">
                            → se cap a {ot.hrsDisponibles} hrs
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-700">
            Total avance esta semana:{' '}
            <span className="font-bold text-gray-900">{totalAvance.toFixed(1)} hrs</span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || ots.length === 0}
            className="px-5 py-2 bg-[#1F497D] text-white text-sm font-semibold rounded-lg hover:bg-[#4472C4] disabled:opacity-40 transition-colors"
          >
            {saved ? '✓ Guardado' : 'Guardar Avances'}
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
        <strong>Lógica de cap:</strong> Si una OT tiene 10 hrs estimadas y en semanas anteriores
        ya se contaron 7, esta semana solo se acreditan máximo 3 hrs — aunque hayas trabajado más.
        Las horas en proceso se suman a las cerradas para calcular la eficiencia real del taller.
      </div>
    </div>
  )
}
