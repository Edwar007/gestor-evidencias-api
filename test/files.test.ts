import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";

import app from "../src/app.js";
import { limpiarBaseDeDatos } from "./utils/cleanup.js";
import obtenerR2Client from "../src/lib/r2.js";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

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
        password,
      });

    const response = await request(app)
      .post("/auth/login")
      .send({
        email,
        password,
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
        descripcion: "Caso utilizado para probar archivos",
      });

    expect(response.status).toBe(201);

    return response.body;
  };

  const subirArchivoR2 = async (
    caseId: string,
    token: string,
    fileName = "evidencia.pdf",
    contentType = "application/pdf",
    contenido = "contenido de prueba"
  ) => {
    const uploadResponse = await request(app)
      .post(`/cases/${caseId}/file/upload-url`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        fileName,
        contentType,
      });

    expect(uploadResponse.status).toBe(200);

    const { uploadUrl, key } = uploadResponse.body;

    const upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: contenido,
    });

    expect(upload.ok).toBe(true);

    return key;
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
          contentType: "application/pdf",
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
          contentType: "application/octet-stream",
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
          contentType: "application/pdf",
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
          contentType: "application/pdf",
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
          contentType: "application/pdf",
        });

      expect(response.status).toBe(403);
    });

    it("debe rechazar la petición sin autenticación", async () => {
      const response = await request(app)
        .post("/cases/caso/file/upload-url")
        .send({
          fileName: "evidencia.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /cases/:id/file/complete", () => {
    it("debe completar correctamente una subida", async () => {
      const token = await registrarYObtenerToken(
        "complete-exitoso@test.com"
      );

      const caso = await crearCaso(token);

      const key = await subirArchivoR2(
        caso.id,
        token
      );

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("fileKey");
      expect(response.body.fileKey).toBe(key);

      await obtenerR2Client().send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
    });

    it("debe rechazar una clave vacía", async () => {
      const token = await registrarYObtenerToken(
        "complete-vacio@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key: "",
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
          key: "cases/otro-caso/archivo.pdf",
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
          key: "cases/caso-no-existe/archivo.pdf",
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
          key: `cases/${caso.id}/archivo.pdf`,
        });

      expect(response.status).toBe(403);
    });

    it("debe rechazar la petición sin autenticación", async () => {
      const response = await request(app)
        .post("/cases/caso/file/complete")
        .send({
          key: "cases/caso/archivo.pdf",
        });

      expect(response.status).toBe(401);
    });

    it("debe rechazar un archivo que no existe en R2", async () => {
      const token = await registrarYObtenerToken(
        "complete-r2@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key: `cases/${caso.id}/archivo-inexistente.pdf`,
        });

      expect(response.status).toBe(400);
    });

    it("debe reemplazar correctamente un archivo existente", async () => {
      const token = await registrarYObtenerToken(
        "complete-reemplazo@test.com"
      );

      const caso = await crearCaso(token);

      const keyAnterior = await subirArchivoR2(
        caso.id,
        token,
        "archivo-anterior.pdf"
      );

      await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key: keyAnterior,
        })
        .expect(200);

      const keyNuevo = await subirArchivoR2(
        caso.id,
        token,
        "archivo-nuevo.pdf"
      );

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key: keyNuevo,
        });

      expect(response.status).toBe(200);
      expect(response.body.fileKey).toBe(keyNuevo);

      await expect(
        obtenerR2Client().send(
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: keyAnterior,
          })
        )
      ).rejects.toThrow();

      await obtenerR2Client().send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: keyNuevo,
        })
      );
    });
  });

  describe("GET /cases/:id/file/download-url", () => {
    it("debe devolver una URL de descarga para un archivo existente", async () => {
      const token = await registrarYObtenerToken(
        "download-exitoso@test.com"
      );

      const caso = await crearCaso(token);

      const key = await subirArchivoR2(
        caso.id,
        token
      );

      await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key,
        })
        .expect(200);

      const response = await request(app)
        .get(`/cases/${caso.id}/file/download-url`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("downloadUrl");
      expect(response.body).toHaveProperty("expiresIn");
      expect(response.body.downloadUrl).toContain(
        "r2.cloudflarestorage.com"
      );

      await obtenerR2Client().send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
    });

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

  describe("Validaciones de almacenamiento", () => {
    it("debe rechazar un archivo que supera los 5 MB", async () => {
      const token = await registrarYObtenerToken(
        "archivo-grande@test.com"
      );

      const caso = await crearCaso(token);

      const uploadResponse = await request(app)
        .post(`/cases/${caso.id}/file/upload-url`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          fileName: "archivo-grande.pdf",
          contentType: "application/pdf",
        });

      expect(uploadResponse.status).toBe(200);

      const { uploadUrl, key } = uploadResponse.body;

      const archivoGrande = new Uint8Array(
        5 * 1024 * 1024 + 1
      );

      const upload = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: archivoGrande,
      });

      expect(upload.ok).toBe(true);

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key,
        });

      expect(response.status).toBe(400);

      await expect(
        obtenerR2Client().send(
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          })
        )
      ).rejects.toThrow();
    });

    it("debe rechazar un MIME inválido almacenado en R2", async () => {
      const token = await registrarYObtenerToken(
        "mime-invalido@test.com"
      );

      const caso = await crearCaso(token);

      const key = `cases/${caso.id}/mime-invalido-${Date.now()}.txt`;

      await obtenerR2Client().send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: "archivo inválido",
          ContentType: "text/plain",
        })
      );

      const response = await request(app)
        .post(`/cases/${caso.id}/file/complete`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          key,
        });

      expect(response.status).toBe(400);

      await expect(
        obtenerR2Client().send(
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          })
        )
      ).rejects.toThrow();
    });
  });
});

