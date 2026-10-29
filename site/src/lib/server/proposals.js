import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadRules, renderRule } from './rules.js';
import { diffMarkdown, loadHistory, withContext } from './history.js';

/**
 * Proposed documents grouped by the proposal file that explains them, with
 * the version under review and its change against the comparison base.
 * @param {string} [rulesRoot]
 * @param {string} [proposalsRoot]
 */
export function loadProposals(
	rulesRoot = resolve(process.cwd(), '../rules'),
	proposalsRoot = resolve(process.cwd(), '../proposals')
) {
	/** @type {Map<string, ReturnType<typeof proposedDocument>[]>} */
	const groups = new Map();
	for (const rule of loadRules(rulesRoot)) {
		if (rule.status !== 'proposed') continue;
		const key = rule.proposal ?? '';
		groups.set(key, [...(groups.get(key) ?? []), proposedDocument(rule)]);
	}
	return [...groups].map(([file, documents]) => {
		const path = file && resolve(proposalsRoot, file);
		if (path && !existsSync(path)) throw new Error(`改定案ファイルがありません: ${file}`);
		const markdown = path ? readFileSync(path, 'utf8') : '';
		const { html } = renderRule(markdown);
		return {
			id: file ? file.replace(/\.md$/, '') : 'other',
			file,
			title: markdown.match(/^# (.+)$/m)?.[1] ?? '説明のない改定案',
			html,
			agenda: documents.some((document) => document.agenda),
			documents
		};
	});
}

/** @param {ReturnType<typeof loadRules>[number]} rule */
function proposedDocument(rule) {
	const versions = loadHistory(rule.file);
	const latest = versions[0];
	const base = rule.baseCommit
		? versions.find((version) => version.sha === rule.baseCommit)
		: undefined;
	const diff = base ? withContext(diffMarkdown(base.markdown, rule.markdown)) : [];
	return {
		slug: rule.slug,
		title: rule.title,
		shortTitle: rule.shortTitle,
		category: rule.category,
		note: rule.note,
		authority: rule.authority,
		agenda: rule.agenda === true,
		kind: rule.baseCommit ? '改定' : '新規',
		sha256: rule.sha256,
		// The text under review matches its latest commit unless it was edited
		// after that commit; then there is no commit to cite yet.
		version:
			latest && latest.sha256 === rule.sha256
				? { shortSha: latest.shortSha, sha: latest.sha, date: latest.date }
				: null,
		base: base ? { shortSha: base.shortSha, sha: base.sha, date: base.date } : null,
		baseMissing: Boolean(rule.baseCommit && !base),
		added: diff.filter((line) => line.type === 'add').length,
		removed: diff.filter((line) => line.type === 'del').length,
		diff
	};
}
