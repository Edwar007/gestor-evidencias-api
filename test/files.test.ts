import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";

import app from "../src/app.js";
import { limpiarBaseDeDatos } from "./utils/cleanup.js";

describe("Gestión de archivos", () => {

  beforeEach(async () => {
    await limpiarBaseDeDatos();
  });

  const registrarYObtenerToken = async (
    email: string,
    password = "123456"
  ) => {

    await request(app)
      .post("/auth/register")
      .send({
        email,
        password
      });

    const response = await request(app)
      .post("/auth/login")
      .send({
        email,
        password
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");

    return response.body.token;
  };

  const crearCaso = async (token: string) => {

    const response = await request(app)
      .post("/cases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Caso con archivo",
        descripcion: "Caso utilizado para probar archivos"
      });

    expect(response.status).toBe(201);

    return response.body;
  };

  describe("POST /cases/:id/file/upload-url", () => {

    it("debe generar una URL de subida para un archivo permitido", async () => {

      const token = await registrarYObtenerToken(
        "upload@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/upload-url`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          fileName: "evidencia.pdf",
          contentType: "application/pdf"
        });

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty("uploadUrl");
      expect(response.body).toHaveProperty("key");
      expect(response.body).toHaveProperty("expiresIn");

      expect(response.body.key).toContain(
        `cases/${caso.id}/`
      );
    });

    it("debe rechazar un tipo de archivo no permitido", async () => {

      const token = await registrarYObtenerToken(
        "upload-invalido@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/upload-url`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          fileName: "evidencia.exe",
          contentType: "application/octet-stream"
        });

      expect(response.status).toBe(400);
    });

    it("debe rechazar un nombre de archivo vacío", async () => {

      const token = await registrarYObtenerToken(
        "upload-nombre@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/upload-url`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          fileName: "",
          contentType: "application/pdf"
        });

      expect(response.status).toBe(400);
    });

    it("debe devolver 404 si el caso no existe", async () => {

      const token = await registrarYObtenerToken(
        "upload-noexiste@test.com"
      );

      const response = await request(app)
        .post("/cases/caso-no-existe/file/upload-url")
        .set("Authorization", `Bearer ${token}`)
        .send({
          fileName: "evidencia.pdf",
          contentType: "application/pdf"
        });

      expect(response.status).toBe(404);
    });

    it("debe devolver 403 si el caso pertenece a otro usuario", async () => {

      const tokenPropietario = await registrarYObtenerToken(
        "upload-propietario@test.com"
      );

      const tokenOtroUsuario = await registrarYObtenerToken(
        "upload-otro@test.com"
      );

      const caso = await crearCaso(tokenPropietario);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/upload-url`)
        .set("Authorization", `Bearer ${tokenOtroUsuario}`)
        .send({
          fileName: "evidencia.pdf",
          contentType: "application/pdf"
        });

      expect(response.status).toBe(403);
    });

    it("debe rechazar la petición sin autenticación", async () => {

      const response = await request(app)
        .post("/cases/caso/file/upload-url")
        .send({
          fileName: "evidencia.pdf",
          contentType: "application/pdf"
        });

      expect(response.status).toBe(401);
    });

  });

  describe("POST /cases/:id/file/complete", () => {

    it("debe rechazar una clave vacía", async () => {

      const token = await registrarYObtenerToken(
        "complete-vacio@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key: ""
        });

      expect(response.status).toBe(400);
    });

    it("debe rechazar una clave que no pertenece al caso", async () => {

      const token = await registrarYObtenerToken(
        "complete-key@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key: "cases/otro-caso/archivo.pdf"
        });

      expect(response.status).toBe(400);
    });

    it("debe devolver 404 si el caso no existe", async () => {

      const token = await registrarYObtenerToken(
        "complete-noexiste@test.com"
      );

      const response = await request(app)
        .post("/cases/caso-no-existe/file/complete")
        .set("Authorization", `Bearer ${token}`)
        .send({
          key: "cases/caso-no-existe/archivo.pdf"
        });

      expect(response.status).toBe(404);
    });

    it("debe devolver 403 si el caso pertenece a otro usuario", async () => {

      const tokenPropietario = await registrarYObtenerToken(
        "complete-propietario@test.com"
      );

      const tokenOtroUsuario = await registrarYObtenerToken(
        "complete-otro@test.com"
      );

      const caso = await crearCaso(tokenPropietario);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${tokenOtroUsuario}`)
        .send({
          key: `cases/${caso.id}/archivo.pdf`
        });

      expect(response.status).toBe(403);
    });

  });

  describe("GET /cases/:id/file/download-url", () => {

    it("debe devolver 404 si el caso no tiene archivo", async () => {

      const token = await registrarYObtenerToken(
        "download-sin-archivo@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .get(`/cases/${caso.id}/file/download-url`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("debe devolver 404 si el caso no existe", async () => {

      const token = await registrarYObtenerToken(
        "download-noexiste@test.com"
      );

      const response = await request(app)
        .get("/cases/caso-no-existe/file/download-url")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("debe devolver 403 si el caso pertenece a otro usuario", async () => {

      const tokenPropietario = await registrarYObtenerToken(
        "download-propietario@test.com"
      );

      const tokenOtroUsuario = await registrarYObtenerToken(
        "download-otro@test.com"
      );

      const caso = await crearCaso(tokenPropietario);

      const response = await request(app)
        .get(`/cases/${caso.id}/file/download-url`)
        .set("Authorization", `Bearer ${tokenOtroUsuario}`);

      expect(response.status).toBe(403);
    });

    it("debe rechazar la petición sin autenticación", async () => {

      const response = await request(app)
        .get("/cases/caso/file/download-url");

      expect(response.status).toBe(401);
    });

  });

});

