<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { KelompokService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_kelompok', label: 'Nama Kelompok', required: true },
		{ key: 'id_desa', label: 'Desa', foreignKey: 'desa', required: true },
		{ key: 'id_daerah', label: 'Daerah', foreignKey: 'daerah', required: true }
	];

	const displayColumns = [
		{ key: 'nama_kelompok', label: 'Nama Kelompok' },
		{ key: 'id_desa', label: 'Desa', foreignKey: 'desa' },
		{ key: 'id_daerah', label: 'Daerah', foreignKey: 'daerah' }
	];

	const foreignKeyLoaders = {
		desa: async () => {
			const data = await KelompokService.getAllDesa();
			return data.map(item => ({ id: item.id, name: item.nama_desa }));
		},
		daerah: async () => {
			const data = await KelompokService.getAllDaerah();
			return data.map(item => ({ id: item.id, name: item.nama_daerah }));
		}
	};

	const service = {
		getAll: KelompokService.getAllKelompok,
		create: KelompokService.createKelompok,
		update: KelompokService.updateKelompok,
		delete: KelompokService.deleteKelompok,
	};
</script>

<svelte:head>
	<title>Master Kelompok - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Kelompok" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} {displayColumns} {foreignKeyLoaders} title="Kelompok" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
