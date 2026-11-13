// ---------------------------------------------------------------------------
// Unit tests for the cover-image storage used by the admin form.
// ---------------------------------------------------------------------------
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

const uploadsDir = await mkdtemp(path.join(os.tmpdir(), 'excursion-uploads-'));
process.env.UPLOADS_DIR = uploadsDir;

const { persistImage } = await import('../src/utils/imageStore.js');

after(async () => {
  await rm(uploadsDir, { recursive: true, force: true });
});

const BASE_URL = 'http://localhost:8084';

function dataUrl(mime, bytes) {
  return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
}

function storedFileName(url) {
  return url.slice(url.lastIndexOf('/') + 1);
}

test('persistImage: stores a PNG data URL and returns its public URL', async () => {
  // Arrange
  const bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  // Act
  const result = await persistImage(dataUrl('image/png', bytes), `${BASE_URL}/`);

  // Assert
  assert.match(result.url, /^http:\/\/localhost:8084\/uploads\/[0-9a-f-]+\.png$/);
  assert.deepEqual(await readFile(path.join(uploadsDir, storedFileName(result.url))), Buffer.from(bytes));
});

test('persistImage: maps JPEG and WEBP to their file extensions', async () => {
  // Act
  const jpeg = await persistImage(dataUrl('image/jpeg', [1, 2, 3]), BASE_URL);
  const webp = await persistImage(dataUrl('image/webp', [4, 5, 6]), BASE_URL);

  // Assert
  assert.match(jpeg.url, /\.jpg$/);
  assert.match(webp.url, /\.webp$/);
});

test('persistImage: leaves values that are not data URLs unchanged', async () => {
  // Act / Assert
  assert.deepEqual(await persistImage('', BASE_URL), { url: '' });
  assert.deepEqual(await persistImage('imgs/excursion-1.jpg', BASE_URL), {
    url: 'imgs/excursion-1.jpg',
  });
  assert.deepEqual(await persistImage('https://cdn.example.com/a.webp', BASE_URL), {
    url: 'https://cdn.example.com/a.webp',
  });
  assert.deepEqual(await persistImage(undefined, BASE_URL), { url: undefined });
});

test('persistImage: rejects an unsupported MIME type without writing a file', async () => {
  // Arrange
  const before = (await readdir(uploadsDir)).length;

  // Act
  const result = await persistImage(dataUrl('image/gif', [1, 2, 3]), BASE_URL);

  // Assert
  assert.equal(result.error.code, 'INVALID_FORMAT');
  assert.equal((await readdir(uploadsDir)).length, before);
});

test('persistImage: rejects an image larger than 2 MB', async () => {
  // Arrange
  const tooLarge = Buffer.alloc(2 * 1024 * 1024 + 1);

  // Act
  const result = await persistImage(dataUrl('image/png', tooLarge), BASE_URL);

  // Assert
  assert.equal(result.error.code, 'INVALID_FORMAT');
  assert.match(result.error.message, /2 MB/);
});
