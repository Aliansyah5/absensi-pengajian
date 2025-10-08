<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { DesaService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_desa', label: 'Nama Desa', required: true }
	];

	const service = {
		getAll: DesaService.getAllDesa,
		create: DesaService.createDesa,
		update: DesaService.updateDesa,
		delete: DesaService.deleteDesa,
	};
</script>

<svelte:head>
	<title>Master Desa - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Desa" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} title="Desa" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
