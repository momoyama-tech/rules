import { error } from '@sveltejs/kit';
import { loadRules } from '#lib/server/rules.js';

export function entries() {
	return loadRules().map(({ slug }) => ({ slug }));
}

/** @param {import('./$types').PageServerLoadEvent} event */
export function load({ params }) {
	const document = loadRules().find((rule) => rule.slug === params.slug);
	if (!document) error(404, '文書が見つかりません');
	return { document };
}
