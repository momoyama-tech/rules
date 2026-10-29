<script>
	import { resolve } from '$app/paths';
	let { data } = $props();
	let documents = $derived(
		data.proposals.flatMap((proposal) =>
			proposal.documents.map((document) => ({ ...document, proposal }))
		)
	);
	let agenda = $derived(documents.filter((document) => document.agenda));
	let others = $derived(documents.filter((document) => !document.agenda));
	/** @param {string} date */
	const formatDate = (date) => date.slice(0, 10).replaceAll('-', '.');
</script>

<svelte:head>
	<title>審議中の案 | 桃山学院大学テック部</title>
	<meta
		name="description"
		content="承認を求めている会則・規則の変更と新規案のまとめ。議決の対象版、本文SHA-256、変更点を確認できます。"
	/>
</svelte:head>

<main id="main" class="proposals-main">
	<p class="eyebrow"><span class="tiny-line"></span> UNDER REVIEW</p>
	<h1>審議中の案</h1>
	<p class="proposals-lead">
		承認を求めている会則・規則の変更と追加のまとめです。ここに載っている文書はまだ採択されていません。
	</p>

	<div class="document-notice proposal-notice">
		<strong>承認の手続</strong>
		<p>
			GitHubのPull
			Requestのマージや承認（Approve）は、正式な承認ではありません。正式な承認は部員総会など、会則で定める機関の決議で行います。投票の前に、対象の版（コミット）と本文SHA-256を議案に記録してください。決議のあとに本文が変わった場合は、審議をやり直します。
		</p>
	</div>

	{#snippet card(/** @type {(typeof documents)[number]} */ document)}
		<article class="proposal-card" class:agenda={document.agenda}>
			<div class="card-top">
				<span class="card-number">{document.kind}<span> / {document.category}</span></span>
				<span class="status-badge" class:status-proposed={document.agenda}
					>{document.agenda ? '今回の議決対象' : '審議中'}</span
				>
			</div>
			<h3>{document.title}</h3>
			<p class="proposal-note">{document.note}</p>
			<dl class="proposal-facts">
				<div>
					<dt>対象の版</dt>
					<dd>
						{#if document.version}<code>{document.version.shortSha}</code>（{formatDate(
								document.version.date
							)}）{:else}コミット前の変更を含みます{/if}
					</dd>
				</div>
				<div>
					<dt>比較元</dt>
					<dd>
						{#if document.base}<code>{document.base.shortSha}</code>（{formatDate(
								document.base.date
							)}）・{#if document.added + document.removed === 0}本文の変更なし{:else}<span
									class="diff-count add">+{document.added}</span
								>
								<span class="diff-count del">−{document.removed}</span
								>{/if}{:else if document.baseMissing}比較元の履歴を取得できません{:else}なし（新規の文書）{/if}
					</dd>
				</div>
				<div>
					<dt>承認主体</dt>
					<dd>{document.authority}</dd>
				</div>
				<div>
					<dt>本文SHA-256</dt>
					<dd><code class="hash">{document.sha256}</code></dd>
				</div>
			</dl>
			<div class="proposal-links">
				<a href={resolve('/[slug]', { slug: document.slug })}
					>本文を読む <span aria-hidden="true">↗</span></a
				>
				<a href={`${resolve('/proposals/[id]', { id: document.proposal.id })}#${document.slug}`}
					>{document.base ? '変更点と理由' : '提案の理由'} <span aria-hidden="true">↗</span></a
				>
				<a href={resolve('/[slug]/history', { slug: document.slug })}
					>版の履歴 <span aria-hidden="true">↗</span></a
				>
			</div>
		</article>
	{/snippet}

	<section aria-labelledby="agenda-title">
		<h2 id="agenda-title" class="proposals-heading">
			今回の議決対象 <span class="document-count">{String(agenda.length).padStart(2, '0')}</span>
		</h2>
		{#if agenda.length}
			<div class="proposal-grid">
				{#each agenda as document}{@render card(document)}{/each}
			</div>
		{:else}
			<p class="history-empty">現在、議決にかけている案はありません。</p>
		{/if}
	</section>

	{#if others.length}
		<section aria-labelledby="others-title">
			<h2 id="others-title" class="proposals-heading">
				その他の審議中の案 <span class="document-count"
					>{String(others.length).padStart(2, '0')}</span
				>
			</h2>
			<p class="proposals-lead">今回の議決には含めず、引き続き審議する案です。</p>
			<div class="proposal-grid">
				{#each others as document}{@render card(document)}{/each}
			</div>
		</section>
	{/if}

	<section aria-labelledby="explain-title">
		<h2 id="explain-title" class="proposals-heading">提案の説明</h2>
		<ul class="proposal-explanations">
			{#each data.proposals as proposal}
				<li>
					<a href={resolve('/proposals/[id]', { id: proposal.id })}
						><span>{proposal.title}</span><span aria-hidden="true">↗</span></a
					>
				</li>
			{/each}
		</ul>
	</section>
</main>
