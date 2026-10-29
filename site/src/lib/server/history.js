import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { renderRule } from './rules.js';

/** @typedef {{sha:string,shortSha:string,date:string,subject:string,path:string,markdown:string,sha256:string}} RuleVersion */
/** @typedef {{type:'same'|'add'|'del',text:string,parts?:{type:'same'|'add'|'del',text:string}[]}} DiffLine */

const defaultRepo = resolve(process.cwd(), '..');
/** @type {Map<string, RuleVersion[]>} */
const cache = new Map();

/**
 * @param {string} repo
 * @param {string[]} args
 */
function git(repo, args) {
	return execFileSync('git', ['-C', repo, ...args], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'ignore']
	});
}

/**
 * Committed versions of one rule file, newest first. Builds without git
 * history (e.g. a source archive) get an empty list instead of failing.
 * @param {string} file path relative to rules/
 * @param {string} [repo]
 * @returns {RuleVersion[]}
 */
export function loadHistory(file, repo = defaultRepo) {
	const key = `${repo}\0${file}`;
	const cached = cache.get(key);
	if (cached) return cached;
	/** @type {RuleVersion[]} */
	let versions = [];
	try {
		const log = git(repo, [
			'log',
			'--follow',
			'--format=%x1e%H%x1f%cI%x1f%s',
			'--name-only',
			'--',
			`rules/${file}`
		]);
		versions = log
			.split('\x1e')
			.filter((record) => record.trim())
			.map((record) => {
				const [header, ...paths] = record.split('\n');
				const [sha, date, subject] = header.split('\x1f');
				const path = paths.find((line) => line.trim()) || `rules/${file}`;
				const markdown = git(repo, ['show', `${sha}:${path}`]);
				return {
					sha,
					shortSha: sha.slice(0, 7),
					date,
					subject,
					path,
					markdown,
					sha256: createHash('sha256').update(markdown).digest('hex')
				};
			});
	} catch {
		versions = [];
	}
	cache.set(key, versions);
	return versions;
}

/**
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 * @returns {{type:'same'|'add'|'del',value:T}[]}
 */
function lcsDiff(a, b) {
	const rows = a.length + 1;
	const cols = b.length + 1;
	const table = new Uint32Array(rows * cols);
	for (let i = a.length - 1; i >= 0; i--)
		for (let j = b.length - 1; j >= 0; j--)
			table[i * cols + j] =
				a[i] === b[j]
					? table[(i + 1) * cols + j + 1] + 1
					: Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
	/** @type {{type:'same'|'add'|'del',value:T}[]} */
	const result = [];
	let i = 0;
	let j = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			result.push({ type: 'same', value: a[i] });
			i++;
			j++;
		} else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1])
			result.push({ type: 'del', value: a[i++] });
		else result.push({ type: 'add', value: b[j++] });
	}
	while (i < a.length) result.push({ type: 'del', value: a[i++] });
	while (j < b.length) result.push({ type: 'add', value: b[j++] });
	return result;
}

/**
 * @param {{type:'same'|'add'|'del',value:string}[]} chars
 */
function mergeParts(chars) {
	/** @type {{type:'same'|'add'|'del',text:string}[]} */
	const parts = [];
	for (const { type, value } of chars) {
		const last = parts.at(-1);
		if (last?.type === type) last.text += value;
		else parts.push({ type, text: value });
	}
	// A one- or two-character match between changes (e.g. a shared kanji in
	// two different phrases) is noise; treat it as part of the change.
	/** @type {{type:'same'|'add'|'del',text:string}[]} */
	const cleaned = [];
	parts.forEach((part, index) => {
		const between = index > 0 && index < parts.length - 1;
		if (part.type === 'same' && between && [...part.text].length <= 2)
			cleaned.push({ type: 'del', text: part.text }, { type: 'add', text: part.text });
		else cleaned.push(part);
	});
	return cleaned;
}

/**
 * @param {{type:'same'|'add'|'del',text:string}[]} parts
 * @param {'add'|'del'} drop
 */
