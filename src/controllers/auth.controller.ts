import { Request, Response } from "express";
import { registrarUsuarioService } from "../services/auth.service.js";
import { CreateUserDTO,UserDTO} from "../types/auth.types.js";

export const registrarUsuarioController = async (req: Request<{}, UserDTO, CreateUserDTO>, res: Response) => {
  const data = req.body;
  const usuario = await registrarUsuarioService(data);

  res.status(201).json(usuario);
};