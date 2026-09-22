import { S3Client } from "@aws-sdk/client-s3";

const obtenerR2Client = () => {

  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY
  } = process.env;

  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      "Las credenciales de Cloudflare R2 no están configuradas"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });
};

export default obtenerR2Client;