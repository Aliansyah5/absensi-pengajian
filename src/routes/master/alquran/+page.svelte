<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { AlQuranService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		{ key: 'nama_surat', label: 'Nama Surat', required: true },
		{ key: 'juz', label: 'Juz', type: 'number' },
		{ key: 'jumlah_ayat', label: 'Jumlah Ayat', type: 'number' }
	];

	const service = {
		getAll: AlQuranService.getAllAlQuran,
		create: AlQuranService.createAlQuran,
		update: AlQuranService.updateAlQuran,
		delete: AlQuranService.deleteAlQuran,
	};
</script>

<svelte:head>
	<title>Master Al-Quran - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Al-Quran" showBack={true} />

<main class="app-content">
	<CrudManager {service} {columns} title="Al-Quran" />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
