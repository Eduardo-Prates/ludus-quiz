<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { game } from '$lib/stores/game.svelte';

	let isQuestionActive = $state(false);
	let questionTimer: ReturnType<typeof setTimeout>;

	let currentQ = $derived(game.questionsList[game.currentQuestionIndex]);
	let isFinished = $derived(game.currentQuestionIndex >= game.questionsList.length);

	async function startNextQuestion() {
		if (isFinished) return;
		
		isQuestionActive = true;
		
		await game.hostStartQuestion(currentQ.text, currentQ.options, currentQ.correctId, game.timePerQuestion);
		
		questionTimer = setTimeout(() => {
			showLeaderboard();
		}, game.timePerQuestion * 1000);
	}

	async function showLeaderboard() {
		clearTimeout(questionTimer);
		isQuestionActive = false;
		game.currentQuestionIndex++;
		await game.hostShowLeaderboard();
	}

	function exportToCSV() {
		// Criar cabeçalhos
		let csvContent = "Posicao,Jogador,Pontuacao\n";
		
		// Preencher linhas ordenadas pelo score
		game.leaderboard.forEach((player, index) => {
			csvContent += `${index + 1},${player.name},${player.score}\n`;
		});

		// Criar o Blob e forçar o download
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `ludus_resultados_${game.roomPin}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<div class="min-h-screen flex flex-col p-8 items-center justify-center">
	
	{#if game.status === 'leaderboard'}
		<!-- Leaderboard Podium View -->
		<div class="w-full max-w-4xl animate-card-in">
			<h1 class="text-5xl font-mono text-gold mb-12 text-center [text-shadow:0_4px_0_var(--gold-deep)]">PÓDIO GERAL</h1>
			
			<div class="flex flex-col gap-4">
				{#each game.leaderboard.slice(0, 5) as player, i}
					<Card class="flex flex-row items-center justify-between p-6 {i === 0 ? 'border-gold border-4 bg-gold/10' : ''}">
						<div class="flex items-center gap-6">
							<span class="text-4xl font-mono {i === 0 ? 'text-gold' : 'text-text-tertiary'}">#{i + 1}</span>
							<span class="text-3xl font-sans font-bold text-text-primary">{player.name}</span>
						</div>
						<span class="text-3xl font-mono text-text-primary">{player.score} <span class="text-lg text-text-tertiary">PTS</span></span>
					</Card>
				{/each}

				{#if game.leaderboard.length === 0}
					<div class="text-center text-text-secondary text-xl">Nenhum jogador pontuou ainda.</div>
				{/if}
			</div>

			<div class="mt-12 text-center">
				{#if isFinished}
					<div class="text-3xl font-mono text-emerald-400 mb-6">FIM DE JOGO!</div>
					<div class="flex gap-4 justify-center">
						<Button variant="secondary" class="text-xl py-4 px-8" onclick={() => window.location.href='/'}>
							Voltar ao Início
						</Button>
						<Button variant="primary" class="text-xl py-4 px-8 bg-emerald-500 border-emerald-700 text-[#1a1e2a] hover:brightness-110 [box-shadow:0_4px_0_var(--emerald-700)]" onclick={exportToCSV}>
							Exportar para Excel (.CSV)
						</Button>
					</div>
				{:else}
					<Button variant="primary" class="text-xl py-4 px-8" onclick={startNextQuestion}>
						Próxima Pergunta ({game.currentQuestionIndex + 1}/{game.questionsList.length})
					</Button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Default Host Panel -->
		<Card class="w-full max-w-2xl text-center p-12">
			<h1 class="text-4xl font-mono text-gold mb-8">Painel do Apresentador</h1>
			
			<div class="text-xl text-text-primary mb-8 font-sans">
				Jogadores Conectados: <span class="font-bold text-2xl">{game.players.length}</span>
			</div>

			{#if !isQuestionActive}
				{#if !isFinished}
					<Button variant="primary" class="text-2xl py-6 px-12" onclick={startNextQuestion}>
						Lançar Pergunta {game.currentQuestionIndex + 1}
					</Button>
				{:else}
					<div class="text-2xl font-sans text-emerald-400">Todas as perguntas foram respondidas!</div>
				{/if}
			{:else}
				<div class="text-4xl font-sans font-bold text-text-primary mb-12 [text-shadow:0_2px_0_var(--border)]">
					{currentQ.text}
				</div>
				<div class="grid grid-cols-2 gap-4 w-full mb-8">
					{#each currentQ.options as option}
						<div class="flex items-center justify-center p-6 rounded-xl border-4 border-border/20 {option.color} text-white font-bold text-2xl shadow-lg">
							{option.text}
						</div>
					{/each}
				</div>
				<Button variant="destructive" onclick={showLeaderboard}>
					Encerrar Tempo Agora
				</Button>
			{/if}
		</Card>
	{/if}
</div>

