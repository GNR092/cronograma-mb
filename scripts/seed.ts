import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tasks = [
  {
    id: "1785271852809",
    name: "Sistema Comisiones",
    startDate: "2026-07-24",
    duration: 15,
    notes: "Programa pedido por la Lic. Guadalupe Medina",
  },
  {
    id: "1785271991977",
    name: "Notas de Credito",
    startDate: "2026-07-24",
    duration: 32,
    notes: "Mejora del Sistema de notas de Credito\nCarlos Novelo",
  },
  {
    id: "1785272949895",
    name: "Facturacion Y pagos",
    startDate: "2026-07-27",
    duration: 20,
    notes: "Sistema de facturacion y pagos \nDavid sosa",
  },
  {
    id: "1785273049011",
    name: "Invesionistas ",
    startDate: "2026-08-10",
    duration: 5,
    notes: "Prueba pilotos de veficacion de facturas en el nuevo sistemas de Invesionistas.\nEmilio Fuente",
  },
  {
    id: "1785273265329",
    name: "Verificacion de Bot",
    startDate: "2026-08-17",
    duration: 5,
    notes: "Detalles en el bot de WhatsApp por verificar en el programa mbpropertymanagement (sistemas de tickets de complejos).\nYestel \n",
  },
  {
    id: "1785274108132",
    name: "Monitoreo de Bot",
    startDate: "2026-08-01",
    duration: 31,
    notes: "Monitoreo de como va funcionando el bot de whatsApp de Campus Residencias, en cuestiones de Funcionalidad para los estudiantes y tutores. (solo es monitoreo)",
  },
  {
    id: "1785274197957",
    name: "Sistema RH",
    startDate: "2026-08-03",
    duration: 1,
    notes: "En espera de liberacion de programa por parte de Recursos Humanos.",
  },
  {
    id: "1785274222459",
    name: "Compras",
    startDate: "2026-08-03",
    duration: 17,
    notes: "Actualizacion y mejoras en el sistema de compras",
  },
];

async function main() {
  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: task,
      create: task,
    });
  }
  console.log(`Seeded ${tasks.length} tasks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
