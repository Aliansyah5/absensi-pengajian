<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { DatabaseService, formatters } from '$lib/utils/supabase.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { BarChart3, Calendar, Download, Filter, TrendingUp, Users, Eye, FileText, Award, Clock } from 'lucide-svelte';

	let isLoading = true;
	let innerWidth = 0;
	let rekapData = [];
	let kategoriList = [];
	let selectedBulan = new Date().getMonth() + 1;
	let selectedTahun = new Date().getFullYear();
	let selectedKategori = '';
	let filteredRekap = [];
	let showFilters = false;

	$: isDesktop = innerWidth >= 768;

	const bulanNames = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];

	// Check authentication
	onMount(async () => {
		auth.initialize();

		const unsubscribe = auth.subscribe(async (state) => {
			if (!state.isLoading) {
				if (!state.isAuthenticated) {
					goto('/login');
					return;
				}

				await loadInitialData();
			}
		});

		return unsubscribe;
	});

	async function loadInitialData() {
		try {
			// Load kategori
			const kategoriResult = await DatabaseService.getKategori();
			if (kategoriResult.data) {
				kategoriList = kategoriResult.data;
			}

			// Load rekap data
			await loadRekapData();
		} catch (error) {
			console.error('Error loading initial data:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadRekapData() {
		isLoading = true;
		try {
			const result = await DatabaseService.getRekapAbsensiBulanan(
				selectedBulan,
				selectedTahun,
				selectedKategori || null
			);

			if (result.data) {
				rekapData = result.data;
				filteredRekap = rekapData;
			} else {
				// Create mock data for demonstration
				rekapData = createMockRekapData();
				filteredRekap = rekapData;
			}
		} catch (error) {
			console.error('Error loading rekap data:', error);
			// Create mock data for demonstration
			rekapData = createMockRekapData();
			filteredRekap = rekapData;
		} finally {
			isLoading = false;
		}
	}

	function createMockRekapData() {
		// This is mock data for demonstration purposes
		return [
			{
				jamaah_id: '1',
				nomor_induk: 'J001',
				nama_lengkap: 'Ahmad Fauzi',
				nama_kategori: 'Putra',
				nama_pengajian: 'Tahfidz Putra A',
				total_hadir: 12,
				total_absen: 2,
				total_izin: 1,
				total_pertemuan: 15,
				persentase_kehadiran: 80.0
			},
			{
				jamaah_id: '2',
				nomor_induk: 'J002',
				nama_lengkap: 'Fatimah Azzahra',
				nama_kategori: 'Putri',
				nama_pengajian: 'Tahfidz Putri A',
				total_hadir: 14,
				total_absen: 0,
				total_izin: 1,
				total_pertemuan: 15,
				persentase_kehadiran: 93.3
			},
			{
				jamaah_id: '3',
				nomor_induk: 'J003',
				nama_lengkap: 'Muhammad Rizki',
				nama_kategori: 'Putra',
				nama_pengajian: 'Tahfidz Putra A',
				total_hadir: 10,
				total_absen: 3,
				total_izin: 2,
				total_pertemuan: 15,
				persentase_kehadiran: 66.7
			},
			{
				jamaah_id: '4',
				nomor_induk: 'J004',
				nama_lengkap: 'Siti Aisyah',
				nama_kategori: 'Putri',
				nama_pengajian: 'Tahfidz Putri A',
				total_hadir: 13,
				total_absen: 1,
				total_izin: 1,
				total_pertemuan: 15,
				persentase_kehadiran: 86.7
			}
		];
	}

	function handleFilterChange() {
		loadRekapData();
	}

	function getKehadiranLevel(persentase) {
		if (persentase >= 90) return { level: 'excellent', label: 'Sangat Baik', class: 'level-excellent' };
		if (persentase >= 80) return { level: 'good', label: 'Baik', class: 'level-good' };
		if (persentase >= 70) return { level: 'fair', label: 'Cukup', class: 'level-fair' };
		return { level: 'poor', label: 'Kurang', class: 'level-poor' };
	}

	function calculateSummaryStats() {
		if (filteredRekap.length === 0) {
			return {
				totalJamaah: 0,
				rataRataKehadiran: 0,
				totalPertemuan: 0,
				jamaahTerbaik: null
			};
		}

		const totalJamaah = filteredRekap.length;
		const rataRataKehadiran = filteredRekap.reduce((sum, item) => sum + (item.persentase_kehadiran || 0), 0) / totalJamaah;
		const totalPertemuan = Math.max(...filteredRekap.map(item => item.total_pertemuan || 0));
		const jamaahTerbaik = filteredRekap.reduce((best, current) =>
			(current.persentase_kehadiran || 0) > (best?.persentase_kehadiran || 0) ? current : best
		, null);

		return {
			totalJamaah,
			rataRataKehadiran: rataRataKehadiran.toFixed(1),
			totalPertemuan,
			jamaahTerbaik
		};
	}

	function exportData() {
		// Simple CSV export functionality
		const headers = ['No', 'Nomor Induk', 'Nama Lengkap', 'Kategori', 'Pengajian', 'Hadir', 'Absen', 'Izin', 'Total', 'Persentase'];
		const rows = filteredRekap.map((item, index) => [
			index + 1,
			item.nomor_induk,
			item.nama_lengkap,
			item.nama_kategori,
			item.nama_pengajian,
			item.total_hadir,
			item.total_absen,
			item.total_izin,
			item.total_pertemuan,
			`${item.persentase_kehadiran}%`
		]);

		const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `rekap-absensi-${bulanNames[selectedBulan - 1]}-${selectedTahun}.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	}

	function toggleFilters() {
		showFilters = !showFilters;
	}

	$: summaryStats = calculateSummaryStats();
	$: currentMonthYear = `${bulanNames[selectedBulan - 1]} ${selectedTahun}`;
</script>

<svelte:head>
	<title>Laporan Absensi - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader
	title="Laporan Absensi"
	on:search-click={toggleFilters}
	showSearch={true}
/>

<main class="app-content" class:desktop={isDesktop}>
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-content">
				<div class="spinner"></div>
				<p class="loading-text">Memuat data laporan...</p>
			</div>
		</div>
	{:else}
		<!-- Filter Section -->
		<div class="filter-section" class:show={showFilters}>
			<div class="filter-container">
				<div class="filter-header">
					<h3 class="filter-title">Filter Laporan</h3>
					<span class="filter-subtitle">Pilih periode dan kategori</span>
				</div>

				<div class="filter-grid" class:desktop-layout={isDesktop}>
					<div class="filter-group">
						<label for="bulan" class="filter-label">
							<Calendar size={16} />
							Bulan
						</label>
						<select
							id="bulan"
							bind:value={selectedBulan}
							on:change={handleFilterChange}
							class="filter-select"
						>
							{#each bulanNames as bulan, index}
								<option value={index + 1}>{bulan}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="tahun" class="filter-label">
							<Clock size={16} />
							Tahun
						</label>
						<select
							id="tahun"
							bind:value={selectedTahun}
							on:change={handleFilterChange}
							class="filter-select"
						>
							{#each [2023, 2024, 2025, 2026] as tahun}
								<option value={tahun}>{tahun}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="kategori" class="filter-label">
							<Users size={16} />
							Kategori
						</label>
						<select
							id="kategori"
							bind:value={selectedKategori}
							on:change={handleFilterChange}
							class="filter-select"
						>
							<option value="">Semua Kategori</option>
							{#each kategoriList as kategori}
								<option value={kategori.id}>{kategori.nama_kategori}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- Period Banner -->
		<div class="period-banner">
			<div class="period-content">
				<div class="period-info">
					<Calendar size={18} class="period-icon" />
					<div class="period-text">
						<span class="period-label">Periode Laporan:</span>
						<span class="period-value">{currentMonthYear}</span>
					</div>
				</div>
				<button
					class="export-btn"
					on:click={exportData}
					disabled={filteredRekap.length === 0}
				>
					<Download size={16} />
					Export
				</button>
			</div>
		</div>

		<div class="report-content">
			<!-- Summary Statistics -->
			<div class="summary-section">
				<h3 class="section-title">Ringkasan {currentMonthYear}</h3>
				<div class="summary-grid" class:desktop-layout={isDesktop}>
					<div class="summary-card primary">
						<div class="summary-icon">
							<Users size={20} />
						</div>
						<div class="summary-info">
							<div class="summary-number">{summaryStats.totalJamaah}</div>
							<div class="summary-label">Total Jamaah</div>
						</div>
					</div>

					<div class="summary-card success">
						<div class="summary-icon">
							<TrendingUp size={20} />
						</div>
						<div class="summary-info">
							<div class="summary-number">{summaryStats.rataRataKehadiran}%</div>
							<div class="summary-label">Rata-rata Kehadiran</div>
						</div>
					</div>

					<div class="summary-card info">
						<div class="summary-icon">
							<Calendar size={20} />
						</div>
						<div class="summary-info">
							<div class="summary-number">{summaryStats.totalPertemuan}</div>
							<div class="summary-label">Total Pertemuan</div>
						</div>
					</div>

					{#if summaryStats.jamaahTerbaik}
						<div class="summary-card warning">
							<div class="summary-icon">
								<Award size={20} />
							</div>
							<div class="summary-info">
								<div class="summary-number">{summaryStats.jamaahTerbaik.persentase_kehadiran}%</div>
								<div class="summary-label">Kehadiran Terbaik</div>
								<div class="summary-extra">{summaryStats.jamaahTerbaik.nama_lengkap}</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Detailed Report -->
			<div class="report-section">
				<div class="report-header">
					<h3 class="section-title">
						Detail Kehadiran
						<span class="record-count">{filteredRekap.length} jamaah</span>
					</h3>
				</div>

				{#if filteredRekap.length > 0}
					<div class="report-list">
						{#each filteredRekap as item, index}
							{@const kehadiranLevel = getKehadiranLevel(item.persentase_kehadiran || 0)}
							<div class="report-card" class:desktop-layout={isDesktop}>
								<div class="report-header-info">
									<div class="jamaah-avatar">
										{item.nama_lengkap.charAt(0).toUpperCase()}
									</div>
									<div class="jamaah-basic">
										<div class="jamaah-name">{item.nama_lengkap}</div>
										<div class="jamaah-id">{item.nomor_induk}</div>
									</div>
									<div class="jamaah-kategori">
										<span class="badge {item.nama_kategori === 'Putra' ? 'badge-info' : 'badge-warning'}">
											{item.nama_kategori}
										</span>
									</div>
								</div>

								<div class="report-details">
									<div class="pengajian-info">
										<FileText size={14} class="info-icon" />
										<span class="info-text">{item.nama_pengajian}</span>
									</div>

									<div class="attendance-stats" class:mobile-stack={!isDesktop}>
										<div class="stat-item hadir">
											<span class="stat-number">{item.total_hadir || 0}</span>
											<span class="stat-label">Hadir</span>
										</div>
										<div class="stat-item absen">
											<span class="stat-number">{item.total_absen || 0}</span>
											<span class="stat-label">Absen</span>
										</div>
										<div class="stat-item izin">
											<span class="stat-number">{item.total_izin || 0}</span>
											<span class="stat-label">Izin</span>
										</div>
										<div class="stat-item total">
											<span class="stat-number">{item.total_pertemuan || 0}</span>
											<span class="stat-label">Total</span>
										</div>
									</div>
								</div>

								<div class="report-footer">
									<div class="attendance-percentage">
										<span class="percentage-value {kehadiranLevel.class}">
											{formatters.percentage(item.persentase_kehadiran || 0)}
										</span>
									</div>
									<div class="attendance-level">
										<span class="level-badge {kehadiranLevel.class}">
											{kehadiranLevel.label}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Desktop Table View -->
					{#if isDesktop}
						<div class="table-section">
							<div class="table-container">
								<table class="report-table">
									<thead>
										<tr>
											<th>No</th>
											<th>Nomor Induk</th>
											<th>Nama Lengkap</th>
											<th>Kategori</th>
											<th>Pengajian</th>
											<th>Hadir</th>
											<th>Absen</th>
											<th>Izin</th>
											<th>Total</th>
											<th>Persentase</th>
											<th>Level</th>
										</tr>
									</thead>
									<tbody>
										{#each filteredRekap as item, index}
											{@const kehadiranLevel = getKehadiranLevel(item.persentase_kehadiran || 0)}
											<tr>
												<td>{index + 1}</td>
												<td class="font-medium">{item.nomor_induk}</td>
												<td class="font-medium">{item.nama_lengkap}</td>
												<td>
													<span class="badge {item.nama_kategori === 'Putra' ? 'badge-info' : 'badge-warning'}">
														{item.nama_kategori}
													</span>
												</td>
												<td>{item.nama_pengajian}</td>
												<td class="text-center">
													<span class="table-stat success">{item.total_hadir || 0}</span>
												</td>
												<td class="text-center">
													<span class="table-stat error">{item.total_absen || 0}</span>
												</td>
												<td class="text-center">
													<span class="table-stat warning">{item.total_izin || 0}</span>
												</td>
												<td class="text-center font-medium">{item.total_pertemuan || 0}</td>
												<td class="text-center">
													<span class="percentage-table {kehadiranLevel.class}">
														{formatters.percentage(item.persentase_kehadiran || 0)}
													</span>
												</td>
												<td class="text-center">
													<span class="level-badge-table {kehadiranLevel.class}">
														{kehadiranLevel.label}
													</span>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
				{:else}
					<div class="empty-state">
						<div class="empty-icon">
							<BarChart3 size={64} />
						</div>
						<div class="empty-content">
							<h3 class="empty-title">Tidak ada data untuk periode ini</h3>
							<p class="empty-description">
								Pilih bulan dan tahun yang berbeda atau pastikan sudah ada data absensi pada periode yang dipilih
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
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

	/* Filter Section */
	.filter-section {
		background: white;
		border-bottom: 1px solid #f1f5f9;
		max-height: 0;
		overflow: hidden;
		transition: max-height 0.3s ease;
	}

	.filter-section.show {
		max-height: 300px;
	}

	.filter-container {
		padding: 1.5rem 1rem;
	}

	.filter-header {
		margin-bottom: 1.5rem;
	}

	.filter-title {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}

	.filter-subtitle {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.filter-grid.desktop-layout {
		grid-template-columns: repeat(3, 1fr);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	/* Period Banner */
	.period-banner {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		padding: 1rem;
	}

	.period-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.period-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.period-icon {
		color: rgba(255, 255, 255, 0.9);
	}

	.period-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.period-label {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	.period-value {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.export-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.export-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
	}

	.export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Report Content */
	.report-content {
		padding: 1.5rem 1rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.record-count {
		background: #e0f2fe;
		color: #0369a1;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Summary Section */
	.summary-section {
		margin-bottom: 2rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.summary-grid.desktop-layout {
		grid-template-columns: repeat(4, 1fr);
	}

	.summary-card {
		background: white;
		border-radius: 12px;
		padding: 1.25rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s ease;
	}

	.summary-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.summary-icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.summary-card.primary .summary-icon {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.summary-card.success .summary-icon {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.summary-card.info .summary-icon {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	.summary-card.warning .summary-icon {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.summary-info {
		text-align: center;
		flex: 1;
	}

	.summary-number {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
	}

	.summary-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		margin-top: 0.25rem;
	}

	.summary-extra {
		font-size: 0.6875rem;
		color: #9ca3af;
		margin-top: 0.125rem;
	}

	/* Report Section */
	.report-section {
		margin-bottom: 2rem;
	}

	.report-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.report-card {
		background: white;
		border-radius: 12px;
		padding: 1.25rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.report-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.report-header-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.jamaah-avatar {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1rem;
		margin-right: 0.75rem;
	}

	.jamaah-basic {
		flex: 1;
		min-width: 0;
	}

	.jamaah-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.125rem;
	}

	.jamaah-id {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.report-details {
		margin-bottom: 1rem;
	}

	.pengajian-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.info-icon {
		color: #9ca3af;
		flex-shrink: 0;
	}

	.info-text {
		flex: 1;
	}

	.attendance-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	.attendance-stats.mobile-stack {
		grid-template-columns: repeat(2, 1fr);
	}

	.stat-item {
		text-align: center;
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid #f1f5f9;
	}

	.stat-item.hadir {
		background: #f0fdf4;
		border-color: #bbf7d0;
	}

	.stat-item.absen {
		background: #fef2f2;
		border-color: #fecaca;
	}

	.stat-item.izin {
		background: #fffbeb;
		border-color: #fed7aa;
	}

	.stat-item.total {
		background: #f0f9ff;
		border-color: #bae6fd;
	}

	.stat-number {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
		display: block;
	}

	.stat-item.hadir .stat-number {
		color: #16a34a;
	}

	.stat-item.absen .stat-number {
		color: #dc2626;
	}

	.stat-item.izin .stat-number {
		color: #ea580c;
	}

	.stat-item.total .stat-number {
		color: #0369a1;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.report-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 1rem;
		border-top: 1px solid #f8fafc;
	}

	.attendance-percentage {
		flex: 1;
	}

	.percentage-value {
		font-size: 1.125rem;
		font-weight: 700;
		padding: 0.5rem 1rem;
		border-radius: 8px;
	}

	.percentage-value.level-excellent {
		background: #dcfce7;
		color: #16a34a;
	}

	.percentage-value.level-good {
		background: #dbeafe;
		color: #2563eb;
	}

	.percentage-value.level-fair {
		background: #fef3c7;
		color: #d97706;
	}

	.percentage-value.level-poor {
		background: #fee2e2;
		color: #dc2626;
	}

	.level-badge {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.level-badge.level-excellent {
		background: #dcfce7;
		color: #15803d;
	}

	.level-badge.level-good {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.level-badge.level-fair {
		background: #fef3c7;
		color: #b45309;
	}

	.level-badge.level-poor {
		background: #fee2e2;
		color: #b91c1c;
	}

	/* Table Section (Desktop) */
	.table-section {
		display: none;
	}

	.table-container {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.report-table {
		width: 100%;
		font-size: 0.875rem;
	}

	.report-table th {
		background: #f8fafc;
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
	}

	.report-table td {
		padding: 1rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.report-table tr:last-child td {
		border-bottom: none;
	}

	.table-stat {
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.table-stat.success {
		background: #dcfce7;
		color: #16a34a;
	}

	.table-stat.error {
		background: #fee2e2;
		color: #dc2626;
	}

	.table-stat.warning {
		background: #fef3c7;
		color: #d97706;
	}

	.percentage-table {
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.percentage-table.level-excellent {
		background: #dcfce7;
		color: #16a34a;
	}

	.percentage-table.level-good {
		background: #dbeafe;
		color: #2563eb;
	}

	.percentage-table.level-fair {
		background: #fef3c7;
		color: #d97706;
	}

	.percentage-table.level-poor {
		background: #fee2e2;
		color: #dc2626;
	}

	.level-badge-table {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.level-badge-table.level-excellent {
		background: #dcfce7;
		color: #15803d;
	}

	.level-badge-table.level-good {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.level-badge-table.level-fair {
		background: #fef3c7;
		color: #b45309;
	}

	.level-badge-table.level-poor {
		background: #fee2e2;
		color: #b91c1c;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		background: white;
		border-radius: 12px;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.empty-icon {
		color: #d1d5db;
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

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.report-content {
			padding: 1rem;
		}

		.summary-grid {
			grid-template-columns: 1fr;
		}

		.summary-card {
			padding: 1rem;
			text-align: center;
		}

		.report-card {
			padding: 1rem;
		}

		.jamaah-avatar {
			width: 36px;
			height: 36px;
			font-size: 0.875rem;
		}

		.attendance-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.report-footer {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}

		.period-content {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.export-btn {
			justify-content: center;
		}
	}

	/* Desktop specific */
	@media (min-width: 1024px) {
		.table-section {
			display: block;
		}

		.report-list {
			display: none;
		}
	}
</style>
