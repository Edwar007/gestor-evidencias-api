import { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";

import { AppError } from "../errors/app.error.js";

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {

  if (error instanceof ZodError) {
    return res.status(400).json({
      mensaje: "Error de validación",
      errores: error.issues
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      mensaje: error.message
    });
  }

  console.error(error);

  return res.status(500).json({
    mensaje: "Error interno del servidor"
  });
};