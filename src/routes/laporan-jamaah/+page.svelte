<script>
	import { onMount, tick } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { JamaahService, KategoriService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { PieChart, Users, UserCheck, Calendar, Filter, TrendingUp, Database } from 'lucide-svelte';
	import Highcharts from 'highcharts';

	let isLoading = true;
	let innerWidth = 0;
	let jamaahData = [];
	let kategoriList = [];

	// Statistics
	let totalJamaah = 0;
	let genderStats = {
		L: 0,
		P: 0
	};
	let kategoriStats = [];

	// Color palette for charts
	const colorPalette = [
		'#0ea5e9', // Sky blue
		'#8b5cf6', // Violet
		'#ec4899', // Pink
		'#f59e0b', // Amber
		'#10b981', // Emerald
		'#06b6d4', // Cyan
		'#f97316', // Orange
		'#84cc16', // Lime
		'#6366f1', // Indigo
		'#14b8a6'  // Teal
	];

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

				await loadInitialData();
			}
		});

		return unsubscribe;
	});

	async function loadInitialData() {
		isLoading = true;
		try {
			// Load jamaah data
			jamaahData = await JamaahService.getAllJamaah();

			// Load kategori data
			kategoriList = await KategoriService.getAllKategori();

			// Calculate statistics
			calculateStatistics();

			// Wait for DOM update then create charts
			await tick();
			setTimeout(() => {
				createGenderChart();
				createKategoriChart();
			}, 100);
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	}

	function calculateStatistics() {
		// Total jamaah
		totalJamaah = jamaahData.length;

		// Gender statistics
		genderStats = {
			L: jamaahData.filter(j => j.jk === 'L').length,
			P: jamaahData.filter(j => j.jk === 'P').length
		};

		// Kategori statistics
		const kategoriCount = {};
		jamaahData.forEach(jamaah => {
			const kategoriId = jamaah.id_kategori;
			const kategoriName = jamaah.mkategori?.category || 'Tidak Ada Kategori';

			if (!kategoriCount[kategoriName]) {
				kategoriCount[kategoriName] = 0;
			}
			kategoriCount[kategoriName]++;
		});

		// Convert to array for chart
		kategoriStats = Object.entries(kategoriCount).map(([name, count]) => ({
			name,
			count,
			percentage: ((count / totalJamaah) * 100).toFixed(1)
		})).sort((a, b) => b.count - a.count);
	}

	function createGenderChart() {
		const container = document.getElementById('gender-chart');
		if (!container) {
			console.error('Gender chart container not found');
			return;
		}

		// Destroy existing chart if it exists
		if (container.chart) {
			container.chart.destroy();
		}

		const chartData = [
			{
				name: 'Laki-laki',
				y: genderStats.L,
				color: '#0ea5e9'
			},
			{
				name: 'Perempuan',
				y: genderStats.P,
				color: '#ec4899'
			}
		];

		// Check if there's any data to show
		const hasData = chartData.some(item => item.y > 0);
		if (!hasData) {
			container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6b7280; font-size: 14px;">Tidak ada data untuk ditampilkan</div>';
			return;
		}

		try {
			const chart = Highcharts.chart('gender-chart', {
				chart: {
					type: 'pie',
					backgroundColor: 'transparent',
					height: 350
				},
				credits: {
					enabled: false
				},
				title: {
					text: 'Distribusi Berdasarkan Jenis Kelamin',
					style: {
						fontSize: '16px',
						fontWeight: 'bold',
						color: '#111827'
					}
				},
				tooltip: {
					pointFormat: '<b>{point.y}</b> jamaah ({point.percentage:.1f}%)'
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b><br>{point.y} ({point.percentage:.1f}%)',
							style: {
								fontSize: '12px',
								fontWeight: '500'
							}
						},
						showInLegend: true,
						borderWidth: 3,
						borderColor: '#ffffff',
						size: '85%'
					}
				},
				legend: {
					align: 'center',
					verticalAlign: 'bottom',
					layout: 'horizontal',
					itemMarginTop: 10,
					itemMarginBottom: 10,
					itemStyle: {
						fontSize: '13px',
						fontWeight: '500'
					}
				},
				series: [{
					name: 'Jenis Kelamin',
					colorByPoint: true,
					data: chartData
				}]
			});

			container.chart = chart;
		} catch (error) {
			console.error('Error creating gender chart:', error);
			container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #ef4444; font-size: 14px;">Error loading chart</div>';
		}
	}

	function createKategoriChart() {
		const container = document.getElementById('kategori-chart');
		if (!container) {
			console.error('Kategori chart container not found');
			return;
		}

		// Destroy existing chart if it exists
		if (container.chart) {
			container.chart.destroy();
		}

		// Prepare chart data with colors
		const chartData = kategoriStats.map((stat, index) => ({
			name: stat.name,
			y: stat.count,
			color: colorPalette[index % colorPalette.length]
		}));

		// Check if there's any data to show
		const hasData = chartData.some(item => item.y > 0);
		if (!hasData) {
			container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6b7280; font-size: 14px;">Tidak ada data untuk ditampilkan</div>';
			return;
		}

		try {
			const chart = Highcharts.chart('kategori-chart', {
				chart: {
					type: 'pie',
					backgroundColor: 'transparent',
					height: 350
				},
				credits: {
					enabled: false
				},
				title: {
					text: 'Distribusi Berdasarkan Kategori',
					style: {
						fontSize: '16px',
						fontWeight: 'bold',
						color: '#111827'
					}
				},
				tooltip: {
					pointFormat: '<b>{point.y}</b> jamaah ({point.percentage:.1f}%)'
				},
				plotOptions: {
					pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b><br>{point.y} ({point.percentage:.1f}%)',
							style: {
								fontSize: '12px',
								fontWeight: '500'
							},
							distance: 20
						},
						showInLegend: true,
						borderWidth: 3,
						borderColor: '#ffffff',
						size: '85%'
					}
				},
				legend: {
					align: 'center',
					verticalAlign: 'bottom',
					layout: 'horizontal',
					itemMarginTop: 10,
					itemMarginBottom: 10,
					itemStyle: {
						fontSize: '13px',
						fontWeight: '500'
					}
				},
				series: [{
					name: 'Kategori',
					colorByPoint: true,
					data: chartData
				}]
			});

			container.chart = chart;
		} catch (error) {
			console.error('Error creating kategori chart:', error);
			container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #ef4444; font-size: 14px;">Error loading chart</div>';
		}
	}

	function toggleFilters() {
		console.log('Toggle filters clicked');
	}
