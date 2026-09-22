import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";
import { limpiarBaseDeDatos } from "./utils/cleanup.js";

describe("Autenticación", () => {

  beforeEach(async () => {
    await limpiarBaseDeDatos();
  });

  describe("POST /auth/register", () => {

    it("debe registrar un usuario correctamente", async () => {

      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "usuario@test.com",
          password: "123456"
        });

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");

      expect(response.body.email).toBe("usuario@test.com");

      expect(response.body).not.toHaveProperty("password");
    });

    it("debe rechazar un registro con datos inválidos", async () => {

      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "correo-invalido",
          password: "123"
        });

      expect(response.status).toBe(400);
    });

    it("debe rechazar un email duplicado", async () => {

      const usuario = {
        email: "duplicado@test.com",
        password: "123456"
      };

      const primerRegistro = await request(app)
        .post("/auth/register")
        .send(usuario);

      expect(primerRegistro.status).toBe(201);

      const segundoRegistro = await request(app)
        .post("/auth/register")
        .send(usuario);

      expect(segundoRegistro.status).toBe(409);
    });

  });

  describe("POST /auth/login", () => {

    it("debe iniciar sesión correctamente", async () => {

      const usuario = {
        email: "login@test.com",
        password: "123456"
      };

      await request(app)
        .post("/auth/register")
        .send(usuario);

      const response = await request(app)
        .post("/auth/login")
        .send(usuario);

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it("debe rechazar credenciales incorrectas", async () => {

      const usuario = {
        email: "incorrecto@test.com",
        password: "123456"
      };

      await request(app)
        .post("/auth/register")
        .send(usuario);

      const response = await request(app)
        .post("/auth/login")
        .send({
          email: usuario.email,
          password: "654321"
        });

      expect(response.status).toBe(401);
    });

  });

  describe("GET /auth/me", () => {

    it("debe obtener el usuario autenticado", async () => {

      const usuario = {
        email: "me@test.com",
        password: "123456"
      };

      await request(app)
        .post("/auth/register")
        .send(usuario);

      const login = await request(app)
        .post("/auth/login")
        .send(usuario);

      const token = login.body.token;

      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");

      expect(response.body.email).toBe(usuario.email);

      expect(response.body).not.toHaveProperty("password");
    });

    it("debe rechazar una petición sin token", async () => {

      const response = await request(app)
        .get("/auth/me");

      expect(response.status).toBe(401);
    });

    it("debe rechazar un token inválido", async () => {

      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer token-invalido");

      expect(response.status).toBe(401);
    });

  });

});

