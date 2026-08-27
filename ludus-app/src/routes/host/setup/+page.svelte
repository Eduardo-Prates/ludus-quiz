<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { game } from '$lib/stores/game.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { goto } from '$app/navigation';

	let fileContent = $state('');
	let isDragging = $state(false);
	let focusedQuestionIndex = $state(0);

	const colorPalette = ['bg-red', 'bg-blue', 'bg-gold', 'bg-emerald-500'];

	function parseMarkdown(text: string) {
		const lines = text.split('\n');
		const questions = [];
		let currentQuestion: any = null;

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;

			if (trimmed.startsWith('# ')) {
				if (currentQuestion && currentQuestion.options.length > 0) {
					questions.push(currentQuestion);
				}
				
				let rawText = trimmed.replace('# ', '').trim();
				let imageUrl = null;
				
				// Buscar URL na pergunta
				const urlMatch = rawText.match(/(https?:\/\/[^\s]+)/);
				if (urlMatch) {
					const foundUrl = urlMatch[1];
					// Remover a URL do texto visível e limpar pontuações residuais
					rawText = rawText.replace(foundUrl, '').trim();
					
					// Converter link do Google Drive para link direto de imagem
					// O Google bloqueou agressivamente uc?id e thumbnail recentemente.
					// A melhor rota alternativa CDN atual é lh3.googleusercontent.com
					const driveMatch = foundUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
					if (driveMatch) {
						imageUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
					} else {
						imageUrl = foundUrl;
					}
				}

				currentQuestion = {
					text: rawText,
					imageUrl: imageUrl,
					options: [],
					correctId: null
				};
			} else {
				const lowerTrimmed = trimmed.toLowerCase();
				if (lowerTrimmed.startsWith('- [ ]') || lowerTrimmed.startsWith('- [x]')) {
					if (currentQuestion) {
						const isCorrect = lowerTrimmed.startsWith('- [x]');
						let optionText = trimmed.replace(/^- \[[ xX]\] /, '').trim();
						let optionImageUrl = null;
						
						const urlMatch = optionText.match(/(https?:\/\/[^\s]+)/);
						if (urlMatch) {
							const foundUrl = urlMatch[1];
							optionText = optionText.replace(foundUrl, '').trim();
							
							const driveMatch = foundUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
							if (driveMatch) {
								optionImageUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
							} else {
								optionImageUrl = foundUrl;
							}
						}
						
						const optionId = currentQuestion.options.length + 1;
						
						currentQuestion.options.push({
							id: optionId,
							text: optionText,
							imageUrl: optionImageUrl,
							color: colorPalette[(optionId - 1) % colorPalette.length]
						});

						if (isCorrect) {
							currentQuestion.correctId = optionId;
						}
					}
				}
			}
		}

		if (currentQuestion && currentQuestion.options.length > 0) {
			questions.push(currentQuestion);
		}

		game.questionsList = questions;
	}

	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;
		const file = input.files[0];
		readFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files.length) {
			readFile(e.dataTransfer.files[0]);
		}
	}

	function readFile(file: File) {
		const reader = new FileReader();
		reader.onload = (ev) => {
			if (ev.target?.result) {
				fileContent = ev.target.result.toString();
				parseMarkdown(fileContent);
			}
		};
		reader.readAsText(file);
	}

	function deleteQuestion(index: number) {
		game.questionsList = game.questionsList.filter((_, i) => i !== index);
	}

	function finalizeSetup() {
		if (game.questionsList.length === 0) {
			ui.alert('Adicione pelo menos uma pergunta válida!');
			return;
		}
		// Go to lobby, which will create the room
		goto('/host/lobby');
	}
</script>

