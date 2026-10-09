import { summaries } from '#lib/server/rules.js';

export function load() {
	return {
		documents: summaries(),
		sourceRef: process.env.SOURCE_REF || 'main',
		previewMode: process.env.PREVIEW_MODE === 'true',
		previewLabel: process.env.PREVIEW_LABEL || '草案'
	};
}
