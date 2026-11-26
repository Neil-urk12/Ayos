<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { staff } from '#lib/state/auth.svelte.ts';
	import { duplicates } from '#lib/state/duplicates.svelte.ts';

	interface NavItem {
		label: string;
		href: '/' | '/duplicates' | '/reports' | '/analytics' | '/weights';
		badge?: number;
	}

	let {
		onLogout
	}: {
		onLogout?: () => void;
	} = $props();

	const navItems = $derived<NavItem[]>([
		{ label: 'Priority queue', href: '/' },
		{ label: 'Duplicate review', href: '/duplicates', badge: duplicates.totalCount },
		{ label: 'All reports', href: '/reports' },
		{ label: 'Analytics', href: '/analytics' },
		{ label: 'Priority weights', href: '/weights' }
	]);

	function handleLogout() {
		if (onLogout) {
			onLogout();
		} else {
			// The layout sends signed-out users to /login.
			staff.signOut();
		}
	}
</script>

<aside class="sidebar" aria-label="Primary Navigation">
	<div class="brand-box">
		<div class="brand-mark" aria-hidden="true">
			<svg
				width="16"
				height="16"
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
			<div class="brand-title">AYOS</div>
			<div class="brand-sub">Mactan Bohol Cebu Engineering</div>
		</div>
	</div>

	<nav class="nav">
		{#each navItems as item (item.href)}
			{@const active = page.url.pathname === item.href}
			<a href={resolve(item.href)} class="nav-link" class:active>
				<span>{item.label}</span>
				{#if item.badge !== undefined}
					<span class="badge">{item.badge}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<div class="footer-card">
		<div class="user-name">{staff.displayName}</div>
		<div class="user-role">Reviewer · City Engineering</div>
		<button type="button" class="logout-btn" onclick={handleLogout}>
			<svg
				width="13"
				height="13"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
				<polyline points="16 17 21 12 16 7" />
				<line x1="21" y1="12" x2="9" y2="12" />
			</svg>
			<span>Log out</span>
		</button>
	</div>
</aside>

<style>
	.sidebar {
		width: 224px;
		height: 100vh;
		flex-shrink: 0;
		background: #0d1726;
		color: #cbd5e1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 18px 12px;
	}

	.brand-box {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 4px 8px 20px;
	}

	.brand-mark {
		color: #60a5fa;
		display: grid;
		place-items: center;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.brand-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.04em;
	}

	.brand-sub {
		font-size: 0.72rem;
		line-height: 1.35;
		color: #94a3b8;
		margin-top: 2px;
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.nav-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 9px 12px;
		border-radius: 7px;
		font-size: 0.85rem;
		color: #cbd5e1;
		text-decoration: none;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #ffffff;
	}

	.nav-link.active {
		background: #1e2d45;
		color: #ffffff;
		font-weight: 600;
	}

	.badge {
		background: #d97706;
		color: #ffffff;
		font-size: 0.7rem;
		font-weight: 700;
		padding: 1px 7px;
		border-radius: 999px;
	}

	.footer-card {
		background: #152238;
		border: 1px solid #223554;
		border-radius: 8px;
		padding: 10px 12px;
	}

	.user-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: #f8fafc;
	}

	.user-role {
		font-size: 0.7rem;
		color: #94a3b8;
		margin-top: 2px;
	}

	.logout-btn {
		margin-top: 10px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 6px;
		border: 1px solid #2a4066;
		background: rgba(255, 255, 255, 0.04);
		color: #cbd5e1;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
	}

	.logout-btn:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(248, 113, 113, 0.45);
		color: #fecaca;
	}
</style>