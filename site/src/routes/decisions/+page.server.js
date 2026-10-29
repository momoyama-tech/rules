import { resolve } from 'node:path';
import { loadDecisions } from '#lib/server/decisions.js';
import { loadRules } from '#lib/server/rules.js';

export function load() {
	const rules = loadRules();
	const decisions = loadDecisions(
		resolve(process.cwd(), '../decisions'),
		resolve(process.cwd(), '..')
	);
	return {
		decisions: [...decisions.values()]
			.sort((a, b) => b.date.localeCompare(a.date))
			.map((decision) => ({
				...decision,
				documents: decision.documents.map((document) => {
					const rule = rules.find((entry) => entry.file === document.file);
					return {
						...document,
						slug: rule?.slug,
						title: rule?.title ?? document.file,
						current: rule?.sha256 === document.sha256
					};
				})
			}))
	};
}
