<script>
	import Board from '$lib/Board.svelte';
	import ThemeToggle from '$lib/ThemeToggle.svelte';
	import './styles.css';
</script>

<div class="container">
	<Board height={10} width={10} mines={10} />
</div>

<div id="theme-toggle">
	<ThemeToggle />
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-content: center;
		height: 100%;
	}
	#theme-toggle {
		position: absolute;
		top: 0%;
		right: 0%;
	}
	:global(body) {
		--bg-color: var(--light-background);
		--board-color: var(--light-background);
		--revealed-color: var(--light-color-16);
		--hovered-color: var(--light-color-01);
		--mine-color: var(--light-color-02);
		--flag-color: var(--light-color-07);
		--cell-color: var(--light-color-09);
		--text-color: var(--light-foreground);
		--button-hover-color: var(--light-color-16);
		--hinted-color: var(--light-color-05);
	}
	:global(body.dark-mode) {
		--bg-color: var(--dark-background);
		--board-color: var(--dark-background);
		--revealed-color: var(--dark-color-16);
		--mine-color: var(--dark-color-02);
		--flag-color: var(--dark-color-07);
		--hovered-color: var(--dark-color-09);
		--cell-color: var(--dark-color-01);
		--text-color: var(--dark-foreground);
		--button-hover-color: var(--dark-color-09);
		--hinted-color: var(--dark-color-05);
	}
	:global(body) {
		transition: 300ms;
		background-color: var(--bg-color);
		--border-size: 0.1rem;
		--cell-size: 3rem;
		font-family: 'Fira Mono', monospace;
		color: var(--text-color);
	}
</style>
