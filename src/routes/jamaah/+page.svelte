<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { DatabaseService, formatters } from '$lib/utils/supabase.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { Search, Filter, UserPlus, Phone, MapPin, Users, Calendar, X, ChevronRight, User, Building } from 'lucide-svelte';

	let isLoading = true;
	let innerWidth = 0;
	let jamaahList = [];
	let kategoriList = [];
	let filteredJamaah = [];
	let searchQuery = '';
	let selectedKategori = '';
	let showFilters = false;

	$: isDesktop = innerWidth >= 768;

	// Check authentication
	onMount(async () => {
		auth.initialize();

		const unsubscribe = auth.subscribe(async (state) => {
			if (!state.isLoading) {
				if (!state.isAuthenticated) {
					goto('/login');
					return;
				}

				await loadData();
			}
		});

		return unsubscribe;
	});

	async function loadData() {
		try {
			// Load kategori for filter
			const kategoriResult = await DatabaseService.getKategori();
			if (kategoriResult.data) {
				kategoriList = kategoriResult.data;
			}

			// Load jamaah data
			const jamaahResult = await DatabaseService.getJamaahByKategori();
			if (jamaahResult.data) {
				jamaahList = jamaahResult.data;
				filteredJamaah = jamaahList;
			}
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	}

	function filterJamaah() {
		filteredJamaah = jamaahList.filter(jamaah => {
			const matchesSearch = jamaah.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
								 jamaah.nomor_induk.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesKategori = selectedKategori === '' || jamaah.kategori_id === selectedKategori;

			return matchesSearch && matchesKategori;
		});
	}

	function handleSearch() {
		filterJamaah();
	}

	function handleKategoriFilter() {
		filterJamaah();
	}

	function clearFilters() {
		searchQuery = '';
		selectedKategori = '';
		filteredJamaah = jamaahList;
		showFilters = false;
	}

	function getKategoriName(kategoriId) {
		const kategori = kategoriList.find(k => k.id === kategoriId);
		return kategori ? kategori.nama_kategori : 'Unknown';
	}

	function getKategoriClass(kategoriId) {
		const kategori = kategoriList.find(k => k.id === kategoriId);
		if (!kategori) return 'badge-info';
		return kategori.kode_kategori === 'PUTRA' ? 'badge-info' : 'badge-warning';
	}

	function calculateAge(birthDate) {
		if (!birthDate) return '-';
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	function getStats() {
		const putraCount = filteredJamaah.filter(j => getKategoriName(j.kategori_id) === 'Putra').length;
		const putriCount = filteredJamaah.filter(j => getKategoriName(j.kategori_id) === 'Putri').length;
		return { total: filteredJamaah.length, putra: putraCount, putri: putriCount };
	}

	function handleAddJamaah() {
		goto('/jamaah/add');
	}

	function handleJamaahDetail(jamaahId) {
		goto(`/jamaah/${jamaahId}`);
	}

	function handleJamaahEdit(jamaahId) {
		goto(`/jamaah/${jamaahId}/edit`);
	}

	$: stats = getStats();
</script>

<svelte:head>
	<title>Data Jamaah - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader
	title="Data Jamaah"
	showSearch={true}
	on:search-click={() => showFilters = !showFilters}
/>

<main class="app-content" class:desktop={isDesktop}>
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-content">
				<div class="spinner"></div>
				<p class="loading-text">Memuat data jamaah...</p>
			</div>
		</div>
	{:else}
		<!-- Search and Filter Section -->
		<div class="search-section">
			<div class="search-container">
				<div class="search-input-container">
					<Search size={18} class="search-icon" />
					<input
						type="text"
						placeholder="Cari nama atau nomor induk..."
						bind:value={searchQuery}
						on:input={handleSearch}
						class="search-input"
					/>
					<button
						class="filter-toggle"
						class:active={showFilters}
						on:click={() => showFilters = !showFilters}
						aria-label="Toggle Filter"
					>
						<Filter size={18} />
					</button>
				</div>


				<!-- Filter Panel -->
				{#if showFilters}
					<div class="filter-panel" class:desktop-layout={isDesktop}>
						<div class="filter-group">
							<label for="kategori-filter" class="filter-label">
								<Users size={16} />
								Kategori
							</label>
							<select
								id="kategori-filter"
								bind:value={selectedKategori}
								on:change={handleKategoriFilter}
								class="filter-select"
							>
								<option value="">Semua Kategori</option>
								{#each kategoriList as kategori}
									<option value={kategori.id}>{kategori.nama_kategori}</option>
								{/each}
							</select>
						</div>

						<div class="filter-actions">
							{#if searchQuery || selectedKategori}
								<button class="clear-filter-btn" on:click={clearFilters}>
									<X size={16} />
									Reset Filter
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Statistics Section -->
		<div class="stats-section">
			<div class="stats-container" class:desktop-layout={isDesktop}>
				<div class="stat-card total">
					<div class="stat-icon">
						<Users size={20} />
					</div>
					<div class="stat-content">
						<div class="stat-number">{stats.total}</div>
						<div class="stat-label">Total Jamaah</div>
					</div>
				</div>

				<div class="stat-card putra">
					<div class="stat-icon">
						<User size={20} />
					</div>
					<div class="stat-content">
						<div class="stat-number">{stats.putra}</div>
						<div class="stat-label">Jamaah Putra</div>
					</div>
				</div>

				<div class="stat-card putri">
					<div class="stat-icon">
						<User size={20} />
					</div>
					<div class="stat-content">
						<div class="stat-number">{stats.putri}</div>
						<div class="stat-label">Jamaah Putri</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Jamaah List -->
		<div class="jamaah-section">
			{#if filteredJamaah.length > 0}
				<div class="jamaah-grid" class:desktop-layout={isDesktop}>
					{#each filteredJamaah as jamaah}
						<div class="jamaah-card">
							<div class="jamaah-header">
								<div class="jamaah-avatar-container">
									<div class="jamaah-avatar">
										{jamaah.nama_lengkap.charAt(0).toUpperCase()}
									</div>
									<div class="jamaah-basic-info">
										<h3 class="jamaah-name">{jamaah.nama_lengkap}</h3>
										<p class="jamaah-id">{jamaah.nomor_induk}</p>
									</div>
								</div>
								<div class="jamaah-kategori">
									<span class="badge {getKategoriClass(jamaah.kategori_id)}">
										{getKategoriName(jamaah.kategori_id)}
									</span>
								</div>
							</div>

							<div class="jamaah-details">
								{#if jamaah.tanggal_lahir}
									<div class="detail-item">
										<Calendar size={14} class="detail-icon" />
										<span class="detail-label">Umur:</span>
										<span class="detail-value">{calculateAge(jamaah.tanggal_lahir)} tahun</span>
									</div>
								{/if}

								{#if jamaah.mkelompok?.mmasjid?.nama_masjid}
									<div class="detail-item">
										<Building size={14} class="detail-icon" />
										<span class="detail-label">Masjid:</span>
										<span class="detail-value">{jamaah.mkelompok.mmasjid.nama_masjid}</span>
									</div>
								{/if}

								{#if jamaah.mkelompok?.nama_kelompok}
									<div class="detail-item">
										<Users size={14} class="detail-icon" />
										<span class="detail-label">Kelompok:</span>
										<span class="detail-value">{jamaah.mkelompok.nama_kelompok}</span>
									</div>
								{/if}

								{#if jamaah.contact_orangtua}
									<div class="detail-item">
										<Phone size={14} class="detail-icon" />
										<span class="detail-label">Kontak:</span>
										<a href="tel:{jamaah.contact_orangtua}" class="detail-link">
											{jamaah.contact_orangtua}
										</a>
									</div>
								{/if}
							</div>

							<div class="jamaah-actions">
								<button
									class="action-btn secondary"
									on:click={() => handleJamaahDetail(jamaah.id)}
								>
									Detail
									<ChevronRight size={14} />
								</button>
								<button
									class="action-btn primary"
									on:click={() => handleJamaahEdit(jamaah.id)}
								>
									Edit
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<div class="empty-icon">
						<Users size={64} />
					</div>
					<div class="empty-content">
						<h3 class="empty-title">
							{#if searchQuery || selectedKategori}
								Tidak ada jamaah yang sesuai filter
							{:else}
								Belum ada data jamaah
							{/if}
						</h3>
						<p class="empty-description">
							{#if searchQuery || selectedKategori}
								Coba ubah kata kunci pencarian atau filter kategori yang dipilih
							{:else}
								Tambahkan jamaah baru untuk memulai pendataan jamaah
							{/if}
						</p>
						{#if !searchQuery && !selectedKategori}
							<button class="empty-action-btn" on:click={handleAddJamaah}>
								<UserPlus size={18} />
								Tambah Jamaah
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Floating Add Button -->
		<button
			class="fab"
			on:click={handleAddJamaah}
			aria-label="Tambah Jamaah"
		>
			<UserPlus size={24} />
		</button>
	{/if}
</main>

<BottomNav />

<style>
	.app-content {
		min-height: calc(100vh - 64px);
		background: #f8fafc;
	}

	.app-content.desktop {
		padding-bottom: 2rem;
	}

	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: 2rem;
	}

	.loading-content {
		text-align: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #0ea5e9;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}

	/* Search Section */
	.search-section {
		background: white;
		border-bottom: 1px solid #f1f5f9;
	}

	.search-container {
		padding: 1rem;
	}

	.search-input-container {
		position: relative;
		display: flex;
		align-items: center;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 0.75rem 1rem;
	}

	.search-icon {
		color: #9ca3af;
		margin-right: 0.75rem;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.875rem;
		color: #111827;
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	.filter-toggle {
		padding: 0.5rem;
		border: none;
		background: transparent;
		border-radius: 8px;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-left: 0.5rem;
	}

	.filter-toggle:hover,
	.filter-toggle.active {
		background: #e0f2fe;
		color: #0ea5e9;
	}

	.filter-panel {
		margin-top: 1rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}

	.filter-panel.desktop-layout {
		display: flex;
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.filter-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: white;
		font-size: 0.875rem;
		color: #111827;
	}

	.filter-select:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.filter-actions {
		display: flex;
		align-items: end;
		margin-top: 1rem;
	}

	.filter-panel.desktop-layout .filter-actions {
		margin-top: 0;
	}

	.clear-filter-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #f3f4f6;
		color: #6b7280;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-filter-btn:hover {
		background: #e5e7eb;
		color: #374151;
	}

	/* Stats Section */
	.stats-section {
		padding: 1rem;
	}

	.stats-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stats-container.desktop-layout {
		max-width: 600px;
		margin: 0 auto;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 1rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transition: all 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.stat-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.stat-card.total .stat-icon {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.stat-card.putra .stat-icon {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	}

	.stat-card.putri .stat-icon {
		background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
	}

	.stat-content {
		text-align: center;
		flex: 1;
	}

	.stat-number {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		margin-top: 0.25rem;
	}

	/* Jamaah Section */
	.jamaah-section {
		padding: 0 1rem 1rem;
	}

	.jamaah-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.jamaah-grid.desktop-layout {
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.jamaah-card {
		background: white;
		border-radius: 16px;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.jamaah-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: #e2e8f0;
	}

	.jamaah-header {
		padding: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #f8fafc;
	}

	.jamaah-avatar-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.jamaah-avatar {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.125rem;
		flex-shrink: 0;
	}

	.jamaah-basic-info {
		flex: 1;
		min-width: 0;
	}

	.jamaah-name {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.jamaah-id {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.jamaah-kategori {
		flex-shrink: 0;
	}

	.jamaah-details {
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
	}

	.detail-icon {
		color: #9ca3af;
		flex-shrink: 0;
	}

	.detail-label {
		font-weight: 500;
		color: #6b7280;
		min-width: 60px;
	}

	.detail-value {
		color: #111827;
		flex: 1;
	}

	.detail-link {
		color: #0ea5e9;
		text-decoration: none;
		flex: 1;
	}

	.detail-link:hover {
		text-decoration: underline;
	}

	.jamaah-actions {
		padding: 1rem 1.25rem;
		background: #f8fafc;
		display: flex;
		gap: 0.75rem;
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.action-btn.secondary {
		background: #f3f4f6;
		color: #6b7280;
		border: 1px solid #d1d5db;
	}

	.action-btn.secondary:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
	}

	.action-btn.primary:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		background: white;
		border-radius: 16px;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.empty-icon {
		color: #d1d5db;
		margin-bottom: 1.5rem;
	}

	.empty-content {
		max-width: 400px;
		margin-bottom: 1.5rem;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.75rem 0;
	}

	.empty-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
		margin: 0;
	}

	.empty-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		margin: 0 auto;
		width: fit-content;
	}

	.empty-action-btn:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	/* Floating Action Button */
	.fab {
		position: fixed;
		bottom: 90px;
		right: 1rem;
		width: 56px;
		height: 56px;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transition: all 0.2s ease;
		z-index: 40;
	}

	.fab:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4);
	}

	.fab:active {
		transform: translateY(0);
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.stats-container {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: 1.25rem;
			text-align: center;
		}

		.stat-icon {
			width: 48px;
			height: 48px;
		}

		.stat-number {
			font-size: 1.5rem;
		}

		.jamaah-card {
			border-radius: 12px;
		}

		.jamaah-header {
			padding: 1rem;
		}

		.jamaah-avatar {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}

		.jamaah-details {
			padding: 0.75rem 1rem;
		}

		.jamaah-actions {
			padding: 0.75rem 1rem;
			flex-direction: column;
		}

		.fab {
			bottom: 80px;
			width: 48px;
			height: 48px;
		}
	}
</style>
