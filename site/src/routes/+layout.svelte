<script>
	import { resolve, asset } from '$app/paths';
	import { page } from '$app/state';
	import '../app.css';

	let { data, children } = $props();
	let menuOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={asset('favicon.svg')} type="image/svg+xml" />
	<meta name="theme-color" content="#f5f4ef" />
	{#if data.previewMode}<meta name="robots" content="noindex,nofollow" />{/if}
</svelte:head>

<a class="skip-link" href="#main">本文へ移動</a>
{#if data.previewMode}
	<aside class="preview-banner" aria-label="草案プレビュー">
		<strong>未承認の草案プレビュー</strong>
		<span>正式な現行版ではありません。{data.previewLabel}</span>
		<a href={`https://github.com/momoyama-tech/rules/commit/${encodeURIComponent(data.sourceRef)}`}
			>対象コミット {data.sourceRef.slice(0, 7)}</a
		>
	</aside>
{/if}
<header class="site-header">
	<a class="brand" href={resolve('/')} aria-label="テック部 会則・規則のトップ">
		<span class="brand-mark" aria-hidden="true">m<span>t</span></span>
		<span class="brand-name"
			>桃山学院大学 <strong>テック部</strong><small>RULES &amp; GOVERNANCE</small></span
		>
	</a>
	<nav class="header-nav" aria-label="メインナビゲーション">
		<a class:active={!page.params.slug} href={resolve('/')}>会則・規則</a>
		<a href="https://github.com/momoyama-tech/rules/pulls"
			>変更の提案 <span aria-hidden="true">↗</span></a
		>
		<a class="github-link" href="https://github.com/momoyama-tech/rules"
			>GitHub <span aria-hidden="true">↗</span></a
		>
	</nav>
	<button
		class="menu-toggle"
		aria-expanded={menuOpen}
		aria-controls="mobile-nav"
		onclick={() => (menuOpen = !menuOpen)}
		>文書一覧 <span aria-hidden="true">{menuOpen ? '−' : '+'}</span></button
	>
</header>
<nav id="mobile-nav" class="mobile-nav" hidden={!menuOpen} aria-label="モバイル文書ナビゲーション">
	<a href={resolve('/')} onclick={() => (menuOpen = false)}>会則・規則の一覧</a>
	{#each data.documents as document}
		<a href={resolve('/[slug]', { slug: document.slug })} onclick={() => (menuOpen = false)}
			>{document.title}</a
		>
	{/each}
</nav>

{@render children()}

<footer class="site-footer">
	<span class="footer-name">MOMOYAMA TECH</span>
	<p>学び、活かし、創り出す。そのための約束。</p>
	<a
		href={`https://github.com/momoyama-tech/rules/blob/${encodeURIComponent(data.sourceRef)}/README.md`}
		>会則の管理と改定について <span aria-hidden="true">↗</span></a
	>
</footer>
