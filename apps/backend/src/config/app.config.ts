export default () => ({
  port: Number(process.env.PORT ?? 3000),
  /** Base URL the browser uses to reach this API (local uploads/downloads). */
  publicApiUrl:
    process.env.API_PUBLIC_URL?.trim() ||
    `http://localhost:${Number(process.env.PORT?.trim()) || 3005}`,
  jwt: {
    secret: (() => {
      if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
      }
      return process.env.JWT_SECRET ?? 'dev-only-secret';
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  storage: {
    backend:
      process.env.STORAGE_BACKEND ??
      (process.env.NODE_ENV === 'development' ? 'local' : 'gcs'),
    localRoot: process.env.LOCAL_STORAGE_ROOT ?? 'storage',
    gcsBucket: process.env.GCS_BUCKET ?? '',
    gcsProjectId: process.env.GCS_PROJECT_ID ?? '',
  },
  uploadPolicy: {
    imageMaxBytes: Number(
      process.env.UPLOAD_MAX_IMAGE_BYTES ?? 25 * 1024 * 1024,
    ),
    pdfMaxBytes: Number(process.env.UPLOAD_MAX_PDF_BYTES ?? 50 * 1024 * 1024),
    otherMaxBytes: Number(
      process.env.UPLOAD_MAX_OTHER_BYTES ?? 100 * 1024 * 1024,
    ),
  },
});
