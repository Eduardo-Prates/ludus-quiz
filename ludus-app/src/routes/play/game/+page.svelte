<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import ScoreHUD from '$lib/components/ui/ScoreHUD.svelte';
	import { game } from '$lib/stores/game.svelte';

	let selectedAnswer = $state<number | null>(null);
	let isCorrect = $state<boolean | null>(null);
	let pointsEarned = $state(0);
	let showResult = $state(false);
	
	// Timer logic
	const TOTAL_TIME = 20; // 20 seconds per question
	let timeRemaining = $state(TOTAL_TIME);
	let timerInterval: ReturnType<typeof setInterval>;

	import { onMount, onDestroy } from 'svelte';

	// We watch the status from the store
	let currentStatus = $derived(game.status);
	let previousStatus = $state(game.status);
	let shuffledOptions = $state<any[]>([]);

	let rankIndex = $derived(game.leaderboard.findIndex(p => p.id === game.playerId));

	// When status changes to question_active, reset and start
	$effect(() => {
		if (currentStatus === 'question_active' && previousStatus !== 'question_active') {
			selectedAnswer = null;
			isCorrect = null;
			pointsEarned = 0;
			showResult = false;
			timeRemaining = game.timeLimit * 1000;
			
			// Embaralha as opções de forma única para este jogador
			shuffledOptions = game.options ? [...game.options].sort(() => Math.random() - 0.5) : [];
			
			timerInterval = setInterval(() => {
				timeRemaining -= 100;
				if (timeRemaining <= 0) {
					clearInterval(timerInterval);
					timeRemaining = 0;
					if (selectedAnswer === null) {
						selectedAnswer = -1; 
						isCorrect = false;
					}
					showResult = true;
				}
			}, 100);
		}
		previousStatus = currentStatus;
	});

	onDestroy(() => {
		clearInterval(timerInterval);
	});

	const defaultOptions = [
		{ id: 1, text: 'Vermelho', color: 'bg-red' },
		{ id: 2, text: 'Azul', color: 'bg-blue' },
		{ id: 3, text: 'Amarelo', color: 'bg-gold' },
		{ id: 4, text: 'Verde', color: 'bg-emerald-500' }
	];
	const colorPalette = ['bg-red', 'bg-blue', 'bg-gold', 'bg-emerald-500'];

	function selectAnswer(id: number) {
		if (selectedAnswer !== null || timeRemaining <= 0) return;
		selectedAnswer = id;
		
		isCorrect = id === game.correctId; 
		if (isCorrect) {
			const percentage = timeRemaining / (game.timeLimit * 1000);
			pointsEarned = Math.round(percentage * 1000); 
			game.addScore(pointsEarned, true); 
		} else {
			isCorrect = false;
		}
	}
</script>

