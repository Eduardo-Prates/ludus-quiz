<script>
	import './layout.css';
	import '@fontsource/nunito/400.css';
	import '@fontsource/nunito/700.css';
	import '@fontsource/nunito/800.css';
	import '@fontsource/silkscreen/400.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="balatro-bg"></div>

{@render children()}

