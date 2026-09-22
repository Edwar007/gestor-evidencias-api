import { Router } from "express";
import { registrarController,loginController, obtenerMe} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createUserSchema, loginSchema} from "../schemas/auth.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/register",
  validate(createUserSchema, "body"),
  registrarController
);

router.post("/login",
  validate(loginSchema, "body"),
  loginController
);

router.get("/me",
  authMiddleware,
  obtenerMe
);

export default router;