import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../rules/', import.meta.url);
const documents = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
for (const document of documents) {
  if (!/^[a-z0-9/-]+\.md$/.test(document.file) || document.file.startsWith('/')) {
    throw new Error(`Invalid rule path: ${document.file}`);
  }
  const bytes = readFileSync(new URL(document.file, root));
  console.log(`${createHash('sha256').update(bytes).digest('hex')}  rules/${document.file}`);
}
