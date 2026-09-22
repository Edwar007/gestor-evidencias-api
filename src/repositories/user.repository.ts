import prisma from "../lib/prisma.js";

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email
    }
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      email: true,
      createdAt: true
    }
  });
};

export const createUser = async (
  email: string,
  password: string
) => {
  return prisma.user.create({
    data: {
      email,
      password
    },
    select: {
      id: true,
      email: true,
      createdAt: true
    }
  });
};