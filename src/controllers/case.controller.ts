import { Request, Response } from "express";
import { crearCaso, listarCasos, obtenerCaso, actualizarCaso, eliminarCaso} from "../services/case.service.js";
import { CreateCaseDTO, UpdateCaseDTO} from "../types/case.types.js";

export const crear = async ( req: Request<{}, {}, CreateCaseDTO>, res: Response) => {
  const caso = await crearCaso(
    req.body,
    req.userId!
  );

  res.status(201).json(caso);
};

export const listar = async (req: Request,res: Response) => {
  const casos = await listarCasos(
    req.userId!
  );

  res.status(200).json(casos);
};

export const obtener = async ( req: Request<{ id: string }>, res: Response) => {
  const caso = await obtenerCaso(
    req.params.id,
    req.userId!
  );

  res.status(200).json(caso);
};

export const actualizar = async (req: Request<{ id: string }, {}, UpdateCaseDTO>, res: Response) => {
  const caso = await actualizarCaso(
    req.params.id,
    req.body,
    req.userId!
  );

  res.status(200).json(caso);
};

export const eliminar = async ( req: Request<{ id: string }>, res: Response) => {
  await eliminarCaso(
    req.params.id,
    req.userId!
  );

  res.status(204).send();
};