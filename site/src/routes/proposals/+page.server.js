import { loadProposals } from '#lib/server/proposals.js';

export function load() {
	return {
		proposals: loadProposals().map(({ html, documents, ...proposal }) => ({
			...proposal,
			documents: documents.map(({ diff, ...document }) => document)
		}))
	};
}
