<script>
	/** @type {{ diff: ({type:'same'|'add'|'del',text:string,parts?:{type:'same'|'add'|'del',text:string}[]} | {type:'gap',count:number})[] }} */
	let { diff } = $props();
</script>

<div class="diff-block">
	{#each diff as line}
		{#if line.type === 'gap'}
			<div class="diff-gap">… 変更のない {line.count} 行 …</div>
		{:else}
			<div class="diff-line diff-{line.type}">
				<span
					class="diff-mark"
					aria-label={line.type === 'add' ? '追加' : line.type === 'del' ? '削除' : '変更なし'}
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
