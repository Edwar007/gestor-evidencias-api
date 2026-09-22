import bcrypt from "bcryptjs";
import { createUser,  findUserByEmail} from "../repositories/user.repository.js";
import { CreateUserDTO } from "../types/auth.types.js";
import { AppError } from "../errors/app.error.js";

export const registrarUsuarioService = async ({email,password}: CreateUserDTO) => {
  const usuarioExistente = await findUserByEmail(email);
  if (usuarioExistente) {
    throw new AppError("El correo electrónico ya está registrado",409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return createUser(email, passwordHash);
};