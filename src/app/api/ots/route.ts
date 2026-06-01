export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const ots = await prisma.oT.findMany({
    include: {
      tecnicos: {
        include: { tecnico: true },
        orderBy: { posicion: 'asc' },
      },
    },
    orderBy: { fechaEntrada: 'desc' },
  })
  return NextResponse.json(ots)
}

export async function POST(req: Request) {
  const body = await req.json()

  const tecnicos = (body.tecnicos as { tecnicoId: number; posicion: number; horas: number }[])
    .filter((t) => t.tecnicoId && t.horas > 0)

  if (tecnicos.length === 0) {
    return NextResponse.json({ error: 'Asigna al menos un tÃ©cnico' }, { status: 400 })
  }

  try {
    const ot = await prisma.oT.create({
      data: {
        numero:       body.numero,
        unidad:       body.unidad,
        precio:       parseFloat(body.precio),
        tipoCliente:  body.tipoCliente,
        comeback:     body.comeback ?? false,
        fechaEntrada:      new Date(body.fechaEntrada),
        fechaAutorizacion: body.fechaAutorizacion ? new Date(body.fechaAutorizacion) : null,
        fechaFinalizacion: body.fechaFinalizacion ? new Date(body.fechaFinalizacion) : null,
        fechaPromesa:      new Date(body.fechaPromesa),
        notas:             body.notas || null,
        tecnicos: {
          create: tecnicos.map((t) => ({
            tecnicoId: t.tecnicoId,
            posicion:  t.posicion,
            horas:     t.horas,
          })),
        },
      },
      include: {
        tecnicos: { include: { tecnico: true }, orderBy: { posicion: 'asc' } },
      },
    })
    return NextResponse.json(ot, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    if (msg.includes('Unique constraint') && msg.includes('numero')) {
      return NextResponse.json({ error: `El NÂ° OT "${body.numero}" ya existe` }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

