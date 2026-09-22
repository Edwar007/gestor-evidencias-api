import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { r2Client } from "../lib/r2.js";
import { FILE_CONFIG } from "../config/file.config.js";
import {
  findCaseByIdOnly,
  updateCaseFileKey
} from "../repositories/case.repository.js";
import { AppError } from "../errors/app.error.js";

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!BUCKET_NAME) {
  throw new Error(
    "R2_BUCKET_NAME no está configurado"
  );
}

export const generarUploadUrl = async (caseId: string, userId: string, fileName: string, contentType: string) => {
    const caso = await findCaseByIdOnly(caseId);

    if (!caso) {
        throw new AppError("Caso no encontrado", 404);
    }

    if (caso.userId !== userId) {
        throw new AppError( "No tienes permisos para acceder a este caso", 403);
    }

    if (caso.fileKey) {
        throw new AppError("El caso ya tiene un archivo asociado", 409);
    }

    const extensionByMime = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "application/pdf": ".pdf"
        } as const;

    const extension = extensionByMime[contentType as keyof typeof extensionByMime];
    const key = `cases/${caseId}/${randomUUID()}${extension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(r2Client, command,{expiresIn: FILE_CONFIG.uploadUrlExpiresIn});
    return {
        uploadUrl,
        key,
        expiresIn: FILE_CONFIG.uploadUrlExpiresIn
    };
};

export const completarUpload = async (caseId: string, userId: string, key: string) => {
  const caso = await findCaseByIdOnly(caseId);
  if (!caso) {
    throw new AppError("Caso no encontrado",404);
  }

  if (caso.userId !== userId) {
    throw new AppError("No tienes permisos para acceder a este caso", 403 );
  }

  if (!key.startsWith(`cases/${caseId}/`)) {
    throw new AppError("El archivo no pertenece al caso",400);
  }

  let object;

  try {
    object = await r2Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );
  } catch {
    throw new AppError("El archivo no existe en el almacenamiento", 400);
  }

  if (!object.ContentLength) {
    throw new AppError("No se pudo determinar el tamaño del archivo", 400);
  }

  if (object.ContentLength > FILE_CONFIG.maxSize) {
    await r2Client.send(new DeleteObjectCommand({Bucket: BUCKET_NAME,Key: key}));
    throw new AppError("El archivo supera el tamaño máximo permitido de 5 MB", 400 );
  }

  if (!object.ContentType ||!FILE_CONFIG.allowedMimeTypes.includes(
      object.ContentType as
        (typeof FILE_CONFIG.allowedMimeTypes)[number]
    )
  ) {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      })
    );

    throw new AppError("El tipo de archivo no está permitido", 400);
  }

  await updateCaseFileKey(caseId,userId,key);

  return {
    fileKey: key
  };
};

export const generarDownloadUrl = async (caseId: string,userId: string) => {
  const caso = await findCaseByIdOnly(caseId);

  if (!caso) {
    throw new AppError("Caso no encontrado",404);
  }

  if (caso.userId !== userId) {
    throw new AppError("No tienes permisos para acceder a este caso", 403 );
  }

  if (!caso.fileKey) {
    throw new AppError("El caso no tiene un archivo asociado", 404);
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: caso.fileKey
  });

  const downloadUrl = await getSignedUrl(
    r2Client,
    command,
    {
      expiresIn:
        FILE_CONFIG.downloadUrlExpiresIn
    }
  );

  return {
    downloadUrl,
    expiresIn:
      FILE_CONFIG.downloadUrlExpiresIn
  };
};