<script lang="ts">
	import { authErrorMessage, staff } from '#lib/state/auth.svelte.ts';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let busy = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		if (!email.trim() || !password) {
			error = 'Enter your email and password.';
			return;
		}
		busy = true;
		try {
			// The layout redirects to the queue once staff.signedIn turns true.
			await staff.signIn(email, password);
		} catch (err) {
			error = authErrorMessage(err);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in · AYOS</title>
</svelte:head>

<div class="page">
	<form class="card" onsubmit={submit} novalidate>
		<div class="brand-title">AYOS</div>
		<h1>Staff sign in</h1>
		<p class="subtitle">For LGU staff reviewing resident reports.</p>

		<label for="email">Email</label>
		<input id="email" type="email" autocomplete="username" bind:value={email} />

		<label for="password">Password</label>
		<input id="password" type="password" autocomplete="current-password" bind:value={password} />

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
	</form>
</div>

<style>
	.page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 16px;
		background: #f8fafc;
		color: #0f172a;
	}

	.card {
		width: 100%;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 28px 24px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
	}

	.brand-title {
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: #2563eb;
	}

	h1 {
		margin: 4px 0 0;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.subtitle {
		margin: 0 0 12px;
		font-size: 0.85rem;
		color: #64748b;
	}

	label {
		margin-top: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
	}

	input {
		height: 38px;
		padding: 0 11px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		font-size: 0.9rem;
		color: #0f172a;
	}

	.error {
		margin: 8px 0 0;
		font-size: 0.8rem;
		color: #b91c1c;
	}

	button {
		margin-top: 14px;
		height: 40px;
		border: none;
		border-radius: 6px;
		background: #2563eb;
		color: #ffffff;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>
