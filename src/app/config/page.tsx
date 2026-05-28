'use client'

import { useState, useEffect } from 'react'

type Tecnico = { id: number; nombre: string; activo: boolean; _count: { ots: number } }

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4472C4]'
const label = 'block text-sm font-medium text-gray-700 mb-1'

export default function ConfigPage() {
  const [tecnicos,    setTecnicos]    = useState<Tecnico[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [addError,    setAddError]    = useState('')
  const [addLoading,  setAddLoading]  = useState(false)
  const [saveMsg,     setSaveMsg]     = useState('')

  // Parámetros del taller
  const [hrsPorSemana,   setHrsPorSemana]   = useState('47.5')
  const [factorMO,       setFactorMO]       = useState('0.6')
  const [tarifaHora,     setTarifaHora]     = useState('300')
  const [bonoMaximo,     setBonoMaximo]     = useState('2000')
  const [pesoEficiencia, setPesoEficiencia] = useState('30')
  const [pesoComeback,   setPesoComeback]   = useState('20')
  const [pesoATiempo,    setPesoATiempo]    = useState('20')
  const [pesoCabina,     setPesoCabina]     = useState('10')
  const [pesoInventario, setPesoInventario] = useState('10')
  const [pesoLimpieza,   setPesoLimpieza]   = useState('10')

  function fetchTecnicos() {
    fetch('/api/tecnicos?todos=1')
      .then((r) => r.json())
      .then(setTecnicos)
  }

  useEffect(() => {
    fetchTecnicos()
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (!cfg) return
        setHrsPorSemana(String(cfg.hrsPorSemana))
        setFactorMO(String(cfg.factorMO))
        setTarifaHora(String(cfg.tarifaHora))
        setBonoMaximo(String(cfg.bonoMaximo))
        setPesoEficiencia(String(cfg.pesoEficiencia))
        setPesoComeback(String(cfg.pesoComeback))
        setPesoATiempo(String(cfg.pesoATiempo))
        setPesoCabina(String(cfg.pesoCabina))
        setPesoInventario(String(cfg.pesoInventario))
        setPesoLimpieza(String(cfg.pesoLimpieza))
      })
  }, [])

  async function handleAddTecnico(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    const res = await fetch('/api/tecnicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoNombre }),
    })
    if (res.ok) {
      setNuevoNombre('')
      fetchTecnicos()
    } else {
      const data = await res.json()
      setAddError(data.error)
    }
    setAddLoading(false)
  }

  async function toggleActivo(t: Tecnico) {
    await fetch(`/api/tecnicos/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !t.activo }),
    })
    fetchTecnicos()
  }

  async function handleDelete(t: Tecnico) {
    if (!confirm(`¿Eliminar a ${t.nombre}? Solo es posible si no tiene OTs asignadas.`)) return
    const res = await fetch(`/api/tecnicos/${t.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error)
    } else {
      fetchTecnicos()
    }
  }

  const totalPesos = [pesoEficiencia, pesoComeback, pesoATiempo, pesoCabina, pesoInventario, pesoLimpieza]
    .reduce((s, v) => s + (parseInt(v) || 0), 0)

  async function handleSaveConfig() {
    if (totalPesos !== 100) { alert('Los pesos deben sumar exactamente 100%'); return }
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hrsPorSemana: parseFloat(hrsPorSemana),
        factorMO: parseFloat(factorMO),
        tarifaHora: parseFloat(tarifaHora),
        bonoMaximo: parseFloat(bonoMaximo),
        pesoEficiencia: parseInt(pesoEficiencia),
        pesoComeback: parseInt(pesoComeback),
        pesoATiempo: parseInt(pesoATiempo),
        pesoCabina: parseInt(pesoCabina),
        pesoInventario: parseInt(pesoInventario),
        pesoLimpieza: parseInt(pesoLimpieza),
      }),
    })
    setSaveMsg(res.ok ? '✓ Guardado' : 'Error al guardar')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {/* Parámetros del taller */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Parámetros del Taller</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Hrs / semana por técnico', val: hrsPorSemana, set: setHrsPorSemana },
            { label: 'Factor MO',                val: factorMO,     set: setFactorMO },
            { label: 'Tarifa / hora ($)',          val: tarifaHora,   set: setTarifaHora },
            { label: 'Bono máximo ($)',            val: bonoMaximo,   set: setBonoMaximo },
          ].map(({ label: l, val, set }) => (
            <div key={l}>
              <label className={label}>{l}</label>
              <input type="number" className={input} value={val} onChange={(e) => set(e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Pesos del bono */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pesos del Bono</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalPesos === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            Total: {totalPesos}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Deben sumar exactamente 100%</p>
        <div className="space-y-3">
          {[
            { label: 'Eficiencia del Taller', val: pesoEficiencia, set: setPesoEficiencia },
            { label: 'Tasa de Comeback',      val: pesoComeback,   set: setPesoComeback },
            { label: 'Entrega A Tiempo',       val: pesoATiempo,    set: setPesoATiempo },
            { label: 'Cabina / Pintura',       val: pesoCabina,     set: setPesoCabina },
            { label: 'Inventario',             val: pesoInventario, set: setPesoInventario },
            { label: 'Limpieza',               val: pesoLimpieza,   set: setPesoLimpieza },
          ].map(({ label: l, val, set }) => (
            <div key={l} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-gray-700">{l}</span>
              <input type="number" min={0} max={100} className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center"
                value={val} onChange={(e) => set(e.target.value)} />
              <span className="text-sm text-gray-400">%</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSaveConfig}
        className="w-full py-3 bg-[#1F497D] text-white font-medium rounded-lg hover:bg-[#4472C4] transition-colors">
        {saveMsg || 'Guardar Configuración'}
      </button>

      {/* Técnicos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Técnicos</h2>

        {/* Agregar */}
        <form onSubmit={handleAddTecnico} className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4472C4]"
            placeholder="Nombre del técnico"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <button type="submit" disabled={addLoading || !nuevoNombre.trim()}
            className="px-4 py-2 bg-[#1F497D] text-white text-sm font-medium rounded-lg hover:bg-[#4472C4] disabled:opacity-40">
            + Agregar
          </button>
        </form>
        {addError && <p className="text-xs text-red-600 mb-3">{addError}</p>}

        {/* Lista */}
        <div className="space-y-2">
          {tecnicos.map((t) => (
            <div key={t.id} className={`flex items-center justify-between py-2.5 px-3 rounded-lg border ${t.activo ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${t.activo ? 'bg-green-400' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium">{t.nombre}</span>
                {t._count.ots > 0 && (
                  <span className="text-xs text-gray-400">{t._count.ots} OT{t._count.ots !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleActivo(t)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${t.activo ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                  {t.activo ? 'Desactivar' : 'Activar'}
                </button>
                {t._count.ots === 0 && (
                  <button onClick={() => handleDelete(t)} className="text-xs text-red-400 hover:text-red-600">
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Técnicos desactivados no aparecen en formularios nuevos ni en el Dashboard. Solo se pueden eliminar si no tienen OTs asignadas.
        </p>
      </div>
    </div>
  )
}
