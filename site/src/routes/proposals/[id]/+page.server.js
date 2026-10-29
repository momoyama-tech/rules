import { error } from '@sveltejs/kit';
import { loadProposals } from '#lib/server/proposals.js';

export function entries() {
	return loadProposals().map(({ id }) => ({ id }));
}

/** @param {import('./$types').PageServerLoadEvent} event */
export function load({ params }) {
	const proposal = loadProposals().find((entry) => entry.id === params.id);
	if (!proposal) error(404, '改定案が見つかりません');
	return { proposal };
}
