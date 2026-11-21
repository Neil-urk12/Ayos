<script lang="ts">
	let {
		groupCode,
		newDot = { x: '50%', y: '51%' },
		groupDot = { x: '56%', y: '54%' },
		radiusMeters = 30
	}: {
		groupCode: string;
		newDot?: { x: string; y: string };
		groupDot?: { x: string; y: string };
		radiusMeters?: number;
	} = $props();
</script>

<section class="location-card" aria-label="Location comparison">
	<h2>Location</h2>

	<div class="schematic-canvas" aria-hidden="true">
		<div class="block b-tl"></div>
		<div class="block b-tr"></div>
		<div class="block b-bl"></div>
		<div class="block b-br"></div>

		<div class="radius-ring" style="left: {newDot.x}; top: {newDot.y};"></div>
		<span class="dot-pin new-report" style="left: {newDot.x}; top: {newDot.y};"></span>
		<span class="dot-pin existing-group" style="left: {groupDot.x}; top: {groupDot.y};"></span>
	</div>

	<div class="legend">
		<span class="legend-item"><i class="swatch dark"></i>New report</span>
		<span class="legend-item"><i class="swatch orange"></i>Group {groupCode}</span>
	</div>
	<div class="caption">Dashed: {radiusMeters} m cluster radius</div>
</section>

<style>
	.location-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 16px;
	}

	h2 {
		margin: 0 0 12px;
		font-size: 0.92rem;
		font-weight: 700;
		color: #0f172a;
	}

	.schematic-canvas {
		position: relative;
		width: 100%;
		height: 156px;
		background: #f1f5f9;
		border-radius: 8px;
		overflow: hidden;
		pointer-events: none;
	}

	.block {
		position: absolute;
		background: #e2e8f0;
	}

	.b-tl {
		top: 0;
		left: 0;
		width: 44%;
		height: 46%;
	}

	.b-tr {
		top: 0;
		right: 0;
		width: 46%;
		height: 36%;
	}

	.b-bl {
		bottom: 0;
		left: 0;
		width: 38%;
		height: 42%;
	}

	.b-br {
		bottom: 0;
		right: 0;
		width: 52%;
		height: 52%;
	}

	.radius-ring {
		position: absolute;
		width: 72px;
		height: 72px;
		transform: translate(-50%, -50%);
		border-radius: 999px;
		border: 1.5px dashed #3b82f6;
		background: rgba(59, 130, 246, 0.08);
	}

	.dot-pin {
		position: absolute;
		width: 11px;
		height: 11px;
		border-radius: 999px;
		transform: translate(-50%, -50%);
		border: 2px solid #ffffff;
		box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
	}

	.dot-pin.new-report {
		background: #1e293b;
	}

	.dot-pin.existing-group {
		background: #ea580c;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 10px;
		font-size: 0.74rem;
		color: #475569;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.swatch {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		display: inline-block;
	}

	.swatch.dark {
		background: #1e293b;
	}

	.swatch.orange {
		background: #ea580c;
	}

	.caption {
		margin-top: 4px;
		font-size: 0.72rem;
		color: #94a3b8;
	}
</style>