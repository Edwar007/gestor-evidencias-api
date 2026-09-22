import bcrypt from "bcryptjs";
import {createUser,findUserByEmail,findUserById} from "../repositories/user.repository.js";
import { CreateUserDTO } from "../types/auth.types.js";
import { AppError } from "../errors/app.error.js";
import { generarToken } from "../lib/jwt.js";

export const registrarUsuarioService = async ({email,password}: CreateUserDTO) => {
  const usuarioExistente = await findUserByEmail(email);
  if (usuarioExistente) {
    throw new AppError("El correo electrónico ya está registrado",409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return createUser(email, passwordHash);
};

export const obtenerUsuAutService = async (userId: string) => {
  const usuario = await findUserById(userId);
  if (!usuario) {
    throw new AppError("Usuario no encontrado",404);
  }
  return usuario;
};

export const iniciarSesionService = async ({email,password}: CreateUserDTO) => {
  const usuario = await findUserByEmail(email);
  if (!usuario) {
    throw new AppError("Credenciales inválidas",401);
  }
  const passwordValida = await bcrypt.compare(password,usuario.password);
  if (!passwordValida) {
    throw new AppError("Credenciales inválidas",401);
  }
  const token = generarToken(usuario.id);
  return {token};
};