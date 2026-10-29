<script>
	import { resolve } from '$app/paths';
	let { data } = $props();
	let document = $derived(data.document);
	let version = $derived(data.version);
	/** @param {string} date */
	const formatDate = (date) => date.slice(0, 16).replace('T', ' ').replaceAll('-', '.');
</script>

<svelte:head>
	<title>{version.shortSha}版: {document.title} | 桃山学院大学テック部</title>
	<meta name="description" content={`${document.title}の${version.shortSha}時点の本文と変更点。`} />
</svelte:head>

<div class="reader-layout">
	<aside class="document-nav">
		<a class="back-link" href={resolve('/[slug]/history', { slug: document.slug })}
			><span aria-hidden="true">←</span> 版の履歴</a
		>
		<p class="eyebrow">VERSION</p>
		<nav aria-label="前後の版">
			{#if version.next}<a
					href={resolve('/[slug]/history/[commit]', {
						slug: document.slug,
						commit: version.next.shortSha
					})}><span>新しい版 {version.next.shortSha}</span><span aria-hidden="true">↑</span></a
				>{/if}
			{#if version.previous}<a
					href={resolve('/[slug]/history/[commit]', {
						slug: document.slug,
						commit: version.previous.shortSha
					})}><span>古い版 {version.previous.shortSha}</span><span aria-hidden="true">↓</span></a
				>{/if}
			<a href={resolve('/[slug]', { slug: document.slug })}
				><span>現在の本文</span><span aria-hidden="true">↗</span></a
			>
		</nav>
	</aside>

	<main id="main" class="reader-main">
		<div class="reader-toolbar">
			<span class="eyebrow">{document.category} / VERSION {version.shortSha}</span><button
				class="print-button"
				onclick={() => window.print()}>印刷・PDF保存 <span aria-hidden="true">↗</span></button
			>
		</div>
		<h1>{version.title || document.title}</h1>
		<div class="reader-metadata">
			<span class="status-badge" class:status-pending={!version.isLatest}
				>{version.isLatest ? '最新の版' : '過去の版'}</span
			><span>コミット <code>{version.shortSha}</code></span><span
				>日時 <time datetime={version.date}>{formatDate(version.date)}</time></span
			>
		</div>
		<div class="document-notice" class:proposal-notice={!version.isLatest}>
			<strong>{version.subject}</strong>
			<p>
				この版の本文SHA-256: <code class="hash">{version.sha256}</code><br />
				コミット: <code class="hash">{version.sha}</code>
			</p>
		</div>

		<section class="version-diff" aria-labelledby="diff-title">
			<h2 id="diff-title">
				{version.previous ? `前の版（${version.previous.shortSha}）からの変更` : '初版'}
			</h2>
			{#if !version.previous}
				<p class="history-empty">この文書が最初に追加された版です。</p>
			{:else if version.diff.every((line) => line.type === 'gap')}
				<p class="history-empty">本文の変更はありません（空行や書式のみの変更）。</p>
			{:else}
				<div class="diff-block">
					{#each version.diff as line}
						{#if line.type === 'gap'}
							<div class="diff-gap">… 変更のない {line.count} 行 …</div>
						{:else}
							<div class="diff-line diff-{line.type}">
								<span
									class="diff-mark"
									aria-label={line.type === 'add'
										? '追加'
										: line.type === 'del'
											? '削除'
											: '変更なし'}
									>{line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' '}</span
								><span class="diff-text"
									>{#if line.parts}{#each line.parts as part}{#if part.type === 'same'}{part.text}{:else if part.type === 'add'}<ins
													>{part.text}</ins
												>{:else}<del>{part.text}</del>{/if}{/each}{:else}{line.text}{/if}</span
								>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</section>

		<h2 class="version-body-title">この版の全文</h2>
		<article class="prose" aria-label={`${document.title}（${version.shortSha}版）`}>
			{@html version.html}
		</article>
		<div class="document-end"><span class="tiny-line"></span><span>END OF VERSION</span></div>
		<div class="reader-links">
			<a href={`https://github.com/momoyama-tech/rules/commit/${version.sha}`}
				>GitHubでコミットを見る <span aria-hidden="true">↗</span></a
			><a href={`https://github.com/momoyama-tech/rules/blob/${version.sha}/${version.path}`}
				>この版のMarkdown <span aria-hidden="true">↗</span></a
			>
		</div>
	</main>

	<aside class="table-of-contents">
		<p class="eyebrow">ON THIS PAGE</p>
		<nav aria-label="この版の目次">
			<a href="#diff-title">変更点</a>
			{#each version.headings.filter((heading) => heading.level === 2) as heading}<a
					href={`#${heading.id}`}>{heading.title}</a
				>{/each}
		</nav>
		<a class="top-link" href="#main">ページの先頭へ ↑</a>
	</aside>
</div>
