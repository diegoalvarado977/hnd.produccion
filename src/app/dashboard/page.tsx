'use client'

import { useState, useEffect, useCallback } from 'react'
import { inicioSemana, semanaLabel } from '@/lib/calculos'

type TecRow = {
  id: number; nombre: string
  otsAsignadas: number; otsCerradas: number; comebacks: number
  hrsCerradas: number; hrsEnProceso: number; hrsProducidas: number
  diasAsist: boolean[]; capacidad: number; eficiencia: number
}

function toDate(d: Date) { return d.toISOString().split('T')[0] }

const DIAS_LABELS = ['L', 'M', 'Mi', 'J', 'V', 'S']

function EficienciaBadge({ val }: { val: number }) {
  const color = val >= 75 ? 'bg-[#70AD47] text-white'
              : val >= 50 ? 'bg-amber-400 text-white'
              : val >   0 ? 'bg-red-400 text-white'
              : 'bg-gray-100 text-gray-500'
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${color}`}>
      {val.toFixed(1)}%
    </span>
  )
}

export default function DashboardPage() {
  const [semana,  setSemana]  = useState<Date>(() => inicioSemana(new Date()))
  const [rows,    setRows]    = useState<TecRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dashboard?semana=${toDate(semana)}`)
    setRows(await res.json())
    setLoading(false)
  }, [semana])

  useEffect(() => { fetchData() }, [fetchData])

  function changeWeek(n: number) {
    const d = new Date(semana); d.setDate(d.getDate() + n * 7); setSemana(d)
  }

  const totalHrsProd = rows.reduce((s, r) => s + r.hrsProducidas, 0)
  const totalCap     = rows.reduce((s, r) => s + r.capacidad,     0)
  const eficEquipo   = totalCap > 0 ? (totalHrsProd / totalCap * 100) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Técnicos</h1>
        <p className="text-sm text-gray-600 mt-0.5">Productividad individual — horas proporcionales cerradas + en proceso</p>
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

      {/* Resumen equipo */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalHrsProd.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Hrs producidas equipo</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCap.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Capacidad total</p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${eficEquipo >= 75 ? 'bg-[#70AD47] border-[#70AD47]' : eficEquipo >= 50 ? 'bg-amber-400 border-amber-400' : 'bg-red-400 border-red-400'}`}>
            <p className="text-2xl font-bold text-white">{eficEquipo.toFixed(1)}%</p>
            <p className="text-xs text-white/80 mt-1 uppercase tracking-wide">Eficiencia equipo</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1F497D] text-white text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Técnico</th>
              <th className="px-4 py-3 text-center">OTs Asig.</th>
              <th className="px-4 py-3 text-center">OTs Cerr.</th>
              <th className="px-4 py-3 text-center">CB</th>
              <th className="px-4 py-3 text-center">Hrs Cerradas</th>
              <th className="px-4 py-3 text-center">Hrs Proceso</th>
              <th className="px-4 py-3 text-center">Hrs Prod.</th>
              <th className="px-4 py-3 text-center">Asistencia</th>
              <th className="px-4 py-3 text-center">Cap.</th>
              <th className="px-4 py-3 text-center">Eficiencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={10} className="py-12 text-center text-gray-500">Cargando...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={10} className="py-12 text-center text-gray-400">
                <p className="font-medium">Sin datos para esta semana</p>
                <p className="text-xs mt-1">Registra OTs o selecciona otra semana</p>
              </td></tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{r.nombre}</td>
                <td className="px-4 py-3 text-center font-medium text-gray-800">{r.otsAsignadas}</td>
                <td className="px-4 py-3 text-center font-medium text-gray-800">{r.otsCerradas}</td>
                <td className="px-4 py-3 text-center">
                  {r.comebacks > 0
                    ? <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-0.5 rounded-full">{r.comebacks}</span>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-800">{r.hrsCerradas}</td>
                <td className="px-4 py-3 text-center font-medium text-[#4472C4]">
                  {r.hrsEnProceso > 0 ? r.hrsEnProceso : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-900">{r.hrsProducidas}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-0.5">
                    {r.diasAsist.map((presente, i) => (
                      <span key={i} title={['L','M','Mi','J','V','S'][i]}
                        className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${
                          presente
                            ? i === 5 ? 'bg-[#4472C4] text-white' : 'bg-[#70AD47] text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                        {DIAS_LABELS[i]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-800">{r.capacidad} h</td>
                <td className="px-4 py-3 text-center"><EficienciaBadge val={r.eficiencia} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && rows.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 grid grid-cols-10 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <span className="col-span-4">Total equipo</span>
            <span className="text-center">{rows.reduce((s,r) => s+r.hrsCerradas,   0).toFixed(1)}</span>
            <span className="text-center text-[#4472C4]">{rows.reduce((s,r) => s+r.hrsEnProceso,  0).toFixed(1)}</span>
            <span className="text-center text-gray-900">{totalHrsProd.toFixed(1)}</span>
            <span></span>
            <span className="text-center">{totalCap.toFixed(1)} h</span>
            <span className="text-center">
              <EficienciaBadge val={eficEquipo} />
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Hrs proporcionales: cada técnico recibe su parte según las horas asignadas en la OT.
        Verde = cerradas · Azul = en proceso (avance semanal).
      </p>
    </div>
  )
}
