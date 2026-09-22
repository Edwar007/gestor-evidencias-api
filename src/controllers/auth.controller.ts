import { Request, Response } from "express";
import { registrarUsuarioService, iniciarSesionService, obtenerUsuAutService} from "../services/auth.service.js";
import {  CreateUserDTO,  UserDTO} from "../types/auth.types.js";

export const registrarController = async (req: Request<{}, UserDTO, CreateUserDTO>,res: Response) => {
  const data = req.body;
  const usuario = await registrarUsuarioService(data);
  res.status(201).json(usuario);
};

export const loginController = async (req: Request<{}, {}, CreateUserDTO>,res: Response) => {
  const data = req.body;
  const resultado = await iniciarSesionService(data);
  res.status(200).json(resultado);
};

export const obtenerMe = async (req: Request, res: Response) => {
  const usuario = await obtenerUsuAutService(req.userId!);
  res.status(200).json(usuario);
};