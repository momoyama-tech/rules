<script>
	import { resolve } from '$app/paths';
	let { data } = $props();
	/** @param {string} date */
	const formatDate = (date) => date.replaceAll('-', '.');
</script>

<svelte:head>
	<title>決議記録 | 桃山学院大学テック部</title>
	<meta
		name="description"
		content="会則・規則の採択に関する決議の公開用の概要。決議日、票数、投票対象の版と本文SHA-256を確認できます。"
	/>
</svelte:head>

<main id="main" class="proposals-main">
	<p class="eyebrow"><span class="tiny-line"></span> DECISIONS</p>
	<h1>決議記録</h1>
	<p class="proposals-lead">
		会則・規則の採択に関する決議の、公開用の概要です。正式な議事録は別に保管しています。個人名と個人別の投票は載せません。
	</p>
	<div class="document-notice">
		<strong>照合の仕組み</strong>
		<p>
			「採択済み」と表示する文書は、ここにある可決の決議記録と結び付いています。サイトのビルド時に、記録した投票対象コミットの本文と現在の本文のSHA-256が一致するかを確かめ、一致しない場合は公開できないようにしています。
		</p>
	</div>

	{#if data.decisions.length === 0}
		<p class="history-empty">まだ決議記録はありません。</p>
	{:else}
		<ol class="decision-list">
			{#each data.decisions as decision}
				<li class="decision-card" id={decision.id}>
					<h2>
						{formatDate(decision.date)}
						{decision.body}
						<span class="status-badge" class:status-adopted={decision.result === '可決'}
							>{decision.result}</span
						>
					</h2>
					<p class="proposal-note">{decision.summary}</p>
					<dl class="proposal-facts">
						<div>
							<dt>根拠</dt>
							<dd>{decision.clause}</dd>
						</div>
						<div>
							<dt>定足数</dt>
							<dd>
								出席 {decision.quorum.present}/{decision.quorum.members}名（{decision.quorum.met
									? '成立'
									: '不成立'}）
							</dd>
						</div>
						<div>
							<dt>票数</dt>
							<dd>
								賛成 {decision.votes.for}・反対 {decision.votes.against}・棄権 {decision.votes
									.abstain}・無効 {decision.votes.invalid}
							</dd>
						</div>
						<div>
							<dt>判定方法</dt>
							<dd>{decision.rule}</dd>
						</div>
						<div>
							<dt>施行日</dt>
							<dd>{formatDate(decision.effectiveDate)}</dd>
						</div>
						<div>
							<dt>議事録照合</dt>
							<dd>{decision.minutesVerified ? '照合済み' : '未照合'}</dd>
						</div>
						<div>
							<dt>決議ID</dt>
							<dd><code>{decision.id}</code></dd>
						</div>
					</dl>
					<ul>
						{#each decision.documents as document}
							<li>
								{#if document.slug}<a
										class="history-link"
										href={resolve('/[slug]', { slug: document.slug })}>{document.title}</a
									>{:else}{document.title}{/if}
								— 版 <code>{document.commit.slice(0, 7)}</code>・SHA-256
								<code class="hash">{document.sha256}</code>
								{#if document.slug && !document.current}（現在の本文とは異なります）{/if}
							</li>
						{/each}
					</ul>
					<div class="proposal-links">
						<a href={`https://github.com/momoyama-tech/rules/pull/${decision.pullRequest}`}
							>対象PR #{decision.pullRequest} <span aria-hidden="true">↗</span></a
						>
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</main>
