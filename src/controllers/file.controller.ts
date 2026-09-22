import { Request, Response } from "express";

import {
  generarUploadUrl,
  completarUpload,
  generarDownloadUrl
} from "../services/file.service.js";

export const uploadUrl = async (
  req: Request<
    { id: string },
    {},
    {
      fileName: string;
      contentType: string;
    }
  >,
  res: Response
) => {
  const resultado = await generarUploadUrl(
    req.params.id,
    req.userId!,
    req.body.fileName,
    req.body.contentType
  );

  res.status(200).json(resultado);
};

export const complete = async (
  req: Request<
    { id: string },
    {},
    { key: string }
  >,
  res: Response
) => {
  const resultado = await completarUpload(
    req.params.id,
    req.userId!,
    req.body.key
  );

  res.status(200).json(resultado);
};

export const downloadUrl = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const resultado = await generarDownloadUrl(
    req.params.id,
    req.userId!
  );

  res.status(200).json(resultado);
};