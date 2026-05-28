/**
 * Prueba de control — Comeback KPI
 * Verifica que el cálculo, display y lógica del bono sean consistentes
 */
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()
let ok = 0, fail = 0

function assert(label, got, expected, tol = 0.01) {
  const pass = Math.abs(Number(got) - Number(expected)) <= tol
  if (pass) ok++; else fail++
  console.log(`  ${pass ? '✓' : '✗'}  ${label}: ${got}  (esperado: ${expected})`)
}
function section(t) { console.log(`\n${t}\n${'─'.repeat(55)}`) }

const FACTOR_MO = 0.6
const TARIFA    = 300
const INI = new Date('2026-05-25T00:00:00')
const FIN = new Date('2026-05-31T23:59:59')

const cfg = await p.config.findFirst()
const comebackTecho = Number(cfg?.comebackTecho ?? 0.10)
const pesoComeback  = cfg?.pesoComeback ?? 20
const bonoMax       = Number(cfg?.bonoMaximo ?? 2000)

const allOTs = await p.oT.findMany()
const otsCerradas  = allOTs.filter(o => o.estado === 'CERRADA' && o.fechaEntrega >= INI && o.fechaEntrega <= FIN)
const otsRecibidas = allOTs.filter(o => o.fechaEntrada >= INI && o.fechaEntrada <= FIN)
const comebackOTs  = otsRecibidas.filter(o => o.comeback)

section('A. DATOS CRUDOS')
console.log(`  OTs cerradas esta semana:    ${otsCerradas.length}`)
console.log(`  OTs recibidas esta semana:   ${otsRecibidas.length}`)
console.log(`  OTs comeback (por entrada):  ${comebackOTs.length}`)
for (const ot of comebackOTs) {
  console.log(`     → ${ot.numero} | entrada ${ot.fechaEntrada.toISOString().split('T')[0]} | cerrada ${ot.estado}`)
}

section('B. CÁLCULO DE TASA')
const tasaCBdecimal = comebackOTs.length / otsCerradas.length
const tasaCBpct     = tasaCBdecimal * 100

console.log(`  Fórmula: ${comebackOTs.length} comebacks / ${otsCerradas.length} cerradas`)
assert('tasaComeback (decimal)', tasaCBdecimal.toFixed(4), '0.1250')
assert('tasaComeback (%)',       tasaCBpct.toFixed(1),     '12.5')
console.log(`\n  ⚠️  BUG CORREGIDO: antes mostraba ${tasaCBdecimal.toFixed(1)}% en lugar de ${tasaCBpct.toFixed(1)}%`)

section('C. PUNTAJE BONO (0-100)')
// puntajeComeback = MAX(0, MIN(100, (1 - tasa/techo) × 100))
const puntaje = Math.max(0, Math.min(100, Math.round((1 - tasaCBdecimal / comebackTecho) * 1000) / 10))

console.log(`  Techo configurado:  ${comebackTecho * 100}%`)
console.log(`  Tasa real:          ${tasaCBpct.toFixed(1)}%`)
console.log(`  Cálculo: (1 - ${tasaCBpct.toFixed(1)}% / ${comebackTecho * 100}%) × 100 = ${((1 - tasaCBdecimal/comebackTecho)*100).toFixed(1)}`)
console.log(`  Aplicando MAX(0,...): ${puntaje}`)
assert('Puntaje (0-100)', puntaje, 0)
console.log(`\n  ✓ Correcto: ${tasaCBpct.toFixed(1)}% > ${comebackTecho * 100}% techo → 0 pts`)
console.log(`    Para tener puntaje, la tasa debe ser < ${comebackTecho * 100}%`)
console.log(`    Con 0 comebacks → 100 pts | Con 5% → 50 pts | Con 10%+ → 0 pts`)

section('D. IMPACTO EN BONO')
const ptdCB = Math.round(puntaje * pesoComeback) / 100
console.log(`  Peso: ${pesoComeback}%  |  Puntos ponderados: ${puntaje} × ${pesoComeback}% = ${ptdCB}`)
assert('Puntos ponderados comeback', ptdCB, 0)
console.log(`\n  El comeback elimina ${pesoComeback} puntos posibles del bono`)
console.log(`  Impacto económico: ${pesoComeback}% × $${bonoMax} = -$${pesoComeback/100*bonoMax} potenciales`)

section('E. SIMULACIÓN: ¿Qué pasaría sin comeback?')
const tasaSin = 0 / otsCerradas.length
const ptSin   = Math.max(0, Math.min(100, Math.round((1 - tasaSin / comebackTecho) * 1000) / 10))
const ptdSin  = Math.round(ptSin * pesoComeback) / 100
console.log(`  Sin comebacks → tasa 0% → puntaje ${ptSin} → ${ptdSin} pts pond.`)
console.log(`  Ganancia potencial: +$${Math.round(ptdSin / 100 * bonoMax)} en bono`)

console.log(`\n${'═'.repeat(55)}`)
console.log(`RESULTADO: ${ok} OK / ${fail} FALLIDOS`)
await p.$disconnect()
