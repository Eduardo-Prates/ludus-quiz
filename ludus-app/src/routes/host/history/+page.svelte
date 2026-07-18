<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { supabase } from '$lib/supabase';
	import { ui } from '$lib/stores/ui.svelte';

	let history = $state<any[]>([]);
	let isLoading = $state(true);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('ludus_history');
			if (saved) {
				history = JSON.parse(saved).reverse(); // Newer first
			}
			isLoading = false;
		}
	});

	async function downloadCSV(roomId: string, pin: string) {
		const { data, error } = await supabase
			.from('players')
			.select('name, score')
			.eq('room_id', roomId)
			.order('score', { ascending: false });
			
		if (error || !data) {
			ui.alert('Erro ao buscar dados desta partida.');
			return;
		}

		if (data.length === 0) {
			ui.alert('Nenhum jogador pontuou nesta sala.');
			return;
		}

		let csvContent = "Posicao,Jogador,Pontuacao\n";
		data.forEach((player, index) => {
			csvContent += `${index + 1},${player.name},${player.score}\n`;
		});

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `ludus_partida_${pin}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function deleteRoom(roomId: string) {
		const proceed = await ui.confirm('Deseja apagar esta sala definitivamente do banco de dados? Você não poderá baixar o CSV dela depois.', 'Atenção');
		if (!proceed) return;
		
		const { error } = await supabase
			.from('rooms')
			.delete()
			.eq('id', roomId);
			
		if (error) {
			ui.alert('Erro ao excluir sala do banco.');
			return;
		}
		
		// Remove from local state and storage
		history = history.filter(h => h.id !== roomId);
		localStorage.setItem('ludus_history', JSON.stringify(history.reverse())); // Re-reverse to save original order
		ui.success('Sala apagada com sucesso!');
	}

	function formatDate(isoString: string) {
		return new Date(isoString).toLocaleString('pt-BR');
	}

	async function clearHistory() {
		const proceed = await ui.confirm('Tem certeza que deseja apagar TODAS as salas listadas aqui definitivamente do banco de dados? Você não poderá baixar o CSV de nenhuma delas depois.', 'Limpar Tudo');
		if (proceed) {
			
			const roomIds = history.map(h => h.id);
			
			if (roomIds.length > 0) {
				const { error } = await supabase
					.from('rooms')
					.delete()
					.in('id', roomIds);
					
				if (error) {
					ui.alert('Ocorreu um erro ao tentar limpar o banco de dados.');
					return;
				}
			}

			localStorage.removeItem('ludus_history');
			history = [];
			ui.success('Todo o histórico foi apagado do banco de dados!');
		}
	}
</script>

<div class="min-h-screen flex flex-col p-8 items-center max-w-3xl mx-auto">
	<div class="w-full flex justify-between items-center mb-12">
		<h1 class="text-4xl font-mono text-gold [text-shadow:0_3px_0_var(--gold-deep)]">Histórico de Partidas</h1>
		<div class="flex gap-4">
			{#if history.length > 0}
				<Button variant="destructive" onclick={clearHistory}>Limpar Tudo</Button>
			{/if}
			<Button variant="secondary" onclick={() => window.location.href='/'}>Voltar à Home</Button>
		</div>
	</div>

	{#if isLoading}
		<div class="text-text-secondary animate-pulse text-xl">Carregando histórico...</div>
	{:else if history.length === 0}
		<Card class="w-full p-12 text-center">
			<div class="text-2xl text-text-secondary font-mono">Nenhuma partida criada neste navegador.</div>
		</Card>
	{:else}
		<div class="w-full flex flex-col gap-4">
			{#each history as match}
				<Card class="w-full flex flex-row justify-between items-center p-6 border-2 border-border/50 hover:border-gold transition-colors">
					<div class="flex flex-col">
						<span class="text-2xl font-mono text-text-primary">PIN: <span class="text-gold">{match.pin}</span></span>
						<span class="text-sm font-sans text-text-secondary">{formatDate(match.date)}</span>
					</div>
					
					<div class="flex gap-4">
						<Button variant="primary" onclick={() => downloadCSV(match.id, match.pin)} class="bg-emerald-500 border-emerald-700 text-[#1a1e2a] hover:brightness-110 [box-shadow:0_4px_0_var(--emerald-700)] text-sm px-6 py-2">
							Baixar CSV
						</Button>
						<Button variant="destructive" onclick={() => deleteRoom(match.id)} class="text-sm px-4 py-2 bg-red border-red-700 text-white [box-shadow:0_4px_0_var(--red-700)]" title="Apagar do Banco">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
