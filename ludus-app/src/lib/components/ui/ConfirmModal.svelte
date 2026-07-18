<script lang="ts">
	import { ui } from '$lib/stores/ui.svelte';
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import { fade, scale } from 'svelte/transition';

	function handleConfirm() {
		ui.resolveModal(true);
	}

	function handleCancel() {
		ui.resolveModal(false);
	}
</script>

{#if ui.modalActive}
	<div 
		class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<div transition:scale={{ duration: 200, start: 0.95 }} class="w-full max-w-lg">
			<Card class="flex flex-col gap-6 p-8 border-gold">
				<h2 class="text-3xl font-mono text-gold [text-shadow:0_2px_0_var(--gold-deep)]">
					{ui.modalTitle}
				</h2>
				
				<p class="text-xl font-sans text-text-primary">
					{ui.modalMessage}
				</p>
				
				<div class="flex gap-4 justify-end mt-4">
					<Button variant="secondary" onclick={handleCancel} class="px-6 py-2">
						{ui.modalCancelText}
					</Button>
					<Button variant="primary" onclick={handleConfirm} class="px-8 py-2">
						{ui.modalConfirmText}
					</Button>
				</div>
			</Card>
		</div>
	</div>
{/if}
