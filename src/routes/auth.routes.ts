import { Router } from "express";

import { registrarUsuarioController } from "../controllers/auth.controller.js";

import { validate } from "../middlewares/validate.middleware.js";

import { createUserSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validate(createUserSchema, "body"), registrarUsuarioController);

export default router;