<script>
	import { resolve } from '$app/paths';
	let { data } = $props();
	let document = $derived(data.document);
</script>

<svelte:head>
	<title>{document.title} | 桃山学院大学テック部</title>
	<meta name="description" content={`${document.description} ${document.statusLabel}。`} />
</svelte:head>

<div class="reader-layout">
	<aside class="document-nav">
		<a class="back-link" href={resolve('/')}><span aria-hidden="true">←</span> 会則・規則の一覧</a>
		<p class="eyebrow">DOCUMENTS</p>
		<nav aria-label="文書一覧">
			{#each data.documents as item}
				<a
					class:current={item.slug === document.slug}
					aria-current={item.slug === document.slug ? 'page' : undefined}
					href={resolve('/[slug]', { slug: item.slug })}
					><span>{item.shortTitle}</span><span aria-hidden="true">↗</span></a
				>
			{/each}
		</nav>
		<div class="nav-note">よりよい活動のために。<br />会則への提案はGitHubから。</div>
	</aside>

	<main id="main" class="reader-main">
		<div class="reader-toolbar">
			<span class="eyebrow">{document.category} / {document.slug.toUpperCase()}</span><button
				class="print-button"
				onclick={() => window.print()}>印刷・PDF保存 <span aria-hidden="true">↗</span></button
			>
		</div>
		<h1>{document.title}</h1>
		<div class="reader-metadata">
			<span
				class="status-badge"
				class:status-pending={document.status === 'unconfirmed'}
				class:status-proposed={document.status === 'proposed'}>{document.statusLabel}</span
			><span
				>{document.dateLabel}
				<time datetime={document.date}>{document.date.replaceAll('-', '.')}</time></span
			>
		</div>
		<div class="document-notice" class:proposal-notice={document.status === 'proposed'}>
			<strong
				>{document.status === 'proposed'
					? 'この文書は未承認の改定案です'
					: 'この文書について'}</strong
			>
			<p>{document.note}</p>
		</div>
		<details class="mobile-toc">
			<summary>この文書の目次</summary>
			<nav aria-label="この文書の目次（モバイル）">
				{#each document.headings.filter((heading) => heading.level === 2) as heading}<a
						href={`#${heading.id}`}>{heading.title}</a
					>{/each}
			</nav>
		</details>
		<article class="prose" aria-label={document.title}>{@html document.html}</article>
		<div class="document-end"><span class="tiny-line"></span><span>END OF DOCUMENT</span></div>
		<div class="reader-links">
			<a
				href={`https://github.com/momoyama-tech/rules/blob/${encodeURIComponent(data.sourceRef)}/rules/${document.file}`}
				>Markdown原文 <span aria-hidden="true">↗</span></a
			><a
				href={`https://github.com/momoyama-tech/rules/commits/${encodeURIComponent(data.sourceRef)}/rules/${document.file}`}
				>変更履歴 <span aria-hidden="true">↗</span></a
			><a href="https://github.com/momoyama-tech/rules/pulls"
				>改定の提案 <span aria-hidden="true">↗</span></a
			>
		</div>
	</main>

	<aside class="table-of-contents">
		<p class="eyebrow">ON THIS PAGE</p>
		<nav aria-label="この文書の目次">
			{#each document.headings.filter((heading) => heading.level === 2) as heading}<a
					href={`#${heading.id}`}>{heading.title}</a
				>{/each}
		</nav>
		<a class="top-link" href="#main">ページの先頭へ ↑</a>
	</aside>
</div>
