import express from "express";

const app = express();

app.use(express.json());

app.get("/salud", (_solicitud, respuesta) => {
  respuesta.status(200).json({
    mensaje: "API funcionando correctamente"
  });
});

export default app;