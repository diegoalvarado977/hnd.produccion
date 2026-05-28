import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ot = await prisma.oT.findUnique({
    where: { id: parseInt(id) },
    include: {
      tecnicos: { include: { tecnico: true }, orderBy: { posicion: 'asc' } },
      avances:  { orderBy: { semanaInicio: 'asc' } },
    },
  })
  if (!ot) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(ot)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // Cerrar OT
  if (body.action === 'cerrar') {
    const ot = await prisma.oT.findUnique({ where: { id: parseInt(id) } })
    if (!ot) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const fechaEntrega = new Date(body.fechaEntrega)
    const updated = await prisma.oT.update({
      where: { id: parseInt(id) },
      data: {
        estado:       'CERRADA',
        fechaEntrega,
        aTiempo:      fechaEntrega <= ot.fechaPromesa,
      },
    })
    return NextResponse.json(updated)
  }

  // Editar OT completa
  const tecnicos = (body.tecnicos as { tecnicoId: number; posicion: number; horas: number }[])
    ?.filter((t) => t.tecnicoId && t.horas > 0) ?? []

  await prisma.oTTecnico.deleteMany({ where: { otId: parseInt(id) } })

  const updated = await prisma.oT.update({
    where: { id: parseInt(id) },
    data: {
      numero:       body.numero,
      unidad:       body.unidad,
      precio:       parseFloat(body.precio),
      tipoCliente:  body.tipoCliente,
      comeback:     body.comeback ?? false,
      fechaEntrada: new Date(body.fechaEntrada),
      fechaPromesa: new Date(body.fechaPromesa),
      notas:        body.notas || null,
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
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.oT.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ ok: true })
}