</script>

<svelte:head>
	<title>Laporan Database Jamaah - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader
	title="Laporan Database Jamaah"
	on:search-click={toggleFilters}
	showSearch={false}
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
		<!-- Header Banner -->
		<div class="header-banner">
			<div class="banner-content">
				<Database size={24} class="banner-icon" />
				<div class="banner-text">
					<h2 class="banner-title">Database Jamaah</h2>
					<p class="banner-description">Statistik dan distribusi data jamaah</p>
				</div>
			</div>
		</div>

		<div class="report-content">
			<!-- Summary Stats -->
			<div class="stats-section">
				<div class="stats-grid" class:desktop-grid={isDesktop}>
					<div class="stat-card primary">
						<div class="stat-icon">
							<Users size={28} />
						</div>
						<div class="stat-info">
							<div class="stat-number">{totalJamaah}</div>
							<div class="stat-label">Total Jamaah</div>
						</div>
					</div>

					<div class="stat-card male">
						<div class="stat-icon">
							<UserCheck size={28} />
						</div>
						<div class="stat-info">
							<div class="stat-number">{genderStats.L}</div>
							<div class="stat-label">Laki-laki</div>
							<div class="stat-percentage">{totalJamaah > 0 ? ((genderStats.L / totalJamaah) * 100).toFixed(1) : 0}%</div>
						</div>
					</div>

					<div class="stat-card female">
						<div class="stat-icon">
							<UserCheck size={28} />
						</div>
						<div class="stat-info">
							<div class="stat-number">{genderStats.P}</div>
							<div class="stat-label">Perempuan</div>
							<div class="stat-percentage">{totalJamaah > 0 ? ((genderStats.P / totalJamaah) * 100).toFixed(1) : 0}%</div>
						</div>
					</div>

					<div class="stat-card category">
						<div class="stat-icon">
							<TrendingUp size={28} />
						</div>
						<div class="stat-info">
							<div class="stat-number">{kategoriStats.length}</div>
							<div class="stat-label">Kategori</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Charts Section -->
			<div class="charts-section">
				<!-- Gender Distribution Chart -->
				<div class="chart-card">
					<div class="chart-header">
						<h3 class="chart-title">
							<PieChart size={20} />
							Distribusi Jenis Kelamin
						</h3>
					</div>
					<div class="chart-container">
						<div id="gender-chart" class="pie-chart"></div>
					</div>
					<div class="chart-summary">
						<div class="summary-row">
							<div class="summary-item male-item">
								<div class="indicator male"></div>
								<span class="label">Laki-laki</span>
								<span class="value">{genderStats.L}</span>
								<span class="percentage">{totalJamaah > 0 ? ((genderStats.L / totalJamaah) * 100).toFixed(1) : 0}%</span>
							</div>
							<div class="summary-item female-item">
								<div class="indicator female"></div>
								<span class="label">Perempuan</span>
								<span class="value">{genderStats.P}</span>
								<span class="percentage">{totalJamaah > 0 ? ((genderStats.P / totalJamaah) * 100).toFixed(1) : 0}%</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Kategori Distribution Chart -->
				<div class="chart-card">
					<div class="chart-header">
						<h3 class="chart-title">
							<PieChart size={20} />
							Distribusi Kategori
						</h3>
					</div>
					<div class="chart-container">
						<div id="kategori-chart" class="pie-chart"></div>
					</div>
					<div class="chart-summary">
						<div class="summary-list">
							{#each kategoriStats as stat, index}
								<div class="summary-item">
									<div class="indicator" style="background-color: {colorPalette[index % colorPalette.length]}"></div>
									<span class="label">{stat.name}</span>
									<span class="value">{stat.count}</span>
									<span class="percentage">{stat.percentage}%</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Detailed Statistics Table -->
			<div class="table-section">
				<h3 class="section-title">Rincian Statistik Kategori</h3>
				<div class="table-card">
					<table class="stats-table">
						<thead>
							<tr>
								<th>No</th>
								<th>Kategori</th>
								<th>Jumlah</th>
								<th>Persentase</th>
								<th>Grafik</th>
							</tr>
						</thead>
						<tbody>
							{#each kategoriStats as stat, index}
								<tr>
									<td>{index + 1}</td>
									<td>
										<div class="kategori-cell">
											<div class="color-indicator" style="background-color: {colorPalette[index % colorPalette.length]}"></div>
											<span>{stat.name}</span>
										</div>
									</td>
									<td><strong>{stat.count}</strong> jamaah</td>
									<td><strong>{stat.percentage}%</strong></td>
									<td>
										<div class="progress-bar">
											<div class="progress-fill" style="width: {stat.percentage}%; background-color: {colorPalette[index % colorPalette.length]}"></div>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
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

	/* Header Banner */
	.header-banner {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		padding: 2rem 1rem;
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.banner-icon {
		flex-shrink: 0;
	}

	.banner-text {
		flex: 1;
	}

	.banner-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.25rem 0;
	}

	.banner-description {
		font-size: 0.875rem;
		margin: 0;
		opacity: 0.95;
	}

	/* Report Content */
	.report-content {
		padding: 1.5rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Stats Section */
	.stats-section {
		margin-bottom: 2rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.stats-grid.desktop-grid {
		grid-template-columns: repeat(4, 1fr);
	}

	.stat-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.stat-icon {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.stat-card.primary .stat-icon {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.stat-card.male .stat-icon {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	}

	.stat-card.female .stat-icon {
		background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
	}

	.stat-card.category .stat-icon {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	.stat-info {
		flex: 1;
		min-width: 0;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.stat-percentage {
		font-size: 0.75rem;
		color: #10b981;
		font-weight: 600;
		margin-top: 0.25rem;
	}

	/* Charts Section */
	.charts-section {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 768px) {
		.charts-section {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.chart-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.chart-header {
		margin-bottom: 1.5rem;
	}

	.chart-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.chart-container {
		margin: 1.5rem 0;
	}

	.pie-chart {
		width: 100%;
		height: 350px;
	}

	.chart-summary {
		border-top: 1px solid #f3f4f6;
		padding-top: 1.5rem;
	}

	.summary-row {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.summary-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 10px;
		transition: background 0.2s ease;
	}

	.summary-item:hover {
		background: #f3f4f6;
	}

	.indicator {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.indicator.male {
		background: #0ea5e9;
	}

	.indicator.female {
		background: #ec4899;
	}

	.summary-item .label {
		flex: 1;
		font-size: 0.875rem;
		color: #374151;
		font-weight: 500;
	}

	.summary-item .value {
		font-size: 0.875rem;
		font-weight: 700;
		color: #111827;
		min-width: 40px;
		text-align: right;
	}

	.summary-item .percentage {
		font-size: 0.875rem;
		font-weight: 600;
		color: #10b981;
		min-width: 50px;
		text-align: right;
	}

	/* Table Section */
	.table-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}

	.table-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
	}

	.stats-table {
		width: 100%;
		border-collapse: collapse;
	}

	.stats-table thead {
		background: #f9fafb;
	}

	.stats-table th {
		padding: 0.875rem;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}

	.stats-table td {
		padding: 1rem 0.875rem;
		font-size: 0.875rem;
		color: #6b7280;
		border-bottom: 1px solid #f3f4f6;
	}

	.stats-table tbody tr:hover {
		background: #f9fafb;
	}

	.kategori-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-indicator {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.progress-bar {
		height: 8px;
		background: #f3f4f6;
		border-radius: 4px;
		overflow: hidden;
		width: 100%;
		max-width: 200px;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
		border-radius: 4px;
	}

	/* Mobile Optimizations */
	@media (max-width: 640px) {
		.report-content {
			padding: 1rem;
		}

		.banner-content {
			flex-direction: column;
			text-align: center;
		}

		.banner-title {
			font-size: 1.25rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: 1.25rem;
		}

		.stat-icon {
			width: 48px;
			height: 48px;
		}

		.stat-number {
			font-size: 1.75rem;
		}

		.pie-chart {
			height: 280px;
		}

		.chart-card {
			padding: 1.25rem;
		}

		.table-card {
			padding: 1rem;
		}

		.stats-table {
			font-size: 0.75rem;
		}

		.stats-table th,
		.stats-table td {
			padding: 0.75rem 0.5rem;
		}

		.progress-bar {
			max-width: 100px;
		}
	}
</style>
