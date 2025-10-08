<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { MasterDataService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import {
		BookOpen, MapPin, Home, Users, Building, List,
		Book, FileText, ChevronRight
	} from 'lucide-svelte';

	let isLoading = true;
	let userRole = 'user';
	let isSuperAdmin = false;
	let message = { type: '', text: '', show: false };

	// Master menu configuration
	const masterMenus = [
		{ id: 'pengajian', label: 'Pengajian', icon: BookOpen, color: 'from-blue-500 to-blue-600', description: 'Kelola data pengajian', route: '/master/pengajian' },
		{ id: 'daerah', label: 'Daerah', icon: MapPin, color: 'from-green-500 to-green-600', description: 'Kelola data daerah', route: '/master/daerah' },
		{ id: 'desa', label: 'Desa', icon: Home, color: 'from-yellow-500 to-yellow-600', description: 'Kelola data desa', route: '/master/desa' },
		{ id: 'kelompok', label: 'Kelompok', icon: Users, color: 'from-purple-500 to-purple-600', description: 'Kelola data kelompok', route: '/master/kelompok' },
		{ id: 'masjid', label: 'Masjid', icon: Building, color: 'from-indigo-500 to-indigo-600', description: 'Kelola data masjid', route: '/master/masjid' },
		{ id: 'kategori', label: 'Kategori', icon: List, color: 'from-pink-500 to-pink-600', description: 'Kelola data kategori', route: '/master/kategori' },
		{ id: 'hadist', label: 'Hadist', icon: Book, color: 'from-orange-500 to-orange-600', description: 'Kelola data hadist', route: '/master/hadist' },
		{ id: 'alquran', label: 'Al-Quran', icon: BookOpen, color: 'from-teal-500 to-teal-600', description: 'Kelola data Al-Quran', route: '/master/alquran' },
		{ id: 'dapukan', label: 'Dapukan', icon: FileText, color: 'from-cyan-500 to-cyan-600', description: 'Kelola data dapukan', route: '/master/dapukan' },
		{ id: 'jamaah', label: 'Jamaah', icon: Users, color: 'from-red-500 to-red-600', description: 'Kelola data jamaah', route: '/master/jamaah' }
	];

	onMount(async () => {
		await checkUserPermission();
		isLoading = false;
	});

	async function checkUserPermission() {
		try {
			console.log('Checking user permission...');
			userRole = await MasterDataService.getUserRole();
			console.log('User role:', userRole);
			isSuperAdmin = await MasterDataService.isSuperAdmin();
			console.log('Is super admin:', isSuperAdmin);

			if (!isSuperAdmin) {
				showMessage('error', 'Akses ditolak. Halaman ini hanya untuk Super Admin.');
				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
			}
		} catch (error) {
			console.error('Error checking permission:', error);
			showMessage('error', 'Gagal memeriksa permission.');
		}
	}

	function showMessage(type, text) {
		message = { type, text, show: true };
		setTimeout(() => {
			message.show = false;
		}, 3000);
	}

	function navigateToMaster(route) {
		goto(route);
	}
</script>

<svelte:head>
	<title>Master Data - Absensi Pengajian</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<AppHeader />

	<main class="container mx-auto px-4 py-6 pb-24">
		{#if isLoading}
			<div class="flex items-center justify-center py-20">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p class="text-gray-600">Memuat data...</p>
				</div>
			</div>
		{:else if isSuperAdmin}
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-800 mb-2">Master Data</h1>
				<p class="text-gray-600">Kelola semua data master aplikasi</p>
			</div>

			<!-- Master Menu Grid (2 columns) -->
			<div class="master-grid">
				{#each masterMenus as menu}
					<button
						on:click={() => navigateToMaster(menu.route)}
						class="menu-card group"
					>
						<div class="icon-wrapper bg-gradient-to-br {menu.color}">
							<svelte:component this={menu.icon} size={32} color="white" />
						</div>
						<div class="menu-content">
							<h3 class="menu-title">{menu.label}</h3>
							<p class="menu-description">{menu.description}</p>
						</div>
						<div class="arrow-icon">
							<ChevronRight size={20} />
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<div class="flex items-center justify-center py-20">
				<div class="text-center">
					<div class="text-red-600 mb-4">
						<AlertCircle size={64} class="mx-auto" />
					</div>
					<h2 class="text-2xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
					<p class="text-gray-600">Halaman ini hanya untuk Super Admin</p>
				</div>
			</div>
		{/if}
	</main>

	<!-- Message Notification -->
	{#if message.show}
		<div class="fixed top-20 right-4 z-50 animate-slide-in">
			<div class="px-6 py-4 rounded-lg shadow-lg {message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white">
				<p class="font-medium">{message.text}</p>
			</div>
		</div>
	{/if}

	<BottomNav />
</div>

<style>
	.master-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.menu-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		cursor: pointer;
		text-align: center;
		border: 2px solid transparent;
		overflow: hidden;
	}

	.menu-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		border-color: #e5e7eb;
	}

	.icon-wrapper {
		width: 64px;
		height: 64px;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		transition: transform 0.3s ease;
	}

	.menu-card:hover .icon-wrapper {
		transform: scale(1.1);
	}

	.menu-content {
		flex: 1;
		margin-bottom: 0.5rem;
	}

	.menu-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.menu-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.4;
	}

	.arrow-icon {
		position: absolute;
		top: 1rem;
		right: 1rem;
		color: #9ca3af;
		transition: all 0.3s ease;
		opacity: 0;
	}

	.menu-card:hover .arrow-icon {
		opacity: 1;
		transform: translateX(4px);
	}

	@media (max-width: 640px) {
		.master-grid {
			grid-template-columns: 1fr;
		}

		.menu-card {
			padding: 1.25rem;
		}

		.icon-wrapper {
			width: 56px;
			height: 56px;
		}

		.menu-title {
			font-size: 1.125rem;
		}

		.menu-description {
			font-size: 0.8125rem;
		}
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
