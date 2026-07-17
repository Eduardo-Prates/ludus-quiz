<script lang="ts">
	let { score = 0, class: className = '' } = $props();
</script>

<div class="flex items-center gap-4 rounded-full border-2 border-border bg-surface px-6 py-2 backdrop-blur-md [box-shadow:0_4px_0_rgba(0,0,0,0.28)] {className}">
	
	<div class="flex flex-col items-center justify-center leading-none">
		<span class="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mb-1">Pontuação Total</span>
		<div class="flex items-center gap-2">
			<span class="font-mono text-3xl text-gold">{score}</span>
			<span class="text-sm font-mono text-gold-deep mt-1">PTS</span>
		</div>
	</div>
</div>


