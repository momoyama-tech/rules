import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderRule, loadRules } from '../src/lib/server/rules.js';
import { diffMarkdown, withContext, loadHistory } from '../src/lib/server/history.js';
import { loadProposals } from '../src/lib/server/proposals.js';

test('Japanese article anchors stay stable and repeated paragraph numbers are distinct', () => {
	const result = renderRule(
		'# 会則\n\n## 第5条（組織）\n\n### 第2項\n\n本文\n\n## 第14条\n\n### 第2項\n\n別の本文'
	);
	assert.deepEqual(
		result.headings.map((heading) => heading.id),
		['article-5', 'article-5-paragraph-2', 'article-14', 'article-14-paragraph-2']
	);
	assert.ok(!result.html.includes('<h1'));
	assert.match(result.html, /id="article-14-paragraph-2"/);
});

test('Markdown cannot execute HTML or javascript links', () => {
	const { html } = renderRule(
		'# 題\n\n<script>alert(1)</script>\n\n[危険](javascript:alert(1))\n\n[通常](https://example.com)'
	);
	assert.ok(!html.includes('<script'));
	assert.ok(!html.includes('href="javascript:'));
	assert.match(html, /href="https:\/\/example.com"/);
});

test('the vote covers the constitution and all eight regulations without adopting them', () => {
	const documents = loadRules();
	assert.equal(documents.length, 9);
	assert.ok(documents.every((document) => document.status === 'proposed' && document.agenda));
	assert.ok(documents.every((document) => document.proposal === '2026-10-30-bylaws-vote.md'));
	const unchanged = ['constitution', 'travel', 'budget', 'relationships'];
	for (const slug of unchanged)
		assert.equal(
			documents.find((document) => document.slug === slug)?.baseCommit,
			'b031c597b362c146eac467c8f15de9cc4fb1561f'
		);
	assert.ok(documents.every((document) => /^[a-f0-9]{64}$/.test(document.sha256)));
	for (const [slug, count] of [
		['constitution', 20],
		['travel', 6],
		['budget', 8],
		['relationships', 11],
		['executive-board', 9],
		['discipline', 15],
		['reporting', 10],
		['project-distribution', 8],
		['accounting-and-subsidies', 9]
	]) {
		const document = documents.find((entry) => entry.slug === slug);
		assert.ok(document, `${slug}: missing document`);
		for (let number = 1; number <= count; number++) {
			assert.ok(
				document.headings.some((heading) => heading.id === `article-${number}`),
				`${slug}: missing article ${number}`
			);
		}
	}
	for (const document of documents) {
		assert.equal(
			new Set(document.headings.map((heading) => heading.id)).size,
			document.headings.length
		);
	}
});

