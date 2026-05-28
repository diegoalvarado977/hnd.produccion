/**
 * Pruebas de congruencia — semana 25-31 may 2026
 * Verifica KPIs del Reporte vs Dashboard vs datos crudos
 */
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()
let ok = 0, fail = 0

function assert(label, got, expected, tol = 0.05) {
  const pass = Math.abs(Number(got) - Number(expected)) <= tol
  const icon = pass ? '✓' : '✗'
  if (pass) ok++; else fail++
  console.log(`  ${icon}  ${label}: ${got}  (esperado: ${expected})`)
}
function section(t) { console.log(`\n${t}\n${'─'.repeat(50)}`) }

const FACTOR_MO  = 0.6
const TARIFA     = 300
const SEMANA_INI = new Date('2026-05-25T00:00:00')
const SEMANA_FIN = new Date('2026-05-31T23:59:59')
const AVANCE_INI = new Date('2026-05-25T00:00:00')
const AVANCE_FIN = new Date('2026-05-25T23:59:59')
const CAP_MAX    = 47.5

// ── Carga de datos ────────────────────────────────────────────────────────────
const [config, allOTs, avances, asist, techs] = await Promise.all([
  p.config.findFirst(),
  p.oT.findMany({ include: { tecnicos: true, avances: true } }),
  p.avanceSemanal.findMany({ where: { semanaInicio: { gte: AVANCE_INI, lte: AVANCE_FIN } } }),
  p.asistenciaSemana.findMany({ where: { semanaInicio: { gte: AVANCE_INI, lte: AVANCE_FIN } } }),
  p.tecnico.findMany({ where: { activo: true } }),
])

const otsRecibidas  = allOTs.filter(o => o.fechaEntrada >= SEMANA_INI && o.fechaEntrada <= SEMANA_FIN)
const otsCerradas   = allOTs.filter(o => o.estado === 'CERRADA' && o.fechaEntrega >= SEMANA_INI && o.fechaEntrega <= SEMANA_FIN)
const comebacksOTs  = otsRecibidas.filter(o => o.comeback)

section('1. CONTEOS BÁSICOS')
assert('OTs recibidas',  otsRecibidas.length,  9)  // 5 cerradas + 4 en proceso entraron esta semana
assert('OTs cerradas',   otsCerradas.length,   8)
assert('Comebacks',      comebacksOTs.length,  1)

const ventas = otsCerradas.reduce((s, o) => s + Number(o.precio), 0)
assert('Ventas totales', ventas, 90000)

section('2. TASAS')
const tasaCB = comebacksOTs.length / otsCerradas.length
const otsAT  = otsCerradas.filter(o => o.aTiempo).length
const tasaAT = otsAT / otsCerradas.length
assert('Tasa Comeback %',  (tasaCB * 100).toFixed(1),  12.5)
assert('OTs A Tiempo',     otsAT,                       7)
assert('Tasa A Tiempo %',  (tasaAT * 100).toFixed(1),  87.5)

section('3. HORAS CALCULADAS (cerradas)')
const hrsCalcFn = (precio) => Math.round(Number(precio) * FACTOR_MO / TARIFA * 100) / 100
const hrsCerradas = otsCerradas.reduce((s, o) => s + hrsCalcFn(o.precio), 0)
assert('Hrs cerradas total', hrsCerradas.toFixed(1), 180.0)

// Detalle por OT cerrada
for (const ot of otsCerradas.sort((a,b) => a.numero.localeCompare(b.numero))) {
  console.log(`     ${ot.numero}: $${Number(ot.precio).toLocaleString()} → ${hrsCalcFn(ot.precio)} hrs  A tiempo: ${ot.aTiempo ? '✓' : '✗'}`)
}

