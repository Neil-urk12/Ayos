<script lang="ts">
	import Sidebar from '#lib/components/Sidebar.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="shell">
	<Sidebar />
	<main class="workspace">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		display: flex;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: #f8fafc;
		color: #0f172a;
	}

	.workspace {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		padding: 28px 32px;
	}
</style>