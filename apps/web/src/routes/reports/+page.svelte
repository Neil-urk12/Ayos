<script lang="ts">
	import { reportList, type ReportStatus } from '#lib/state/report-list.svelte.ts';

	function badgeClass(status: ReportStatus): string {
		if (status === 'In progress') return 'pill progress';
		if (status === 'Verified') return 'pill verified';
		if (status === 'Duplicate') return 'pill duplicate';
		if (status === 'Resolved') return 'pill resolved';
		return 'pill received';
	}
</script>

<svelte:head>
	<title>All reports · AYOS Engineering</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>All reports</h1>
		<p class="subtitle">
			Every incoming report submitted to City Engineering, including grouped and standalone items.
		</p>
	</div>

	<div class="controls">
		<input
			type="search"
			bind:value={reportList.searchQuery}
			placeholder="Search code, street, summary..."
			aria-label="Search reports"
			class="search-input"
		/>

		<select bind:value={reportList.selectedCategory} aria-label="Filter by category" class="select">
			<option value="ALL">All categories</option>
			{#each reportList.categories as category (category)}
				<option value={category}>{category}</option>
			{/each}
		</select>

		<select bind:value={reportList.selectedBarangay} aria-label="Filter by barangay" class="select">
			<option value="ALL">All barangays</option>
			{#each reportList.barangays as barangay (barangay)}
				<option value={barangay}>{barangay}</option>
			{/each}
		</select>

		<select bind:value={reportList.selectedStatus} aria-label="Filter by status" class="select">
			<option value="ALL">All statuses</option>
			{#each reportList.statuses as status (status)}
				<option value={status}>{status}</option>
			{/each}
		</select>

		<button type="button" class="btn-export" onclick={() => reportList.exportCsv()}>
			Export CSV
		</button>
	</div>
</div>

<section class="summary-strip" aria-label="Report counts">
	<div class="stat-box">
		<span class="stat-label">Matching reports</span>
		<strong class="stat-val">{reportList.filteredItems.length}</strong>
	</div>
	<div class="stat-box">
		<span class="stat-label">Assigned to a group</span>
		<strong class="stat-val">{reportList.groupedCount}</strong>
	</div>
	<div class="stat-box">
		<span class="stat-label">Resident safety flags</span>
		<strong class="stat-val">{reportList.flaggedCount}</strong>
	</div>
	{#if reportList.searchQuery || reportList.selectedCategory !== 'ALL' || reportList.selectedBarangay !== 'ALL' || reportList.selectedStatus !== 'ALL'}
		<button type="button" class="btn-reset" onclick={() => reportList.clearFilters()}>
			Reset filters
		</button>
	{/if}
</section>

<div class="reports-layout" class:with-drawer={Boolean(reportList.activeReport)}>
	<section class="table-card" aria-label="Submitted reports list">
		{#if reportList.filteredItems.length === 0}
			<div class="empty-state">
				<p>No reports match the current filters.</p>
				<button type="button" class="btn-export" onclick={() => reportList.clearFilters()}>
					Clear filters
				</button>
			</div>
		{:else}
			<table class="reports-table">
				<thead>
					<tr>
						<th class="col-code">REPORT</th>
						<th>SUMMARY &amp; LOCATION</th>
						<th class="col-group">GROUP</th>
						<th class="col-time">SUBMITTED</th>
						<th class="col-status">STATUS</th>
					</tr>
				</thead>
				<tbody>
					{#each reportList.filteredItems as rep (rep.id)}
						<tr
							class="clickable-row"
							class:selected={reportList.activeReportId === rep.id}
							onclick={() => reportList.selectReport(rep.id)}
						>
							<td class="col-code">
								<div class="code-text">{rep.code}</div>
								<div class="gps-text">GPS {rep.gpsAccuracy}</div>
							</td>
							<td>
								<div class="summary-text">{rep.summary}</div>
								<div class="location-text">
									{rep.category} · {rep.street}, {rep.barangay}
									{#if rep.residentFlag}
										<span class="flag-tag">· {rep.residentFlag}</span>
									{/if}
								</div>
							</td>
							<td class="col-group">
								{#if rep.groupCode}
									<span class="group-chip">{rep.groupCode}</span>
								{:else}
									<span class="muted">Ungrouped</span>
								{/if}
							</td>
							<td class="col-time muted">{rep.submittedAt}</td>
							<td class="col-status">
								<span class={badgeClass(rep.status)}>{rep.status}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	{#if reportList.activeReport}
		{@const detail = reportList.activeReport}
		<aside class="inspector-card" aria-label="Report details">
			<div class="inspector-head">
				<div>
					<div class="inspector-code">{detail.code}</div>
					<h2>{detail.category}</h2>
				</div>
				<button
					type="button"
					class="btn-close"
					onclick={() => (reportList.activeReportId = null)}
					aria-label="Close report details"
				>
					✕
				</button>
			</div>

			<p class="inspector-quote">"{detail.summary}"</p>

			<dl class="meta-list">
				<div>
					<dt>Location</dt>
					<dd>{detail.street}, {detail.barangay}</dd>
				</div>
				<div>
					<dt>Submitted</dt>
					<dd>{detail.submittedAt} ({detail.ageDays}d ago)</dd>
				</div>
				<div>
					<dt>GPS accuracy</dt>
					<dd>{detail.gpsAccuracy}</dd>
				</div>
				<div>
					<dt>Issue group</dt>
					<dd>{detail.groupCode ?? 'Not grouped yet'} ({detail.matchScore})</dd>
				</div>
			</dl>

			<!-- Read-only here: status and resident updates are changed on the issue in the priority queue. -->
			<dl class="meta-list">
				<div>
					<dt>Status</dt>
					<dd><span class={badgeClass(detail.status)}>{detail.status}</span></dd>
				</div>
				<div>
					<dt>Update to residents</dt>
					<dd>{detail.notes || '—'}</dd>
				</div>
			</dl>
		</aside>
	{/if}
</div>

<style>
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 14px;
		margin-bottom: 16px;
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
		flex-wrap: wrap;
		gap: 8px;
	}

	.search-input,
	.select,
	.btn-export {
		height: 34px;
		padding: 0 11px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #1e293b;
		font-size: 0.8rem;
	}

	.search-input {
		width: 210px;
	}

	.search-input:focus,
	.select:focus {
		outline: none;
		border-color: #2563eb;
	}

	.select,
	.btn-export {
		font-weight: 500;
		cursor: pointer;
	}

	.btn-export:hover {
		background: #f1f5f9;
	}

	.summary-strip {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 16px;
	}

	.stat-box {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 10px 14px;
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.stat-label {
		font-size: 0.76rem;
		color: #64748b;
	}

	.stat-val {
		font-size: 1.05rem;
		font-weight: 700;
		color: #0f172a;
	}

	.btn-reset {
		background: transparent;
		border: none;
		color: #2563eb;
		font-size: 0.78rem;
		font-weight: 500;
		text-decoration: underline;
		cursor: pointer;
	}

	.reports-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 16px;
		align-items: start;
	}

	.reports-layout.with-drawer {
		grid-template-columns: minmax(0, 1fr) 310px;
	}

	.table-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		overflow-x: auto;
	}

	.reports-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.reports-table th {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: #64748b;
		padding: 12px 16px;
		border-bottom: 1px solid #e2e8f0;
	}

	.reports-table td {
		padding: 13px 16px;
		border-bottom: 1px solid #f1f5f9;
		vertical-align: middle;
	}

	.reports-table tbody tr:last-child td {
		border-bottom: none;
	}

	.clickable-row {
		cursor: pointer;
	}

	.clickable-row:hover {
		background: #f8fafc;
	}

	.clickable-row.selected {
		background: #eff6ff;
	}

	.col-code {
		width: 118px;
	}

	.col-group {
		width: 115px;
	}

	.col-time {
		width: 155px;
	}

	.col-status {
		width: 120px;
	}

	.code-text {
		font-size: 0.82rem;
		font-weight: 700;
		color: #0f172a;
	}

	.gps-text {
		font-size: 0.7rem;
		color: #94a3b8;
		margin-top: 2px;
	}

	.summary-text {
		font-size: 0.85rem;
		font-weight: 600;
		color: #0f172a;
		/* Descriptions run up to 2000 chars; the detail panel shows the full text. */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.location-text {
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 2px;
	}

	.flag-tag {
		color: #b45309;
		font-weight: 600;
	}

	.group-chip {
		display: inline-block;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		color: #0f172a;
		font-size: 0.74rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 5px;
	}

	.muted {
		color: #64748b;
		font-size: 0.8rem;
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

	.pill.duplicate {
		background: #ede9fe;
		color: #6d28d9;
	}

	.pill.resolved {
		background: #dcfce7;
		color: #15803d;
	}

	.pill.received {
		background: #f1f5f9;
		color: #475569;
	}

	.empty-state {
		padding: 36px 20px;
		text-align: center;
		color: #64748b;
		font-size: 0.85rem;
	}

	.inspector-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px 18px;
	}

	.inspector-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
	}

	.inspector-code {
		font-size: 0.74rem;
		font-weight: 700;
		color: #2563eb;
	}

	.inspector-head h2 {
		margin: 2px 0 0;
		font-size: 1rem;
		font-weight: 700;
		color: #0f172a;
	}

	.btn-close {
		background: transparent;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		width: 26px;
		height: 26px;
		color: #64748b;
		cursor: pointer;
	}

	.btn-close:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.inspector-quote {
		margin: 12px 0;
		font-size: 0.84rem;
		line-height: 1.45;
		color: #1e293b;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 7px;
		padding: 10px 12px;
	}

	.meta-list {
		margin: 0 0 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 0.78rem;
	}

	.meta-list div {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}

	.meta-list dt {
		color: #64748b;
	}

	.meta-list dd {
		margin: 0;
		font-weight: 600;
		color: #0f172a;
		text-align: right;
	}
</style>