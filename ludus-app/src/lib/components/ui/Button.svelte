<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children, class: className = '', variant = 'primary', ...rest } = $props<{
		children?: Snippet;
		class?: string;
		variant?: 'primary' | 'destructive' | 'secondary' | 'accent' | 'answer';
	}>();

	const baseClasses = 'inline-flex items-center justify-center rounded-xl border-2 font-extrabold text-sm px-4 py-2.5 transition-all duration-150 active:translate-y-1';

	const variants = {
		primary: 'bg-gold border-gold-deep text-[#1a1e2a] hover:brightness-110 [box-shadow:0_4px_0_var(--gold-deep)] active:[box-shadow:0_0px_0_var(--gold-deep)]',
		destructive: 'bg-red border-red-deep text-white hover:brightness-110 [box-shadow:0_4px_0_var(--red-deep)] active:[box-shadow:0_0px_0_var(--red-deep)]',
		secondary: 'bg-surface border-border text-text-primary hover:border-gold [box-shadow:0_4px_0_var(--border)] active:[box-shadow:0_0px_0_var(--border)]',
		accent: 'bg-blue border-blue-deep text-white hover:brightness-110 [box-shadow:0_4px_0_var(--blue-deep)] active:[box-shadow:0_0px_0_var(--blue-deep)]',
		answer: 'border-border text-white hover:-translate-y-1 hover:border-white/50 [box-shadow:0_5px_0_rgba(0,0,0,0.5)] font-mono text-xl active:[box-shadow:0_0px_0_rgba(0,0,0,0.5)]'
	};

</script>

<button class="{baseClasses} {variants[variant]} {className}" {...rest}>
	{@render children?.()}
</button>

