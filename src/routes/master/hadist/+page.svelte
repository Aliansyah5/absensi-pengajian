<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { HadistService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_hadist', label: 'Nama Hadist', required: true },
		{ key: 'jumlah_halaman', label: 'Jumlah Halaman', type: 'number' }
	];

	const service = {
		getAll: HadistService.getAllHadist,
		create: HadistService.createHadist,
		update: HadistService.updateHadist,
		delete: HadistService.deleteHadist,
	};
</script>

<svelte:head>
	<title>Master Hadist - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Hadist" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} title="Hadist" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
