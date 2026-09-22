import prisma from "../../src/lib/prisma.js";

export const limpiarBaseDeDatos = async () => {
  await prisma.caso.deleteMany();
  await prisma.user.deleteMany();
};