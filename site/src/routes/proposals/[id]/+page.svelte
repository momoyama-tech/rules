<script>
	import { resolve } from '$app/paths';
	import DiffBlock from '#lib/DiffBlock.svelte';
	let { data } = $props();
	let proposal = $derived(data.proposal);
	/** @param {string} date */
	const formatDate = (date) => date.slice(0, 10).replaceAll('-', '.');
</script>

<svelte:head>
	<title>{proposal.title} | 桃山学院大学テック部</title>
	<meta name="description" content={`${proposal.title}の理由と変更点。未承認の案です。`} />
</svelte:head>

<div class="reader-layout">
	<aside class="document-nav">
		<a class="back-link" href={resolve('/proposals')}
			><span aria-hidden="true">←</span> 審議中の案</a
		>
		<p class="eyebrow">DOCUMENTS</p>
		<nav aria-label="この案の文書">
			{#each proposal.documents as document}
				<a href={`#${document.slug}`}
					><span>{document.shortTitle}</span><span aria-hidden="true">↓</span></a
				>
			{/each}
		</nav>
	</aside>

	<main id="main" class="reader-main">
		<div class="reader-toolbar">
			<span class="eyebrow">PROPOSAL / {proposal.id.toUpperCase()}</span><button
				class="print-button"
				onclick={() => window.print()}>印刷・PDF保存 <span aria-hidden="true">↗</span></button
			>
		</div>
		<h1>{proposal.title}</h1>
		<div class="reader-metadata">
			<span class="status-badge status-proposed">改定案・未承認</span>
			{#if proposal.agenda}<span>今回の議決対象を含みます</span>{/if}
		</div>

		{#each proposal.documents as document}
			<section
				class="proposal-document"
				id={document.slug}
				aria-labelledby={`${document.slug}-title`}
			>
				<h2 id={`${document.slug}-title`}>
					{document.title}
					<span class="status-badge" class:status-proposed={document.agenda}
						>{document.agenda ? '今回の議決対象' : '審議中'}</span
					>
				</h2>
				<p class="proposal-note">{document.note}</p>
				<p class="proposal-target">
					対象の版
					{#if document.version}<code>{document.version.shortSha}</code>（{formatDate(
							document.version.date
						)}）{:else}コミット前の変更を含みます{/if}・本文SHA-256
					<code class="hash">{document.sha256}</code>
				</p>
				{#if document.base && document.diff.length === 0}
					<p class="history-empty">
						比較元（{document.base
							.shortSha}）から本文の変更はありません。現行の本文をそのまま議決にかけます。
					</p>
				{:else if document.base}
					<h3>比較元（{document.base.shortSha}）からの変更</h3>
					<DiffBlock diff={document.diff} />
				{:else if document.baseMissing}
					<p class="history-empty">比較元の版をこのビルドの履歴から取得できませんでした。</p>
				{:else}
					<p class="history-empty">新規の文書です。全文は本文ページで確認してください。</p>
				{/if}
				<div class="reader-links">
					<a href={resolve('/[slug]', { slug: document.slug })}
						>本文を読む <span aria-hidden="true">↗</span></a
					><a href={resolve('/[slug]/history', { slug: document.slug })}
						>版の履歴 <span aria-hidden="true">↗</span></a
					>
				</div>
			</section>
		{/each}

		{#if proposal.html}
			<h2 class="version-body-title">提案の説明</h2>
			<article class="prose" aria-label={`${proposal.title}の説明`}>{@html proposal.html}</article>
		{/if}
		<div class="document-end"><span class="tiny-line"></span><span>END OF PROPOSAL</span></div>
		{#if proposal.file}
			<div class="reader-links">
				<a
					href={`https://github.com/momoyama-tech/rules/blob/${encodeURIComponent(data.sourceRef)}/proposals/${proposal.file}`}
					>Markdown原文 <span aria-hidden="true">↗</span></a
				>
			</div>
		{/if}
	</main>

	<aside class="table-of-contents"></aside>
</div>
