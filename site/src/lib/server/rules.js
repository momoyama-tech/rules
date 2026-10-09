import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

/** @typedef {{slug:string,file:string,title:string,shortTitle:string,category:string,description:string,status:'source-current'|'unconfirmed'|'proposed',date:string,dateLabel:string,authority:string,sourceTab:string,note:string}} RuleMetadata */

export const statusLabels = {
	'source-current': '原本移行版',
	unconfirmed: '採択状況を確認中',
	proposed: '改定案・未承認'
};

/** @param {string} markdown */
export function renderRule(markdown) {
	const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
	const tokens = md.parse(markdown, {});
	/** @type {{id:string,title:string,level:number}[]} */
	const headings = [];
	const ids = new Set();
	let article = '';
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i].type !== 'heading_open') continue;
		const title = tokens[i + 1].content;
		const level = Number(tokens[i].tag.slice(1));
		const articleMatch = title.match(/^第(\d+)条(?:の(\d+))?/);
		const paragraphMatch = title.match(/^第(\d+)項/);
		if (level === 2)
			article = articleMatch
				? `article-${articleMatch[1]}${articleMatch[2] ? `-${articleMatch[2]}` : ''}`
				: '';
		const proposedId = articleMatch
			? article
			: paragraphMatch && article
				? `${article}-paragraph-${paragraphMatch[1]}`
				: `section-${headings.length + 1}`;
		let id = proposedId;
		for (let suffix = 2; ids.has(id); suffix++) id = `${proposedId}-${suffix}`;
		ids.add(id);
		tokens[i].attrSet('id', id);
		if (level > 1) headings.push({ id, title, level });
	}
	// The page supplies the document title; omit its duplicate Markdown H1.
	if (tokens[0]?.type === 'heading_open' && tokens[0].tag === 'h1') tokens.splice(0, 3);
	const html = sanitizeHtml(md.renderer.render(tokens, md.options, {}), {
		allowedTags: sanitizeHtml.defaults.allowedTags,
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			h2: ['id'],
			h3: ['id'],
			h4: ['id']
		},
		allowedSchemes: ['https', 'http', 'mailto'],
		allowProtocolRelative: false
	});
	const text = tokens
		.filter((token) => token.type === 'inline')
		.map((token) => token.content)
		.join(' ');
	return { html, headings, text };
}

/** @param {string} [root] */
export function loadRules(root = resolve(process.cwd(), '../rules')) {
	/** @type {RuleMetadata[]} */
	const entries = JSON.parse(readFileSync(resolve(root, 'index.json'), 'utf8'));
	if (!Array.isArray(entries) || entries.length === 0) throw new Error('文書一覧が空です');
	const slugs = new Set();
	return entries.map((entry) => {
		if (!/^[a-z][a-z0-9-]*$/.test(entry.slug) || slugs.has(entry.slug))
			throw new Error('文書IDが不正または重複しています');
		slugs.add(entry.slug);
		if (!Object.hasOwn(statusLabels, entry.status))
			throw new Error(`不明な文書状態: ${entry.slug}`);
		/** @type {(keyof RuleMetadata)[]} */
		const requiredFields = [
			'title',
			'shortTitle',
			'category',
			'description',
			'dateLabel',
			'authority',
			'note',
			'sourceTab'
		];
		for (const field of requiredFields) {
			if (typeof entry[field] !== 'string' || !entry[field].trim())
				throw new Error(`文書情報が不足: ${entry.slug}/${field}`);
		}
		if (
			!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
			!Number.isFinite(Date.parse(entry.date)) ||
			new Date(entry.date).toISOString().slice(0, 10) !== entry.date
		)
			throw new Error('文書の日付が不正です');
		if (typeof entry.file !== 'string' || !/^[a-z0-9/-]+\.md$/.test(entry.file))
			throw new Error('本文パスが不正です');
		const filePath = resolve(root, entry.file);
		if (!filePath.startsWith(resolve(root) + sep))
			throw new Error('本文はrules内に配置してください');
		const markdown = readFileSync(filePath, 'utf8');
		if (!markdown.startsWith(`# ${entry.title}\n`))
			throw new Error(`本文と一覧のタイトルが不一致: ${entry.slug}`);
		return {
			...entry,
			...renderRule(markdown),
			statusLabel: statusLabels[entry.status],
			sha256: createHash('sha256').update(markdown).digest('hex'),
			readingMinutes: Math.max(1, Math.ceil(markdown.length / 600))
		};
	});
}

export function summaries() {
	return loadRules().map(({ html, sha256, ...summary }) => summary);
}
