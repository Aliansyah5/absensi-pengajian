<script>
	import { createEventDispatcher } from 'svelte';
	import { Search, UserCheck, UserX, Clock } from 'lucide-svelte';

	export let title;
	export let jamaahList = [];
	export let absensiData = {};

	const dispatch = createEventDispatcher();

	let searchTerm = '';

	$: filteredJamaah = jamaahList.filter(jamaah =>
		jamaah.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(jamaah.mkelompok?.nama_kelompok || '').toLowerCase().includes(searchTerm.toLowerCase())
	);

	function handleAbsensiChange(jamaahId, status) {
		dispatch('absensiChange', {
			jamaahId,
			status,
			keterangan: ''
		});
	}

	function getStatusCount(status) {
		return jamaahList.filter(jamaah =>
			absensiData[jamaah.id]?.status_kehadiran === status
		).length;
	}

	$: hadirCount = getStatusCount('H');
	$: absenCount = getStatusCount('A');
	$: izinCount = getStatusCount('I');
	$: totalChecked = hadirCount + absenCount + izinCount;
</script>

<div class="jamaah-list">
	<div class="list-header">
		<h3 class="list-title">{title}</h3>

		<!-- Search Box -->
		<div class="search-container">
			<Search size={16} class="search-icon" />
			<input
				type="text"
				placeholder="Cari {title.toLowerCase()}..."
				bind:value={searchTerm}
				class="search-input"
			/>
		</div>

		<!-- Stats -->
		<div class="stats-row">
			<div class="stat-item hadir">
				<UserCheck size={16} />
				<span>Hadir: {hadirCount}</span>
			</div>
			<div class="stat-item absen">
				<UserX size={16} />
				<span>Absen: {absenCount}</span>
			</div>
			<div class="stat-item izin">
				<Clock size={16} />
				<span>Izin: {izinCount}</span>
			</div>
		</div>
	</div>

	<div class="list-content">
		{#if filteredJamaah.length === 0}
			<div class="empty-state">
				{#if searchTerm}
					<p>Tidak ada jamaah yang cocok dengan pencarian "{searchTerm}"</p>
				{:else}
					<p>Belum ada data {title.toLowerCase()}</p>
				{/if}
			</div>
		{:else}
			<div class="jamaah-grid">
				{#each filteredJamaah as jamaah}
					<div class="jamaah-card">
						<div class="jamaah-info">
							<div class="jamaah-name">{jamaah.nama}</div>
							<div class="jamaah-detail">
								{#if jamaah.mkelompok?.nama_kelompok}
									<span class="kelompok">{jamaah.mkelompok.nama_kelompok}</span>
								{/if}
								{#if jamaah.mkategori?.category}
									<span class="kategori">{jamaah.mkategori.category}</span>
								{/if}
							</div>
						</div>

						<div class="absensi-controls">
							<button
								class="status-btn hadir"
								class:active={absensiData[jamaah.id]?.status_kehadiran === 'H'}
								on:click={() => handleAbsensiChange(jamaah.id, 'H')}
								title="Hadir"
							>
								<span class="status-letter">H</span>
								<span class="status-label">Hadir</span>
							</button>
							<button
								class="status-btn izin"
								class:active={absensiData[jamaah.id]?.status_kehadiran === 'I'}
								on:click={() => handleAbsensiChange(jamaah.id, 'I')}
								title="Izin"
							>
								<span class="status-letter">I</span>
								<span class="status-label">Izin</span>
							</button>
							<button
								class="status-btn absen"
								class:active={absensiData[jamaah.id]?.status_kehadiran === 'A'}
								on:click={() => handleAbsensiChange(jamaah.id, 'A')}
								title="Alpha"
							>
								<span class="status-letter">A</span>
								<span class="status-label">Alpha</span>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="list-footer">
		<div class="total-info">
			Total: {filteredJamaah.length} jamaah | Sudah diabsen: {totalChecked}
		</div>
	</div>
</div>

<style>
	.jamaah-list {
		background: #f9fafb;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
		height: 600px;
		display: flex;
		flex-direction: column;
	}

	.list-header {
		padding: 1rem;
		background: white;
		border-bottom: 1px solid #e5e7eb;
	}

	.list-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
		text-align: center;
	}

	.search-container {
		position: relative;
		margin-bottom: 1rem;
	}

	.search-container :global(.search-icon) {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #6b7280;
		z-index: 2;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 0.875rem;
		background: #f9fafb;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		background: white;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.search-input::placeholder {
		color: #9ca3af;
		font-style: italic;
	}

	.stats-row {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
	}

	.stat-item.hadir {
		background: #f0fdf4;
		color: #166534;
	}

	.stat-item.absen {
		background: #fef2f2;
		color: #dc2626;
	}

	.stat-item.izin {
		background: #fffbeb;
		color: #d97706;
	}

	.list-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: #6b7280;
		font-style: italic;
		text-align: center;
	}

	.jamaah-grid {
		display: grid;
		gap: 0.75rem;
	}

	.jamaah-card {
		background: white;
		border-radius: 8px;
		padding: 0.75rem;
		border: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.2s ease;
	}

	.jamaah-card:hover {
		border-color: #d1d5db;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.jamaah-info {
		flex: 1;
		min-width: 0;
	}

	.jamaah-name {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
		word-break: break-word;
	}

	.jamaah-detail {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.kelompok,
	.kategori {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.kelompok {
		background: #dbeafe;
		color: #1e40af;
	}

	.kategori {
		background: #fce7f3;
		color: #be185d;
	}

	.absensi-controls {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
		margin-left: 0.75rem;
	}

	.status-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 60px;
		height: 48px;
		border: 2px solid;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0.25rem;
		gap: 0.125rem;
	}

	.status-letter {
		font-size: 1rem;
		font-weight: 700;
		line-height: 1;
	}

	.status-label {
		font-size: 0.65rem;
		font-weight: 500;
		line-height: 1;
		white-space: nowrap;
	}

	.status-btn.hadir {
		border-color: #d1fae5;
		color: #065f46;
	}

	.status-btn.hadir:hover,
	.status-btn.hadir.active {
		background: #10b981;
		border-color: #10b981;
		color: white;
	}

	.status-btn.absen {
		border-color: #fecaca;
		color: #991b1b;
	}

	.status-btn.absen:hover,
	.status-btn.absen.active {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}

	.status-btn.izin {
		border-color: #fed7aa;
		color: #9a3412;
	}

	.status-btn.izin:hover,
	.status-btn.izin.active {
		background: #f59e0b;
		border-color: #f59e0b;
		color: white;
	}

	.list-footer {
		padding: 0.75rem 1rem;
		background: white;
		border-top: 1px solid #e5e7eb;
	}

	.total-info {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: center;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.jamaah-list {
			height: 500px;
		}

		.jamaah-card {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		.absensi-controls {
			margin-left: 0;
			justify-content: center;
		}

		.status-btn {
			flex: 1;
			max-width: 80px;
		}
	}
</style>
