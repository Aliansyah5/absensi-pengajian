<script>
	import AbsensiManager from './components/AbsensiManager.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
</script>

<svelte:head>
	<title>Input Absensi - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Input Absensi" showBack={true} />

<main class="app-content">
	<AbsensiManager />
</main>

<BottomNav />

<style>
	.app-content {
		padding: 0;
		min-height: calc(100vh - 120px);
	}
</style>
