<script lang="ts">
	let { children, class: className = '', animate = false, ...rest } = $props();
</script>

<div
	class="bg-surface text-text-primary border-border flex flex-col rounded-2xl border-2 p-6 [box-shadow:0_5px_0_rgba(0,0,0,0.28)] transition-all duration-300 {animate ? 'animate-float-idle' : ''} {className}"
	{...rest}
>
	{@render children?.()}
</div>

