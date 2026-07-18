<script lang="ts">
	import { ui } from '$lib/stores/ui.svelte';
	import Card from './Card.svelte';
	import { fly } from 'svelte/transition';
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
	{#each ui.toasts as toast (toast.id)}
		<div transition:fly={{ y: 20, duration: 300 }} class="pointer-events-auto">
			<Card class="flex items-center px-6 py-4 shadow-xl border-4 
				{toast.type === 'error' ? 'bg-red text-white border-red-700' : 
				 toast.type === 'success' ? 'bg-emerald-500 text-slate-900 border-emerald-700' : 
				 'bg-surface text-text-primary border-border'}
			">
				<span class="font-sans font-bold text-lg">{toast.message}</span>
			</Card>
		</div>
	{/each}
</div>
