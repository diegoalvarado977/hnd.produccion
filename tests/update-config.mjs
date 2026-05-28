import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const c = await p.config.update({
  where: { id: 1 },
  data: { comebackPiso: 0.05, comebackTecho: 0.25 }
})
console.log('✓ Config actualizado:  comebackPiso =', String(c.comebackPiso), '  comebackTecho =', String(c.comebackTecho))
await p.$disconnect()
