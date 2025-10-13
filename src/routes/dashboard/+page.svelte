<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { DatabaseService } from '$lib/utils/supabase.js';
	import { AbsensiService } from '$lib/services/absensi.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { Users, UserCheck, UserX, Calendar, TrendingUp,
        ChevronRight, Plus, BarChart, MapPin, Clock, BookOpen, Percent,
        FileChartColumnIncreasing} from 'lucide-svelte';

	let isLoading = true;
	let innerWidth = 0;
	let stats = {
		total_jamaah: 0,
		total_putra: 0,
		total_putri: 0,
		total_pengajian: 0,
		total_kelompok: 0,
		total_masjid: 0
	};
	let absensiHariIni = {
		hadir: 0,
		absen: 0,
		izin: 0,
		total: 0
	};
	let pengajianHariIni = [];

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

				// Load dashboard data
				await loadDashboardData();
			}
		});

		return unsubscribe;
	});

	async function loadDashboardData() {
		try {
			// Load general statistics
			const statsResult = await DatabaseService.getDashboardStats();
			if (statsResult.data) {
				stats = statsResult.data;
			}

			const absensiTodayResult = await AbsensiService.getAllAbsensiToday();

			if (absensiTodayResult && absensiTodayResult.length > 0) {
				pengajianHariIni = absensiTodayResult;
			}
		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			isLoading = false;
		}
	}

	function getAttendancePercentage(type) {
		if (absensiHariIni.total === 0) return 0;
		return ((absensiHariIni[type] / absensiHariIni.total) * 100).toFixed(1);
	}

	function getTodayFormatted() {
		const today = new Date();
		return today.toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});
	}

	function handlePengajianClick(absensiId) {
		// Navigate to edit existing absensi
		goto(`/absensi-new?edit=${absensiId}`);
	}

	function getRandomGradient() {
		const gradients = [
			'from-blue-500 to-blue-600',
			'from-green-500 to-green-600',
			'from-purple-500 to-purple-600',
			'from-orange-500 to-orange-600',
			'from-pink-500 to-pink-600',
			'from-indigo-500 to-indigo-600'
		];
		return gradients[Math.floor(Math.random() * gradients.length)];
	}

	const quickActions = [
		{
			title: 'Input Absensi',
			icon: UserCheck,
			href: '/absensi-new',
			color: 'bg-green-500',
			description: 'Catat kehadiran jamaah',
			gradient: 'from-green-500 to-green-600'
		},
		{
			title: 'Data Jamaah',
			icon: Users,
			href: '/master/jamaah',
			color: 'bg-blue-500',
			description: 'Kelola data jamaah',
			gradient: 'from-blue-500 to-blue-600'
		},
		{
			title: 'Master Data',
			icon: BarChart,
			href: '/master',
			color: 'bg-purple-500',
			description: 'Kelola data master',
			gradient: 'from-purple-500 to-purple-600'
		},
		{
			title: 'Laporan Pengajian',
			icon: FileChartColumnIncreasing,
			href: '/laporan',
			color: 'bg-orange-500',
			description: 'Lihat laporan pengajian',
			gradient: 'from-orange-500 to-orange-600'
		}
	];

	function handleNotificationClick() {
		// Handle notification click
		console.log('Notification clicked');
	}

	function handleMenuClick() {
		// Handle menu click
		console.log('Menu clicked');
	}
</script>

<svelte:head>
	<title>Dashboard - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader
	title="Dashboard"
	onNotificationClick={handleNotificationClick}
	onMenuClick={handleMenuClick}
/>

