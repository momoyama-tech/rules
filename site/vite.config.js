import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const basePath = process.env.BASE_PATH || '';
if (basePath && !/^\/[a-zA-Z0-9/_-]+$/.test(basePath))
	throw new Error('BASE_PATH must be an absolute URL path');

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			paths: { base: /** @type {'' | `/${string}`} */ (basePath) },
			adapter: adapter({ fallback: '404.html' })
		})
	]
});
