import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../site/', import.meta.url));
const sourceRef = process.env.SOURCE_REF || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: site, encoding: 'utf8' }).trim();
if (!/^[0-9a-f]{40}$/.test(sourceRef)) throw new Error('SOURCE_REF must be a full commit SHA');
execFileSync('npm', ['run', 'build'], {
  cwd: site, stdio: 'inherit',
  env: { ...process.env, BASE_PATH: '', PREVIEW_MODE: 'true', SOURCE_REF: sourceRef }
});
writeFileSync(new URL('../site/build/_headers', import.meta.url), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
writeFileSync(new URL('../site/build/robots.txt', import.meta.url), 'User-agent: *\nDisallow: /\n');
