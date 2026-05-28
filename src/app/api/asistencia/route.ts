import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcCapacidad, DIAS_DEFAULT } from '@/lib/calculos'

// GET /api/asistencia?semana=2026-05-25
export async function GET(req: Request) {
  const semana = new URL(req.url).searchParams.get('semana')
  if (!semana) return NextResponse.json({ error: 'Parámetro semana requerido' }, { status: 400 })

  const semanaInicio = new Date(semana + 'T12:00:00')

  const [tecnicos, registros] = await Promise.all([
    prisma.tecnico.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } }),
    prisma.asistenciaSemana.findMany({ where: { semanaInicio } }),
  ])

  const result = tecnicos.map((t) => {
    const reg = registros.find((r) => r.tecnicoId === t.id)
    const dias = reg
      ? { lunes: reg.lunes, martes: reg.martes, miercoles: reg.miercoles,
          jueves: reg.jueves, viernes: reg.viernes, sabado: reg.sabado }
      : { ...DIAS_DEFAULT }
    return {
      tecnicoId:  t.id,
      nombre:     t.nombre,
      dias,
      capacidad:  calcCapacidad(dias),
      registrado: !!reg,
    }
  })

  return NextResponse.json(result)
}

// POST /api/asistencia
export async function POST(req: Request) {
  const { semana, asistencias } = await req.json()
  const semanaInicio = new Date(semana + 'T12:00:00')

  type AsistenciaInput = {
    tecnicoId: number
    lunes: boolean; martes: boolean; miercoles: boolean
    jueves: boolean; viernes: boolean; sabado: boolean
  }

  await Promise.all(
    (asistencias as AsistenciaInput[]).map((a) =>
      prisma.asistenciaSemana.upsert({
        where: { tecnicoId_semanaInicio: { tecnicoId: a.tecnicoId, semanaInicio } },
        update: {
          lunes: a.lunes, martes: a.martes, miercoles: a.miercoles,
          jueves: a.jueves, viernes: a.viernes, sabado: a.sabado,
        },
        create: {
          tecnicoId: a.tecnicoId, semanaInicio,
          lunes: a.lunes, martes: a.martes, miercoles: a.miercoles,
          jueves: a.jueves, viernes: a.viernes, sabado: a.sabado,
        },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