<main class="app-content" class:desktop={isDesktop}>
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-content">
				<div class="spinner"></div>
				<p class="loading-text">Memuat data dashboard...</p>
			</div>
		</div>
	{:else}
		<!-- Today's Date Banner -->
		<div class="date-banner">
			<div class="date-content">
				<Calendar size={18} class="date-icon" />
				<span class="date-text">{getTodayFormatted()}</span>
			</div>
		</div>

		<div class="dashboard-content">
			<!-- Main Stats Overview -->
			<div class="stats-section">
				<h2 class="section-title">Ringkasan Data</h2>
				<div class="stats-grid" class:desktop-grid={isDesktop}>
					<div class="stat-card primary">
						<div class="stat-icon">
							<Users size={24} />
						</div>
						<div class="stat-info">
							<div class="stat-number">{stats.total_jamaah}</div>
							<div class="stat-label">Total Jamaah</div>
						</div>
					</div>

					<div class="stat-card success">
						<div class="stat-icon">
							<TrendingUp size={24} />
						</div>
						<div class="stat-info">
							<div class="stat-number">{stats.total_pengajian}</div>
							<div class="stat-label">Pengajian</div>
						</div>
					</div>

					{#if isDesktop}
						<div class="stat-card info">
							<div class="stat-icon">
								<BarChart size={24} />
							</div>
							<div class="stat-info">
								<div class="stat-number">{stats.total_kelompok}</div>
								<div class="stat-label">Kelompok</div>
							</div>
						</div>

						<div class="stat-card warning">
							<div class="stat-icon">
								<MapPin size={24} />
							</div>
							<div class="stat-info">
								<div class="stat-number">{stats.total_masjid}</div>
								<div class="stat-label">Masjid</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Gender Breakdown -->
				<div class="gender-stats" class:desktop-layout={isDesktop}>
					<div class="gender-card male">
						<div class="gender-number">{stats.total_putra}</div>
						<div class="gender-label">Jamaah Putra</div>
					</div>
					<div class="gender-card female">
						<div class="gender-number">{stats.total_putri}</div>
						<div class="gender-label">Jamaah Putri</div>
					</div>
				</div>
			</div>

			<!-- Today's Attendance -->
			<div class="attendance-section">
				<h2 class="section-title">Pengajian Hari Ini</h2>
				<div class="attendance-card">
					{#if pengajianHariIni.length > 0}
						<div class="pengajian-grid">
							{#each pengajianHariIni as absensi}
								<button
									class="pengajian-card"
									on:click={() => handlePengajianClick(absensi.id)}
								>
									<div class="pengajian-icon bg-gradient-to-br {getRandomGradient()}">
										<BookOpen size={24} />
									</div>
									<div class="pengajian-content">
										<h3 class="pengajian-title">{absensi.mpengajian?.nama_pengajian || 'Pengajian'}</h3>
										<div class="pengajian-meta">
											<div class="pengajian-time">
												<Clock size={14} />
												<span>{absensi.jam_mulai || '19:00'} - {absensi.jam_akhir || '20:30'}</span>
											</div>
										</div>
										<div class="pengajian-details">
											{#if absensi.malquran?.nama_surat}
												<div class="detail-item">
													<span class="detail-label">Al-Quran:</span>
													<span class="detail-value">{absensi.malquran.nama_surat}</span>
												</div>
											{/if}
											{#if absensi.mhadist?.nama_hadist}
												<div class="detail-item">
													<span class="detail-label">Hadist:</span>
													<span class="detail-value">{absensi.mhadist.nama_hadist}</span>
												</div>
											{/if}
										</div>
									</div>
									<ChevronRight size={16} class="pengajian-arrow" />
								</button>
							{/each}
						</div>

						<!-- <div class="attendance-summary">
							<div class="summary-item">
								<span class="summary-number">{absensiHariIni.total}</span>
								<span class="summary-label">jamaah tercatat</span>
							</div>
							<div class="summary-item">
								<span class="summary-number">{absensiHariIni.hadir}</span>
								<span class="summary-label">hadir</span>
							</div>
							<div class="summary-item">
								<span class="summary-number">{pengajianHariIni.length}</span>
								<span class="summary-label">pengajian aktif</span>
							</div>
						</div> -->
					{:else}
						<div class="empty-attendance">
							<BookOpen size={48} class="empty-icon" />
							<div class="empty-title">Belum ada absensi hari ini</div>
							<div class="empty-description">Mulai buat absensi baru untuk pengajian hari ini</div>
							<a href="/absensi-new" class="btn btn-primary">
								<Plus size={18} />
								Input Absensi
							</a>
						</div>
					{/if}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="actions-section">
				<h2 class="section-title">Menu Utama</h2>
				<div class="actions-grid" class:desktop-grid={isDesktop}>
					{#each quickActions as action}
						<a href={action.href} class="action-card">
							<div class="action-icon bg-gradient-to-br {action.gradient}">
								<svelte:component this={action.icon} size={24} />
							</div>
							<div class="action-content">
								<div class="action-title">{action.title}</div>
								<div class="action-description">{action.description}</div>
							</div>
							<ChevronRight size={16} class="action-arrow" />
						</a>
					{/each}
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

	.date-banner {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		padding: 1rem;
	}

	.date-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.date-icon {
		color: rgba(255, 255, 255, 0.9);
	}

	.dashboard-content {
		padding: 1.5rem 1rem;
		space-y: 2rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}

	/* Stats Section */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stats-grid.desktop-grid {
		grid-template-columns: repeat(4, 1fr);
	}

	.stat-card {
		background: white;
		border-radius: 16px;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid #f1f5f9;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.stat-card.primary .stat-icon {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.stat-card.success .stat-icon {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.stat-card.info .stat-icon {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	.stat-card.warning .stat-icon {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.stat-info {
		flex: 1;
		min-width: 0;
	}

	.stat-number {
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	/* Gender Stats */
	.gender-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.gender-stats.desktop-layout {
		grid-template-columns: repeat(2, 1fr);
		max-width: 400px;
	}

	.gender-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		text-align: center;
		border: 1px solid #f1f5f9;
		transition: all 0.2s ease;
	}

	.gender-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.gender-card.male {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
		border-color: #93c5fd;
	}

	.gender-card.female {
		background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
		border-color: #f9a8d4;
	}

	.gender-number {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.gender-card.male .gender-number {
		color: #1e40af;
	}

	.gender-card.female .gender-number {
		color: #be185d;
	}

	.gender-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.gender-card.male .gender-label {
		color: #1e3a8a;
	}

	.gender-card.female .gender-label {
		color: #9d174d;
	}

	/* Attendance Section */
	.attendance-section {
		margin-top: 2rem;
	}

	.attendance-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Pengajian Cards */
	.pengajian-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	@media (min-width: 768px) {
		.pengajian-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}
	}

	.pengajian-card {
		display: flex;
		align-items: center;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		transition: all 0.2s ease;
		cursor: pointer;
		gap: 1rem;
		width: 100%;
		text-align: left;
	}

	.pengajian-card:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.pengajian-card:active {
		transform: translateY(0);
	}

	.pengajian-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.pengajian-content {
		flex: 1;
		min-width: 0;
	}

	.pengajian-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
	}

	.pengajian-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.pengajian-time {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.pengajian-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.detail-label {
		color: #9ca3af;
		font-weight: 500;
		min-width: 60px;
	}

	.detail-value {
		color: #4b5563;
		font-weight: 500;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pengajian-arrow {
		color: #9ca3af;
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}

	.pengajian-card:hover .pengajian-arrow {
		transform: translateX(2px);
		color: #6b7280;
	}

	.attendance-summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.25rem;
	}

	.summary-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
	}

	.summary-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.total-attendance {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.total-number {
		font-size: 2.5rem;
		font-weight: 700;
		color: #111827;
	}

	.total-label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.attendance-breakdown {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.attendance-breakdown.desktop-layout {
		gap: 1.5rem;
	}

	.attendance-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		border-radius: 12px;
		gap: 0.75rem;
	}

	.attendance-item.hadir {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
	}

	.attendance-item.absen {
		background: #fef2f2;
		border: 1px solid #fecaca;
	}

	.attendance-item.izin {
		background: #fffbeb;
		border: 1px solid #fed7aa;
	}

	.attendance-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.attendance-item.hadir .attendance-icon {
		background: #16a34a;
	}

	.attendance-item.absen .attendance-icon {
		background: #dc2626;
	}

	.attendance-item.izin .attendance-icon {
		background: #ea580c;
	}

	.attendance-data {
		text-align: center;
	}

	.attendance-number {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.attendance-item.hadir .attendance-number {
		color: #16a34a;
	}

	.attendance-item.absen .attendance-number {
		color: #dc2626;
	}

	.attendance-item.izin .attendance-number {
		color: #ea580c;
	}

	.attendance-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 0.125rem;
	}

	.attendance-percentage {
		font-size: 0.625rem;
		font-weight: 600;
		opacity: 0.8;
	}

	.progress-container {
		margin-top: 1rem;
	}

	.progress-bar {
		height: 8px;
		background: #f3f4f6;
		border-radius: 4px;
		overflow: hidden;
		display: flex;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.5s ease;
	}

	.progress-fill.hadir {
		background: #16a34a;
	}

	.progress-fill.izin {
		background: #ea580c;
	}

	/* Empty State */
	.empty-attendance {
		text-align: center;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	:global(.empty-icon) {
		color: #d1d5db !important;
		margin: 0 auto 1rem !important;
		display: block !important;
	}

	.empty-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.empty-description {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	/* Actions Section */
	.actions-section {
		margin-top: 2rem;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.actions-grid.desktop-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.action-card {
		display: flex;
		align-items: center;
		padding: 1rem;
		background: white;
		border-radius: 16px;
		border: 1px solid #f1f5f9;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
		gap: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.action-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: #e2e8f0;
	}

	.action-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.action-content {
		flex: 1;
		min-width: 0;
	}

	.action-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.action-description {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.action-arrow {
		color: #9ca3af;
		flex-shrink: 0;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.dashboard-content {
			padding: 1rem;
		}

		.stat-card {
			padding: 1rem;
			flex-direction: column;
			text-align: center;
			gap: 0.75rem;
		}

		.stat-icon {
			width: 40px;
			height: 40px;
		}

		.stat-number {
			font-size: 1.5rem;
		}

		.attendance-breakdown {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.attendance-item {
			flex-direction: row;
			text-align: left;
			padding: 0.75rem;
		}

		.attendance-icon {
			width: 32px;
			height: 32px;
		}

		.pengajian-card {
			padding: 0.875rem;
		}

		.pengajian-icon {
			width: 40px;
			height: 40px;
		}

		.pengajian-title {
			font-size: 0.875rem;
		}

		.pengajian-time {
			font-size: 0.75rem;
		}

		.detail-item {
			font-size: 0.7rem;
		}

		.detail-label {
			min-width: 50px;
		}

		.attendance-summary {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.75rem;
			padding: 0.875rem;
		}

		.summary-number {
			font-size: 1.25rem;
		}

		.summary-label {
			font-size: 0.7rem;
		}
	}
</style>
