export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { cerrarOT, reabrirOT } from './actions'
import { DeleteOTButton } from '@/components/DeleteOTButton'

function fmt(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtPeso(n: unknown) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(n))
}

export default async function OTsPage() {
  const ots = await prisma.oT.findMany({
    include: {
      tecnicos: { include: { tecnico: true }, orderBy: { posicion: 'asc' } },
    },
    orderBy: { fechaEntrada: 'desc' },
  })

  const enProceso = ots.filter((o) => o.estado === 'EN_PROCESO').length
  const cerradas  = ots.filter((o) => o.estado === 'CERRADA').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ots.length} OTs total — {enProceso} en proceso · {cerradas} cerradas
          </p>
        </div>
        <Link
          href="/ots/nueva"
          className="px-4 py-2 bg-[#1F497D] text-white text-sm font-medium rounded-lg hover:bg-[#4472C4] transition-colors"
        >
          + Nueva OT
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <colgroup>
            <col className="w-28" />   {/* N° OT */}
            <col className="w-48" />   {/* Unidad */}
            <col className="w-44" />   {/* Técnicos */}
            <col className="w-28" />   {/* Precio */}
            <col className="w-24" />   {/* Cliente */}
            <col className="w-24" />   {/* Estado */}
            <col className="w-10" />   {/* CB */}
            <col className="w-24" />   {/* Entrada */}
            <col className="w-28" />   {/* Entrega */}
            <col className="w-24" />   {/* Promesa */}
            <col />                    {/* Acciones */}
          </colgroup>
          <thead>
            <tr className="bg-[#1F497D] text-white text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">N° OT</th>
              <th className="px-4 py-3 text-left">Unidad</th>
              <th className="px-4 py-3 text-left">Técnicos</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-center">Cliente</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">CB</th>
              <th className="px-4 py-3 text-left">Entrada</th>
              <th className="px-4 py-3 text-left">Recolección</th>
              <th className="px-4 py-3 text-left">Promesa</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ots.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-400">
                  <p className="font-medium">Sin OTs registradas</p>
                  <p className="text-xs mt-1 text-gray-300">Crea la primera OT con el botón de arriba</p>
                </td>
              </tr>
            )}
            {ots.map((ot) => {
              const tecNames = ot.tecnicos.map((t) => t.tecnico.nombre).join(', ')
              const cerrada  = ot.estado === 'CERRADA'
              const today    = new Date().toISOString().split('T')[0]

              return (
                <tr key={ot.id} className={`hover:bg-gray-50 ${cerrada ? 'bg-gray-50/60' : ''}`}>
                  <td className="px-4 py-3 font-mono font-bold text-[#1F497D] whitespace-nowrap">{ot.numero}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{ot.unidad}</td>
                  <td className="px-4 py-3 text-gray-800 text-xs font-medium">{tecNames}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{fmtPeso(ot.precio)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ot.tipoCliente === 'PARTICULAR' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                      {ot.tipoCliente === 'PARTICULAR' ? 'Particular' : 'Flotilla'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cerrada ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {cerrada ? 'Cerrada' : 'En Proceso'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ot.comeback
                      ? <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-0.5 rounded-full">CB</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{fmt(ot.fechaEntrada)}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {cerrada && ot.aTiempo !== null ? (
                      <span className={`font-semibold ${ot.aTiempo ? 'text-green-700' : 'text-red-600'}`}>
                        {fmt(ot.fechaRecoleccion)} {ot.aTiempo ? '✓' : '✗'}
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{fmt(ot.fechaPromesa)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/ots/${ot.id}`} className="text-xs font-medium text-gray-500 hover:text-[#4472C4]">
                        Editar
                      </Link>
                      <DeleteOTButton otId={ot.id} numero={ot.numero} />
                      {!cerrada ? (
                        <form action={cerrarOT} className="flex items-center gap-1 flex-wrap">
                          <input type="hidden" name="otId" value={ot.id} />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400 leading-none">Finalización</span>
                            <input
                              type="date"
                              name="fechaFinalizacion"
                              className="border border-gray-200 rounded px-2 py-1 text-xs w-32 text-gray-900"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-gray-400 leading-none">Recolección</span>
                            <input
                              type="date"
                              name="fechaRecoleccion"
                              defaultValue={today}
                              className="border border-gray-200 rounded px-2 py-1 text-xs w-32 text-gray-900"
                            />
                          </div>
                          <button type="submit"
                            className="text-xs px-2 py-1 bg-[#70AD47] text-white font-semibold rounded hover:bg-green-700 self-end">
                            Cerrar
                          </button>
                        </form>
                      ) : (
                        <form action={reabrirOT}>
                          <input type="hidden" name="otId" value={ot.id} />
                          <button type="submit" className="text-xs font-medium text-gray-500 hover:text-orange-600">
                            Reabrir
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
