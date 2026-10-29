import { error } from '@sveltejs/kit';
import { loadRules } from '#lib/server/rules.js';
import { historySummaries } from '#lib/server/history.js';

export function entries() {
	return loadRules().map(({ slug }) => ({ slug }));
}

/** @param {import('./$types').PageServerLoadEvent} event */
export function load({ params }) {
	const document = loadRules().find((rule) => rule.slug === params.slug);
	if (!document) error(404, '文書が見つかりません');
	const { html, markdown, ...summary } = document;
	return { document: summary, versions: historySummaries(document.file) };
}
