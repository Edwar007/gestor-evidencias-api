export const FILE_CONFIG = {
  maxSize: 5 * 1024 * 1024,

  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "application/pdf"
  ],

  uploadUrlExpiresIn: 900,

  downloadUrlExpiresIn: 180
} as const;