import express from "express";
import authRoutes from "./routes/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use(errorMiddleware);

export default app;