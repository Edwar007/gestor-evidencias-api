import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema,property: "body" | "params" | "query") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req[property]);
    next();
  };
};