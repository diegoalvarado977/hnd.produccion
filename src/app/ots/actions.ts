'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function cerrarOT(formData: FormData) {
  const otId             = parseInt(formData.get('otId') as string)
  const fechaRecoleccionStr  = formData.get('fechaRecoleccion') as string
  const fechaFinStr      = formData.get('fechaFinalizacion') as string | null

  const ot = await prisma.oT.findUnique({ where: { id: otId } })
  if (!ot) throw new Error('OT no encontrada')

  const entrega = new Date(fechaRecoleccionStr)
  await prisma.oT.update({
    where: { id: otId },
    data: {
      estado:            'CERRADA',
      fechaRecoleccion:      entrega,
      fechaFinalizacion: fechaFinStr ? new Date(fechaFinStr) : null,
      aTiempo:           entrega <= ot.fechaPromesa,
    },
  })

  revalidatePath('/ots')
}

export async function reabrirOT(formData: FormData) {
  const otId = parseInt(formData.get('otId') as string)
  await prisma.oT.update({
    where: { id: otId },
    data: { estado: 'EN_PROCESO', fechaRecoleccion: null, aTiempo: null },
  })
  revalidatePath('/ots')
}

export async function eliminarOT(formData: FormData) {
  const otId = parseInt(formData.get('otId') as string)
  await prisma.oT.delete({ where: { id: otId } })
  revalidatePath('/ots')
}
