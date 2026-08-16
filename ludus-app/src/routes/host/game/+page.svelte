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
		
		await game.hostStartQuestion(currentQ.text, currentQ.options, currentQ.correctId, game.timePerQuestion, currentQ.imageUrl);
		
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
		let csvContent = "Posicao,Jogador,Pontuacao,Acertos\n";
		
		// Preencher linhas ordenadas pelo score
		game.leaderboard.forEach((player, index) => {
			csvContent += `${index + 1},${player.name},${player.score},${player.correct_answers || 0}\n`;
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

<div class="min-h-screen flex flex-col p-4 sm:p-8 items-center overflow-y-auto">
	
	{#if game.status === 'leaderboard'}
		<!-- Leaderboard Podium View -->
		<div class="w-full max-w-4xl my-auto animate-card-in">
			<h1 class="text-3xl sm:text-5xl font-mono text-gold mb-8 sm:mb-12 text-center [text-shadow:0_4px_0_var(--gold-deep)]">PÓDIO GERAL</h1>
			
			<div class="flex flex-col gap-4">
				{#each game.leaderboard.slice(0, 5) as player, i}
					<Card class="flex flex-row items-center justify-between p-4 sm:p-6 {i === 0 ? 'border-gold border-4 bg-gold/10' : ''}">
						<div class="flex items-center gap-4 sm:gap-6">
							<span class="text-2xl sm:text-4xl font-mono {i === 0 ? 'text-gold' : 'text-text-tertiary'}">#{i + 1}</span>
							<span class="text-xl sm:text-3xl font-sans font-bold text-text-primary">{player.name}</span>
						</div>
						<span class="text-xl sm:text-3xl font-mono text-text-primary">{player.score} <span class="text-sm sm:text-lg text-text-tertiary">PTS</span></span>
					</Card>
				{/each}

				{#if game.leaderboard.length === 0}
					<div class="text-center text-text-secondary text-lg sm:text-xl">Nenhum jogador pontuou ainda.</div>
				{/if}
			</div>

			<div class="mt-8 sm:mt-12 text-center">
				{#if isFinished}
					<div class="text-2xl sm:text-3xl font-mono text-emerald-400 mb-6">FIM DE JOGO!</div>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<Button variant="secondary" class="text-lg sm:text-xl py-3 px-6 sm:py-4 sm:px-8" onclick={() => window.location.href='/'}>
							Voltar ao Início
						</Button>
						<Button variant="primary" class="text-lg sm:text-xl py-3 px-6 sm:py-4 sm:px-8 bg-emerald-500 border-emerald-700 text-[#1a1e2a] hover:brightness-110 [box-shadow:0_4px_0_var(--emerald-700)]" onclick={exportToCSV}>
							Exportar para Excel (.CSV)
						</Button>
					</div>
				{:else}
					<Button variant="primary" class="text-lg sm:text-xl py-3 px-6 sm:py-4 sm:px-8" onclick={startNextQuestion}>
						Próxima Pergunta ({game.currentQuestionIndex + 1}/{game.questionsList.length})
					</Button>
				{/if}
			</div>
		</div>
	{:else}
		{#if !isQuestionActive}
			<!-- Default Host Panel (Lobby) -->
			<Card class="w-full max-w-5xl my-auto text-center p-4 sm:p-8 md:p-12">
				<h1 class="text-2xl sm:text-3xl md:text-4xl font-mono text-gold mb-6 md:mb-8">Painel do Apresentador</h1>
				
				<div class="text-lg sm:text-xl text-text-primary mb-6 md:mb-8 font-sans">
					Jogadores Conectados: <span class="font-bold text-xl sm:text-2xl">{game.players.length}</span>
				</div>

				{#if !isFinished}
					<Button variant="primary" class="text-xl sm:text-2xl py-4 px-8 sm:py-6 sm:px-12" onclick={startNextQuestion}>
						Lançar Pergunta {game.currentQuestionIndex + 1}
					</Button>
				{:else}
					<div class="text-xl sm:text-2xl font-sans text-emerald-400">Todas as perguntas foram respondidas!</div>
				{/if}
			</Card>
		{:else}
			<!-- Active Question View (Matches Participant Screen) -->
			<div class="flex-1 flex flex-col justify-between w-full h-full pb-4 sm:pb-8">
				<header class="w-full max-w-4xl mx-auto flex justify-between items-center mt-4 px-4">
					<div class="text-lg sm:text-xl font-mono text-text-secondary uppercase">Pergunta {game.currentQuestionIndex + 1}</div>
					<Button variant="destructive" class="text-xs sm:text-sm px-4 py-2" onclick={showLeaderboard}>
						Encerrar Tempo
					</Button>
				</header>
				
				<main class="flex-1 flex items-center justify-center flex-col gap-4 text-center w-full px-2 max-w-5xl mx-auto">
					{#if currentQ.imageUrl}
						<img src={currentQ.imageUrl} alt="Imagem da pergunta" class="max-w-full max-h-[25vh] object-contain rounded-xl shadow-md border-4 border-border/50" />
					{/if}
					<div class="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-text-primary leading-tight break-words uppercase">
						{currentQ.text}
					</div>
				</main>
				
				<footer class="w-full max-w-4xl mx-auto mt-auto px-4 sm:px-0">
					<div class="grid grid-cols-2 gap-3 sm:gap-4 w-full min-h-[16rem] auto-rows-fr">
						{#each currentQ.options as option}
							<Button 
								variant="answer"
								class="w-full h-full p-2 sm:p-4 {option.color}"
								disabled={true}
							>
								{option.text}
							</Button>
						{/each}
					</div>
				</footer>
			</div>
		{/if}
	{/if}
</div>