function side(parts, drop) {
	/** @type {{type:'same'|'add'|'del',text:string}[]} */
	const result = [];
	for (const part of parts) {
		if (part.type === drop) continue;
		const last = result.at(-1);
		if (last?.type === part.type) last.text += part.text;
		else result.push({ ...part });
	}
	return result;
}

/**
 * Line diff of two Markdown texts. A removed line directly replaced by an
 * added one also carries a character diff so small wording changes stand out.
 * @param {string} before
 * @param {string} after
 * @returns {DiffLine[]}
 */
export function diffMarkdown(before, after) {
	const lines = (/** @type {string} */ text) => text.split('\n').filter((line) => line.trim());
	const diff = lcsDiff(lines(before), lines(after));
	/** @type {DiffLine[]} */
	const result = [];
	for (let k = 0; k < diff.length;) {
		if (diff[k].type === 'same') {
			result.push({ type: 'same', text: diff[k++].value });
			continue;
		}
		const removed = [];
		const added = [];
		while (k < diff.length && diff[k].type === 'del') removed.push(diff[k++].value);
		while (k < diff.length && diff[k].type === 'add') added.push(diff[k++].value);
		const pairs = Math.min(removed.length, added.length);
		for (let p = 0; p < pairs; p++) {
			const parts = mergeParts(lcsDiff([...removed[p]], [...added[p]]));
			result.push({ type: 'del', text: removed[p], parts: side(parts, 'add') });
			result.push({ type: 'add', text: added[p], parts: side(parts, 'del') });
		}
		for (const text of removed.slice(pairs)) result.push({ type: 'del', text });
		for (const text of added.slice(pairs)) result.push({ type: 'add', text });
	}
	return result;
}

/**
 * Keeps changed lines with a little surrounding context; long unchanged runs
 * collapse to a single gap marker.
 * @param {DiffLine[]} diff
 * @param {number} [context]
 */
export function withContext(diff, context = 1) {
	const keep = diff.map(() => false);
	diff.forEach((line, index) => {
		if (line.type === 'same') return;
		for (let k = Math.max(0, index - context); k <= Math.min(diff.length - 1, index + context); k++)
			keep[k] = true;
	});
	/** @type {(DiffLine | {type:'gap',count:number})[]} */
	const result = [];
	diff.forEach((line, index) => {
		if (keep[index]) return result.push(line);
		const last = result.at(-1);
		if (last?.type === 'gap') last.count++;
		else result.push({ type: 'gap', count: 1 });
	});
	return result;
}

/**
 * Summaries for the history list, each with its change size against the
 * previous (older) version.
 * @param {string} file
 * @param {string} [repo]
 */
export function historySummaries(file, repo) {
	const versions = loadHistory(file, repo);
	return versions.map((version, index) => {
		const previous = versions[index + 1];
		const diff = diffMarkdown(previous?.markdown ?? '', version.markdown);
		return {
			sha: version.sha,
			shortSha: version.shortSha,
			date: version.date,
			subject: version.subject,
			sha256: version.sha256,
			added: diff.filter((line) => line.type === 'add').length,
			removed: diff.filter((line) => line.type === 'del').length,
			isLatest: index === 0,
			isFirst: !previous
		};
	});
}

/**
 * @param {string} file
 * @param {string} shortSha
 * @param {string} [repo]
 */
export function loadVersion(file, shortSha, repo) {
	const versions = loadHistory(file, repo);
	const index = versions.findIndex((version) => version.shortSha === shortSha);
	if (index === -1) return undefined;
	const version = versions[index];
	const previous = versions[index + 1];
	const { html, headings } = renderRule(version.markdown);
	return {
		sha: version.sha,
		shortSha: version.shortSha,
		date: version.date,
		subject: version.subject,
		sha256: version.sha256,
		path: version.path,
		title: version.markdown.match(/^# (.+)$/m)?.[1] ?? '',
		html,
		headings,
		isLatest: index === 0,
		previous: previous ? { shortSha: previous.shortSha, date: previous.date } : null,
		next:
			index > 0 ? { shortSha: versions[index - 1].shortSha, date: versions[index - 1].date } : null,
		diff: previous ? withContext(diffMarkdown(previous.markdown, version.markdown)) : []
	};
}
