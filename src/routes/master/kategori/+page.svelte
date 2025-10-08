<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { KategoriService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'category', label: 'Kategori', required: true },
		{ key: 'group', label: 'Group' }
	];

	const service = {
		getAll: KategoriService.getAllKategori,
		create: KategoriService.createKategori,
		update: KategoriService.updateKategori,
		delete: KategoriService.deleteKategori,
	};
</script>

<svelte:head>
	<title>Master Kategori - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Kategori" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} title="Kategori" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
