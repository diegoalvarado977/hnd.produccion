export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { semana, cabina, inventario, limpieza, notas } = await req.json()
  const semanaInicio = new Date(semana + 'T12:00:00')

  const ev = await prisma.evaluacionManual.upsert({
    where:  { semanaInicio },
    update: { cabina, inventario, limpieza, notas: notas || null },
    create: { semanaInicio, cabina, inventario, limpieza, notas: notas || null },
  })
  return NextResponse.json(ev)
}