section('4. HORAS EN PROCESO (avance semanal con cap)')
let hrsEnProceso = 0
for (const av of avances) {
  const ot = allOTs.find(o => o.id === av.otId)
  if (!ot) continue
  const hrsCalc = hrsCalcFn(ot.precio)
  const prevContadas = ot.avances
    .filter(a => new Date(a.semanaInicio) < AVANCE_INI)
    .reduce((s, a) => s + Number(a.horasInvertidas), 0)
  const capped = Math.min(Number(av.horasInvertidas), Math.max(0, hrsCalc - prevContadas))
  hrsEnProceso += capped
  console.log(`     ${ot.numero}: HrsCalc=${hrsCalc}  PrevContadas=${prevContadas}  Avance=${av.horasInvertidas}  Capped=${capped.toFixed(1)}`)
}
assert('Hrs en proceso total', hrsEnProceso.toFixed(0), 77)

section('5. EFICIENCIA')
const hrsProd = hrsCerradas + hrsEnProceso
const capacidad = asist.length > 0
  ? asist.reduce((s, a) => s + (a.lunes?8.5:0)+(a.martes?8.5:0)+(a.miercoles?8.5:0)+(a.jueves?8.5:0)+(a.viernes?8.5:0)+(a.sabado?5:0), 0)
  : techs.length * CAP_MAX
assert('Hrs producidas',  hrsProd.toFixed(1), 257.0)
assert('Capacidad total', capacidad.toFixed(1), 285.0)
assert('Eficiencia %',   (hrsProd / capacidad * 100).toFixed(1), 90.2, 0.2)

section('6. PUNTAJES BONO')
const ptEfic = Math.max(0, Math.min(100, Math.round((hrsProd/capacidad - 0.40) / (0.75 - 0.40) * 1000) / 10))
const ptCB   = Math.max(0, Math.min(100, Math.round((1 - tasaCB / 0.10) * 1000) / 10))
const ptAT   = Math.max(0, Math.min(100, Math.round((tasaAT - 0.55) / (0.85 - 0.55) * 1000) / 10))
assert('Puntaje Eficiencia (0-100)', ptEfic, 100)
assert('Puntaje Comeback  (0-100)', ptCB,   0)    // 12.5% > 10% → 0
assert('Puntaje A Tiempo  (0-100)', ptAT,   100)  // 87.5% > 85% → 100

section('7. DASHBOARD — suma de horas por técnico vs total reporte')
let totalDash = 0
for (const tec of techs.sort((a,b) => a.nombre.localeCompare(b.nombre))) {
  let hrsCerr = 0
  for (const ot of otsCerradas) {
    const asig = ot.tecnicos.find(t => t.tecnicoId === tec.id)
    if (!asig) continue
    const total = ot.tecnicos.reduce((s, t) => s + Number(t.horas), 0)
    hrsCerr += hrsCalcFn(ot.precio) * Number(asig.horas) / total
  }
  let hrsPrx = 0
  for (const av of avances) {
    const ot = allOTs.find(o => o.id === av.otId)
    if (!ot) continue
    const asig = ot.tecnicos.find(t => t.tecnicoId === tec.id)
    if (!asig) continue
    const total = ot.tecnicos.reduce((s, t) => s + Number(t.horas), 0)
    const hrsCalc = hrsCalcFn(ot.precio)
    const prev = ot.avances.filter(a => new Date(a.semanaInicio) < AVANCE_INI).reduce((s,a) => s+Number(a.horasInvertidas), 0)
    const cap  = Math.min(Number(av.horasInvertidas), Math.max(0, hrsCalc - prev))
    hrsPrx += cap * Number(asig.horas) / total
  }
  const hrsT = hrsCerr + hrsPrx
  totalDash += hrsT
  console.log(`     ${tec.nombre.padEnd(14)} cerradas=${hrsCerr.toFixed(1).padStart(5)}  proceso=${hrsPrx.toFixed(1).padStart(5)}  TOTAL=${hrsT.toFixed(1).padStart(6)}`)
}
assert('Dashboard total == Reporte total', totalDash.toFixed(1), hrsProd.toFixed(1), 0.1)

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`)
console.log(`RESULTADO: ${ok} OK / ${fail} FALLIDOS`)
await p.$disconnect()
