<script>
	import { resolve } from '$app/paths';
	let { data } = $props();
	let query = $state('');
	let normalizedQuery = $derived(query.trim().toLocaleLowerCase('ja'));
	let filtered = $derived(
		data.documents.filter((document) =>
			`${document.title} ${document.description} ${document.text}`
				.toLocaleLowerCase('ja')
				.includes(normalizedQuery)
		)
	);
</script>

<svelte:head>
	<title>会則・規則 | 桃山学院大学テック部</title>
	<meta
		name="description"
		content="桃山学院大学テック部の会則・交通費・予算・関係の規則を読む。文書の状態と改定の手順も確認できます。"
	/>
</svelte:head>

<main id="main" class="home-main">
	<section class="hero" aria-labelledby="hero-title">
		<div class="hero-copy">
			<p class="eyebrow"><span class="tiny-line"></span> OUR SHARED PRINCIPLES</p>
			<h1 id="hero-title">私たちの活動を、<br />支えるルール。</h1>
			<p class="hero-description">
				自由な学びと、創造のために。<br />テック部の会則と、日々の活動を支える規則をまとめました。
			</p>
			<a class="primary-link" href={resolve('/[slug]', { slug: 'constitution' })}
				>会則を読む <span aria-hidden="true">↗</span></a
			>
		</div>
		<div class="hero-art" aria-hidden="true">
			<div class="folio-back"></div>
			<div class="folio">
				<div class="folio-top"><span>MOMOYAMA<br />TECH CLUB</span><span>01 — 20</span></div>
				<div class="folio-title">学び、<br />活かし、<br /><span>創り出す。</span></div>
				<div class="folio-bottom"><span>会 則</span><span>EST. 2023</span></div>
			</div>
			<div class="folio-caption">A FOUNDATION FOR CREATIVITY.</div>
		</div>
	</section>

	<section class="documents-section" aria-labelledby="documents-title">
		<div class="section-top">
			<div>
				<p class="eyebrow">DOCUMENTS</p>
				<h2 id="documents-title">
					会則と規則 <span class="document-count"
						>{data.documents.length.toString().padStart(2, '0')}</span
					>
				</h2>
			</div>
			<label class="search-box"
				><span aria-hidden="true">⌕</span><input
					type="search"
					bind:value={query}
					placeholder="キーワードで本文を探す"
					aria-label="会則・規則の本文を検索"
				/></label
			>
		</div>
		{#if query}<p class="search-summary" aria-live="polite">
				「{query}」を含む文書：{filtered.length}件
			</p>{/if}
		<div class="document-grid">
			{#each filtered as document, i}
				<a class="document-card" href={resolve('/[slug]', { slug: document.slug })}>
					<div class="card-top">
						<span class="card-number"
							>{String(i + 1).padStart(2, '0')} <span>/ {document.category}</span></span
						><span
							class="status-badge"
							class:status-pending={document.status === 'unconfirmed'}
							class:status-proposed={document.status === 'proposed'}>{document.statusLabel}</span
						>
					</div>
					<h3>{document.slug === 'constitution' ? 'テック部活動会則' : document.title}</h3>
					<p>{document.description}</p>
					<div class="card-bottom">
						<span
							>{document.headings.filter(
								(heading) => heading.level === 2 && heading.title.startsWith('第')
							).length}条 <span class="dot">·</span> 約{document.readingMinutes}分</span
						><span class="card-arrow" aria-hidden="true">↗</span>
					</div>
				</a>
			{/each}
		</div>
		{#if filtered.length === 0}<div class="empty-state">
				<h3>該当する文書が見つかりませんでした</h3>
				<p>「交通費」「投票」「予算」など、別のキーワードで探してください。</p>
				<button class="text-button" onclick={() => (query = '')}>検索をクリア</button>
			</div>{/if}
		<p class="source-notice">
			<span aria-hidden="true">ⓘ</span>
			{data.documents.some((document) => document.status === 'proposed')
				? '未承認の改定案を含みます。正式な現行規則として扱わず、各文書の状態をご確認ください。'
				: '会則は原本からの移行版です。3つの細則は採択・施行状況を確認中のため、各文書の状態をご確認ください。'}
		</p>
	</section>

	<section class="contribution" aria-labelledby="contribution-title">
		<div>
			<p class="eyebrow">GROW TOGETHER</p>
			<h2 id="contribution-title">ルールも、みんなで育てる。</h2>
			<p>
				気づいたことや、変えたいことはPull Requestへ。<br
				/>変更の理由を共有し、正式な決議を経て会則に反映します。
			</p>
		</div>
		<a
			class="outline-link"
			href={`https://github.com/momoyama-tech/rules/blob/${encodeURIComponent(data.sourceRef)}/README.md`}
			>改定の手順を読む <span aria-hidden="true">↗</span></a
		>
	</section>
</main>
