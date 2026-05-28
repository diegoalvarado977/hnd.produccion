'use client'

import { useState, useEffect, useCallback } from 'react'
import { inicioSemana, semanaLabel, calcCapacidad, CAPACIDAD_MAX, HRS_SEMANA, HRS_SABADO, type DiasSemana } from '@/lib/calculos'

type Row = {
  tecnicoId: number
  nombre: string
  dias: DiasSemana
  capacidad: number
  registrado: boolean
}

type Dia = keyof DiasSemana

const DIAS_SEMANA: { key: Dia; label: string; hrs: number }[] = [
  { key: 'lunes',     label: 'L',  hrs: HRS_SEMANA },
  { key: 'martes',    label: 'M',  hrs: HRS_SEMANA },
  { key: 'miercoles', label: 'Mi', hrs: HRS_SEMANA },
  { key: 'jueves',    label: 'J',  hrs: HRS_SEMANA },
  { key: 'viernes',   label: 'V',  hrs: HRS_SEMANA },
  { key: 'sabado',    label: 'S',  hrs: HRS_SABADO },
]

function toInputDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function AsistenciaPage() {
  const [semana,  setSemana]  = useState<Date>(() => inicioSemana(new Date()))
  const [rows,    setRows]    = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setSaved(false)
    const res = await fetch(`/api/asistencia?semana=${toInputDate(semana)}`)
    setRows(await res.json())
    setLoading(false)
  }, [semana])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleDia(tecnicoId: number, dia: Dia) {
    setRows((prev) => prev.map((r) => {
      if (r.tecnicoId !== tecnicoId) return r
      const dias = { ...r.dias, [dia]: !r.dias[dia] }
      return { ...r, dias, capacidad: calcCapacidad(dias) }
    }))
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    await fetch('/api/asistencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        semana: toInputDate(semana),
        asistencias: rows.map(({ tecnicoId, dias }) => ({ tecnicoId, ...dias })),
      }),
    })
    setSaved(true)
    setLoading(false)
    fetchData()
  }

  function changeWeek(offset: number) {
    const d = new Date(semana)
    d.setDate(d.getDate() + offset * 7)
    setSemana(d)
  }

  const capacidadTotal = rows.reduce((s, r) => s + r.capacidad, 0)
  const capacidadMaxTotal = rows.length * CAPACIDAD_MAX
  const ausencias = rows.filter((r) => Object.values(r.dias).some((v) => !v)).length

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Lun–Vie: {HRS_SEMANA} hrs · Sáb: {HRS_SABADO} hrs · Capacidad máx: {CAPACIDAD_MAX} hrs/técnico
        </p>
      </div>

      {/* Selector de semana */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex items-center justify-between">
        <button onClick={() => changeWeek(-1)}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg">
          ← Anterior
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-800">{semanaLabel(semana)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Semana del lunes {toInputDate(semana)}</p>
        </div>
        <button onClick={() => changeWeek(1)}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg">
          Siguiente →
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{capacidadTotal.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-1">Hrs disponibles equipo</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#4472C4]">
            {capacidadMaxTotal > 0 ? Math.round(capacidadTotal / capacidadMaxTotal * 100) : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Capacidad del equipo</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className={`text-2xl font-bold ${ausencias > 0 ? 'text-amber-500' : 'text-green-600'}`}>{ausencias}</p>
          <p className="text-xs text-gray-400 mt-1">Con ausencias</p>
        </div>
      </div>

      {/* Tabla principal */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-[#1F497D] text-white flex items-center justify-between">
          <p className="text-sm font-semibold">Registro semanal</p>
          {rows.some((r) => r.registrado) && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Ya registrada</span>
          )}
        </div>

        {/* Encabezado de días */}
        <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '1fr repeat(6,52px) 80px' }}>
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Técnico</div>
          {DIAS_SEMANA.map(({ key, label, hrs }) => (
            <div key={key} className="py-2 text-center">
              <p className={`text-xs font-bold ${key === 'sabado' ? 'text-purple-600' : 'text-gray-600'}`}>{label}</p>
              <p className="text-xs text-gray-400">{hrs}h</p>
            </div>
          ))}
          <div className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Cap.</div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400 text-sm">Cargando...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((row) => {
              const ausente = Object.values(row.dias).some((v) => !v)
              return (
                <div key={row.tecnicoId}
                  className={`grid items-center hover:bg-gray-50 ${ausente ? 'bg-amber-50/40' : ''}`}
                  style={{ gridTemplateColumns: '1fr repeat(6,52px) 80px' }}>

                  <div className="px-4 py-3 font-semibold text-sm text-gray-900">{row.nombre}</div>

                  {DIAS_SEMANA.map(({ key }) => (
                    <div key={key} className="py-3 flex justify-center">
                      <button
                        onClick={() => toggleDia(row.tecnicoId, key)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border-2 ${
                          row.dias[key]
                            ? key === 'sabado'
                              ? 'bg-[#4472C4] border-[#4472C4] text-white'
                              : 'bg-[#70AD47] border-[#70AD47] text-white'
                            : 'bg-white border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400'
                        }`}
                      >
                        {row.dias[key] ? '✓' : '✗'}
                      </button>
                    </div>
                  ))}

                  <div className="py-3 text-center">
                    <span className={`text-sm font-bold ${row.capacidad < CAPACIDAD_MAX ? 'text-amber-600' : 'text-gray-700'}`}>
                      {row.capacidad.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400"> hrs</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Capacidad total del equipo:{' '}
            <span className="font-bold text-gray-800">{capacidadTotal.toFixed(1)} hrs</span>
            <span className="text-gray-400"> / {capacidadMaxTotal.toFixed(1)} máx</span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 bg-[#1F497D] text-white text-sm font-medium rounded-lg hover:bg-[#4472C4] disabled:opacity-50 transition-colors"
          >
            {saved ? '✓ Guardado' : 'Guardar asistencia'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Verde ✓ = presente · Rojo ✗ = ausente · Toca cada casilla para cambiar el estado.
        Morado = sábado ({HRS_SABADO} hrs).
      </p>
    </div>
  )
}
