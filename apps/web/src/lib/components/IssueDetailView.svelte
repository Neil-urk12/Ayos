<script lang="ts">
	import type { IssueGroup } from '#lib/state/queue.svelte.ts';
	import { queue } from '#lib/state/queue.svelte.ts';

	let { issue }: { issue: IssueGroup } = $props();
</script>

<div class="detail-topbar">
	<button type="button" class="back-link" onclick={() => queue.closeIssue()}>
		← Priority queue
	</button>

	<div class="top-actions">
		<select bind:value={issue.status} aria-label="Issue status" class="status-select">
			<option value="In progress">In progress</option>
			<option value="Verified">Verified</option>
			<option value="Received">Received</option>
		</select>
		<button
			type="button"
			class="btn-outline"
			onclick={() => (queue.feedback = `Crew assignment opened for ${issue.groupCode}.`)}
		>
			Assign crew
		</button>
	</div>
</div>

<div class="issue-header">
	<div class="eyebrow">{issue.groupCode} · {issue.category}</div>
	<h1>{issue.title}</h1>
	<p class="submeta">
		{issue.street}, {issue.barangay} · {issue.reports} reports · {issue.firstReportedLabel}
	</p>
</div>

{#if queue.feedback}
	<div class="notice" role="status">{queue.feedback}</div>
{/if}

<div class="detail-grid">
	<!-- Left column -->
	<div class="left-col">
		<section class="panel" aria-label="Photos from all reports">
			<h2>Photos from all reports</h2>
			<div class="photo-grid">
				{#each Array(issue.photoCount) as _, i}
					<div class="photo-tile" title="Report photo #{i + 1}"></div>
				{/each}
			</div>
		</section>

		<section class="panel" aria-label="Reports in this group">
			<div class="panel-head-row">
				<h2>Reports in this group</h2>
				<span class="muted-note">Reporter names hidden</span>
			</div>

			<div class="table-wrap">
				<table class="reports-table">
					<thead>
						<tr>
							<th>REPORT</th>
							<th>SUBMITTED</th>
							<th>MATCH SCORE</th>
							<th>MERGED BY</th>
							<th class="col-action"></th>
						</tr>
					</thead>
					<tbody>
						{#each issue.reportItems as rep (rep.id)}
							<tr>
								<td class="code-cell">{rep.code}</td>
								<td class="muted-cell">{rep.submitted}</td>
								<td class="muted-cell">{rep.matchScore}</td>
								<td class="muted-cell">{rep.mergedBy}</td>
								<td class="col-action">
									{#if rep.canUnmerge}
										<button
											type="button"
											class="unmerge-link"
											onclick={() => queue.unmergeReport(issue.id, rep.code)}
										>
											Unmerge
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</div>

	<!-- Right column -->
	<aside class="right-col">
		<section class="panel" aria-label="Priority score breakdown">
			<div class="score-head">
				<h2>Priority score</h2>
				<span class="big-score">{issue.score}</span>
			</div>

			<div class="weight-item">
				<div class="weight-row">
					<span class="weight-label">Severity <small>· weight 0.35</small></span>
					<span class="weight-val">{issue.severityScore} / 5</span>
				</div>
				<div class="bar-bg">
					<div class="bar-fill" style="width: {(issue.severityScore / 5) * 100}%;"></div>
				</div>
			</div>

			<div class="weight-item">
				<div class="weight-row">
					<span class="weight-label">Public safety impact <small>· weight 0.30</small></span>
					<span class="weight-val">{issue.safetyImpact}</span>
				</div>
				<div class="bar-bg">
					<div
						class="bar-fill"
						style="width: {issue.safetyImpact === 'High' ? 90 : issue.safetyImpact === 'Medium' ? 60 : 35}%;"
					></div>
				</div>
			</div>

			<div class="weight-item">
				<div class="weight-row">
					<span class="weight-label">Issue age <small>· weight 0.15</small></span>
					<span class="weight-val">{issue.ageDays} days</span>
				</div>
				<div class="bar-bg">
					<div class="bar-fill" style="width: {Math.min(100, issue.ageDays * 7)}%;"></div>
				</div>
			</div>

			<div class="weight-item">
				<div class="weight-row">
					<span class="weight-label">Corroborating reports <small>· weight 0.20</small></span>
					<span class="weight-val">{issue.reports}</span>
				</div>
				<div class="bar-bg">
					<div class="bar-fill" style="width: {Math.min(100, issue.reports * 15)}%;"></div>
				</div>
			</div>

			<div class="severity-box">
				<label for="staff-severity" class="field-label">Severity (set by staff)</label>
				<select id="staff-severity" bind:value={issue.severitySelect} class="full-select">
					<option value="4 · Major: affects traffic">4 · Major: affects traffic</option>
					<option value="3 · Moderate: night visibility">3 · Moderate: night visibility</option>
					<option value="2 · Minor: pedestrian detour">2 · Minor: pedestrian detour</option>
					<option value="1 · Low: intermittent">1 · Low: intermittent</option>
				</select>
				<p class="disclaimer">Weights shown are placeholders until agreed with the LGU.</p>
			</div>
		</section>

		<section class="panel" aria-label="Update to residents">
			<h2>Update to residents</h2>
			<textarea bind:value={issue.residentUpdate} rows="3" class="update-textarea"></textarea>
			<button type="button" class="btn-primary-full" onclick={() => queue.sendUpdate(issue.id)}>
				Send to all {issue.reports} reporters
			</button>
		</section>
	</aside>
</div>

<style>
	.detail-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.back-link {
		background: transparent;
		border: none;
		padding: 0;
		font-size: 0.82rem;
		font-weight: 500;
		color: #2563eb;
		cursor: pointer;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.top-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.status-select,
	.btn-outline {
		height: 32px;
		padding: 0 11px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #0f172a;
		font-size: 0.78rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-outline:hover {
		background: #f1f5f9;
	}

	.issue-header {
		margin-bottom: 18px;
	}

	.eyebrow {
		font-size: 0.76rem;
		color: #64748b;
		margin-bottom: 4px;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f172a;
	}

	.submeta {
		margin: 5px 0 0;
		font-size: 0.82rem;
		color: #64748b;
	}

	.notice {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		color: #1e40af;
		padding: 9px 14px;
		border-radius: 7px;
		font-size: 0.8rem;
		margin-bottom: 14px;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 290px;
		gap: 16px;
		align-items: start;
	}

	.left-col,
	.right-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.panel {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px 18px;
	}

	h2 {
		margin: 0 0 12px;
		font-size: 0.9rem;
		font-weight: 700;
		color: #0f172a;
	}

	.photo-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 10px;
	}

	.photo-tile {
		aspect-ratio: 4 / 3;
		background: #d6d3cd;
		border-radius: 6px;
	}

	.panel-head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.panel-head-row h2 {
		margin: 0;
	}

	.muted-note {
		font-size: 0.72rem;
		color: #94a3b8;
	}

	.table-wrap {
		overflow-x: auto;
	}

	.reports-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.reports-table th {
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: #64748b;
		padding: 9px 10px;
		border-bottom: 1px solid #e2e8f0;
	}

	.reports-table td {
		padding: 10px;
		border-bottom: 1px solid #f1f5f9;
		font-size: 0.78rem;
	}

	.reports-table tbody tr:last-child td {
		border-bottom: none;
	}

	.code-cell {
		font-weight: 500;
		color: #0f172a;
	}

	.muted-cell {
		color: #64748b;
	}

	.col-action {
		text-align: right;
		width: 84px;
	}

	.unmerge-link {
		background: transparent;
		border: none;
		padding: 0;
		font-size: 0.76rem;
		color: #2563eb;
		cursor: pointer;
	}

	.unmerge-link:hover {
		text-decoration: underline;
	}

	.score-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.score-head h2 {
		margin: 0;
	}

	.big-score {
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f172a;
	}

	.weight-item {
		margin-bottom: 12px;
	}

	.weight-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.76rem;
		margin-bottom: 5px;
	}

	.weight-label {
		color: #334155;
		font-weight: 500;
	}

	.weight-label small {
		color: #94a3b8;
		font-weight: 400;
	}

	.weight-val {
		color: #0f172a;
		font-weight: 700;
	}

	.bar-bg {
		height: 5px;
		background: #e2e8f0;
		border-radius: 999px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: #1d4ed8;
		border-radius: 999px;
	}

	.severity-box {
		border-top: 1px solid #f1f5f9;
		padding-top: 12px;
		margin-top: 6px;
	}

	.field-label {
		display: block;
		font-size: 0.74rem;
		font-weight: 600;
		color: #334155;
		margin-bottom: 6px;
	}

	.full-select {
		width: 100%;
		height: 34px;
		padding: 0 10px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		font-size: 0.78rem;
		color: #0f172a;
	}

	.disclaimer {
		margin: 8px 0 0;
		font-size: 0.68rem;
		line-height: 1.35;
		color: #94a3b8;
	}

	.update-textarea {
		width: 100%;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 9px 10px;
		font-family: inherit;
		font-size: 0.78rem;
		line-height: 1.4;
		color: #0f172a;
		resize: vertical;
		margin-bottom: 10px;
	}

	.btn-primary-full {
		width: 100%;
		height: 36px;
		border: none;
		border-radius: 6px;
		background: #1d4ed8;
		color: #ffffff;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-primary-full:hover {
		background: #1e40af;
	}
</style>