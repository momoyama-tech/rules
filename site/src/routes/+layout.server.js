import { summaries } from '#lib/server/rules.js';

export function load() {
	return { documents: summaries(), sourceRef: process.env.SOURCE_REF || 'main' };
}