test('a proposal has an explicit unapproved status', () => {
	const root = mkdtempSync(join(tmpdir(), 'rules-test-'));
	try {
		const metadata = {
			slug: 'sample',
			file: 'sample.md',
			title: '案',
			shortTitle: '案',
			category: '会則',
			description: '案',
			status: 'proposed',
			date: '2026-10-09',
			dateLabel: '起草日',
			authority: '部員総会',
			sourceTab: 't.0',
			note: '未承認'
		};
		writeFileSync(join(root, 'sample.md'), '# 案\n\n## 第1条\n\n本文\n');
		writeFileSync(join(root, 'index.json'), JSON.stringify([metadata]));
		assert.equal(loadRules(root)[0].statusLabel, '改定案・未承認');
		writeFileSync(join(root, 'index.json'), JSON.stringify([{ ...metadata, status: 'approved' }]));
		assert.throws(() => loadRules(root), /不明な文書状態/);
		writeFileSync(
			join(root, 'index.json'),
			JSON.stringify([{ ...metadata, file: '../private.md' }])
		);
		assert.throws(() => loadRules(root), /本文パス/);
		writeFileSync(join(root, 'index.json'), JSON.stringify([metadata, metadata]));
		assert.throws(() => loadRules(root), /重複/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('duplicate non-article headings receive unique anchors', () => {
	const { headings } = renderRule('# 題\n\n## その他\n\n本文\n\n## その他\n\n本文');
	assert.equal(new Set(headings.map((heading) => heading.id)).size, 2);
});

test('inserted articles keep their own number in links', () => {
	const { headings } = renderRule('# 題\n\n## 第15条\n\n本文\n\n## 第15条の3\n\n本文');
	assert.deepEqual(
		headings.map((heading) => heading.id),
		['article-15', 'article-15-3']
	);
});

test('wording changes inside a line are highlighted character by character', () => {
	const diff = diffMarkdown(
		'# 題\n\n## 第3条\n\n重なる場合は、代替確認者を置く。\n',
		'# 題\n\n## 第3条\n\n重なる場合は、幹部会で承認する。\n\n## 第4条\n'
	);
	const removed = diff.find((line) => line.type === 'del');
	const added = diff.filter((line) => line.type === 'add');
	assert.equal(removed?.text, '重なる場合は、代替確認者を置く。');
	assert.deepEqual(
		removed?.parts
			?.filter((part) => part.type === 'del')
			.map((part) => part.text)
			.join(''),
		'代替確認者を置く'
	);
	assert.equal(added.length, 2);
	assert.equal(added[1].text, '## 第4条');
	assert.ok(!added[1].parts);
	const collapsed = withContext(diffMarkdown('a\nb\nc\nd\ne\n', 'a\nb\nc\nd\nE\n'), 1);
	assert.deepEqual(
		collapsed.map((line) => line.type),
		['gap', 'same', 'del', 'add']
	);
});

test('history lists committed versions of a file newest first', () => {
	const repo = mkdtempSync(join(tmpdir(), 'rules-history-'));
	const run = (/** @type {string[]} */ ...args) =>
		execFileSync('git', ['-C', repo, ...args], { stdio: 'ignore' });
	try {
		run('init', '-q');
		run('config', 'user.email', 'test@example.com');
		run('config', 'user.name', 'test');
		mkdirSync(join(repo, 'rules'));
		writeFileSync(join(repo, 'rules', 'a.md'), '# 案\n\n## 第1条\n\n旧\n');
		run('add', '.');
		run('commit', '-q', '-m', 'first');
		writeFileSync(join(repo, 'rules', 'a.md'), '# 案\n\n## 第1条\n\n新\n');
		run('commit', '-q', '-am', 'second');
		const versions = loadHistory('a.md', repo);
		assert.deepEqual(
			versions.map((version) => version.subject),
			['second', 'first']
		);
		assert.match(versions[0].markdown, /新/);
		assert.match(versions[0].sha256, /^[a-f0-9]{64}$/);
		assert.deepEqual(loadHistory('missing.md', repo), []);
	} finally {
		rmSync(repo, { recursive: true, force: true });
	}
});

test('proposed documents are grouped by their proposal and marked for the vote', () => {
	const root = mkdtempSync(join(tmpdir(), 'rules-proposals-'));
	try {
		const rules = join(root, 'rules');
		const proposals = join(root, 'proposals');
		mkdirSync(rules);
		mkdirSync(proposals);
		const metadata = {
			file: 'a.md',
			title: '案',
			shortTitle: '案',
			category: '新規規則案',
			description: '案',
			status: 'proposed',
			date: '2026-10-09',
			dateLabel: '起草日',
			authority: '部員総会',
			sourceTab: '新規案',
			note: '未承認'
		};
		writeFileSync(join(rules, 'a.md'), '# 案\n\n## 第1条\n\n本文\n');
		writeFileSync(join(proposals, 'p.md'), '# 提案\n\n理由\n');
		writeFileSync(
			join(rules, 'index.json'),
			JSON.stringify([
				{ ...metadata, slug: 'a', proposal: 'p.md', agenda: true },
				{ ...metadata, slug: 'b', proposal: 'p.md' }
			])
		);
		const [proposal] = loadProposals(rules, proposals);
		assert.equal(proposal.id, 'p');
		assert.equal(proposal.title, '提案');
		assert.ok(proposal.agenda);
		assert.deepEqual(
			proposal.documents.map((document) => [document.slug, document.agenda, document.kind]),
			[
				['a', true, '新規'],
				['b', false, '新規']
			]
		);
		writeFileSync(
			join(rules, 'index.json'),
			JSON.stringify([{ ...metadata, slug: 'a', status: 'unconfirmed', agenda: true }])
		);
		assert.throws(() => loadRules(rules), /改定案以外/);
		writeFileSync(
			join(rules, 'index.json'),
			JSON.stringify([{ ...metadata, slug: 'a', proposal: 'missing.md' }])
		);
		assert.throws(() => loadProposals(rules, proposals), /改定案ファイルがありません/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('adopted documents must match a verified passing decision for the voted text', () => {
	const repo = mkdtempSync(join(tmpdir(), 'rules-adopted-'));
	const run = (/** @type {string[]} */ ...args) =>
		execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
	try {
		run('init', '-q');
		run('config', 'user.email', 'test@example.com');
		run('config', 'user.name', 'test');
		const rules = join(repo, 'rules');
		const decisions = join(repo, 'decisions');
		mkdirSync(rules);
		mkdirSync(decisions);
		const text = '# 案\n\n## 第1条\n\n本文\n';
		writeFileSync(join(rules, 'a.md'), text);
		run('add', '.');
		run('commit', '-q', '-m', 'vote target');
		const commit = run('rev-parse', 'HEAD');
		const sha256 = createHash('sha256').update(text).digest('hex');
		const metadata = {
			slug: 'a',
			file: 'a.md',
			title: '案',
			shortTitle: '案',
			category: '細則',
			description: '案',
			status: 'adopted',
			date: '2026-01-05',
			dateLabel: '施行日',
			authority: '部員総会',
			sourceTab: '新規案',
			note: '採択済み',
			decision: '2026-01-05-a'
		};
		const decision = {
			id: '2026-01-05-a',
			date: '2026-01-05',
			body: '部員総会',
			clause: '会則第15条',
			quorum: { members: 20, present: 12, met: true },
			votes: { for: 8, against: 2, abstain: 2, invalid: 0 },
			rule: '有効投票の5分の3以上',
			result: '可決',
			effectiveDate: '2026-01-05',
			pullRequest: 7,
			documents: [{ file: 'a.md', commit, sha256 }],
			minutesVerified: true,
			summary: '規則案を採択'
		};
		const write = (/** @type {object} */ entry, /** @type {object} */ record) => {
			writeFileSync(join(rules, 'index.json'), JSON.stringify([entry]));
			writeFileSync(join(decisions, '2026-01-05-a.json'), JSON.stringify(record));
		};

		write(metadata, decision);
		const [document] = loadRules(rules);
		assert.equal(document.statusLabel, '採択済み');
		assert.equal(document.decisionRecord?.commit, commit);
		// Templates are not read as decisions.
		writeFileSync(join(decisions, '_template.json'), '{}');
		assert.doesNotThrow(() => loadRules(rules));

		write(metadata, { ...decision, effectiveDate: '2999-01-01' });
		assert.equal(loadRules(rules)[0].statusLabel, '採択済み・施行前');

		write(metadata, { ...decision, documents: [{ file: 'a.md', commit, sha256: '0'.repeat(64) }] });
		assert.throws(() => loadRules(rules), /SHA-256が一致しません/);

		write(metadata, { ...decision, result: '否決' });
		assert.throws(() => loadRules(rules), /可決されていません/);

		write(metadata, { ...decision, date: '2999-01-01', effectiveDate: '2999-01-01' });
		assert.throws(() => loadRules(rules), /未来/);

		write(metadata, { ...decision, minutesVerified: false });
		assert.throws(() => loadRules(rules), /照合が済んでいません/);

		write(metadata, {
			...decision,
			quorum: { members: 20, present: 8, met: false },
			votes: { for: 6, against: 2, abstain: 0, invalid: 0 }
		});
		assert.throws(() => loadRules(rules), /定足数が不成立/);

		write(metadata, { ...decision, votes: { for: 10, against: 3, abstain: 0, invalid: 0 } });
		assert.throws(() => loadRules(rules), /出席者数を超えて/);

		write({ ...metadata, decision: 'missing' }, decision);
		assert.throws(() => loadRules(rules), /決議記録がありません/);

		write({ ...metadata, status: 'proposed' }, decision);
		assert.throws(() => loadRules(rules), /採択済み以外に決議ID/);

		write(metadata, decision);
		writeFileSync(join(rules, 'a.md'), '# 案\n\n## 第1条\n\n変更後の本文\n');
		assert.throws(() => loadRules(rules), /再審議/);
	} finally {
		rmSync(repo, { recursive: true, force: true });
	}
});
