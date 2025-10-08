<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { DapukanService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_dapukan', label: 'Nama Dapukan', required: true },
		{ key: 'deskripsi', label: 'Deskripsi', type: 'textarea' }
	];

	const service = {
		getAll: DapukanService.getAllDapukan,
		create: DapukanService.createDapukan,
		update: DapukanService.updateDapukan,
		delete: DapukanService.deleteDapukan,
	};
</script>

<svelte:head>
	<title>Master Dapukan - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Dapukan" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} title="Dapukan" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
