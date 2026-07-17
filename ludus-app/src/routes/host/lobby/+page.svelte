<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import { game } from '$lib/stores/game.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(async () => {
		await game.createRoom();
	});

	function startGame() {
		if (game.players.length === 0) {
			if (!confirm('Nenhum jogador entrou. Iniciar mesmo assim?')) return;
		}
		goto('/host/game');
	}
</script>

<div class="min-h-screen flex flex-col p-8">
	<header class="flex justify-between items-center mb-12">
		<Card class="py-4 px-8 bg-surface/80 backdrop-blur-md">
			<span class="text-lg text-text-tertiary font-mono uppercase tracking-widest">Acesse:</span>
			<div class="text-3xl font-mono text-text-primary">ludus.app</div>
		</Card>

		<Card class="py-4 px-12 bg-surface/80 backdrop-blur-md border-gold text-center">
			<span class="text-sm font-mono text-gold uppercase tracking-widest">PIN do Jogo</span>
			<div class="text-7xl font-mono text-text-primary tracking-widest [text-shadow:0_4px_0_var(--border)]">
				{game.roomPin || '...'}
			</div>
		</Card>
		
		<Button onclick={startGame} variant="primary" class="h-full px-8 animate-shake text-lg">
			Iniciar Jogo
		</Button>
	</header>

	<main class="flex-1">
		<div class="flex justify-between items-end mb-6">
			<h2 class="text-3xl font-mono text-text-primary [text-shadow:0_2px_0_var(--border)]">Jogadores ({game.players.length})</h2>
		</div>
		
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
			{#each game.players as player, i}
				<Card class="animate-card-in items-center justify-center py-8 hover:border-gold" style="animation-delay: {(i % 10) * 100}ms">
					<span class="text-xl font-bold font-sans text-text-primary">{player.name}</span>
				</Card>
			{/each}
		</div>
	</main>
</div>

