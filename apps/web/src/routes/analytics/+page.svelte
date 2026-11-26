<script lang="ts">
	import { analytics, type TimeWindow } from '#lib/state/analytics.svelte.ts';

	const windows: { value: TimeWindow; label: string }[] = [
		{ value: '7d', label: 'Last 7 days' },
		{ value: '30d', label: 'Last 30 days' },
		{ value: '90d', label: 'Last 90 days' }
	];
</script>

<svelte:head>
	<title>Analytics · AYOS Engineering</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Analytics</h1>
		<p class="subtitle">
			Triage throughput, duplicate consolidation, and issue distribution across engineering categories.
		</p>
	</div>

	<div class="controls">
		<select bind:value={analytics.window} aria-label="Time window" class="select">
			{#each windows as win}
				<option value={win.value}>{win.label}</option>
			{/each}
		</select>

		<select bind:value={analytics.selectedCategory} aria-label="Category filter" class="select">
			<option value="ALL">All categories</option>
			{#each analytics.data.categories as cat}
				<option value={cat.category}>{cat.category}</option>
			{/each}
		</select>

		<button type="button" class="btn-export" onclick={() => analytics.exportCsv()}>
			Export CSV
		</button>
	</div>
</div>

<section class="kpi-grid" aria-label="Summary metrics">
	<div class="kpi-card">
		<div class="kpi-label">Total reports intake</div>
		<div class="kpi-value">{analytics.data.totalReports}</div>
		<div class="kpi-note">{analytics.data.reportsDelta}</div>
	</div>

	<div class="kpi-card">
		<div class="kpi-label">Duplicate merge rate</div>
		<div class="kpi-value">{analytics.data.mergeRatePct}%</div>
		<div class="kpi-note">Consolidated into existing groups</div>
	</div>

	<div class="kpi-card">
		<div class="kpi-label">Median time to verify</div>
		<div class="kpi-value">{analytics.data.medianVerifyHours}</div>
		<div class="kpi-note">From submission to staff check</div>
	</div>

	<div class="kpi-card">
		<div class="kpi-label">Median time to resolve</div>
		<div class="kpi-value">{analytics.data.medianResolveDays}</div>
		<div class="kpi-note">Across verified issue groups</div>
	</div>
</section>

<div class="analytics-grid">
	<!-- Left card: Breakdown by category -->
	<section class="panel" aria-label="Breakdown by category">
		<div class="panel-head">
			<h2>Reports by category</h2>
			<span class="panel-sub">Volume and verification rate</span>
		</div>

		<div class="category-list">
			{#each analytics.visibleCategories as item}
				{@const sharePct = Math.round((item.reports / analytics.maxCategoryReports) * 100)}
				<div class="cat-row">
					<div class="cat-top">
						<div>
							<span class="cat-name">{item.category}</span>
							<span class="cat-meta">· {item.groups} groups · avg score {item.avgScore}</span>
						</div>
						<div class="cat-right">
							<strong>{item.reports}</strong>
							<span class="verified-tag">{item.verifiedRate}% verified</span>
						</div>
					</div>
					<div class="bar-track">
						<div class="bar-fill" style="width: {sharePct}%;"></div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Right card: Intake vs verified trend -->
	<section class="panel" aria-label="Intake versus verified trend">
		<div class="panel-head">
			<h2>Intake vs. verified</h2>
			<div class="legend">
				<span><i class="swatch navy"></i>Received</span>
				<span><i class="swatch blue"></i>Verified</span>
			</div>
		</div>

		<div class="trend-chart">
			{#each analytics.data.trend as point}
				{@const recPct = Math.round((point.received / analytics.maxTrendReceived) * 100)}
				{@const verPct = Math.round((point.verified / analytics.maxTrendReceived) * 100)}
				<div class="trend-col">
					<div class="bars-pair">
						<div class="col-bar navy" style="height: {recPct}%;" title="{point.received} received"></div>
						<div class="col-bar blue" style="height: {verPct}%;" title="{point.verified} verified"></div>
					</div>
					<div class="trend-nums">{point.received} / {point.verified}</div>
					<div class="trend-label">{point.label}</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<!-- Bottom full-width card: Barangay summary -->
<section class="table-card" aria-label="Barangay summary">
	<div class="table-card-head">
		<h2>Barangay triage summary</h2>
		<span class="panel-sub">Ordered by report volume</span>
	</div>

	<table class="brgy-table">
		<thead>
			<tr>
				<th>BARANGAY</th>
				<th class="col-num">REPORTS</th>
				<th class="col-num">CRITICAL GROUPS</th>
				<th class="col-num">AVG OPEN AGE</th>
			</tr>
		</thead>
		<tbody>
			{#each analytics.data.barangays as row}
				<tr>
					<td class="brgy-name">{row.barangay}</td>
					<td class="col-num">{row.reports}</td>
					<td class="col-num">
						{#if row.criticalGroups > 0}
							<span class="crit-pill">{row.criticalGroups}</span>
						{:else}
							<span class="muted">0</span>
						{/if}
					</td>
					<td class="col-num muted">{row.avgAgeDays} days</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

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

	.select,
	.btn-export {
		height: 34px;
		padding: 0 12px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #1e293b;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-export:hover {
		background: #f1f5f9;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 14px;
		margin-bottom: 18px;
	}

	.kpi-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px 18px;
	}

	.kpi-label {
		font-size: 0.78rem;
		color: #64748b;
	}

	.kpi-value {
		font-size: 1.65rem;
		font-weight: 700;
		color: #0f172a;
		margin: 6px 0 4px;
	}

	.kpi-note {
		font-size: 0.72rem;
		color: #94a3b8;
	}

	.analytics-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
		gap: 16px;
		margin-bottom: 18px;
	}

	.panel {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 18px 20px;
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 16px;
	}

	.panel-head h2,
	.table-card-head h2 {
		margin: 0;
		font-size: 0.94rem;
		font-weight: 700;
		color: #0f172a;
	}

	.panel-sub {
		font-size: 0.74rem;
		color: #94a3b8;
	}

	.category-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.cat-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 6px;
		font-size: 0.82rem;
	}

	.cat-name {
		font-weight: 600;
		color: #0f172a;
	}

	.cat-meta {
		font-size: 0.74rem;
		color: #64748b;
		margin-left: 4px;
	}

	.cat-right {
		display: flex;
		align-items: baseline;
		gap: 8px;
		color: #0f172a;
	}

	.verified-tag {
		font-size: 0.72rem;
		color: #1d4ed8;
		font-weight: 600;
	}

	.bar-track {
		height: 7px;
		background: #e2e8f0;
		border-radius: 999px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: #1d4ed8;
		border-radius: 999px;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 0.72rem;
		color: #64748b;
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.swatch {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		display: inline-block;
	}

	.swatch.navy {
		background: #0d1726;
	}

	.swatch.blue {
		background: #2563eb;
	}

	.trend-chart {
		height: 185px;
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
		gap: 12px;
		padding-top: 12px;
		border-bottom: 1px solid #e2e8f0;
	}

	.trend-col {
		flex: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
	}

	.bars-pair {
		width: 100%;
		max-width: 44px;
		height: 125px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 4px;
	}

	.col-bar {
		width: 12px;
		border-radius: 3px 3px 0 0;
		min-height: 4px;
	}

	.col-bar.navy {
		background: #0d1726;
	}

	.col-bar.blue {
		background: #2563eb;
	}

	.trend-nums {
		font-size: 0.7rem;
		font-weight: 600;
		color: #334155;
	}

	.trend-label {
		font-size: 0.72rem;
		color: #64748b;
		padding-bottom: 8px;
	}

	.table-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		overflow-x: auto;
	}

	.table-card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 15px 18px;
		border-bottom: 1px solid #e2e8f0;
	}

	.brgy-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.brgy-table th {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: #64748b;
		padding: 11px 18px;
		border-bottom: 1px solid #e2e8f0;
	}

	.brgy-table td {
		padding: 12px 18px;
		border-bottom: 1px solid #f1f5f9;
		font-size: 0.82rem;
	}

	.brgy-table tbody tr:last-child td {
		border-bottom: none;
	}

	.brgy-name {
		font-weight: 600;
		color: #0f172a;
	}

	.col-num {
		width: 160px;
	}

	.muted {
		color: #64748b;
	}

	.crit-pill {
		display: inline-block;
		background: #fee2e2;
		color: #b91c1c;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 999px;
	}
</style>