<script>
	import { resolve } from '$app/paths';
	let { data } = $props();
	let document = $derived(data.document);
	/** @param {string} date */
	const formatDate = (date) => date.slice(0, 16).replace('T', ' ').replaceAll('-', '.');
</script>

<svelte:head>
	<title>版の履歴: {document.title} | 桃山学院大学テック部</title>
	<meta name="description" content={`${document.title}のコミットごとの版と変更点。`} />
</svelte:head>

<div class="reader-layout">
	<aside class="document-nav">
		<a class="back-link" href={resolve('/[slug]', { slug: document.slug })}
			><span aria-hidden="true">←</span> 本文に戻る</a
		>
		<p class="eyebrow">DOCUMENTS</p>
		<nav aria-label="文書一覧">
			{#each data.documents as item}
				<a
					class:current={item.slug === document.slug}
					aria-current={item.slug === document.slug ? 'page' : undefined}
					href={resolve('/[slug]/history', { slug: item.slug })}
					><span>{item.shortTitle}</span><span aria-hidden="true">↗</span></a
				>
			{/each}
		</nav>
	</aside>

	<main id="main" class="reader-main">
		<div class="reader-toolbar">
			<span class="eyebrow">{document.category} / VERSION HISTORY</span>
		</div>
		<h1>{document.title}<span class="history-heading">版の履歴</span></h1>
		<div class="document-notice">
			<strong>コミットごとの版</strong>
			<p>
				本文が変わったコミットごとに、その時点の全文と直前の版からの変更点を確認できます。議決では対象の版（コミット）と本文SHA-256を記録してください。履歴に載っていても採択されたことを意味しません。
			</p>
		</div>
		{#if data.versions.length === 0}
			<p class="history-empty">このビルドではGitの履歴を取得できませんでした。</p>
		{:else}
			<ol class="version-list">
				{#each data.versions as version}
					<li>
						<a
							class="version-card"
							href={resolve('/[slug]/history/[commit]', {
								slug: document.slug,
								commit: version.shortSha
							})}
						>
							<div class="version-top">
								<code>{version.shortSha}</code>
								<time datetime={version.date}>{formatDate(version.date)}</time>
								{#if version.isLatest}<span class="status-badge">最新</span>{/if}
								{#if version.isFirst}<span class="status-badge status-pending">初版</span>{/if}
							</div>
							<p class="version-subject">{version.subject}</p>
							<div class="version-meta">
								<span class="diff-count add">+{version.added}</span>
								<span class="diff-count del">−{version.removed}</span>
								<span class="version-hash" title="本文SHA-256"
									>SHA-256 {version.sha256.slice(0, 16)}…</span
								>
							</div>
						</a>
					</li>
				{/each}
			</ol>
		{/if}
	</main>

	<aside class="table-of-contents"></aside>
</div>
