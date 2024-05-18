<script>
	import Toggle from 'svelte-toggle';
	function toggleTheme() {
		document.body.classList.toggle('dark-mode');
	}
</script>

<Toggle
	on:toggle={toggleTheme}
	hideLabel
	switchColor="var(--bg-color)"
	toggledColor="var(--text-color)"
	untoggledColor="var(--text-color)"
	width="100px;"
	off="☾"
	on="☼"
/>
