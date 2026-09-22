import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado");
}

export const generarToken = (userId: string) => {
  return jwt.sign(
    {
      userId
    },
    JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );
};