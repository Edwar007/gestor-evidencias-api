import prisma from "../lib/prisma.js";

export const createCase = async (titulo: string, descripcion: string, userId: string) => {
  return prisma.caso.create({
    data: {
      titulo,
      descripcion,
      userId
    }
  });
};

export const findAllCasesByUser = async (userId: string) => {
  return prisma.caso.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const findCaseById = async (id: string,userId: string) => {
  return prisma.caso.findFirst({
    where: {
      id,
      userId
    }
  });
};

export const updateCase = async (id: string, userId: string,
  data: {
    titulo?: string;
    descripcion?: string;
    estado?: "OPEN" | "CLOSED";
  }
) => {
  return prisma.caso.updateMany({
    where: {
      id,
      userId
    },
    data
  });
};

export const deleteCase = async (
  id: string,
  userId: string
) => {
  return prisma.caso.deleteMany({
    where: {
      id,
      userId
    }
  });
};

export const findCaseByIdOnly = async (id: string) => {
  return prisma.caso.findUnique({
    where: {
      id
    }
  });
};

export const updateCaseFileKey = async (
  id: string,
  userId: string,
  fileKey: string
) => {
  return prisma.caso.updateMany({
    where: {
      id,
      userId
    },
    data: {
      fileKey
    }
  });
};