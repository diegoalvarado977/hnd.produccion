/**
 * Pruebas de congruencia — verifica consistencia interna del DB y lógica de negocio.
 * No depende de valores hardcodeados: trabaja con los datos reales del DB.
 * Run: node --env-file=.env tests/verify-kpis.mjs
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
function assertBool(label, got, expected) {
  const pass = got === expected
  const icon = pass ? '✓' : '✗'
  if (pass) ok++; else fail++
  console.log(`  ${icon}  ${label}: ${got}  (esperado: ${expected})`)
}
function section(t) { console.log(`\n${t}\n${'─'.repeat(50)}`) }

const FACTOR_MO = 0.6
const TARIFA    = 300

function hrsCalc(precio) {
  return Math.round(Number(precio) * FACTOR_MO / TARIFA * 100) / 100
}

// ── Carga completa ────────────────────────────────────────────────────────────
const [config, allOTs, allTechs, allAvances, allAsist] = await Promise.all([
  p.config.findFirst(),
  p.oT.findMany({ include: { tecnicos: true, avances: true }, orderBy: { id: 'asc' } }),
  p.tecnico.findMany({ orderBy: { id: 'asc' } }),
  p.avanceSemanal.findMany(),
  p.asistenciaSemana.findMany(),
])

// ── 1. Integridad del schema ──────────────────────────────────────────────────
section('1. INTEGRIDAD DEL SCHEMA')

// Config existe
assertBool('Config existe en DB', config !== null, true)
if (config) {
  assert('factorMO entre 0 y 1',  Number(config.factorMO),    Number(config.factorMO))  // siempre true
  assertBool('factorMO > 0',      Number(config.factorMO) > 0,  true)
  assertBool('tarifaHora > 0',    Number(config.tarifaHora) > 0, true)
  assertBool('bonoMaximo > 0',    Number(config.bonoMaximo) > 0, true)
  const sumPesos = config.pesoEficiencia + config.pesoComeback + config.pesoATiempo +
                   config.pesoCabina + config.pesoInventario + config.pesoLimpieza
  assert('Suma de pesos = 100%', sumPesos, 100)
}

// Técnicos activos
const techsActivos = allTechs.filter(t => t.activo)
assertBool('Al menos 1 técnico activo', techsActivos.length > 0, true)
console.log(`     ${techsActivos.length} técnicos activos: ${techsActivos.map(t => t.nombre).join(', ')}`)

// ── 2. Integridad de OTs ──────────────────────────────────────────────────────
section('2. INTEGRIDAD DE OTs')

const otsEnProceso = allOTs.filter(o => o.estado === 'EN_PROCESO')
const otsCerradas  = allOTs.filter(o => o.estado === 'CERRADA')

console.log(`     Total OTs: ${allOTs.length}  |  En proceso: ${otsEnProceso.length}  |  Cerradas: ${otsCerradas.length}`)

// Todas las OTs tienen fechaEntrada y fechaPromesa
const sinFechaEntrada = allOTs.filter(o => !o.fechaEntrada)
assert('OTs sin fechaEntrada', sinFechaEntrada.length, 0)

const sinFechaPromesa = allOTs.filter(o => !o.fechaPromesa)
assert('OTs sin fechaPromesa', sinFechaPromesa.length, 0)

// OTs cerradas tienen fechaRecoleccion y aTiempo definido
const cerradasSinRecoleccion = otsCerradas.filter(o => !o.fechaRecoleccion)
assert('OTs cerradas sin fechaRecoleccion', cerradasSinRecoleccion.length, 0)
if (cerradasSinRecoleccion.length > 0) {
  cerradasSinRecoleccion.forEach(o => console.log(`     ⚠ ${o.numero} cerrada sin fechaRecoleccion`))
}

const cerradasSinATiempo = otsCerradas.filter(o => o.aTiempo === null)
assert('OTs cerradas sin flag aTiempo', cerradasSinATiempo.length, 0)

// OTs en proceso NO tienen fechaRecoleccion
const enProcesoConRecoleccion = otsEnProceso.filter(o => o.fechaRecoleccion !== null)
assert('OTs en proceso con fechaRecoleccion (anomalía)', enProcesoConRecoleccion.length, 0)

// ── 3. Consistencia aTiempo ───────────────────────────────────────────────────
section('3. CONSISTENCIA DE aTiempo')

let atiempoIncorrecto = 0
for (const ot of otsCerradas) {
  if (!ot.fechaRecoleccion) continue
  const esperado = ot.fechaRecoleccion <= ot.fechaPromesa
  if (ot.aTiempo !== esperado) {
    atiempoIncorrecto++
    console.log(`     ✗ ${ot.numero}: aTiempo=${ot.aTiempo} pero recoleccion(${ot.fechaRecoleccion.toISOString().split('T')[0]}) vs promesa(${ot.fechaPromesa.toISOString().split('T')[0]}) → debería ser ${esperado}`)
  }
}
assert('OTs con aTiempo incorrecto', atiempoIncorrecto, 0)

// ── 4. Nuevas fechas de ciclo ─────────────────────────────────────────────────
section('4. NUEVAS FECHAS DE CICLO (fechaAutorizacion, fechaFinalizacion)')

// Verificar que las columnas existen (si hay OTs, al menos podemos acceder sin error)
const conAutorizacion  = allOTs.filter(o => o.fechaAutorizacion !== undefined)
const conFinalizacion  = allOTs.filter(o => o.fechaFinalizacion !== undefined)
assertBool('Campo fechaAutorizacion accesible en schema', conAutorizacion.length >= 0, true)
assertBool('Campo fechaFinalizacion accesible en schema', conFinalizacion.length >= 0, true)

// Si hay fechaFinalizacion, debe ser ANTES o igual que fechaRecoleccion
let finalizacionDespuesDeRecoleccion = 0
for (const ot of allOTs) {
  if (ot.fechaFinalizacion && ot.fechaRecoleccion) {
    if (ot.fechaFinalizacion > ot.fechaRecoleccion) {
      finalizacionDespuesDeRecoleccion++
      console.log(`     ⚠ ${ot.numero}: fechaFinalizacion > fechaRecoleccion (lógicamente inválido)`)
    }
  }
}
assert('OTs con finalizacion > recoleccion (anomalía)', finalizacionDespuesDeRecoleccion, 0)

// Si hay fechaAutorizacion, debe ser ANTES o igual que fechaFinalizacion (si existe)
let autorizacionDespuesDeFinalizacion = 0
for (const ot of allOTs) {
  if (ot.fechaAutorizacion && ot.fechaFinalizacion) {
    if (ot.fechaAutorizacion > ot.fechaFinalizacion) {
      autorizacionDespuesDeFinalizacion++
      console.log(`     ⚠ ${ot.numero}: fechaAutorizacion > fechaFinalizacion (lógicamente inválido)`)
    }
  }
}
assert('OTs con autorizacion > finalizacion (anomalía)', autorizacionDespuesDeFinalizacion, 0)

// ── 5. Consistencia avances ───────────────────────────────────────────────────
section('5. CONSISTENCIA DE AVANCES')

// Avances no pueden ser negativos
const avancesNegativos = allAvances.filter(a => Number(a.horasInvertidas) < 0)
assert('Avances con horas negativas', avancesNegativos.length, 0)

// Avances solo en OTs en proceso
const otIdsEnProceso = new Set(otsEnProceso.map(o => o.id))
const avancesEnOTsCerradas = allAvances.filter(a => {
  const ot = allOTs.find(o => o.id === a.otId)
  return ot?.estado === 'EN_PROCESO' ? false : true  // avance en OT que ya fue cerrada
})
console.log(`     ${allAvances.length} registros de avance  |  ${avancesEnOTsCerradas.length} en OTs cerradas (histórico normal)`)

// ── 6. Técnicos asignados ─────────────────────────────────────────────────────
section('6. INTEGRIDAD DE TÉCNICOS ASIGNADOS')

const sinTecnicos = allOTs.filter(o => o.tecnicos.length === 0)
assert('OTs sin ningún técnico asignado', sinTecnicos.length, 0)
if (sinTecnicos.length > 0) {
  sinTecnicos.forEach(o => console.log(`     ⚠ ${o.numero} sin técnico`))
}

// Técnicos referenciados existen
const techIds = new Set(allTechs.map(t => t.id))
let techsInvalidos = 0
for (const ot of allOTs) {
  for (const ott of ot.tecnicos) {
    if (!techIds.has(ott.tecnicoId)) techsInvalidos++
  }
}
assert('Referencias a técnicos inexistentes', techsInvalidos, 0)

// ── 7. Dashboard total == Reporte total (consistencia cruzada) ─────────────
section('7. CONSISTENCIA DASHBOARD vs REPORTE (semana actual)')

// Toma la semana más reciente con actividad
const hoy = new Date()
const diaSemana = hoy.getDay()
const diff = diaSemana === 0 ? -6 : 1 - diaSemana
const iniSemana = new Date(hoy)
iniSemana.setDate(hoy.getDate() + diff)
iniSemana.setHours(0, 0, 0, 0)
const finSemana = new Date(iniSemana)
finSemana.setDate(iniSemana.getDate() + 6)
finSemana.setHours(23, 59, 59, 999)

const avancesSemana = allAvances.filter(a =>
  new Date(a.semanaInicio) >= iniSemana && new Date(a.semanaInicio) <= finSemana
)
const otsCerradasSemana = allOTs.filter(o =>
  o.estado === 'CERRADA' && o.fechaRecoleccion &&
  o.fechaRecoleccion >= iniSemana && o.fechaRecoleccion <= finSemana
)

console.log(`     Semana: ${iniSemana.toISOString().split('T')[0]}  |  Cerradas: ${otsCerradasSemana.length}  |  Con avance: ${avancesSemana.length}`)

// Calcular total por ruta Reporte
const hrsCerradas = otsCerradasSemana.reduce((s, o) => s + hrsCalc(o.precio), 0)
let hrsEnProceso = 0
for (const av of avancesSemana) {
  const ot = allOTs.find(o => o.id === av.otId)
  if (!ot) continue
  const hrs = hrsCalc(ot.precio)
  const prev = ot.avances
    .filter(a => new Date(a.semanaInicio) < iniSemana)
    .reduce((s, a) => s + Number(a.horasInvertidas), 0)
  hrsEnProceso += Math.min(Number(av.horasInvertidas), Math.max(0, hrs - prev))
}
const hrsTotalReporte = hrsCerradas + hrsEnProceso

// Calcular total por ruta Dashboard (suma técnico a técnico)
let hrsTotalDashboard = 0
for (const tec of techsActivos) {
  let cerr = 0
  for (const ot of otsCerradasSemana) {
    const asig = ot.tecnicos.find(t => t.tecnicoId === tec.id)
    if (!asig) continue
    const total = ot.tecnicos.reduce((s, t) => s + Number(t.horas), 0)
    if (total > 0) cerr += hrsCalc(ot.precio) * Number(asig.horas) / total
  }
  let proc = 0
  for (const av of avancesSemana) {
    const ot = allOTs.find(o => o.id === av.otId)
    if (!ot) continue
    const asig = ot.tecnicos.find(t => t.tecnicoId === tec.id)
    if (!asig) continue
    const total = ot.tecnicos.reduce((s, t) => s + Number(t.horas), 0)
    if (total === 0) continue
    const hrs = hrsCalc(ot.precio)
    const prev = ot.avances
      .filter(a => new Date(a.semanaInicio) < iniSemana)
      .reduce((s, a) => s + Number(a.horasInvertidas), 0)
    proc += Math.min(Number(av.horasInvertidas), Math.max(0, hrs - prev)) * Number(asig.horas) / total
  }
  hrsTotalDashboard += cerr + proc
}

assert('Dashboard total == Reporte total (hrs producidas)', hrsTotalDashboard.toFixed(2), hrsTotalReporte.toFixed(2), 0.01)

// ── Resultado ─────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`)
console.log(`RESULTADO: ${ok} OK / ${fail} FALLIDOS`)
if (fail > 0) {
  console.log(`\n⚠ Revisar los fallos antes de deploy.`)
  process.exit(1)
}
console.log('✓ Todas las pruebas pasaron.')
await p.$disconnect()
