import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    mensaje: "API funcionando correctamente"
  });
});

export default router;