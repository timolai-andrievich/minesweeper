<script>
	import { createEventDispatcher } from 'svelte';
	export let mine;
	export let revealed;
	export let adjacentMines;
	export let flagged;
	export let hinted;
	$: text = ((mine, adjacentMines) => {
		if (flagged) {
			return '🚩';
		} else if (!revealed) {
			return '';
		} else if (mine) {
			return '💥';
		} else if (adjacentMines == 0) {
			return '';
		} else {
			return adjacentMines;
		}
	})(mine, adjacentMines);

	const dispatch = createEventDispatcher();
</script>

<button
	class:cell={true}
	class:mine
	class:revealed
	class:flagged
	class:hinted
	on:contextmenu|preventDefault
	on:mousedown|preventDefault={(event) => {
		if (event.buttons == 1) {
			dispatch('reveal');
		} else if (event.buttons == 2) {
			dispatch('flagged');
		}
	}}>{text}</button
>

<style>
	.cell {
		width: var(--cell-size);
		height: var(--cell-size);
		background-color: var(--cell-color);
		font-family: inherit;
		transition: 100ms;
		border: solid var(--border-size) var(--board-color);
	}
	.cell:hover {
		background-color: var(--hovered-color);
	}
	.cell.revealed {
		background-color: var(--revealed-color);
	}
	.cell.hinted {
		background-color: var(--hinted-color);
	}
	.cell.flagged {
		background-color: var(--flag-color);
	}
	.cell.mine {
		background-color: var(--mine-color);
	}
</style>
