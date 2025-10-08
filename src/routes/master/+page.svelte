<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { MasterDataService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import {
		Database, Users, MapPin, Building, BookOpen,
		FileText, Shield, List, Home, Globe, ChevronRight, AlertCircle
	} from 'lucide-svelte';

	let isLoading = true;
	let userRole = 'user';
	let isSuperAdmin = false;
	let message = { type: '', text: '', show: false };
	let innerWidth = 0;

	$: isDesktop = innerWidth >= 768;

	// Master data cards configuration
	const masterCards = [
		{
			id: 'pengajian',
			title: 'Pengajian',
			description: 'Kelola data pengajian dan jadwal',
			icon: BookOpen,
			color: 'bg-blue-500',
			route: '/master/pengajian'
		},
		{
			id: 'daerah',
			title: 'Daerah',
			description: 'Kelola data daerah',
			icon: MapPin,
			color: 'bg-green-500',
			route: '/master/daerah'
		},
		{
			id: 'desa',
			title: 'Desa',
			description: 'Kelola data desa',
			icon: Home,
			color: 'bg-yellow-500',
			route: '/master/desa'
		},
		{
			id: 'kelompok',
			title: 'Kelompok',
			description: 'Kelola data kelompok',
			icon: Users,
			color: 'bg-purple-500',
			route: '/master/kelompok'
		},
		{
			id: 'masjid',
			title: 'Masjid',
			description: 'Kelola data masjid',
			icon: Building,
			color: 'bg-indigo-500',
			route: '/master/masjid'
		},
		{
			id: 'kategori',
			title: 'Kategori',
			description: 'Kelola kategori jamaah',
			icon: List,
			color: 'bg-pink-500',
			route: '/master/kategori'
		},
		{
			id: 'hadist',
			title: 'Hadist',
			description: 'Kelola data kitab hadist',
			icon: FileText,
			color: 'bg-orange-500',
			route: '/master/hadist'
		},
		{
			id: 'alquran',
			title: 'Al-Quran',
			description: 'Kelola data surat Al-Quran',
			icon: BookOpen,
			color: 'bg-teal-500',
			route: '/master/alquran'
		},
		{
			id: 'dapukan',
			title: 'Dapukan',
			description: 'Kelola data dapukan',
			icon: Globe,
			color: 'bg-red-500',
			route: '/master/dapukan'
		},
		{
			id: 'jamaah',
			title: 'Jamaah',
			description: 'Kelola data jamaah',
			icon: Users,
			color: 'bg-cyan-500',
			route: '/master/jamaah'
		}
	];

	onMount(async () => {
		await checkUserPermission();
		isLoading = false;
	});

	async function checkUserPermission() {
		try {
			userRole = await MasterDataService.getUserRole();
			isSuperAdmin = await MasterDataService.isSuperAdmin();

			if (!isSuperAdmin) {
				showMessage('error', 'Akses ditolak. Halaman ini hanya untuk Super Admin.');
				setTimeout(() => goto('/dashboard'), 2000);
			}
		} catch (error) {
			console.error('Error checking permission:', error);
			showMessage('error', 'Gagal memeriksa permission.');
		}
	}

	function handleCardClick(card) {
		goto(card.route);
	}

	function showMessage(type, text) {
		message = { type, text, show: true };
		setTimeout(() => {
			message.show = false;
		}, 3000);
	}
</script>

<svelte:head>
	<title>Master Data - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader title="Master Data" showBack={true} />

{#if message.show}
	<div class="message {message.type}" class:desktop={isDesktop}>
		<div class="message-content">
			<AlertCircle size={20} />
			<span>{message.text}</span>
		</div>
	</div>
{/if}

{#if isLoading}
	<div class="loading-container">
		<div class="loading-content">
			<div class="spinner"></div>
			<p class="loading-text">Memuat data master...</p>
		</div>
	</div>
{:else if !isSuperAdmin}
	<div class="access-denied">
		<Shield size={64} class="access-icon" />
		<h2>Akses Ditolak</h2>
		<p>Halaman ini hanya dapat diakses oleh Super Admin.</p>
	</div>
{:else}
	<main class="app-content" class:desktop={isDesktop}>
		<!-- Page Header -->
		<div class="page-header">
			<div class="header-content">
				<Database size={24} />
				<div class="header-text">
					<h1>Master Data Management</h1>
					<p>Kelola data master sistem absensi pengajian</p>
				</div>
			</div>
		</div>

		<!-- Master Cards Grid (2x2 layout) -->
		<div class="cards-grid" class:desktop={isDesktop}>
			{#each masterCards as card}
				<div
					class="master-card {card.color}"
					class:desktop={isDesktop}
					on:click={() => handleCardClick(card)}
					on:keydown={(e) => e.key === 'Enter' && handleCardClick(card)}
					role="button"
					tabindex="0"
				>
					<div class="card-icon">
						<svelte:component this={card.icon} size={28} />
					</div>
					<div class="card-content">
						<h3 class="card-title">{card.title}</h3>
						<p class="card-description">{card.description}</p>
					</div>
					<div class="card-arrow">
						<ChevronRight size={20} />
					</div>
				</div>
			{/each}
		</div>
	</main>
{/if}

<BottomNav />

<style>
	/* Base Styles */
	.app-content {
		min-height: calc(100vh - 120px);
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1rem 1rem 100px 1rem;
	}

	.app-content.desktop {
		padding: 2rem 2rem 2rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Message Styles */
	.message {
		position: fixed;
		top: 70px;
		left: 1rem;
		right: 1rem;
		z-index: 30;
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(8px);
	}

	.message.desktop {
		left: 50%;
		right: auto;
		transform: translateX(-50%);
		max-width: 500px;
	}

	.message.success {
		background: rgba(220, 252, 231, 0.95);
		color: #166534;
		border: 1px solid #86efac;
	}

	.message.error {
		background: rgba(254, 242, 242, 0.95);
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.message-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 500;
	}

	/* Loading Styles */
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
		border-top: 3px solid #3b82f6;
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

	/* Access Denied Styles */
	.access-denied {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		padding: 2rem;
	}

	.access-icon {
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.access-denied h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.access-denied p {
		color: #6b7280;
		margin: 0;
	}

	/* Page Header */
	.page-header {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #1f2937;
	}

	.header-text h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.25rem 0;
		color: #1f2937;
	}

	.header-text p {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	/* Cards Grid - 2x2 Layout */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.cards-grid.desktop {
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	/* Master Card */
	.master-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-height: 140px;
	}

	.master-card.desktop {
		padding: 2rem;
		border-radius: 20px;
		min-height: 160px;
	}

	.master-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
	}

	.master-card:active {
		transform: translateY(-2px);
	}

	.master-card:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Card Icon */
	.card-icon {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		flex-shrink: 0;
	}

	.bg-blue-500 .card-icon { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
	.bg-green-500 .card-icon { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
	.bg-yellow-500 .card-icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
	.bg-purple-500 .card-icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
	.bg-indigo-500 .card-icon { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
	.bg-pink-500 .card-icon { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
	.bg-orange-500 .card-icon { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
	.bg-teal-500 .card-icon { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }
	.bg-red-500 .card-icon { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
	.bg-cyan-500 .card-icon { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }

	/* Card Content */
	.card-content {
		flex: 1;
	}

	.card-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.card-description {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.4;
	}

	/* Card Arrow */
	.card-arrow {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		color: #d1d5db;
		transition: all 0.3s ease;
	}

	.master-card:hover .card-arrow {
		color: #6b7280;
		transform: translateX(4px);
	}

	/* Responsive Styles */
	@media (max-width: 640px) {
		.app-content {
			padding: 1rem 0.75rem 100px 0.75rem;
		}

		.page-header {
			padding: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.header-text h1 {
			font-size: 1.25rem;
		}

		.cards-grid {
			gap: 0.75rem;
		}

		.master-card {
			padding: 1.25rem;
			min-height: 120px;
		}

		.card-icon {
			width: 48px;
			height: 48px;
		}

		.card-title {
			font-size: 1rem;
		}
	}
</style>
