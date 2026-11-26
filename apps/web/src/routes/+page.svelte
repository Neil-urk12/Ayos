<script lang="ts">
	import IssueDetailView from '#lib/components/IssueDetailView.svelte';
	import { duplicates } from '#lib/state/duplicates.svelte.ts';
	import { queue } from '#lib/state/queue.svelte.ts';
	import { settings } from '#lib/state/settings.svelte.ts';

	function scoreColor(score: number): string {
		if (score >= settings.current.criticalThreshold) return '#dc2626';
		if (score >= 60) return '#ea580c';
		if (score >= 45) return '#d97706';
		return '#475569';
	}

	function statusClass(status: string): string {
		if (status === 'In progress') return 'pill progress';
		if (status === 'Verified') return 'pill verified';
		return 'pill received';
	}
</script>
{#if queue.selectedIssue}
	<IssueDetailView issue={queue.selectedIssue} />
{:else}
	<div class="page-head">
	<div>
		<h1>Priority queue</h1>
		<p class="subtitle">
			Issue groups ranked by priority score. Scores support decisions; they don't set repair schedules.
		</p>
	</div>

	<div class="controls">
		<select bind:value={queue.selectedCategory} aria-label="Filter by category" class="select">
			<option value="ALL">All categories</option>
			{#each queue.categories as category (category)}
				<option value={category}>{category}</option>
			{/each}
		</select>

		<select bind:value={queue.selectedBarangay} aria-label="Filter by barangay" class="select">
			<option value="ALL">All barangays</option>
			{#each queue.barangays as barangay (barangay)}
				<option value={barangay}>{barangay}</option>
			{/each}
		</select>

		<button type="button" class="btn-export" onclick={() => queue.exportCsv()}>
			Export CSV
		</button>
	</div>
</div>

<section class="kpi-grid" aria-label="Key metrics">
	<div class="kpi-card">
		<div class="kpi-label">Open issue groups</div>
		<div class="kpi-value">{queue.filteredItems.length}</div>
		<div class="kpi-note">From {queue.reportTotal} {queue.reportTotal === 1 ? 'report' : 'reports'}</div>
	</div>

	<div class="kpi-card">
		<div class="kpi-label">Awaiting duplicate check</div>
		<div class="kpi-value">{duplicates.totalCount}</div>
		<div class="kpi-note">{duplicates.oldestWaitingLabel ?? 'Nothing waiting'}</div>
	</div>

	<div class="kpi-card">
		<div class="kpi-label">Critical priority</div>
		<div class="kpi-value">{queue.criticalCount}</div>
		<div class="kpi-note">Score 80 and above</div>
	</div>

	<div class="kpi-card">
		<div class="kpi-label">Median time to verify</div>
		<div class="kpi-value">
			{queue.medianVerifyHours === null ? '—' : `${queue.medianVerifyHours.toFixed(1)} h`}
		</div>
		<div class="kpi-note">Last 30 days</div>
	</div>
</section>


	<section class="table-card" aria-label="Ranked issue groups">
		<table class="queue-table">
			<thead>
				<tr>
					<th class="col-rank">#</th>
					<th>ISSUE GROUP</th>
					<th class="col-num">REPORTS</th>
					<th class="col-age">AGE</th>
					<th class="col-score">SCORE</th>
					<th class="col-status">STATUS</th>
				</tr>
			</thead>
			<tbody>
				{#each queue.filteredItems as item, index (item.id)}
					<tr class="clickable-row" onclick={() => queue.openIssue(item.id)}>
						<td class="col-rank muted">{index + 1}</td>
						<td>
							<div class="issue-title">{item.title}</div>
							<div class="issue-meta">{item.category} · {item.street}, {item.barangay}</div>
						</td>
						<td class="col-num">{item.reports}</td>
						<td class="col-age muted">{item.ageDays} {item.ageDays === 1 ? 'day' : 'days'}</td>
						<td class="col-score">
							<div class="score-wrap">
								<span class="score-num">{item.score}</span>
								<div class="bar-track">
									<div
										class="bar-fill"
										style="width: {item.score}%; background: {scoreColor(item.score)};"
									></div>
								</div>
							</div>
						</td>
						<td class="col-status">
							<span class={statusClass(item.status)}>{item.status}</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}



<style>
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
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

	.table-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		overflow-x: auto;
	}

	.queue-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.queue-table th {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: #64748b;
		padding: 12px 16px;
		border-bottom: 1px solid #e2e8f0;
	}

	.queue-table td {
		padding: 13px 16px;
		border-bottom: 1px solid #f1f5f9;
		vertical-align: middle;
	}

	.queue-table tbody tr:last-child td {
		border-bottom: none;
	}

	.queue-table tbody tr:hover {
		background: #f8fafc;
	}

	.col-rank {
		width: 44px;
	}

	.col-num {
		width: 90px;
		font-size: 0.82rem;
	}

	.col-age {
		width: 100px;
		font-size: 0.82rem;
	}

	.col-score {
		width: 150px;
	}

	.col-status {
		width: 120px;
	}

	.muted {
		color: #64748b;
		font-size: 0.82rem;
	}

	.issue-title {
		font-size: 0.86rem;
		font-weight: 600;
		color: #0f172a;
	}

	.issue-meta {
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 2px;
	}

	.score-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.score-num {
		font-size: 0.82rem;
		font-weight: 700;
		min-width: 24px;
		color: #0f172a;
	}

	.bar-track {
		flex: 1;
		height: 6px;
		background: #e2e8f0;
		border-radius: 999px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 999px;
	}

	.pill {
		display: inline-block;
		padding: 3px 9px;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
	}

	.pill.progress {
		background: #fef3c7;
		color: #b45309;
	}

	.pill.verified {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.pill.received {
		background: #f1f5f9;
		color: #475569;
	}
</style>