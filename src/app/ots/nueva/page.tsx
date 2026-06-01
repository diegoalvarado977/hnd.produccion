'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Tecnico = { id: number; nombre: string }
type TecRow  = { tecnicoId: number; horas: number }

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4472C4]'
const label = 'block text-sm font-medium text-gray-700 mb-1'

export default function NuevaOTPage() {
  const router = useRouter()
  const [tecnicos,  setTecnicos]  = useState<Tecnico[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const [numero,       setNumero]       = useState('')
  const [unidad,       setUnidad]       = useState('')
  const [precio,       setPrecio]       = useState('')
  const [tipoCliente,  setTipoCliente]  = useState('PARTICULAR')
  const [comeback,     setComeback]     = useState(false)
  const [fechaEntrada,      setFechaEntrada]      = useState('')
  const [fechaAutorizacion, setFechaAutorizacion] = useState('')
  const [fechaPromesa,      setFechaPromesa]      = useState('')
  const [notas,             setNotas]             = useState('')
  const [tecs, setTecs] = useState<TecRow[]>([
    { tecnicoId: 0, horas: 0 },
    { tecnicoId: 0, horas: 0 },
    { tecnicoId: 0, horas: 0 },
  ])

  useEffect(() => {
    fetch('/api/tecnicos').then((r) => r.json()).then(setTecnicos)
  }, [])

  // Auto-calcular fecha promesa: entrada + 3 días hábiles
  useEffect(() => {
    if (!fechaEntrada) return
    const d = new Date(fechaEntrada + 'T12:00:00')
    d.setDate(d.getDate() + 3)
    setFechaPromesa(d.toISOString().split('T')[0])
  }, [fechaEntrada])

  function updateTec(i: number, field: keyof TecRow, val: number) {
    setTecs((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const tecnicos = tecs
      .filter((t) => t.tecnicoId > 0 && t.horas > 0)
      .map((t, i) => ({ ...t, posicion: i + 1 }))

    if (tecnicos.length === 0) {
      setError('Asigna al menos un técnico con horas.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero, unidad, precio, tipoCliente, comeback,
          fechaEntrada, fechaAutorizacion: fechaAutorizacion || null,
          fechaPromesa, notas, tecnicos,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return
      }
      router.push('/ots')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ots" className="text-gray-400 hover:text-gray-600 text-sm">← Volver</Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Orden de Trabajo</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

        {/* Datos generales */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Datos Generales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>N° OT</label>
              <input className={input} placeholder="VH-2250" value={numero}
                onChange={(e) => setNumero(e.target.value)} required />
            </div>
            <div>
              <label className={label}>Unidad</label>
              <input className={input} placeholder="Nissan Sentra 2022" value={unidad}
                onChange={(e) => setUnidad(e.target.value)} required />
            </div>
            <div>
              <label className={label}>Precio</label>
              <input className={input} type="number" min="0" step="0.01" placeholder="0.00"
                value={precio} onChange={(e) => setPrecio(e.target.value)} required />
            </div>
            <div>
              <label className={label}>Tipo de Cliente</label>
              <select className={input} value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value)}>
                <option value="PARTICULAR">Particular</option>
                <option value="FLOTILLA">Flotilla</option>
              </select>
            </div>
            <div>
              <label className={label}>Fecha de Entrada</label>
              <input className={input} type="date" value={fechaEntrada}
                onChange={(e) => setFechaEntrada(e.target.value)} required />
            </div>
            <div>
              <label className={label}>Fecha de Autorización <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className={input} type="date" value={fechaAutorizacion}
                onChange={(e) => setFechaAutorizacion(e.target.value)} />
            </div>
            <div>
              <label className={label}>Fecha Promesa</label>
              <input className={input} type="date" value={fechaPromesa}
                onChange={(e) => setFechaPromesa(e.target.value)} required />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" id="comeback" checked={comeback}
              onChange={(e) => setComeback(e.target.checked)}
              className="w-4 h-4 rounded accent-red-500" />
            <label htmlFor="comeback" className="text-sm text-gray-700">
              Es un <span className="font-semibold text-red-600">comeback</span> (retrabajo / reclamación)
            </label>
          </div>
        </section>

        {/* Técnicos */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Técnicos Asignados</h2>
          <p className="text-xs text-gray-400 mb-3">Las horas se usan para distribuir la producción proporcionalmente.</p>
          <div className="space-y-3">
            {tecs.map((t, i) => (
              <div key={i} className="flex gap-3 items-center">
                <span className="text-xs font-medium text-gray-400 w-14">Tec. {i + 1}</span>
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4472C4]"
                  value={t.tecnicoId}
                  onChange={(e) => updateTec(i, 'tecnicoId', parseInt(e.target.value))}
                >
                  <option value={0}>— Sin asignar —</option>
                  {tecnicos.map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.nombre}</option>
                  ))}
                </select>
                <input
                  type="number" min="0" step="0.5" placeholder="Hrs"
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#4472C4]"
                  value={t.horas || ''}
                  onChange={(e) => updateTec(i, 'horas', parseFloat(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notas */}
        <section>
          <label className={label}>Notas (opcional)</label>
          <textarea rows={2} className={input} value={notas}
            onChange={(e) => setNotas(e.target.value)} />
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={loading}
            className="px-5 py-2.5 bg-[#1F497D] text-white text-sm font-medium rounded-lg hover:bg-[#4472C4] transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar OT'}
          </button>
          <Link href="/ots"
            className="px-5 py-2.5 text-gray-500 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
