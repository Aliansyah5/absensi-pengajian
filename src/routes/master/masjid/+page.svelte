<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { MasjidService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_masjid', label: 'Nama Masjid', required: true },
		{ key: 'id_kelompok', label: 'Kelompok', foreignKey: 'kelompok', required: true }
	];

	const displayColumns = [
		{ key: 'nama_masjid', label: 'Nama Masjid' },
		{ key: 'id_kelompok', label: 'Kelompok', foreignKey: 'kelompok' }
	];

	const foreignKeyLoaders = {
		kelompok: async () => {
			const data = await MasjidService.getAllKelompok();
			return data.map(item => ({ id: item.id, name: item.nama_kelompok }));
		}
	};

	const service = {
		getAll: MasjidService.getAllMasjid,
		create: MasjidService.createMasjid,
		update: MasjidService.updateMasjid,
		delete: MasjidService.deleteMasjid,
	};
</script>

<svelte:head>
	<title>Master Masjid - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Masjid" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} {displayColumns} {foreignKeyLoaders} title="Masjid" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
