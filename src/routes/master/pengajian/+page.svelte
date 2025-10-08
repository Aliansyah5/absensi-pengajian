<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { PengajianService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_pengajian', label: 'Nama Pengajian', required: true }
	];

	const service = {
		getAll: PengajianService.getAllPengajian,
		create: PengajianService.createPengajian,
		update: PengajianService.updatePengajian,
		delete: PengajianService.deletePengajian,
	};
</script>

<svelte:head>
	<title>Master Pengajian - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Pengajian" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} title="Pengajian" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
