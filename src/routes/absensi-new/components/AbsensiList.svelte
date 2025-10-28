<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { AbsensiService } from '$lib/services/absensi.js';
	import { PengajianService, KategoriService } from '$lib/services/masterData.js';
	import { Plus, Eye, Edit3, Trash2, Calendar, MapPin, Users, Search, Filter, CloudCog, ChevronRight } from 'lucide-svelte';
  import moment from 'moment';

	const dispatch = createEventDispatcher();

	let absensiList = [];
	let pengajianList = [];
	let kategoriList = [];
	let isLoading = true;
	let currentPage = 1;
	let totalPages = 1;
	let searchQuery = '';
	let expandedCards = {}; // Track which cards are expanded

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
            filters.tanggal_mulai = moment().startOf('month').format('YYYY-MM-DD');
		    filters.tanggal_akhir = moment().endOf('month').format('YYYY-MM-DD');
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

	function getJamaahCount(item) {
		// Prioritas 1: Gunakan jamaah_count yang sudah dihitung dari service
		if (typeof item.jamaah_count === 'number') {
			console.log(`[AbsensiList] Absensi ID ${item.id}: ${item.jamaah_count} jamaah (dari jamaah_count)`);
			return item.jamaah_count;
		}

		// Prioritas 2: Count dari dabsensi array jika tersedia
		if (item.dabsensi && Array.isArray(item.dabsensi)) {
			// Gunakan Set untuk menghitung unique id_siswa (dalam 1 form)
			const uniqueJamaah = new Set();
			item.dabsensi.forEach(d => {
				if (d && d.id_siswa) {
					uniqueJamaah.add(d.id_siswa);
				}
			});
			const count = uniqueJamaah.size;
			console.log(`[AbsensiList] Absensi ID ${item.id}: ${count} jamaah (dari dabsensi array)`);
			return count;
		}

		// Prioritas 3: Fallback ke field peserta
		const pesertaCount = parseInt(item.peserta) || 0;
		console.log(`[AbsensiList] Absensi ID ${item.id}: ${pesertaCount} jamaah (dari field peserta)`);
		return pesertaCount;
	}

	function toggleCard(id) {
		expandedCards[id] = !expandedCards[id];
		expandedCards = { ...expandedCards }; // Trigger reactivity
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
			<!-- Cards Container -->
			<div class="cards-container">
				{#each filteredAbsensi as item, index}
					<div class="data-card {expandedCards[item.id] ? 'expanded' : 'collapsed'}" style="animation-delay: {index * 0.05}s">
						<div class="card-header" on:click={() => toggleCard(item.id)}>
							<div class="card-info">
								<div class="card-number">#{startIndex + index + 1}</div>
								<div class="card-preview">
									<span class="preview-item">{formatDate(item.tgl)} - {item.mpengajian?.nama_pengajian || '-'}</span>
									<span class="preview-item">{item.mmasjid?.nama_masjid || '-'} • {formatTime(item.jam_mulai)} - {formatTime(item.jam_akhir)}</span>
								</div>
							</div>
							<div class="card-toggle">
								<button
									class="btn-toggle"
									type="button"
									title="{expandedCards[item.id] ? 'Tutup' : 'Buka'}"
								>
									<ChevronRight size={16} class="chevron {expandedCards[item.id] ? 'rotated' : ''}" />
								</button>
							</div>
						</div>
						{#if expandedCards[item.id]}
							<div class="card-body">
								<div class="card-field">
									<span class="field-label">TANGGAL</span>
									<span class="field-value">
										<Calendar size={14} />
										{formatDate(item.tgl)}
									</span>
								</div>
								<div class="card-field">
									<span class="field-label">WAKTU</span>
									<span class="field-value">{formatTime(item.jam_mulai)} - {formatTime(item.jam_akhir)}</span>
								</div>
								<div class="card-field">
									<span class="field-label">PENGAJIAN</span>
									<span class="field-value">{item.mpengajian?.nama_pengajian || '-'}</span>
								</div>
								<div class="card-field">
									<span class="field-label">TINGKAT</span>
									<span class="field-value">{formatTingkat(item.tingkat)}</span>
								</div>
								<div class="card-field">
									<span class="field-label">TEMPAT</span>
									<span class="field-value">
										<MapPin size={14} />
										{item.mmasjid?.nama_masjid || '-'}
									</span>
								</div>
								<div class="card-field">
									<span class="field-label">JAMAAH</span>
									<span class="field-value">
										<Users size={14} />
										{getJamaahCount(item)} jamaah
									</span>
								</div>
								<div class="card-field">
									<span class="field-label">SURAH</span>
									<span class="field-value">
										{item.malquran?.nama_surat || '-'}
										{#if item.ayat_awal && item.ayat_akhir}
											<span class="range-info">({item.ayat_awal} - {item.ayat_akhir})</span>
										{/if}
									</span>
								</div>
								<div class="card-field">
									<span class="field-label">HADIST</span>
									<span class="field-value">
										{item.mhadist?.nama_hadist || '-'}
										{#if item.hal_awal && item.hal_akhir}
											<span class="range-info">(Hal. {item.hal_awal} - {item.hal_akhir})</span>
										{/if}
									</span>
								</div>
								<div class="card-field">
									<span class="field-label">INFAQ</span>
									<span class="field-value">Rp {(item.infaq || 0).toLocaleString('id-ID')}</span>
								</div>
								<div class="card-actions-bottom">
									<button
										class="btn-action edit"
										on:click|stopPropagation={() => handleEdit(item.id)}
										title="Edit"
									>
										<Edit3 size={16} />
										<span>Edit</span>
									</button>
									<button
										class="btn-action danger"
										on:click|stopPropagation={() => handleDelete(item.id)}
										title="Hapus"
									>
										<Trash2 size={16} />
										<span>Hapus</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
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
		padding: 1.5rem;
	}

	/* Cards Container */
	.cards-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.data-card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: fadeInUp 0.3s ease-out;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.data-card.collapsed:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
		border-color: #3b82f6;
	}

	.data-card.expanded {
		border-color: #3b82f6;
		box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}

	.data-card.expanded .card-header {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
		border-bottom: 1px solid #93c5fd;
	}

	.card-header:active {
		background: #e0f2fe;
	}

	.card-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.card-number {
		font-size: 0.875rem;
		font-weight: 700;
		color: #3b82f6;
		background: white;
		padding: 0.375rem 0.875rem;
		border-radius: 8px;
		border: 1px solid #dbeafe;
		flex-shrink: 0;
	}

	.card-preview {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow: hidden;
		flex: 1;
		min-width: 0;
	}

	.preview-item {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-item:nth-child(2) {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.card-toggle {
		flex-shrink: 0;
	}

	.btn-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 2px solid #3b82f6;
		background: white;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #3b82f6;
	}

	.btn-toggle:hover {
		background: #eff6ff;
		transform: scale(1.1);
	}

	.btn-toggle:active {
		transform: scale(0.95);
	}

	.chevron {
		transition: transform 0.3s ease;
	}

	.chevron.rotated {
		transform: rotate(90deg);
	}

	.card-body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		animation: slideDown 0.3s ease;
		background: #fafbfc;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			max-height: 0;
			padding-top: 0;
			padding-bottom: 0;
		}
		to {
			opacity: 1;
			max-height: 2000px;
			padding-top: 1.25rem;
			padding-bottom: 1.25rem;
		}
	}

	.card-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
		border-left: 3px solid #e5e7eb;
		transition: all 0.2s ease;
	}

	.card-field:hover {
		background: #f3f4f6;
		border-left-color: #3b82f6;
	}

	.field-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.field-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
		word-break: break-word;
		line-height: 1.5;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.range-info {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 400;
		font-style: italic;
	}

	.card-actions-bottom {
		display: flex;
		gap: 0.75rem;
		padding-top: 0.75rem;
		margin-top: 0.75rem;
		border-top: 2px solid #e5e7eb;
	}

	.btn-action {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	.btn-action:active {
		transform: scale(0.95);
	}

	.btn-action.edit {
		background: #fef3c7;
		color: #d97706;
		border: 1px solid #fde68a;
	}

	.btn-action.edit:hover {
		background: #fde68a;
		border-color: #fcd34d;
	}

	.btn-action.danger {
		background: #fee2e2;
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.btn-action.danger:hover {
		background: #fecaca;
		border-color: #f87171;
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

		.table-section {
			padding: 1rem;
		}

		.cards-container {
			gap: 0.75rem;
		}

		.card-header {
			padding: 0.875rem 1rem;
		}

		.card-info {
			gap: 0.75rem;
		}

		.card-preview {
			gap: 0.125rem;
		}

		.preview-item {
			font-size: 0.8rem;
		}

		.preview-item:nth-child(2) {
			font-size: 0.7rem;
		}

		.card-body {
			padding: 1rem;
			gap: 0.75rem;
		}

		.card-actions-bottom {
			flex-direction: column;
			gap: 0.5rem;
		}

		.btn-action {
			font-size: 0.8rem;
			padding: 0.75rem;
		}
	}
</style>
