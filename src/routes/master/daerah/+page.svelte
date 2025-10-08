<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { DaerahService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_daerah', label: 'Nama Daerah', required: true }
	];

	const service = {
		getAll: DaerahService.getAllDaerah,
		create: DaerahService.createDaerah,
		update: DaerahService.updateDaerah,
		delete: DaerahService.deleteDaerah,
	};
</script>

<svelte:head>
	<title>Master Daerah - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Daerah" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} title="Daerah" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
