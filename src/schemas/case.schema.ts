import { z } from "zod";

export const createCaseSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es obligatorio")
    .max(150, "El título no puede superar los 150 caracteres"),

  descripcion: z
    .string()
    .min(1, "La descripción es obligatoria")
    .max(2000, "La descripción no puede superar los 2000 caracteres")
});

export const updateCaseSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es obligatorio")
    .max(150, "El título no puede superar los 150 caracteres")
    .optional(),

  descripcion: z
    .string()
    .min(1, "La descripción es obligatoria")
    .max(2000, "La descripción no puede superar los 2000 caracteres")
    .optional(),

  estado: z
    .enum(["OPEN", "CLOSED"])
    .optional()
});

export const uploadFileSchema = z.object({
  fileName: z
    .string()
    .min(1, "El nombre del archivo es obligatorio")
    .max(255, "El nombre del archivo es demasiado largo"),

  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "application/pdf"
  ])
});

export const completeFileSchema = z.object({
  key: z
    .string()
    .min(1, "La clave del archivo es obligatoria")
});