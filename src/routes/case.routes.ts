import { Router } from "express";
import { crear, listar, obtener, actualizar, eliminar} from "../controllers/case.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { completeFileSchema, createCaseSchema, updateCaseSchema} from "../schemas/case.schema.js";
import { uploadUrl, complete, downloadUrl} from "../controllers/file.controller.js";
import { uploadFileSchema } from "../schemas/case.schema.js";

const router = Router();

router.use(authMiddleware);

router.post("/",validate(createCaseSchema, "body"),crear);
router.get("/",listar);
router.get("/:id",obtener);
router.put("/:id",validate(updateCaseSchema, "body"),actualizar);
router.delete("/:id",eliminar);
router.post("/:id/file/upload-url", validate(uploadFileSchema, "body"),uploadUrl);
router.post("/:id/file/complete",validate(completeFileSchema, "body"), complete);
router.get("/:id/file/download-url",downloadUrl);

export default router;