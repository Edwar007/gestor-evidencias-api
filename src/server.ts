import "dotenv/config";
import app from "./app.js";
import prisma from "./lib/prisma.js";

const PUERTO = Number(process.env.PUERTO) || 3000;

app.listen(PUERTO, async () => {
  try {
    await prisma.$connect();
    console.log("Conexión con PostgreSQL establecida");
    console.log(`Servidor ejecutándose en http://localhost:${PUERTO}`);
  } catch (error) {
    console.error("Error conectando con PostgreSQL:", error);
  }
});