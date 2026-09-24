import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";
import app from "../src/app.js";
import { limpiarBaseDeDatos } from "./utils/cleanup.js";

describe("Gestión de casos", () => {

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

    return response.body.token;
  };

  const crearCaso = async (
    token: string,
    titulo = "Caso de prueba",
    descripcion = "Descripción del caso"
  ) => {

    return request(app)
      .post("/cases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo,
        descripcion
      });
  };

  describe("POST /cases", () => {

    it("debe crear un caso correctamente", async () => {

      const token = await registrarYObtenerToken(
        "caso1@test.com"
      );

      const response = await crearCaso(token);

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("titulo");
      expect(response.body).toHaveProperty("descripcion");
      expect(response.body).toHaveProperty("estado");
      expect(response.body).toHaveProperty("userId");

      expect(response.body.titulo).toBe("Caso de prueba");
      expect(response.body.descripcion).toBe("Descripción del caso");
      expect(response.body.estado).toBe("OPEN");
    });

    it("debe rechazar datos inválidos", async () => {

      const token = await registrarYObtenerToken(
        "caso2@test.com"
      );

      const response = await request(app)
        .post("/cases")
        .set("Authorization", `Bearer ${token}`)
        .send({
          titulo: "",
          descripcion: ""
        });

      expect(response.status).toBe(400);
    });

    it("debe rechazar la creación sin autenticación", async () => {

      const response = await request(app)
        .post("/cases")
        .send({
          titulo: "Caso",
          descripcion: "Descripción"
        });

      expect(response.status).toBe(401);
    });

  });

  describe("GET /cases", () => {

    it("debe listar los casos del usuario autenticado", async () => {

      const token = await registrarYObtenerToken(
        "lista@test.com"
      );

      await crearCaso(
        token,
        "Caso 1",
        "Descripción 1"
      );

      await crearCaso(
        token,
        "Caso 2",
        "Descripción 2"
      );

      const response = await request(app)
        .get("/cases")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body).toHaveLength(2);

      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[1]).toHaveProperty("id");
    });

    it("no debe mostrar casos de otro usuario", async () => {

      const tokenUsuario1 = await registrarYObtenerToken(
        "usuario1@test.com"
      );

      const tokenUsuario2 = await registrarYObtenerToken(
        "usuario2@test.com"
      );

      await crearCaso(
        tokenUsuario1,
        "Caso Usuario 1",
        "Descripción Usuario 1"
      );

      const response = await request(app)
        .get("/cases")
        .set("Authorization", `Bearer ${tokenUsuario2}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("debe rechazar el listado sin autenticación", async () => {

      const response = await request(app)
        .get("/cases");

      expect(response.status).toBe(401);
    });

  });

  describe("GET /cases/:id", () => {

    it("debe obtener un caso propio", async () => {

      const token = await registrarYObtenerToken(
        "obtener@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .get(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.id).toBe(caso.body.id);
      expect(response.body.titulo).toBe("Caso de prueba");
    });

    it("debe devolver 404 si el caso no existe", async () => {

      const token = await registrarYObtenerToken(
        "noexiste@test.com"
      );

      const response = await request(app)
        .get("/cases/caso-que-no-existe")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("debe devolver 403 si el caso pertenece a otro usuario", async () => {

      const tokenUsuario1 = await registrarYObtenerToken(
        "propietario@test.com"
      );

      const tokenUsuario2 = await registrarYObtenerToken(
        "otro@test.com"
      );

      const caso = await crearCaso(
        tokenUsuario1
      );

      const response = await request(app)
        .get(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${tokenUsuario2}`);

      expect(response.status).toBe(403);
    });

  });

  describe("PUT /cases/:id", () => {

    it("debe actualizar un caso propio", async () => {

      const token = await registrarYObtenerToken(
        "actualizar@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .patch(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          titulo: "Caso actualizado",
          descripcion: "Descripción actualizada",
          estado: "CLOSED"
        });

      expect(response.status).toBe(200);

      expect(response.body.titulo).toBe("Caso actualizado");
      expect(response.body.descripcion).toBe("Descripción actualizada");
      expect(response.body.estado).toBe("CLOSED");
    });

    it("debe rechazar datos inválidos al actualizar", async () => {

      const token = await registrarYObtenerToken(
        "actualizar-invalido@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .patch(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          estado: "ESTADO_INVALIDO"
        });

      expect(response.status).toBe(400);
    });

    it("debe devolver 403 al actualizar un caso de otro usuario", async () => {

      const tokenUsuario1 = await registrarYObtenerToken(
        "actualiza-propietario@test.com"
      );

      const tokenUsuario2 = await registrarYObtenerToken(
        "actualiza-otro@test.com"
      );

      const caso = await crearCaso(tokenUsuario1);

      const response = await request(app)
        .patch(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${tokenUsuario2}`)
        .send({
          titulo: "Intento de modificación"
        });

      expect(response.status).toBe(403);
    });

  });

  describe("DELETE /cases/:id", () => {

    it("debe eliminar un caso propio", async () => {

      const token = await registrarYObtenerToken(
        "eliminar@test.com"
      );

      const caso = await crearCaso(token);

      const response = await request(app)
        .delete(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);

      const consulta = await request(app)
        .get(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(consulta.status).toBe(404);
    });

    it("debe devolver 403 al eliminar un caso de otro usuario", async () => {

      const tokenUsuario1 = await registrarYObtenerToken(
        "elimina-propietario@test.com"
      );

      const tokenUsuario2 = await registrarYObtenerToken(
        "elimina-otro@test.com"
      );

      const caso = await crearCaso(tokenUsuario1);

      const response = await request(app)
        .delete(`/cases/${caso.body.id}`)
        .set("Authorization", `Bearer ${tokenUsuario2}`);

      expect(response.status).toBe(403);
    });

    it("debe devolver 404 al eliminar un caso inexistente", async () => {

      const token = await registrarYObtenerToken(
        "elimina-noexiste@test.com"
      );

      const response = await request(app)
        .delete("/cases/caso-que-no-existe")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

  });

});

