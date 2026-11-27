<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import { staff } from '#lib/state/auth.svelte.ts';
	import { reports } from '#lib/state/reports.svelte.ts';
	import { settings } from '#lib/state/settings.svelte.ts';
	import '../app.css';

	let { children } = $props();

	staff.init();

	const onLogin = $derived(page.url.pathname === '/login');

	// Signed-out staff go to /login; signed-in staff skip it.
	$effect(() => {
		if (!staff.ready) return;
		if (!staff.signedIn && !onLogin) goto(resolve('/login'));
		else if (staff.signedIn && onLogin) goto(resolve('/'));
	});

	// Keep reports live while signed in.
	$effect(() => {
		if (!staff.signedIn) return;
		const unsubscribe = reports.start();
		const unsubscribeSettings = settings.start();
		return () => {
			unsubscribe();
			unsubscribeSettings();
			reports.stop();
		};
	});
</script>

{#if onLogin}
	{@render children()}
{:else if staff.signedIn}
	<div class="shell">
		<Sidebar />
		<main class="workspace">
			{#if reports.error}
				<div class="load-error" role="alert">{reports.error}</div>
			{/if}
			{@render children()}
		</main>
	</div>
{/if}

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

	.load-error {
		margin-bottom: 14px;
		padding: 10px 14px;
		border-radius: 8px;
		border: 1px solid #fecaca;
		background: #fef2f2;
		color: #b91c1c;
		font-size: 0.82rem;
	}
</style>
