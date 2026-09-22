import {createCase, findAllCasesByUser, findCaseById, updateCase, deleteCase, findCaseByIdOnly} from "../repositories/case.repository.js";
import {CreateCaseDTO,UpdateCaseDTO} from "../types/case.types.js";
import { AppError } from "../errors/app.error.js";
export const crearCaso = async (data: CreateCaseDTO,userId: string) => {
  return createCase(
    data.titulo,
    data.descripcion,
    userId
  );
};

export const listarCasos = async (userId: string) => {
  return findAllCasesByUser(userId);
};

export const obtenerCaso = async (id: string, userId: string) => {
  const caso = await findCaseByIdOnly(id);
  if (!caso) {
    throw new AppError("Caso no encontrado",404);
  }

  if (caso.userId !== userId) {
    throw new AppError("No tienes permisos para acceder a este caso",403);
  }

  return caso;
};

export const actualizarCaso = async (id: string,data: UpdateCaseDTO,userId: string) => {
  await obtenerCaso(id, userId);
  await updateCase(id,userId,data);
  return obtenerCaso(id, userId);
};

export const eliminarCaso = async (id: string,userId: string) => {
  await obtenerCaso(id, userId);
  await deleteCase(id, userId);
};