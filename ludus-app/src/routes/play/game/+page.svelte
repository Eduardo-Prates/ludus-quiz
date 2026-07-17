<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import ScoreHUD from '$lib/components/ui/ScoreHUD.svelte';
	import { game } from '$lib/stores/game.svelte';

	let selectedAnswer = $state<number | null>(null);
	let isCorrect = $state<boolean | null>(null);
	let pointsEarned = $state(0);
	
	// Timer logic
	const TOTAL_TIME = 20; // 20 seconds per question
	let timeRemaining = $state(TOTAL_TIME);
	let timerInterval: ReturnType<typeof setInterval>;

	import { onMount, onDestroy } from 'svelte';

	// We watch the status from the store
	let currentStatus = $derived(game.status);
	let previousStatus = $state(game.status);

	let rankIndex = $derived(game.leaderboard.findIndex(p => p.id === game.playerId));

	// When status changes to question_active, reset and start
	$effect(() => {
		if (currentStatus === 'question_active' && previousStatus !== 'question_active') {
			resetForNewQuestion();
			startTimer();
		}
		previousStatus = currentStatus;
	});

	function resetForNewQuestion() {
		selectedAnswer = null;
		isCorrect = null;
		pointsEarned = 0;
	}

	onDestroy(() => {
		clearInterval(timerInterval);
	});

	function startTimer() {
		clearInterval(timerInterval);
		timeRemaining = TOTAL_TIME;
		timerInterval = setInterval(() => {
			if (timeRemaining > 0) {
				timeRemaining -= 0.1;
			} else {
				timeRemaining = 0;
				clearInterval(timerInterval);
				if (selectedAnswer === null) {
					handleTimeUp();
				}
			}
		}, 100);
	}

	function handleTimeUp() {
		selectedAnswer = -1; // -1 indicates timeout
		isCorrect = false;
	}

	const defaultOptions = [
		{ id: 1, text: 'Vermelho', color: 'bg-red' },
		{ id: 2, text: 'Azul', color: 'bg-blue' },
		{ id: 3, text: 'Amarelo', color: 'bg-gold' },
		{ id: 4, text: 'Verde', color: 'bg-emerald-500' }
	];

	function selectAnswer(id: number) {
		if (selectedAnswer !== null || timeRemaining <= 0) return;
		selectedAnswer = id;
		clearInterval(timerInterval);
		
		setTimeout(() => {
			isCorrect = id === game.correctId; 
			if (isCorrect) {
				const percentage = timeRemaining / TOTAL_TIME;
				pointsEarned = Math.round(percentage * 1000); 
				game.addScore(pointsEarned); 
			}
		}, 1000);
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
				style="width: {(timeRemaining / TOTAL_TIME) * 100}%; background-color: {timeRemaining < 5 ? 'var(--error)' : 'var(--gold)'};"
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
			{#if selectedAnswer !== null && isCorrect === null}
				<div class="text-4xl font-mono text-text-primary animate-float-idle [text-shadow:0_4px_0_var(--border)]">Enviando...</div>
			{:else if isCorrect === true}
				<div class="text-5xl font-mono text-emerald-400 animate-score-pop [text-shadow:0_4px_0_theme(colors.emerald.700)]">Correto!</div>
				<div class="text-2xl font-mono text-gold animate-shake">+{pointsEarned} PTS</div>
			{:else if selectedAnswer === -1}
				<div class="text-5xl font-mono text-error animate-shake [text-shadow:0_4px_0_var(--red-deep)]">Tempo Esgotado!</div>
				<div class="text-xl text-text-secondary">Seja mais rápido na próxima.</div>
			{:else if isCorrect === false}
				<div class="text-5xl font-mono text-error animate-shake [text-shadow:0_4px_0_var(--red-deep)]">Incorreto</div>
				<div class="text-xl text-text-secondary">Você não pontuou nesta rodada.</div>
			{:else}
				<div class="text-3xl font-sans font-bold text-text-primary">{game.currentQuestion || 'Pergunta...'}</div>
			{/if}
		{/if}
	</main>

	<!-- Bottom Action Area -->
	<footer class="w-full max-w-4xl mx-auto">
		{#if currentStatus === 'question_active'}
		<div class="grid grid-cols-2 gap-4 h-64">
			{#each (game.options.length ? game.options : defaultOptions) as option}
				<Button 
					variant="answer"
					class="w-full h-full text-2xl {option.color || defaultOptions[option.id-1].color} text-white {selectedAnswer !== null && selectedAnswer !== option.id ? 'opacity-30 grayscale scale-95' : ''} {selectedAnswer === option.id ? 'border-gold border-4 scale-105' : ''}"
					onclick={() => selectAnswer(option.id)}
					disabled={selectedAnswer !== null}
				>
					{option.text}
				</Button>
			{/each}
		</div>
		{/if}
	</footer>
</div>


