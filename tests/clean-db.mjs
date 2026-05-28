/**
 * Limpia todos los datos operativos
 * Conserva: Config + Técnicos
 */
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

console.log('Limpiando base de datos...')
await p.avanceSemanal.deleteMany()
await p.oTTecnico.deleteMany()
await p.oT.deleteMany()
await p.asistenciaSemana.deleteMany()
await p.evaluacionManual.deleteMany()

const [ots, avances, asist, eval_, tecs, cfg] = await Promise.all([
  p.oT.count(), p.avanceSemanal.count(), p.asistenciaSemana.count(),
  p.evaluacionManual.count(), p.tecnico.count(), p.config.count(),
])

console.log('\n=== Estado final ===')
console.log(`  OTs:           ${ots}   ← limpio`)
console.log(`  Avances:       ${avances}   ← limpio`)
console.log(`  Asistencias:   ${asist}   ← limpio`)
console.log(`  Evaluaciones:  ${eval_}   ← limpio`)
console.log(`  Técnicos:      ${tecs}   ← conservado`)
console.log(`  Config:        ${cfg}   ← conservado`)
console.log('\n✓ Listo para producción')
await p.$disconnect()