<div class="min-h-screen flex p-4 sm:p-8 gap-8 max-w-7xl mx-auto">
	<div class="flex-1 flex flex-col w-full max-w-3xl">
	<h1 class="text-4xl font-mono text-gold mb-8 [text-shadow:0_3px_0_var(--gold-deep)]">Setup do Jogo</h1>

	{#if game.questionsList.length === 0}
		<!-- Drag and Drop Zone -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="w-full border-4 border-dashed rounded-3xl p-16 text-center transition-colors {isDragging ? 'border-gold bg-gold/10' : 'border-border bg-surface'}"
			ondragover={(e) => { e.preventDefault(); isDragging = true; }}
			ondragleave={() => isDragging = false}
			ondrop={handleDrop}
		>
			<h2 class="text-2xl font-mono text-text-primary mb-4">Arraste seu arquivo .md aqui</h2>
			<p class="text-text-secondary mb-8">O arquivo será lido automaticamente e transformado em quiz.</p>
			
			<label class="cursor-pointer inline-flex items-center justify-center rounded-xl border-2 font-extrabold text-sm px-6 py-4 transition-all duration-150 bg-blue border-blue-deep text-white hover:brightness-110 [box-shadow:0_4px_0_var(--blue-deep)] active:[box-shadow:0_0px_0_var(--blue-deep)] active:translate-y-1">
				Ou escolha um arquivo
				<input type="file" accept=".md" class="hidden" onchange={handleFileUpload} />
			</label>
			
			<div class="mt-8 text-left inline-block bg-background/50 p-6 rounded-xl border border-border">
				<h3 class="text-sm font-bold text-text-secondary uppercase mb-2">Formato esperado:</h3>
				<pre class="font-mono text-sm text-text-tertiary">
# Qual é a capital do Brasil?
- [ ] São Paulo
- [x] Brasília
- [ ] Rio de Janeiro
- [ ] Salvador</pre>
			</div>
		</div>
	{:else}
		<!-- Editor / Preview Zone -->
		<div class="w-full flex justify-between items-center mb-6">
			<h2 class="text-2xl font-sans font-bold text-text-primary">Perguntas ({game.questionsList.length})</h2>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2 bg-surface/50 px-4 py-2 rounded-xl border border-border">
					<label class="text-sm font-bold text-text-secondary" for="timeInput">Tempo (segundos):</label>
					<input 
						id="timeInput"
						type="number" 
						min="5" 
						max="300" 
						bind:value={game.timePerQuestion} 
						class="w-16 bg-transparent text-text-primary font-mono text-center outline-none border-b border-gold"
					/>
				</div>
				<Button variant="primary" onclick={finalizeSetup}>Criar Sala com essas Perguntas</Button>
			</div>
		</div>

		<div class="w-full flex flex-col gap-6 mb-12">
			{#each game.questionsList as question, qIndex}
				<div onfocusin={() => focusedQuestionIndex = qIndex} onmouseenter={() => focusedQuestionIndex = qIndex} role="presentation">
					<Card class="relative transition-all duration-200 {focusedQuestionIndex === qIndex ? 'border-gold shadow-md shadow-gold/20 scale-[1.01]' : ''}">
					<button 
						class="absolute top-4 right-4 text-error hover:text-red-deep font-bold"
						onclick={() => deleteQuestion(qIndex)}
					>
						Excluir
					</button>
					
					<!-- Make question text editable and show image if any -->
					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 w-11/12">
						{#if question.imageUrl}
							<img src={question.imageUrl} alt="Preview da imagem" class="w-32 h-20 object-cover rounded-lg border-2 border-border shadow-md" />
						{/if}
						<input 
							type="text" 
							bind:value={question.text} 
							class="text-2xl font-bold bg-transparent border-b border-border/50 focus:border-gold outline-none w-full text-text-primary transition-colors"
						/>
					</div>
					
					<div class="grid grid-cols-2 gap-2 mt-2">
						{#each question.options as option}
							<div class="flex flex-col items-start gap-2 p-2 rounded-lg border-2 {question.correctId === option.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-border/50'}">
								<div class="flex items-center w-full gap-2">
									<input 
										type="radio" 
										name="correct-{qIndex}" 
										checked={question.correctId === option.id}
										onchange={() => question.correctId = option.id}
										class="w-4 h-4 cursor-pointer flex-shrink-0"
									/>
									<input 
										type="text" 
										bind:value={option.text} 
										class="bg-transparent outline-none flex-1 font-mono text-sm text-text-secondary focus:text-text-primary"
									/>
								</div>
								{#if option.imageUrl}
									<img src={option.imageUrl} alt="Imagem da opção" class="h-16 w-full object-contain bg-black/20 rounded border border-border/30" />
								{/if}
							</div>
						{/each}
					</div>
				</Card>
				</div>
			{/each}
		</div>
		
		<div class="text-center w-full">
			<label class="cursor-pointer text-text-secondary hover:text-gold transition-colors font-bold underline">
				Importar outro arquivo
				<input type="file" accept=".md" class="hidden" onchange={handleFileUpload} />
			</label>
		</div>
	{/if}
	</div>

	<!-- Phone Preview -->
	{#if game.questionsList.length > 0 && game.questionsList[focusedQuestionIndex]}
	<div class="hidden lg:block w-80 shrink-0">
		<div class="sticky top-8 bg-background border-4 border-border rounded-[2.5rem] shadow-xl overflow-hidden h-[700px] flex flex-col relative [box-shadow:0_8px_0_var(--border)]">
			<!-- Mock notch -->
			<div class="absolute top-0 inset-x-0 h-6 bg-border rounded-b-xl w-32 mx-auto z-10"></div>
			
			<div class="flex-1 flex flex-col overflow-y-auto p-4 bg-surface/30">
				<header class="flex flex-col gap-2 mt-6">
					<div class="flex justify-between items-center w-full">
						<div class="w-full bg-surface border-2 border-border h-3 rounded-full overflow-hidden">
							<div class="h-full bg-gold w-full"></div>
						</div>
					</div>
				</header>

				<main class="flex-1 flex items-center justify-center flex-col gap-2 text-center mt-4">
					{#if game.questionsList[focusedQuestionIndex].imageUrl}
						<img src={game.questionsList[focusedQuestionIndex].imageUrl} alt="Imagem" class="max-w-full max-h-32 object-contain rounded border-2 border-border/50" />
					{/if}
					<div class="!text-[15px] font-sans font-bold text-text-primary !leading-snug break-words px-2">
						{game.questionsList[focusedQuestionIndex].text || 'Pergunta...'}
					</div>
				</main>

				<footer class="w-full mt-auto pt-4 pb-2">
					<div class="grid grid-cols-2 gap-2 w-full">
						{#each game.questionsList[focusedQuestionIndex].options as option}
							<Button 
								variant="answer"
								class="w-full h-24 p-2 {option.color} !text-[11px] sm:!text-[11px] md:!text-[11px] lg:!text-[11px] !leading-[1.2]"
								disabled={true}
							>
								<div class="flex flex-col items-center justify-center gap-1 w-full h-full">
									{#if option.imageUrl}
										<img src={option.imageUrl} alt="img" class="max-h-12 object-contain rounded bg-white p-0.5 shadow-sm" />
									{/if}
									{#if option.text}
										<span class="line-clamp-4">{option.text}</span>
									{/if}
								</div>
							</Button>
						{/each}
					</div>
				</footer>
			</div>
		</div>
	</div>
	{/if}
</div>
