import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR || path.join(dirname, '..', '..', 'uploads'),
);

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;
const EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_BYTES = 2 * 1024 * 1024;

// The Angular form sends the picked file as a data URL. Persist it once as
// uploads/<uuid>.<ext> and keep only the public URL in the database.
export async function persistImage(value, baseUrl) {
  if (typeof value !== 'string' || value.startsWith('data:') === false) {
    return { url: value };
  }

  const match = DATA_URL.exec(value.trim());

  if (match === null) {
    return {
      error: {
        code: 'INVALID_FORMAT',
        message: 'The image must be a PNG, JPEG or WEBP data URL.',
      },
    };
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return {
      error: {
        code: 'INVALID_FORMAT',
        message: 'The image must not exceed 2 MB.',
      },
    };
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const fileName = `${randomUUID()}.${EXTENSIONS[mime]}`;
  await writeFile(path.join(UPLOADS_DIR, fileName), buffer);

  return { url: `${baseUrl.replace(/\/$/, '')}/uploads/${fileName}` };
}
