<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { game } from '$lib/stores/game.svelte';
	import { goto } from '$app/navigation';

	let fileContent = $state('');
	let isDragging = $state(false);

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
				currentQuestion = {
					text: trimmed.replace('# ', '').trim(),
					options: [],
					correctId: null
				};
			} else if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
				if (currentQuestion) {
					const isCorrect = trimmed.startsWith('- [x]');
					const optionText = trimmed.replace(/- \[[ x]\] /, '').trim();
					const optionId = currentQuestion.options.length + 1;
					
					currentQuestion.options.push({
						id: optionId,
						text: optionText,
						color: colorPalette[(optionId - 1) % colorPalette.length]
					});

					if (isCorrect) {
						currentQuestion.correctId = optionId;
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
			alert('Adicione pelo menos uma pergunta válida!');
			return;
		}
		// Go to lobby, which will create the room
		goto('/host/lobby');
	}
</script>

<div class="min-h-screen flex flex-col p-8 items-center max-w-4xl mx-auto">
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
			<Button variant="primary" onclick={finalizeSetup}>Criar Sala com essas Perguntas</Button>
		</div>

		<div class="w-full flex flex-col gap-6 mb-12">
			{#each game.questionsList as question, qIndex}
				<Card class="relative">
					<button 
						class="absolute top-4 right-4 text-error hover:text-red-deep font-bold"
						onclick={() => deleteQuestion(qIndex)}
					>
						Excluir
					</button>
					
					<!-- Make question text editable -->
					<input 
						type="text" 
						bind:value={question.text} 
						class="text-2xl font-bold bg-transparent border-b border-border/50 focus:border-gold outline-none w-11/12 mb-4 text-text-primary transition-colors"
					/>
					
					<div class="grid grid-cols-2 gap-2 mt-2">
						{#each question.options as option}
							<div class="flex items-center gap-2 p-2 rounded-lg border-2 {question.correctId === option.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-border/50'}">
								<input 
									type="radio" 
									name="correct-{qIndex}" 
									checked={question.correctId === option.id}
									onchange={() => question.correctId = option.id}
									class="w-4 h-4 cursor-pointer"
								/>
								<input 
									type="text" 
									bind:value={option.text} 
									class="bg-transparent outline-none flex-1 font-mono text-sm text-text-secondary focus:text-text-primary"
								/>
							</div>
						{/each}
					</div>
				</Card>
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
