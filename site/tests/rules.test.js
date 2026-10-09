import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderRule, loadRules } from '../src/lib/server/rules.js';

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

test('source documents load without implying the three regulations are adopted', () => {
	const documents = loadRules();
	assert.equal(documents.length, 6);
	const regulations = documents.filter((document) => document.category === '細則');
	assert.equal(regulations.length, 3);
	const proposals = documents.filter((document) => document.category === '新規規則案');
	assert.equal(proposals.length, 2);
	assert.ok(proposals.every((document) => document.status === 'proposed'));
	assert.ok(proposals.every((document) => document.note.includes('未決定')));
	assert.ok(regulations.every((document) => document.status === 'unconfirmed'));
	assert.ok(documents.every((document) => /^[a-f0-9]{64}$/.test(document.sha256)));
	for (const [slug, count] of [
		['constitution', 20],
		['travel', 6],
		['budget', 8],
		['relationships', 11],
		['project-distribution', 8],
		['accounting-and-subsidies', 9]
	]) {
		const document = documents.find((entry) => entry.slug === slug);
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
