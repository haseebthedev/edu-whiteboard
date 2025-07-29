import { mkdir, readFile, writeFile } from 'fs/promises'
import { join, resolve, dirname } from 'path'
import { Readable } from 'stream'
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// We are just using the filesystem to store assets
const DIR = resolve(__dirname, './assets');

if (!existsSync(DIR)) {
	await mkdir(DIR, { recursive: true });
}

export async function storeAsset(id: string, stream: Readable) {
	await writeFile(join(DIR, id), stream)
}

export async function loadAsset(id: string) {
	return await readFile(join(DIR, id))
}
