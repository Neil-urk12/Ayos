<script lang="ts">
	import { weights } from '#lib/state/weights.svelte.ts';
</script>

<svelte:head>
	<title>Priority weights · AYOS Engineering</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Priority weights</h1>
		<p class="subtitle">
			Configure how severity, safety impact, age, and corroborating reports combine into the priority score.
		</p>
	</div>

	<div class="controls">
		<button type="button" class="btn-secondary" onclick={() => weights.resetDefaults()}>
			Reset defaults
		</button>
		<button
			type="button"
			class="btn-primary"
			disabled={!weights.isBalanced}
			onclick={() => weights.saveChanges()}
		>
			Save weights
		</button>
	</div>
</div>

{#if weights.savedNotice}
	<div class="notice" role="status">
		<span>{weights.savedNotice}</span>
		<button type="button" class="notice-close" onclick={() => (weights.savedNotice = null)}>
			Dismiss
		</button>
	</div>
{/if}

<div class="weights-grid">
	<!-- Left column: Scoring factor sliders & numeric weights -->
	<section class="panel" aria-label="Priority score formula weights">
		<div class="panel-head">
			<div>
				<h2>Priority score weights</h2>
				<p class="panel-hint">All four weights must sum to exactly 1.00 before saving.</p>
			</div>

			<div class="total-badge" class:invalid={!weights.isBalanced}>
				Total: {weights.totalWeight.toFixed(2)}
			</div>
		</div>

		<div class="factor-list">
			{#each weights.factors as factor (factor.id)}
				<div class="factor-card">
					<div class="factor-top">
						<div>
							<label for="weight-{factor.id}" class="factor-title">{factor.label}</label>
							<p class="factor-desc">{factor.description}</p>
						</div>

						<div class="weight-input-wrap">
							<input
								id="weight-{factor.id}"
								type="number"
								min="0"
								max="1"
								step="0.05"
								bind:value={factor.weight}
								class="num-input"
							/>
							<span class="pct-hint">{Math.round((factor.weight || 0) * 100)}%</span>
						</div>
					</div>

					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						bind:value={factor.weight}
						aria-label="{factor.label} slider"
						class="range-slider"
					/>
				</div>
			{/each}
		</div>

		{#if !weights.isBalanced}
			<div class="warn-box" role="alert">
				Weights currently total <strong>{weights.totalWeight.toFixed(2)}</strong>. Adjust factors by
				<strong>{(1 - weights.totalWeight).toFixed(2)}</strong> so the total equals <strong>1.00</strong>.
			</div>
		{/if}
	</section>

	<!-- Right column: Live sample preview + Duplicate/Queue thresholds -->
	<aside class="right-stack">
		<section class="panel" aria-label="Sample score preview">
			<div class="preview-head">
				<h2>Sample score preview</h2>
				<span
					class="preview-score"
					class:critical={weights.previewScore >= weights.criticalThreshold}
				>
					{weights.previewScore}
				</span>
			</div>
			<p class="preview-sub">
				Simulated on <strong>G-0317</strong> (Deep pothole, northbound lane · Severity 4/5, High safety, 9 days, 6 reports).
			</p>
			<div class="preview-bar">
				<div
					class="preview-fill"
					style="width: {weights.previewScore}%; background: {weights.previewScore >= weights.criticalThreshold ? '#dc2626' : '#1d4ed8'};"
				></div>
			</div>
			<div class="preview-tier">
				Classification:
				<strong>
					{weights.previewScore >= weights.criticalThreshold ? 'Critical priority' : 'Standard queue'}
				</strong>
			</div>
		</section>

		<section class="panel" aria-label="Triage and clustering thresholds">
			<h2>Triage &amp; clustering thresholds</h2>

			<div class="threshold-list">
				<div class="threshold-row">
					<div>
						<label for="crit-thresh" class="thresh-label">Critical priority cutoff</label>
						<p class="thresh-hint">Minimum score flagged as Critical</p>
					</div>
					<input
						id="crit-thresh"
						type="number"
						min="50"
						max="100"
						step="1"
						bind:value={weights.criticalThreshold}
						class="num-input"
					/>
				</div>

				<div class="threshold-row">
					<div>
						<label for="dup-thresh" class="thresh-label">Duplicate match score</label>
						<p class="thresh-hint">Minimum similarity to suggest merge</p>
					</div>
					<input
						id="dup-thresh"
						type="number"
						min="0.50"
						max="0.99"
						step="0.01"
						bind:value={weights.duplicateScoreThreshold}
						class="num-input"
					/>
				</div>

				<div class="threshold-row">
					<div>
						<label for="radius-thresh" class="thresh-label">Cluster radius (m)</label>
						<p class="thresh-hint">Spatial grouping distance in meters</p>
					</div>
					<input
						id="radius-thresh"
						type="number"
						min="10"
						max="200"
						step="5"
						bind:value={weights.clusterRadiusMeters}
						class="num-input"
					/>
				</div>

				<div class="threshold-row">
					<div>
						<label for="window-thresh" class="thresh-label">Recurrence window (days)</label>
						<p class="thresh-hint">Older matches flag as recurrence</p>
					</div>
					<input
						id="window-thresh"
						type="number"
						min="7"
						max="90"
						step="1"
						bind:value={weights.recurrenceWindowDays}
						class="num-input"
					/>
				</div>
			</div>

			<p class="disclaimer">
				Weights and thresholds shown are placeholders until formally agreed with the LGU.
			</p>
		</section>
	</aside>
</div>

<style>
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 14px;
		margin-bottom: 20px;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f172a;
	}

	.subtitle {
		margin: 4px 0 0;
		font-size: 0.85rem;
		color: #64748b;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.btn-secondary,
	.btn-primary {
		height: 34px;
		padding: 0 14px;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-secondary {
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #1e293b;
	}

	.btn-secondary:hover {
		background: #f1f5f9;
	}

	.btn-primary {
		border: none;
		background: #1d4ed8;
		color: #ffffff;
	}

	.btn-primary:hover:not(:disabled) {
		background: #1e40af;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.notice {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		color: #1e40af;
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 0.82rem;
		margin-bottom: 16px;
	}

	.notice-close {
		background: transparent;
		border: none;
		color: #1d4ed8;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.78rem;
	}

	.weights-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) 320px;
		gap: 16px;
		align-items: start;
	}

	.right-stack {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.panel {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 18px 20px;
	}

	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 16px;
	}

	h2 {
		margin: 0;
		font-size: 0.94rem;
		font-weight: 700;
		color: #0f172a;
	}

	.panel-hint {
		margin: 3px 0 0;
		font-size: 0.76rem;
		color: #64748b;
	}

	.total-badge {
		background: #dcfce7;
		color: #166534;
		font-size: 0.76rem;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: 999px;
		flex-shrink: 0;
	}

	.total-badge.invalid {
		background: #fee2e2;
		color: #b91c1c;
	}

	.factor-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.factor-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 14px 16px;
	}

	.factor-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}

	.factor-title {
		font-size: 0.86rem;
		font-weight: 700;
		color: #0f172a;
	}

	.factor-desc {
		margin: 3px 0 0;
		font-size: 0.76rem;
		color: #64748b;
	}

	.weight-input-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.num-input {
		width: 72px;
		height: 32px;
		padding: 0 8px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #ffffff;
		font-size: 0.82rem;
		font-weight: 600;
		color: #0f172a;
		text-align: right;
	}

	.num-input:focus {
		outline: none;
		border-color: #2563eb;
	}

	.pct-hint {
		font-size: 0.74rem;
		color: #64748b;
		min-width: 34px;
		text-align: right;
	}

	.range-slider {
		width: 100%;
		accent-color: #1d4ed8;
		cursor: pointer;
	}

	.warn-box {
		margin-top: 14px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #b91c1c;
		border-radius: 7px;
		padding: 10px 12px;
		font-size: 0.78rem;
	}

	.preview-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.preview-score {
		font-size: 1.65rem;
		font-weight: 700;
		color: #1d4ed8;
	}

	.preview-score.critical {
		color: #dc2626;
	}

	.preview-sub {
		margin: 0 0 12px;
		font-size: 0.76rem;
		line-height: 1.45;
		color: #64748b;
	}

	.preview-bar {
		height: 7px;
		background: #e2e8f0;
		border-radius: 999px;
		overflow: hidden;
		margin-bottom: 10px;
	}

	.preview-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 0.15s ease;
	}

	.preview-tier {
		font-size: 0.76rem;
		color: #475569;
	}

	.threshold-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 14px;
	}

	.threshold-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid #f1f5f9;
	}

	.threshold-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.thresh-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #1e293b;
	}

	.thresh-hint {
		margin: 2px 0 0;
		font-size: 0.7rem;
		color: #94a3b8;
	}

	.disclaimer {
		margin: 14px 0 0;
		font-size: 0.7rem;
		line-height: 1.4;
		color: #94a3b8;
	}
</style>