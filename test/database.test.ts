import { describe, expect, it } from "vitest";
import prisma from "../src/lib/prisma.js";

describe("Conexión a base de datos", () => {

  it("debe conectarse correctamente a PostgreSQL", async () => {

    await expect(
      prisma.$queryRaw`SELECT 1`
    ).resolves.toBeDefined();

  });

});