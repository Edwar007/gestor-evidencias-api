import "dotenv/config";
import app from "./app.js";

const PUERTO = Number(process.env.PUERTO) || 3000;

app.listen(PUERTO, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PUERTO}`);
});