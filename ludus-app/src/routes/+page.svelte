<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { game } from '$lib/stores/game.svelte';
	import { goto } from '$app/navigation';

	let pin = $state('');
	let nickname = $state('');
	let isJoining = $state(false);
	
	async function joinRoom(e: Event) {
		e.preventDefault();
		if (!pin || !nickname || isJoining) return;
		
		isJoining = true;
		const success = await game.joinRoom(pin, nickname);
		
		if (success) {
			goto('/play/game');
		} else {
			isJoining = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<Card class="w-full max-w-md animate-card-in">
		<h1 class="text-4xl font-mono text-center mb-6 text-gold [text-shadow:0_3px_0_var(--gold-deep)]">LUDUS</h1>
		<p class="text-center text-text-secondary mb-8 font-semibold">Insira o PIN para jogar</p>
		
		<form onsubmit={joinRoom} class="flex flex-col gap-4">
			<input 
				type="text" 
				bind:value={pin}
				placeholder="PIN do Jogo" 
				class="text-center text-2xl font-mono uppercase p-4 rounded-xl border-2 border-border bg-background/60 text-text-primary focus:outline-none focus:border-gold placeholder:text-text-tertiary transition-colors"
				maxlength="6"
				required
			/>
			<input 
				type="text" 
				bind:value={nickname}
				placeholder="Seu Apelido" 
				class="text-center text-xl p-4 rounded-xl border-2 border-border bg-background/60 text-text-primary focus:outline-none focus:border-gold placeholder:text-text-tertiary transition-colors"
				maxlength="20"
				required
			/>
			
			<Button type="submit" variant="primary" class="mt-4 animate-shake" disabled={isJoining}>
				{isJoining ? 'Entrando...' : 'Entrar na Sala'}
			</Button>
		</form>
		
		<div class="mt-8 pt-4 border-t-2 border-border-subtle text-center">
			<a href="/host/setup" class="text-sm font-mono text-text-tertiary hover:text-gold transition-colors uppercase">Sou Apresentador</a>
		</div>
	</Card>
</div>

