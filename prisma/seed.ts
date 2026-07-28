import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.task.deleteMany()

  await prisma.task.createMany({
    data: [
      { name: 'Sistema Comisiones',   startDate: '2026-07-24', duration: 15, notes: 'Programa pedido por la Lic. Guadalupe Medina' },
      { name: 'Notas de Credito',     startDate: '2026-07-24', duration: 32, notes: 'Mejora del Sistema de notas de Credito\nCarlos Novelo' },
      { name: 'Facturacion Y pagos',  startDate: '2026-07-27', duration: 20, notes: 'Sistema de facturacion y pagos \nDavid sosa' },
      { name: 'Invesionistas',        startDate: '2026-08-10', duration:  5, notes: 'Prueba pilotos de veficacion de facturas en el nuevo sistemas de Invesionistas.\nEmilio Fuente' },
      { name: 'Verificacion de Bot',  startDate: '2026-08-17', duration:  5, notes: 'Detalles en el bot de WhatsApp por verificar en el sistema de tickets de complejos.\nYestel' },
      { name: 'Monitoreo de Bot',     startDate: '2026-08-01', duration: 31, notes: 'Monitoreo de como va funcionando el bot de whatsApp para los estudiantes y tutores. (solo es monitoreo)' },
      { name: 'Sistema RH',           startDate: '2026-08-03', duration:  1, notes: 'En espera de liberacion de programa por parte de Recursos Humanos.' },
      { name: 'Compras',              startDate: '2026-08-03', duration: 17, notes: 'Actualizacion y mejoras en el sistema de compras' },
    ],
  })

  console.log('✓ 8 tareas importadas correctamente.')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