<div class="min-h-screen flex flex-col justify-between p-4 pb-8">
	<!-- Top Bar -->
	<header class="flex flex-col gap-4 w-full max-w-4xl mx-auto mt-4">
		<div class="flex justify-between items-center">
			<ScoreHUD 
				score={game.score} 
				class="animate-score-pop"
			/>
			
			<div class="text-right">
				<span class="text-[11px] font-mono text-text-tertiary uppercase">Jogador</span>
				<div class="text-lg font-bold text-text-primary">{game.playerName || 'Anônimo'}</div>
			</div>
		</div>

		{#if currentStatus === 'question_active'}
		<!-- Timer Progress Bar -->
		<div class="w-full bg-surface border-2 border-border h-6 rounded-full overflow-hidden [box-shadow:0_4px_0_rgba(0,0,0,0.28)]">
			<div 
				class="h-full bg-gold transition-all duration-100 ease-linear"
				style="width: {(timeRemaining / (game.timeLimit * 1000)) * 100}%; background-color: {timeRemaining < 5000 ? 'var(--error)' : 'var(--gold)'};"
			></div>
		</div>
		{/if}
	</header>

	<!-- Main Area -->
	<main class="flex-1 flex items-center justify-center flex-col gap-6 text-center">
		{#if currentStatus === 'lobby'}
			<div class="text-3xl font-mono text-text-primary animate-pulse">Aguardando o anfitrião iniciar...</div>
			<div class="text-xl text-text-secondary">Olhe para a tela principal!</div>
		{:else if currentStatus === 'leaderboard'}
			{#if rankIndex !== -1}
				<div class="text-2xl text-text-secondary uppercase font-bold tracking-widest mb-2">Sua Posição</div>
				<div class="text-8xl font-mono text-gold animate-card-in [text-shadow:0_6px_0_var(--gold-deep)]">
					{rankIndex + 1}º
				</div>
				{#if rankIndex === 0}
					<div class="text-2xl font-mono text-emerald-400 mt-4 animate-shake">Liderando!</div>
				{:else if rankIndex < 3}
					<div class="text-2xl font-mono text-text-primary mt-4">No Pódio!</div>
				{/if}
			{:else}
				<div class="text-3xl font-mono text-text-primary animate-pulse">Carregando Placar...</div>
			{/if}
		{:else if currentStatus === 'question_active'}
			{#if selectedAnswer !== null && !showResult}
				<div class="text-4xl font-mono text-text-primary animate-float-idle [text-shadow:0_4px_0_var(--border)]">Enviado!</div>
				<div class="text-xl text-text-secondary mt-4">Aguarde o tempo esgotar...</div>
			{:else if showResult && isCorrect === true}
				<div class="text-5xl font-mono text-emerald-400 animate-score-pop [text-shadow:0_4px_0_theme(colors.emerald.700)]">Correto!</div>
				<div class="text-2xl font-mono text-gold animate-shake">+{pointsEarned} PTS</div>
			{:else if showResult && selectedAnswer === -1}
				<div class="text-5xl font-mono text-error animate-shake [text-shadow:0_4px_0_var(--red-deep)]">Tempo Esgotado!</div>
				<div class="text-xl text-text-secondary">Seja mais rápido na próxima.</div>
			{:else if showResult && isCorrect === false}
				<div class="text-5xl font-mono text-error animate-shake [text-shadow:0_4px_0_var(--red-deep)]">Incorreto</div>
				<div class="text-xl text-text-secondary">Você não pontuou nesta rodada.</div>
			{:else}
				<div class="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto gap-4">
					{#if game.imageUrl}
						<img src={game.imageUrl} alt="Imagem da pergunta" class="max-w-full max-h-[30vh] md:max-h-[45vh] lg:max-h-[55vh] object-contain rounded-xl shadow-md border-4 border-border/50" />
					{/if}
					<div class="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-text-primary leading-tight px-2 break-words">{game.currentQuestion || 'Pergunta...'}</div>
				</div>
			{/if}
		{/if}
	</main>

	<!-- Bottom Action Area -->
	<footer class="w-full max-w-4xl mx-auto mt-auto">
		{#if currentStatus === 'question_active'}
		<div class="grid grid-cols-2 gap-3 sm:gap-4 w-full flex-1 min-h-[16rem] auto-rows-fr">
			{#each (shuffledOptions.length ? shuffledOptions : defaultOptions) as option, index}
				<Button 
					variant="answer"
					class="w-full h-full p-2 sm:p-4 {colorPalette[index % colorPalette.length]} {selectedAnswer !== null && selectedAnswer !== option.id ? 'opacity-30 grayscale scale-95' : ''} {selectedAnswer === option.id ? 'border-gold border-4 scale-[1.02]' : ''}"
					onclick={() => selectAnswer(option.id)}
					disabled={selectedAnswer !== null}
				>
					<div class="flex flex-col items-center justify-center gap-2 w-full h-full">
						{#if option.imageUrl}
							<img src={option.imageUrl} alt="Opção" class="max-h-20 sm:max-h-32 lg:max-h-40 object-contain rounded bg-white border border-border/50 p-1 shadow-sm" />
						{/if}
						{#if option.text}
							<span>{option.text}</span>
						{/if}
					</div>
				</Button>
			{/each}
		</div>
		{/if}
	</footer>
</div>


