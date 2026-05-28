/**
 * Datos de prueba — Semana May 25-31 2026
 * Target: ~90% eficiencia (cerradas + en proceso con avance)
 *
 * Capacidad: 6 técnicos × 47.5 hrs = 285 hrs
 * Hrs cerradas:    180 hrs  (63%)
 * Hrs en proceso:   77 hrs  (27%)  ← avance semanal
 * Total producidas: 257 hrs (90.2%)
 *
 * IDs técnicos (orden seed original):
 *   1=CESAR  2=YAHIR  3=ASAEL  4=FRANCISCO  5=FRANCISCO JR  6=KEVIN
 */

import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

function d(yyyy: number, mm: number, dd: number) {
  return new Date(`${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}T12:00:00`)
}

async function main() {
  // ── Limpiar datos de OTs anteriores ─────────────────────────────────────────
  await p.avanceSemanal.deleteMany()
  await p.oTTecnico.deleteMany()
  await p.oT.deleteMany()
  await p.asistenciaSemana.deleteMany()
  console.log('  Datos anteriores eliminados')

  // ── Asistencia semana 25-may (todos presentes) ───────────────────────────────
  const semanaInicio = d(2026, 5, 25)
  const tecIds = [1, 2, 3, 4, 5, 6]
  for (const tecnicoId of tecIds) {
    await p.asistenciaSemana.create({
      data: {
        tecnicoId, semanaInicio,
        lunes: true, martes: true, miercoles: true,
        jueves: true, viernes: true, sabado: true,
      },
    })
  }
  console.log('  Asistencia semana cargada (6/6 presentes → 285 hrs capacidad)')

  // ── OTs CERRADAS esta semana ─────────────────────────────────────────────────
  // HrsCalc = precio × 0.6 / 300 = precio / 500
  const cerradas = [
    {
      numero: 'VH-2300', unidad: 'Toyota Hilux 4x4 2022', precio: 12000,
      tipoCliente: 'PARTICULAR', comeback: false,
      fechaEntrada: d(2026,5,19), fechaPromesa: d(2026,5,23), fechaEntrega: d(2026,5,27),
      aTiempo: false,  // llegó tarde (27 > 23)
      tecnicos: [{ tecnicoId: 3, posicion: 1, horas: 12 }, { tecnicoId: 4, posicion: 2, horas: 6 }],
      // HrsCalc: 24 → ASAEL: 16 hrs | FRANCISCO: 8 hrs
    },
    {
      numero: 'VH-2301', unidad: 'Audi Q5 2023', precio: 15000,
      tipoCliente: 'PARTICULAR', comeback: false,
      fechaEntrada: d(2026,5,20), fechaPromesa: d(2026,5,26), fechaEntrega: d(2026,5,26),
      aTiempo: true,
      tecnicos: [{ tecnicoId: 1, posicion: 1, horas: 15 }, { tecnicoId: 2, posicion: 2, horas: 8 }],
      // HrsCalc: 30 → CESAR: 19.6 hrs | YAHIR: 10.4 hrs
    },
    {
      numero: 'VH-2302', unidad: 'Nissan Frontier 2021', precio: 10000,
      tipoCliente: 'FLOTILLA', comeback: false,
      fechaEntrada: d(2026,5,22), fechaPromesa: d(2026,5,26), fechaEntrega: d(2026,5,26),
      aTiempo: true,
      tecnicos: [{ tecnicoId: 5, posicion: 1, horas: 10 }, { tecnicoId: 6, posicion: 2, horas: 6 }],
      // HrsCalc: 20 → FJR: 12.5 hrs | KEVIN: 7.5 hrs
    },
    {
      numero: 'VH-2303', unidad: 'VW Tiguan 2023', precio: 8000,
      tipoCliente: 'PARTICULAR', comeback: false,
      fechaEntrada: d(2026,5,25), fechaPromesa: d(2026,5,28), fechaEntrega: d(2026,5,28),
      aTiempo: true,
      tecnicos: [{ tecnicoId: 3, posicion: 1, horas: 10 }, { tecnicoId: 1, posicion: 2, horas: 6 }],
      // HrsCalc: 16 → ASAEL: 10 hrs | CESAR: 6 hrs
    },
    {
      numero: 'VH-2304', unidad: 'Mazda 3 Sedan 2024', precio: 10500,
      tipoCliente: 'PARTICULAR', comeback: false,
      fechaEntrada: d(2026,5,25), fechaPromesa: d(2026,5,28), fechaEntrega: d(2026,5,27),
      aTiempo: true,
      tecnicos: [{ tecnicoId: 2, posicion: 1, horas: 8 }, { tecnicoId: 6, posicion: 2, horas: 4 }],
      // HrsCalc: 21 → YAHIR: 14 hrs | KEVIN: 7 hrs
    },
    {
      numero: 'VH-2305', unidad: 'Chevrolet Aveo 2020', precio: 9000,
      tipoCliente: 'FLOTILLA', comeback: false,
      fechaEntrada: d(2026,5,26), fechaPromesa: d(2026,5,28), fechaEntrega: d(2026,5,28),
      aTiempo: true,
      tecnicos: [{ tecnicoId: 4, posicion: 1, horas: 8 }],
      // HrsCalc: 18 → FRANCISCO: 18 hrs
    },
    {
      numero: 'VH-2306', unidad: 'Honda CR-V 2022', precio: 13500,
      tipoCliente: 'PARTICULAR', comeback: false,
      fechaEntrada: d(2026,5,26), fechaPromesa: d(2026,5,30), fechaEntrega: d(2026,5,29),
      aTiempo: true,
      tecnicos: [
        { tecnicoId: 5, posicion: 1, horas: 8 },
        { tecnicoId: 6, posicion: 2, horas: 6 },
        { tecnicoId: 2, posicion: 3, horas: 4 },
      ],
      // HrsCalc: 27 → FJR: 12 hrs | KEVIN: 9 hrs | YAHIR: 6 hrs
    },
    {
      numero: 'VH-2307', unidad: 'Kia Sportage 2023 ★CB', precio: 12000,
      tipoCliente: 'PARTICULAR', comeback: true,  // ← COMEBACK
      fechaEntrada: d(2026,5,27), fechaPromesa: d(2026,5,30), fechaEntrega: d(2026,5,30),
      aTiempo: true,
      tecnicos: [{ tecnicoId: 1, posicion: 1, horas: 6 }],
      // HrsCalc: 24 → CESAR: 24 hrs
    },
  ]

  // Total cerradas: 24+30+20+16+21+18+27+24 = 180 hrs  |  Ventas: $90,000

  for (const ot of cerradas) {
    const { tecnicos: tecs, ...otData } = ot
    await p.oT.create({
      data: {
        ...otData,
        precio: otData.precio,
        tipoCliente: otData.tipoCliente as 'PARTICULAR' | 'FLOTILLA',
        estado: 'CERRADA',
        tecnicos: { create: tecs },
      },
    })
    process.stdout.write('.')
  }
  console.log(`\n  ${cerradas.length} OTs cerradas → 180 hrs calc / $90,000 ventas`)

  // ── OTs EN PROCESO (con avance semanal) ──────────────────────────────────────
  const enProceso = [
    {
      numero: 'VH-2308', unidad: 'BMW Serie 7 2024', precio: 25000,
      tipoCliente: 'PARTICULAR', comeback: false,
      fechaEntrada: d(2026,5,27), fechaPromesa: d(2026,5,31),
      tecnicos: [
        { tecnicoId: 3, posicion: 1, horas: 18 },
        { tecnicoId: 1, posicion: 2, horas: 10 },
        { tecnicoId: 4, posicion: 3, horas: 8 },
      ],
      // HrsCalc: 50 hrs — avance: 30 hrs (inicio de trabajo intenso)
      avance: 30,
    },
    {
      numero: 'VH-2309', unidad: 'Ford Explorer 2023', precio: 17500,
      tipoCliente: 'FLOTILLA', comeback: false,
      fechaEntrada: d(2026,5,28), fechaPromesa: d(2026,5,31),
      tecnicos: [{ tecnicoId: 2, posicion: 1, horas: 10 }, { tecnicoId: 5, posicion: 2, horas: 8 }],
      // HrsCalc: 35 hrs — avance: 25 hrs (casi terminado)
      avance: 25,
    },
    {
      numero: 'VH-2310', unidad: 'Chevrolet Tahoe 2022', precio: 11000,
      tipoCliente: 'FLOTILLA', comeback: false,
      fechaEntrada: d(2026,5,28), fechaPromesa: d(2026,5,31),
      tecnicos: [{ tecnicoId: 6, posicion: 1, horas: 8 }, { tecnicoId: 2, posicion: 2, horas: 4 }],
      // HrsCalc: 22 hrs — avance: 15 hrs
      avance: 15,
    },
    {
      numero: 'VH-2311', unidad: 'VW Jetta 2023', precio: 5000,
      tipoCliente: 'PARTICULAR', comeback: false,
      fechaEntrada: d(2026,5,29), fechaPromesa: d(2026,5,31),
      tecnicos: [{ tecnicoId: 4, posicion: 1, horas: 6 }],
      // HrsCalc: 10 hrs — avance: 7 hrs
      avance: 7,
    },
  ]

  // Avances: 30+25+15+7 = 77 hrs → Total producidas: 180+77 = 257 hrs (90.2%)

  for (const ot of enProceso) {
    const { tecnicos: tecs, avance, ...otData } = ot
    const created = await p.oT.create({
      data: {
        ...otData,
        precio: otData.precio,
        tipoCliente: otData.tipoCliente as 'PARTICULAR' | 'FLOTILLA',
        estado: 'EN_PROCESO',
        tecnicos: { create: tecs },
      },
    })
    await p.avanceSemanal.create({
      data: { otId: created.id, semanaInicio, horasInvertidas: avance },
    })
    process.stdout.write('.')
  }

  console.log(`\n  ${enProceso.length} OTs en proceso + avances cargados`)
  console.log('  Avances: 30+25+15+7 = 77 hrs')

  // ── Resumen ──────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════')
  console.log('Semana: 25-31 May 2026')
  console.log('Capacidad total: 285 hrs (6 techs × 47.5)')
  console.log('Hrs cerradas:    180 hrs  (ventas: $90,000)')
  console.log('Hrs en proceso:   77 hrs  (avance semanal)')
  console.log('Hrs producidas:  257 hrs')
  console.log('Eficiencia:      90.2%')
  console.log('Comebacks:       1 (VH-2307) → tasa 12.5%')
  console.log('A tiempo:        7/8 → 87.5%')
  console.log('══════════════════════════════════════════════════')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => p.$disconnect())
