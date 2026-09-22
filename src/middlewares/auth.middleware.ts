import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app.error.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado");
}

interface TokenPayload {
  userId: string;
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AppError(
      "Token de autenticación requerido",
      401
    );
  }

  const [tipo, token] = authorization.split(" ");

  if (tipo !== "Bearer" || !token) {
    throw new AppError(
      "Formato de token inválido",
      401
    );
  }

  try {
    const payload = jwt.verify(
      token,
      JWT_SECRET
    ) as TokenPayload;

    req.userId = payload.userId;

    next();

  } catch {
    throw new AppError(
      "Token inválido o expirado",
      401
    );
  }
};