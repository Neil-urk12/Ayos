<script lang="ts">
	import LocationRadiusCard from '#lib/components/LocationRadiusCard.svelte';
	import { duplicates } from '#lib/state/duplicates.svelte.ts';

	const item = $derived(duplicates.current);
	const distancePct = $derived(
		item
			? Math.min(100, Math.round((item.metrics.distanceMeters / item.metrics.maxRadiusMeters) * 100))
			: 0
	);
	const timeGapPct = $derived(
		item
			? Math.min(
					100,
					Math.max(12, Math.round((item.metrics.timeGapDays / item.metrics.maxWindowDays) * 100))
				)
			: 0
	);
</script>

<div class="page-head">
	<div>
		<h1>Duplicate review</h1>
		<p class="subtitle">The system suggests matches. Nothing is merged until you confirm.</p>
	</div>
	<div class="counter">
		Suggestion <strong>{duplicates.displayNumber}</strong> of <strong>{duplicates.totalCount}</strong>
	</div>
</div>

{#if duplicates.lastActionMessage}
	<div class="toast" role="status">
		<span>{duplicates.lastActionMessage}</span>
		<button type="button" class="toast-close" onclick={() => (duplicates.lastActionMessage = null)}>
			Dismiss
		</button>
	</div>
{/if}

{#if !item}
	<p class="empty">No duplicate suggestions right now.</p>
{:else}
<div class="review-grid">
	<!-- Left column: Side-by-side report comparison + action bar -->
	<div class="left-stack">
		<div class="compare-grid">
			<!-- New report card -->
			<article class="report-card">
				<div class="photo-box">
					<span class="pill-tag">New report · {item.newReport.code}</span>
					<span class="photo-placeholder">{item.newReport.photoLabel}</span>
				</div>
				<div class="card-body">
					<h3>{item.newReport.quote}</h3>
					<p class="meta">{item.newReport.category} · {item.newReport.street} · {item.newReport.reportedAt}</p>
					<p class="meta">{item.newReport.gpsAccuracy} · {item.newReport.note}</p>
				</div>
			</article>

			<!-- Existing group card -->
			<article class="report-card">
				<div class="photo-box">
					<span class="pill-tag">
						Existing group · {item.existingGroup.code} · {item.existingGroup.reportCount} reports
					</span>
					<span class="photo-placeholder">
						{item.existingGroup.photos[duplicates.activePhotoIndex]}
					</span>
					<button
						type="button"
						class="photo-counter-btn"
						onclick={() => duplicates.nextPhoto()}
						title="Cycle group photos"
					>
						{duplicates.activePhotoIndex + 1} / {item.existingGroup.photos.length} photos
					</button>
				</div>
				<div class="card-body">
					<h3>{item.existingGroup.title}</h3>
					<p class="meta">
						{item.existingGroup.category} · {item.existingGroup.street} · first reported {item.existingGroup.firstReported}
					</p>
					<p class="meta">Status: {item.existingGroup.status}</p>
				</div>
			</article>
		</div>

		<!-- Action bar -->
		<div class="action-card">
			<div class="action-buttons">
				{#if item.existingGroup.status !== 'Resolved'}
					<button type="button" class="btn-primary" onclick={() => duplicates.resolve('merged')}>
						Confirm duplicate · merge into {item.existingGroup.code}
					</button>
				{/if}
				<button type="button" class="btn-secondary" onclick={() => duplicates.resolve('rejected')}>
					Not a duplicate
				</button>
				<button type="button" class="btn-secondary" onclick={() => duplicates.resolve('recurrence')}>
					Recurrence of a fixed issue
				</button>
			</div>
			<div class="skip-row">
				<button type="button" class="btn-skip" onclick={() => duplicates.resolve('skipped')}>
					Skip for now
				</button>
			</div>
		</div>
	</div>

	<!-- Right column: Why it was suggested + Schematic Location card -->
	<aside class="right-stack">
		<section class="why-card">
			<div class="why-head">
				<h2>Why it was suggested</h2>
				<span class="likely-pill">{item.metrics.badge}</span>
			</div>

			<div class="metric-block">
				<div class="metric-row">
					<span class="metric-label">Image similarity</span>
					<span class="metric-val">
						{item.metrics.imageSimilarity === null ? '—' : item.metrics.imageSimilarity.toFixed(2)}
					</span>
				</div>
				<div class="track">
					<div class="fill" style="width: {(item.metrics.imageSimilarity ?? 0) * 100}%;"></div>
				</div>
				<p class="metric-hint">
					{item.metrics.imageSimilarity === null
						? 'Not compared yet: report photos aren’t uploaded'
						: 'Photo embeddings compared by cosine similarity'}
				</p>
			</div>

			<div class="metric-block">
				<div class="metric-row">
					<span class="metric-label">Distance</span>
					<span class="metric-val">{item.metrics.distanceMeters} m</span>
				</div>
				<div class="track">
					<div class="fill" style="width: {distancePct}%;"></div>
				</div>
				<p class="metric-hint">Inside the {item.metrics.maxRadiusMeters} m cluster radius</p>
			</div>

			<div class="metric-block">
				<div class="metric-row">
					<span class="metric-label">Time gap</span>
					<span class="metric-val">{item.metrics.timeGapDays} days</span>
				</div>
				<div class="track">
					<div class="fill" style="width: {timeGapPct}%;"></div>
				</div>
				<p class="metric-hint">
					Inside the {item.metrics.maxWindowDays}-day window; older matches flag as recurrence
				</p>
			</div>

			<div class="score-footer">
				<div class="combined-row">
					<span class="combined-label">Combined match score</span>
					<span class="combined-val">{item.metrics.combinedScore.toFixed(2)}</span>
				</div>
				<p class="metric-hint">
					Suggested at 0.75 and above. Thresholds are set during evaluation.
				</p>
			</div>
		</section>

		<LocationRadiusCard
			groupCode={item.existingGroup.code}
			newDot={item.schematicCoords.newDot}
			groupDot={item.schematicCoords.groupDot}
			radiusMeters={item.metrics.maxRadiusMeters}
		/>
	</aside>
</div>
{/if}

<style>
	.empty {
		padding: 40px 0;
		text-align: center;
		font-size: 0.9rem;
		color: #64748b;
	}

	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 18px;
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

	.counter {
		font-size: 0.84rem;
		color: #64748b;
		padding-top: 6px;
	}

	.counter strong {
		color: #0f172a;
	}

	.toast {
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

	.toast-close {
		background: transparent;
		border: none;
		color: #1d4ed8;
		font-weight: 600;
		cursor: pointer;
		font-size: 0.78rem;
	}

	.review-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 290px;
		gap: 16px;
		align-items: start;
	}

	.left-stack,
	.right-stack {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.compare-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px;
	}

	.report-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.photo-box {
		position: relative;
		height: 245px;
		background: #d6d3cd;
		display: grid;
		place-items: center;
		padding: 12px;
	}

	.photo-placeholder {
		font-size: 0.78rem;
		color: #57534e;
	}

	.pill-tag {
		position: absolute;
		top: 12px;
		left: 12px;
		background: #1e293b;
		color: #ffffff;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 4px 9px;
		border-radius: 5px;
	}

	.photo-counter-btn {
		position: absolute;
		bottom: 10px;
		right: 10px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid #cbd5e1;
		border-radius: 5px;
		padding: 3px 8px;
		font-size: 0.72rem;
		font-weight: 600;
		color: #0f172a;
		cursor: pointer;
	}

	.photo-counter-btn:hover {
		background: #ffffff;
	}

	.card-body {
		padding: 14px 16px 16px;
	}

	.card-body h3 {
		margin: 0 0 6px;
		font-size: 0.92rem;
		font-weight: 700;
		color: #0f172a;
	}

	.meta {
		margin: 3px 0 0;
		font-size: 0.76rem;
		color: #64748b;
	}

	.action-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 14px 16px;
	}

	.action-buttons {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}

	.btn-primary {
		background: #1d4ed8;
		color: #ffffff;
		border: none;
		border-radius: 7px;
		padding: 9px 15px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-primary:hover {
		background: #1e40af;
	}

	.btn-secondary {
		background: #ffffff;
		color: #1e293b;
		border: 1px solid #cbd5e1;
		border-radius: 7px;
		padding: 8px 14px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background: #f8fafc;
	}

	.skip-row {
		display: flex;
		justify-content: flex-end;
		margin-top: 10px;
	}

	.btn-skip {
		background: transparent;
		border: none;
		color: #1d4ed8;
		font-size: 0.78rem;
		font-weight: 500;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
	}

	.why-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 16px;
	}

	.why-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 14px;
	}

	.why-head h2 {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 700;
		color: #0f172a;
	}

	.likely-pill {
		background: #fef3c7;
		color: #b45309;
		font-size: 0.68rem;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 999px;
	}

	.metric-block {
		margin-bottom: 13px;
	}

	.metric-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.78rem;
		margin-bottom: 5px;
	}

	.metric-label {
		color: #334155;
		font-weight: 500;
	}

	.metric-val {
		color: #0f172a;
		font-weight: 700;
	}

	.track {
		height: 5px;
		background: #e2e8f0;
		border-radius: 999px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: #1d4ed8;
		border-radius: 999px;
	}

	.metric-hint {
		margin: 4px 0 0;
		font-size: 0.7rem;
		line-height: 1.35;
		color: #94a3b8;
	}

	.score-footer {
		border-top: 1px solid #f1f5f9;
		padding-top: 12px;
		margin-top: 4px;
	}

	.combined-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.combined-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #0f172a;
	}

	.combined-val {
		font-size: 1.3rem;
		font-weight: 700;
		color: #0f172a;
	}
</style>