import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

describe("GET /health", () => {

  it("debe responder correctamente", async () => {

    const response = await request(app)
      .get("/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      mensaje: "ok"
    });
  });

});