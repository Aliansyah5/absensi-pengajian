<script>
	import { onMount, tick } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { AbsensiService } from '$lib/services/absensi.js';
	import { PengajianService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { BarChart3, Calendar, Download, Filter, TrendingUp, Users, Eye, FileText, Award, Clock, PieChart, List, BookOpen } from 'lucide-svelte';
	import Highcharts from 'highcharts';

	let isLoading = true;
	let innerWidth = 0;
	let activeTab = 'pengajian'; // 'pengajian' or 'absensi'
	let selectedBulan = new Date().getMonth() + 1;
	let selectedTahun = new Date().getFullYear();

	// Tab 1: Pengajian data
	let pengajianStats = [];

	// Tab 2: Absensi data
	let absensiData = [];

	// Color palette for charts
	const colorPalette = [
		'#10B981', // Emerald (Hadir)
		'#EF4444', // Red (Absen)
		'#F59E0B', // Amber (Izin)
		'#8B5CF6', // Violet
		'#06B6D4', // Cyan
		'#F97316', // Orange
		'#EC4899', // Pink
		'#84CC16', // Lime
		'#6366F1', // Indigo
		'#14B8A6'  // Teal
	];

	$: isDesktop = innerWidth >= 768;

	const bulanNames = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];

	// Reactive statement to create charts after pengajianStats updates and DOM is ready
	$: if (pengajianStats.length > 0 && activeTab === 'pengajian') {
		tick().then(() => {
			setTimeout(() => {
				pengajianStats.forEach((pengajian) => {
					createPieChart(`chart-${pengajian.id}`, pengajian, '');
				});
			}, 100); // Small delay to ensure DOM is fully rendered
		});
	}

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
		isLoading = true;
		try {
			await Promise.all([
				loadPengajianStats(),
				loadAbsensiData()
			]);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadPengajianStats() {
		try {
			// Get all pengajian from master
			const pengajianList = await PengajianService.getAllPengajian();

			// For each pengajian, calculate attendance stats for the month
			const statsPromises = pengajianList.map(async (pengajian) => {
				const startDate = new Date(selectedTahun, selectedBulan - 1, 1).toISOString().split('T')[0];
				const endDate = new Date(selectedTahun, selectedBulan, 0).toISOString().split('T')[0];

				// Get absensi data for this pengajian in the selected month
				const absensiList = await AbsensiService.getAllAbsensi(1, 100, {
					pengajian: pengajian.id,
					tanggal_mulai: startDate,
					tanggal_akhir: endDate
				});

				// Calculate stats
				let totalHadir = 0;
				let totalAbsen = 0;
				let totalIzin = 0;
				let totalSessions = absensiList.length;

				for (const absensi of absensiList) {
					const details = await AbsensiService.getAbsensiDetail(absensi.id);

					totalHadir += details.filter(d => d.status === 'H').length;
					totalAbsen += details.filter(d => d.status === 'A').length;
					totalIzin += details.filter(d => d.status === 'I').length;
				}

				const total = totalHadir + totalAbsen + totalIzin;
				const persentaseHadir = total > 0 ? (totalHadir / total * 100) : 0;

				return {
					id: pengajian.id,
					nama_pengajian: pengajian.nama_pengajian,
					total_hadir: totalHadir,
					total_absen: totalAbsen,
					total_izin: totalIzin,
					total_sessions: totalSessions,
					persentase_hadir: persentaseHadir
				};
			});

			pengajianStats = await Promise.all(statsPromises);
		} catch (error) {
			console.error('Error loading pengajian stats:', error);
			// Mock data for demo
			pengajianStats = [
				{
					id: 1,
					nama_pengajian: 'Tahfidz Putra A',
					total_hadir: 120,
					total_absen: 15,
					total_izin: 8,
					total_sessions: 12,
					persentase_hadir: 83.9
				},
				{
					id: 2,
					nama_pengajian: 'Tahfidz Putri A',
					total_hadir: 95,
					total_absen: 12,
					total_izin: 5,
					total_sessions: 10,
					persentase_hadir: 84.8
				}
			];
		}
	}

	async function loadAbsensiData() {
		try {
			const startDate = new Date(selectedTahun, selectedBulan - 1, 1).toISOString().split('T')[0];
			const endDate = new Date(selectedTahun, selectedBulan, 0).toISOString().split('T')[0];

			// Get all absensi for the month
			const absensiList = await AbsensiService.getAllAbsensi(1, 100, {
				tanggal_mulai: startDate,
				tanggal_akhir: endDate
			});

			// Calculate attendance percentage for each absensi
			const dataPromises = absensiList.map(async (absensi) => {
				const details = await AbsensiService.getAbsensiDetail(absensi.id);

				const totalJamaah = details.length;
				const hadirCount = details.filter(d => d.status === 'H').length;
                const izinCount = details.filter(d => d.status === 'I').length;
                const absenCount = details.filter(d => d.status === 'A').length;
				const persentaseKehadiran = totalJamaah > 0 ? (hadirCount / totalJamaah * 100) : 0;

				return {
					...absensi,
					total_jamaah: totalJamaah,
					hadir_count: hadirCount,
                    izin_count: izinCount,
                    absen_count: absenCount,
					persentase_kehadiran: persentaseKehadiran
				};
			});

			absensiData = await Promise.all(dataPromises);
		} catch (error) {
			console.error('Error loading absensi data:', error);
			// Mock data for demo with Al-Quran and Hadist info
			absensiData = [
				{
					id: 1,
					tgl: '2025-10-01',
					mpengajian: { nama_pengajian: 'Tahfidz Putra A' },
					mmasjid: { nama_masjid: 'Masjid Al-Ikhlas' },
					malquran: { nama_alquran: 'Al-Fatihah' },
					mhadist: { nama_hadist: 'Arba\'in Nawawi' },
					total_jamaah: 15,
					hadir_count: 13,
					persentase_kehadiran: 86.7
				},
				{
					id: 2,
					tgl: '2025-10-05',
					mpengajian: { nama_pengajian: 'Tahfidz Putri A' },
					mmasjid: { nama_masjid: 'Masjid Al-Hidayah' },
					malquran: { nama_alquran: 'Al-Baqarah' },
					mhadist: { nama_hadist: 'Riyadhus Shalihin' },
					total_jamaah: 12,
					hadir_count: 11,
					persentase_kehadiran: 91.7
				}
			];
		}
	}

	function handlePeriodChange() {
		loadInitialData();
	}

	async function handleTabChange(newTab) {
		activeTab = newTab;
		if (newTab === 'pengajian' && pengajianStats.length > 0) {
			// Wait for DOM update then recreate charts
			await tick();
			setTimeout(() => {
				pengajianStats.forEach((pengajian) => {
					createPieChart(`chart-${pengajian.id}`, pengajian, '');
				});
			}, 100);
		}
	}

	function handleAbsensiClick(absensiId) {
		goto(`/absensi-new?edit=${absensiId}`);
	}

	function toggleFilters() {
		// Function for search button click - can be used to toggle filter visibility
		console.log('Toggle filters clicked');
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

	function getAttendanceLevel(percentage) {
		if (percentage >= 90) return { class: 'excellent', label: 'Sangat Baik' };
		if (percentage >= 80) return { class: 'good', label: 'Baik' };
		if (percentage >= 70) return { class: 'fair', label: 'Cukup' };
		return { class: 'poor', label: 'Kurang' };
	}

	function createPieChart(containerId, data, title) {
		// Debug log
		console.log(`Attempting to create chart for container: ${containerId}`);

		// Check if the container element exists in the DOM
		const container = document.getElementById(containerId);
		if (!container) {
			console.error(`Chart container with id '${containerId}' not found`);
			// Try to find the container after a short delay
			setTimeout(() => {
				const retryContainer = document.getElementById(containerId);
				if (retryContainer) {
					console.log(`Found container on retry: ${containerId}`);
					createPieChart(containerId, data, title);
				} else {
					console.error(`Container '${containerId}' still not found after retry`);
				}
			}, 200);
			return;
		}

		console.log(`Found container: ${containerId}`, container);

		// Validate data
		if (!data || typeof data.total_hadir === 'undefined' || typeof data.total_absen === 'undefined' || typeof data.total_izin === 'undefined') {
			console.warn(`Invalid data for chart ${containerId}:`, data);
			return;
		}

		// Destroy existing chart if it exists
		if (container.chart) {
			container.chart.destroy();
		}

		const chartData = [
			{
				name: 'Hadir',
				y: data.total_hadir || 0,
				color: '#10B981'
			},
			{
				name: 'Absen',
				y: data.total_absen || 0,
				color: '#EF4444'
			},
			{
				name: 'Izin',
				y: data.total_izin || 0,
				color: '#F59E0B'
			}
		];

		// Check if there's any data to show
		const hasData = chartData.some(item => item.y > 0);
		if (!hasData) {
			container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #6b7280; font-size: 14px;">Tidak ada data untuk ditampilkan</div>';
			return;
		}

		try {
			console.log(`Creating chart for ${containerId} with data:`, chartData);

			const chart = Highcharts.chart(containerId, {
				chart: {
					type: 'pie',
					backgroundColor: 'transparent',
					height: 250,
					marginTop: 20,
					marginBottom: 20
				},
                credits: {
                    enabled: false
                },
				title: {
					text: title,
					style: {
						fontSize: '14px',
						fontWeight: 'bold',
						color: '#111827'
					}
				},
				tooltip: {
					pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
				},
				accessibility: {
					point: {
						valueSuffix: '%'
					}
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)',
							style: {
								fontSize: '11px'
							}
						},
						showInLegend: true,
						borderWidth: 2,
						borderColor: '#ffffff',
						center: ['50%', '50%'],
						size: '80%'
					}
				},
				legend: {
					align: 'center',
					verticalAlign: 'bottom',
					layout: 'horizontal',
					itemMarginTop: 10,
					itemMarginBottom: 10
				},
				series: [{
					name: 'Kehadiran',
					colorByPoint: true,
					data: chartData
				}]
			});

			// Store chart reference on the container
			container.chart = chart;
			console.log(`Chart created successfully for ${containerId}`);
		} catch (error) {
			console.error(`Error creating chart for ${containerId}:`, error);
			container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #ef4444; font-size: 14px;">Error loading chart</div>';
		}
	}

	$: currentMonthYear = `${bulanNames[selectedBulan - 1]} ${selectedTahun}`;
