<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { AbsensiService } from '$lib/services/absensi.js';
	import { PengajianService, KategoriService } from '$lib/services/masterData.js';
	import { Plus, Eye, Edit3, Trash2, Calendar, MapPin, Users, Search, Filter } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	let absensiList = [];
	let pengajianList = [];
	let kategoriList = [];
	let isLoading = true;
	let currentPage = 1;
	let totalPages = 1;
	let searchQuery = '';
	let filters = {
		tanggal_mulai: '',
		tanggal_akhir: '',
		pengajian: '',
		tempat: ''
	};

	onMount(async () => {
		await loadInitialData();
	});

	async function loadInitialData() {
		try {
			// Load pengajian list for filter
			pengajianList = await PengajianService.getAllPengajian();
			// Load kategori list for tingkat display
			kategoriList = await KategoriService.getAllKategori();
			// Load absensi data
			await loadAbsensiData();
		} catch (error) {
			console.error('Error loading initial data:', error);
		}
	}

	async function loadAbsensiData() {
		isLoading = true;
		try {
			const data = await AbsensiService.getAllAbsensi(currentPage, 10, filters);
			absensiList = data || [];
		} catch (error) {
			console.error('Error loading absensi data:', error);
			absensiList = [];
		} finally {
			isLoading = false;
		}
	}

	function handleAddNew() {
		dispatch('add-new');
	}

	function handleEdit(id) {
		dispatch('edit', { id });
	}

	function handleView(id) {
		dispatch('view', { id });
	}

	function handleDelete(id) {
		dispatch('delete', { id });
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatTime(timeString) {
		if (!timeString) return '-';
		return timeString.slice(0, 5); // HH:MM format
	}

	function formatTingkat(tingkatString) {
		if (!tingkatString || !kategoriList.length) return 'Tingkat 1';

		// Split comma-separated tingkat values
		const tingkatIds = tingkatString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

		// Map IDs to category names
		const categoryNames = tingkatIds.map(id => {
			const kategori = kategoriList.find(k => k.id === id);
			return kategori ? kategori.category : id.toString();
		});

		return `Tingkat ${categoryNames.join(', ')}`;
	}

	$: filteredAbsensi = absensiList.filter(item => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			item.mpengajian?.nama_pengajian?.toLowerCase().includes(query) ||
			item.mmasjid?.nama_masjid?.toLowerCase().includes(query) ||
			formatDate(item.tgl).includes(query)
		);
	});

	$: startIndex = (currentPage - 1) * 10;
</script>

