import { error } from '@sveltejs/kit';
import { loadRules } from '#lib/server/rules.js';
import { loadHistory, loadVersion } from '#lib/server/history.js';

export function entries() {
	return loadRules().flatMap(({ slug, file }) =>
		loadHistory(file).map(({ shortSha }) => ({ slug, commit: shortSha }))
	);
}

/** @param {import('./$types').PageServerLoadEvent} event */
export function load({ params }) {
	const document = loadRules().find((rule) => rule.slug === params.slug);
	if (!document) error(404, '文書が見つかりません');
	const version = loadVersion(document.file, params.commit);
	if (!version) error(404, 'この版が見つかりません');
	const { html, ...summary } = document;
	return { document: summary, version };
}