</script>

<svelte:head>
	<title>Laporan Absensi - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader
	title="Laporan Absensi Pengajian"
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
		<!-- Period Filter Section -->
		<div class="period-filter">
			<div class="filter-container">
				<div class="filter-header">
					<h3 class="filter-title">Periode Laporan</h3>
				</div>

				<div class="filter-grid">
					<div class="filter-group">
						<label for="bulan" class="filter-label">
							<Calendar size={16} />
							Bulan
						</label>
						<select
							id="bulan"
							bind:value={selectedBulan}
							on:change={handlePeriodChange}
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
							on:change={handlePeriodChange}
							class="filter-select"
						>
							{#each [2023, 2024, 2025, 2026, 2027] as tahun}
								<option value={tahun}>{tahun}</option>
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
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="tab-navigation">
			<button
				class="tab-button"
				class:active={activeTab === 'pengajian'}
				on:click={() => handleTabChange('pengajian')}
			>
				<PieChart size={18} />
				<span>Persentase Per Pengajian</span>
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'absensi'}
				on:click={() => handleTabChange('absensi')}
			>
				<List size={18} />
				<span>Data Absensi</span>
			</button>
		</div>

		<!-- Tab Content -->
		<div class="report-content">
			{#if activeTab === 'pengajian'}
				<!-- Tab 1: Pengajian Statistics -->
				<div class="pengajian-stats-section">

					{#if pengajianStats.length > 0}
						<div class="pengajian-grid">
							{#each pengajianStats as pengajian, index}
								<div class="pengajian-stat-card">
									<div class="card-header">
										<h4 class="pengajian-name">{pengajian.nama_pengajian}</h4>
										<span class="session-count">{pengajian.total_sessions} sesi</span>
									</div>

									<!-- Highcharts Container -->
									<div class="chart-container">
										<div id="chart-{pengajian.id}" class="pie-chart-highcharts"></div>
									</div>

									<div class="stats-summary">
										<div class="summary-stat">
											<div class="stat-icon">
												<Users size={16} />
											</div>
											<div class="stat-info">
												<span class="stat-number">{pengajian.persentase_hadir.toFixed(1)}%</span>
												<span class="stat-label">Kehadiran</span>
											</div>
										</div>

										<div class="stats-breakdown">
											<div class="breakdown-item">
												<div class="indicator hadir"></div>
												<span class="label">Hadir</span>
												<span class="value">{pengajian.total_hadir}</span>
											</div>
											<div class="breakdown-item">
												<div class="indicator absen"></div>
												<span class="label">Absen</span>
												<span class="value">{pengajian.total_absen}</span>
											</div>
											<div class="breakdown-item">
												<div class="indicator izin"></div>
												<span class="label">Izin</span>
												<span class="value">{pengajian.total_izin}</span>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-state">
							<PieChart size={48} class="empty-icon" />
							<h4 class="empty-title">Tidak ada data pengajian</h4>
							<p class="empty-description">Belum ada data pengajian untuk periode {currentMonthYear}</p>
						</div>
					{/if}
				</div>			{:else if activeTab === 'absensi'}
				<!-- Tab 2: Absensi Data -->
				<div class="absensi-data-section">
					<h3 class="section-title">Data Absensi {currentMonthYear}</h3>

					{#if absensiData.length > 0}
						<div class="absensi-grid">
							{#each absensiData as absensi}
								{@const level = getAttendanceLevel(absensi.persentase_kehadiran)}
								<button
									class="absensi-card"
									on:click={() => handleAbsensiClick(absensi.id)}
								>
									<div class="absensi-header">
										<div class="absensi-date">
											<Calendar size={16} />
											<span>{formatDate(absensi.tgl)}</span>
										</div>
										<div class="attendance-badge {level.class}">
											{absensi.persentase_kehadiran.toFixed(1)}%
										</div>
									</div>

									<div class="absensi-info">
										<h4 class="pengajian-title">{absensi.mpengajian?.nama_pengajian || 'Pengajian'}</h4>
										<p class="masjid-name">{absensi.mmasjid?.nama_masjid || 'Masjid'}</p>

										<!-- Al-Quran and Hadist Info -->
										<div class="quran-hadist-info">
											{#if absensi.malquran?.nama_surat}
												<div class="info-item">
													<BookOpen size={14} />
													<span class="info-label">Al-Quran:</span>
													<span class="info-value">{absensi.malquran.nama_surat}</span>
												</div>
											{/if}
											{#if absensi.mhadist?.nama_hadist}
												<div class="info-item">
													<FileText size={14} />
													<span class="info-label">Hadist:</span>
													<span class="info-value">{absensi.mhadist.nama_hadist}</span>
												</div>
											{/if}
										</div>
									</div>

									<div class="attendance-summary">
										<div class="summary-item">
											<span class="summary-label">Hadir:</span>
											<span class="summary-value">{absensi.hadir_count}</span>
										</div>
                                        <div class="summary-item">
											<span class="summary-label">Izin:</span>
											<span class="summary-value">{absensi.hadir_count}</span>
										</div>
                                        <div class="summary-item">
                                            <span class="summary-label">Absen:</span>
                                            <span class="summary-value">{absensi.absen_count}</span>
                                        </div>
										<div class="summary-item">
											<span class="summary-label">Total:</span>
											<span class="summary-value">{absensi.total_jamaah}</span>
										</div>
									</div>

									<div class="attendance-level">
										<span class="level-label {level.class}">{level.label}</span>
									</div>
								</button>
							{/each}
						</div>
					{:else}
						<div class="empty-state">
							<List size={48} class="empty-icon" />
							<h4 class="empty-title">Tidak ada data absensi</h4>
							<p class="empty-description">Belum ada data absensi untuk periode {currentMonthYear}</p>
						</div>
					{/if}
				</div>
			{/if}
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

	/* Period Filter Section */
	.period-filter {
		background: white;
		border-bottom: 1px solid #f1f5f9;
		padding: 1.5rem 1rem;
	}

	.filter-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.filter-header {
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.filter-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
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
		justify-content: center;
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

	/* Tab Navigation */
	.tab-navigation {
		display: flex;
		background: white;
		border-bottom: 1px solid #f1f5f9;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		padding: 1rem 1.5rem;
		border: none;
		background: transparent;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
		border-bottom: 2px solid transparent;
	}

	.tab-button:hover {
		background: #f9fafb;
		color: #374151;
	}

	.tab-button.active {
		color: #0ea5e9;
		border-bottom-color: #0ea5e9;
		background: #f0f9ff;
	}

	/* Report Content */
	.report-content {
		padding: 1.5rem 1rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1.5rem 0;
	}

	/* Pengajian Stats Section */
	.pengajian-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.pengajian-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.pengajian-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.pengajian-stat-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.pengajian-stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
	}

	.pengajian-name {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		flex: 1;
		line-height: 1.3;
	}

	.session-count {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		white-space: nowrap;
	}

	/* Highcharts Container */
	.chart-container {
		margin: 2rem 0;
		height: 250px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.pie-chart-highcharts {
		width: 100%;
		height: 250px;
	}

	/* Stats Summary */
	.stats-summary {
		border-top: 1px solid #f3f4f6;
		padding-top: 1.5rem;
	}

	.summary-stat {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 12px;
	}

	.stat-icon {
		background: #0ea5e9;
		color: white;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-info {
		flex: 1;
	}

	.stat-number {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
	}

	.stat-label {
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.stats-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.breakdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.indicator {
		width: 12px;
		height: 12px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.indicator.hadir {
		background: #10b981;
	}

	.indicator.absen {
		background: #ef4444;
	}

	.indicator.izin {
		background: #f59e0b;
	}

	.breakdown-item .label {
		font-size: 0.875rem;
		color: #6b7280;
		flex: 1;
	}

	.breakdown-item .value {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	/* Absensi Data Section */
	.absensi-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.absensi-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.absensi-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.absensi-card {
		background: white;
		border: 1px solid #f1f5f9;
		border-radius: 12px;
		padding: 1.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.absensi-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		border-color: #e2e8f0;
	}

	.absensi-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.absensi-date {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.attendance-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.attendance-badge.excellent {
		background: #dcfce7;
		color: #16a34a;
	}

	.attendance-badge.good {
		background: #dbeafe;
		color: #2563eb;
	}

	.attendance-badge.fair {
		background: #fef3c7;
		color: #d97706;
	}

	.attendance-badge.poor {
		background: #fee2e2;
		color: #dc2626;
	}

	.absensi-info {
		margin-bottom: 1rem;
	}

	.pengajian-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
		line-height: 1.3;
	}

	.masjid-name {
		font-size: 0.8rem;
		color: #6b7280;
		margin: 0 0 0.75rem 0;
	}

	.quran-hadist-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.info-label {
		font-weight: 500;
		min-width: 50px;
	}

	.info-value {
		color: #374151;
		font-weight: 600;
	}

	.attendance-summary {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 8px;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: center;
	}

	.summary-label {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.summary-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	.attendance-level {
		text-align: center;
	}

	.level-label {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
	}

	.level-label.excellent {
		background: #dcfce7;
		color: #15803d;
	}

	.level-label.good {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.level-label.fair {
		background: #fef3c7;
		color: #b45309;
	}

	.level-label.poor {
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
		border-radius: 16px;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	:global(.empty-icon) {
		color: #d1d5db !important;
		margin-bottom: 1rem !important;
	}

	.empty-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
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

		.filter-grid {
			grid-template-columns: 1fr;
		}

		.tab-button {
			flex-direction: column;
			gap: 0.25rem;
			padding: 0.875rem 1rem;
		}

		.tab-button span {
			font-size: 0.75rem;
		}

		.period-content {
			flex-direction: column;
			text-align: center;
		}

		.card-header {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}

		.chart-container {
			height: 200px;
		}

		.pie-chart-highcharts {
			height: 200px;
		}

		.stats-breakdown {
			flex-direction: column;
			gap: 0.5rem;
		}

		.attendance-summary {
			flex-direction: column;
			gap: 0.5rem;
		}

		.summary-item {
			flex-direction: row;
			justify-content: space-between;
			text-align: left;
		}
	}
</style>
