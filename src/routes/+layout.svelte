<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { page } from '$app/stores';

	let isAuthenticated = false;
	let innerWidth = 0;

	onMount(() => {
		// Initialize auth store
		auth.initialize();

		const unsubscribe = auth.subscribe(state => {
			isAuthenticated = state.isAuthenticated;
		});

		return unsubscribe;
	});

	$: isDesktop = innerWidth >= 768;
	$: currentPath = $page.url.pathname;
	$: isAuthPage = currentPath === '/login' || currentPath === '/register';
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="theme-color" content="#0ea5e9">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="default">
	<meta name="apple-mobile-web-app-title" content="Absensi Pengajian">
	<link rel="manifest" href="/manifest.json">
</svelte:head>

<svelte:window bind:innerWidth />

<div class="app-layout">
	<div class="app-container" class:auth-page={isAuthPage}>
		<slot />
	</div>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		background: #f8fafc;
	}

	.app-container {
		max-width: 100%;
		margin: 0 auto;
		background: white;
		min-height: 100vh;
		position: relative;
	}

	/* Responsive container for different screen sizes */
	@media (min-width: 768px) {
		.app-container {
			max-width: 100%;
			border-radius: 0;
			box-shadow: none;
		}
	}

	/* Large desktop - optional container max-width */
	@media (min-width: 1200px) {
		.app-container {
			max-width: 1200px;
			margin: 0 auto;
			box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
			border-left: 1px solid #e2e8f0;
			border-right: 1px solid #e2e8f0;
		}
	}

	/* Auth pages - full width on all devices */
	.auth-page {
		max-width: 100% !important;
		border-radius: 0 !important;
		margin: 0 !important;
		box-shadow: none !important;
		border: none !important;
	}
</style>
