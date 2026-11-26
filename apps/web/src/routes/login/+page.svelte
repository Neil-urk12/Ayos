<script lang="ts">
	import { authErrorMessage, staff } from '#lib/state/auth.svelte.ts';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let errorMessage = $state<string | null>(null);
	let busy = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = null;
		if (!email.trim() || !password) {
			errorMessage = 'Enter your email and password.';
			return;
		}
		busy = true;
		try {
			// The layout redirects to the queue once staff.signedIn turns true.
			await staff.signIn(email, password);
		} catch (err) {
			errorMessage = authErrorMessage(err);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in · AYOS Engineering</title>
</svelte:head>

<div class="login-page">
	<section class="brand-panel" aria-label="System overview">
		<div class="brand-top">
			<div class="logo-badge" aria-hidden="true">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
					/>
				</svg>
			</div>
			<div>
				<div class="brand-name">AYOS</div>
				<div class="brand-office">Mactan Bohol Cebu Engineering</div>
			</div>
		</div>

		<div class="brand-copy">
			<h1>Infrastructure triage &amp; priority queue</h1>
			<p>
				Review incoming citizen reports, verify duplicate clusters, and coordinate field repair
				crews across barangays.
			</p>
		</div>

		<div class="brand-footer">
			Authorized LGU &amp; City Engineering personnel only.
		</div>
	</section>

	<section class="form-panel" aria-label="Sign in">
		<div class="form-card">
			<div class="form-header">
				<h2>Sign in to AYOS</h2>
				<p>Enter your engineering reviewer credentials to continue.</p>
			</div>

			{#if errorMessage}
				<div class="error-banner" role="alert">{errorMessage}</div>
			{/if}

			<form onsubmit={handleSubmit} class="form-stack" novalidate>
				<div class="field">
					<label for="email">Email address</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="reviewer@engineering.gov.ph"
						autocomplete="username"
						required
					/>
				</div>

				<div class="field">
					<label for="password">Password</label>
					<div class="password-wrap">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="••••••••••••"
							autocomplete="current-password"
							required
						/>
						<button
							type="button"
							class="toggle-pw"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>

				<button type="submit" class="btn-signin" disabled={busy}>
					{busy ? 'Signing in...' : 'Sign in'}
				</button>
			</form>
		</div>
	</section>
</div>

<style>
	.login-page {
		display: grid;
		grid-template-columns: 420px minmax(0, 1fr);
		width: 100%;
		min-height: 100vh;
		background: #f8fafc;
		color: #0f172a;
	}

	@media (max-width: 768px) {
		.login-page {
			grid-template-columns: minmax(0, 1fr);
		}

		.brand-panel {
			display: none;
		}

		.form-panel {
			padding: 16px;
		}
	}

	.brand-panel {
		background: #0d1726;
		color: #cbd5e1;
		padding: 40px 36px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.brand-top {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo-badge {
		width: 38px;
		height: 38px;
		border-radius: 9px;
		background: #152238;
		border: 1px solid #223554;
		color: #60a5fa;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.brand-name {
		font-size: 1.05rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.04em;
	}

	.brand-office {
		font-size: 0.78rem;
		color: #94a3b8;
		margin-top: 2px;
	}

	.brand-copy h1 {
		margin: 0 0 12px;
		font-size: 1.55rem;
		line-height: 1.28;
		font-weight: 700;
		color: #ffffff;
	}

	.brand-copy p {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.6;
		color: #94a3b8;
	}

	.brand-footer {
		font-size: 0.75rem;
		color: #64748b;
		border-top: 1px solid #1e2d45;
		padding-top: 16px;
	}

	.form-panel {
		display: grid;
		place-items: center;
		padding: 32px;
	}

	.form-card {
		width: 100%;
		max-width: 400px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 28px 30px;
		box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
	}

	.form-header {
		margin-bottom: 22px;
	}

	.form-header h2 {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 700;
		color: #0f172a;
	}

	.form-header p {
		margin: 5px 0 0;
		font-size: 0.82rem;
		color: #64748b;
	}

	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #b91c1c;
		border-radius: 7px;
		padding: 9px 12px;
		font-size: 0.8rem;
		margin-bottom: 16px;
	}

	.form-stack {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #334155;
	}

	input[type='email'],
	input[type='password'],
	input[type='text'] {
		width: 100%;
		height: 38px;
		padding: 0 12px;
		border: 1px solid #cbd5e1;
		border-radius: 7px;
		font-size: 0.85rem;
		color: #0f172a;
		background: #ffffff;
	}

	input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

	.password-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.password-wrap input {
		padding-right: 54px;
	}

	.toggle-pw {
		position: absolute;
		right: 10px;
		background: transparent;
		border: none;
		font-size: 0.74rem;
		font-weight: 600;
		color: #64748b;
		cursor: pointer;
	}

	.toggle-pw:hover {
		color: #0f172a;
	}

	.btn-signin {
		height: 40px;
		border: none;
		border-radius: 7px;
		background: #1d4ed8;
		color: #ffffff;
		font-size: 0.86rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 4px;
	}

	.btn-signin:hover:not(:disabled) {
		background: #1e40af;
	}

	.btn-signin:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}
</style>