<div class="absensi-list">
	<!-- Header Section -->
	<div class="list-header">
		<div class="header-content">
			<div class="header-title">
				<h1>Data Absensi Pengajian</h1>
				<p class="header-subtitle">Kelola data absensi jamaah pengajian</p>
			</div>
			<button class="btn-add" on:click={handleAddNew}>
				<Plus size={18} />
				<span>Tambah Absensi</span>
			</button>
		</div>
	</div>

	<!-- Search and Filter Section -->
	<div class="search-filter-section">
		<div class="search-box">
			<Search size={18} />
			<input
				type="text"
				placeholder="Cari pengajian, masjid, atau tanggal..."
				bind:value={searchQuery}
			/>
		</div>

		<div class="filters">
			<div class="filter-group">
				<label for="pengajian-filter">Pengajian:</label>
				<select
					id="pengajian-filter"
					bind:value={filters.pengajian}
					on:change={loadAbsensiData}
				>
					<option value="">Semua Pengajian</option>
					{#each pengajianList as pengajian}
						<option value={pengajian.id}>{pengajian.nama_pengajian}</option>
					{/each}
				</select>
			</div>
			<div class="filter-group">
				<label for="tanggal-mulai">Dari Tanggal:</label>
				<input
					id="tanggal-mulai"
					type="date"
					bind:value={filters.tanggal_mulai}
					on:change={loadAbsensiData}
				/>
			</div>
			<div class="filter-group">
				<label for="tanggal-akhir">Sampai Tanggal:</label>
				<input
					id="tanggal-akhir"
					type="date"
					bind:value={filters.tanggal_akhir}
					on:change={loadAbsensiData}
				/>
			</div>
		</div>
	</div>

	<!-- Table Section -->
	<div class="table-section">
		{#if isLoading}
			<div class="loading-container">
				<div class="spinner"></div>
				<p>Memuat data absensi...</p>
			</div>
		{:else if filteredAbsensi.length === 0}
			<div class="empty-state">
				<Calendar size={48} />
				<h3>Belum Ada Data Absensi</h3>
				<p>Klik tombol "Tambah Absensi" untuk membuat data absensi baru</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>No</th>
							<th>Tanggal</th>
							<th>Waktu</th>
							<th>Pengajian</th>
							<th>Tempat</th>
							<th>Jamaah</th>
							<th>Surah</th>
							<th>Hadist</th>
							<th>Infaq</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredAbsensi as item, index}
							<tr>
								<td>{startIndex + index + 1}</td>
								<td>
									<div class="date-cell">
										<Calendar size={14} />
										<span>{formatDate(item.tgl)}</span>
									</div>
								</td>
								<td>
									<div class="time-range">
										<span>{formatTime(item.jam_mulai)}</span>
										<span class="separator">-</span>
										<span>{formatTime(item.jam_akhir)}</span>
									</div>
								</td>
								<td>
									<div class="pengajian-cell">
										<span class="pengajian-name">{item.mpengajian?.nama_pengajian || '-'}</span>
										<span class="level">{formatTingkat(item.tingkat)}</span>
									</div>
								</td>
								<td>
									<div class="location-cell">
										<MapPin size={14} />
										<span>{item.mmasjid?.nama_masjid || '-'}</span>
									</div>
								</td>
								<td>
									<div class="jamaah-cell">
										<Users size={14} />
										<span>{item.peserta || '0'} jamaah</span>
									</div>
								</td>
								<td>{item.malquran?.nama_surat || '-'}</td>
								<td>{item.mhadist?.nama_hadist || '-'}</td>
								<td class="infaq-cell">Rp {(item.infaq || 0).toLocaleString('id-ID')}</td>
								<td>
									<div class="action-buttons">
										<button
											class="btn-action btn-edit"
											on:click={() => handleEdit(item.id)}
											title="Edit"
										>
											<Edit3 size={14} />
										</button>
										<button
											class="btn-action btn-delete"
											on:click={() => handleDelete(item.id)}
											title="Hapus"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.absensi-list {
		padding: 1.5rem;
		padding-bottom: 120px; /* Add extra padding for bottom navbar */
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		min-height: calc(100vh - 120px);
	}

	/* Header Section */
	.list-header {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.header-title h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
		color: #1f2937;
		background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.header-subtitle {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0.25rem 0 0 0;
	}

	.btn-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.btn-add:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
	}

	/* Search and Filter Section */
	.search-filter-section {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.search-box {
		position: relative;
		margin-bottom: 1rem;
	}

	.search-box :global(svg) {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #6b7280;
	}

	.search-box input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.search-box input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.filters {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-group input {
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.filter-group select {
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		background: white;
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Table Section */
	.table-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
		overflow: hidden;
	}

	.table-container {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table th {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
		white-space: nowrap;
	}

	.data-table td {
		padding: 1rem;
		border-bottom: 1px solid #f3f4f6;
		vertical-align: middle;
	}

	.data-table tbody tr:hover {
		background: #f9fafb;
	}

	.date-cell, .location-cell, .jamaah-cell {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
	}

	.time-range {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-family: monospace;
		font-size: 0.8rem;
	}

	.separator {
		color: #9ca3af;
	}

	.pengajian-cell {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.pengajian-name {
		font-weight: 500;
		color: #1f2937;
	}

	.level {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.125rem 0.5rem;
		border-radius: 6px;
		align-self: flex-start;
	}

	.infaq-cell {
		font-weight: 500;
		color: #059669;
		font-family: monospace;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.btn-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-edit {
		background: #fef3c7;
		color: #d97706;
	}

	.btn-edit:hover {
		background: #fde68a;
		transform: scale(1.05);
	}

	.btn-delete {
		background: #fee2e2;
		color: #dc2626;
	}

	.btn-delete:hover {
		background: #fecaca;
		transform: scale(1.05);
	}

	/* Loading and Empty States */
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: #6b7280;
	}

	.empty-state :global(svg) {
		margin-bottom: 1rem;
		color: #d1d5db;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: #374151;
		font-size: 1.125rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.absensi-list {
			padding: 1rem;
		}

		.list-header {
			padding: 1.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.filters {
			grid-template-columns: 1fr;
		}

		.data-table {
			font-size: 0.8rem;
		}

		.data-table th,
		.data-table td {
			padding: 0.75rem 0.5rem;
		}
	}
</style>
