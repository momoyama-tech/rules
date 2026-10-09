<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head><title>ページが見つかりません | テック部</title></svelte:head>
<main id="main" class="error-page">
	<p class="eyebrow">{page.status}</p>
	<h1>ページが見つかりません</h1>
	<p>文書が移動したか、URLが変更された可能性があります。</p>
	<a class="primary-link" href={resolve('/')}>会則・規則の一覧へ →</a>
</main>
