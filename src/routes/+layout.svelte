<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { page } from '$app/stores';

	let isAuthenticated = false;
	let innerWidth = 0;
	let updateAvailable = false;
	let registration = null;

	onMount(() => {
		// Initialize auth store
		auth.initialize();

		const unsubscribe = auth.subscribe(state => {
			isAuthenticated = state.isAuthenticated;
		});

		// Register service worker with auto-update detection
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js')
				.then((reg) => {
					registration = reg;
					console.log('[App] Service Worker registered:', reg);

					// Check for updates every 60 seconds
					setInterval(() => {
						reg.update();
					}, 60000);

					// Detect when new service worker is waiting
					reg.addEventListener('updatefound', () => {
						const newWorker = reg.installing;

						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// New service worker available
								updateAvailable = true;
								console.log('[App] New version available! Show update notification.');
							}
						});
					});
				})
				.catch((err) => {
					console.error('[App] Service Worker registration failed:', err);
				});

			// Listen for controller change (new SW activated)
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				console.log('[App] New service worker activated, reloading...');
				window.location.reload();
			});
		}

		return unsubscribe;
	});

	function updateApp() {
		if (registration && registration.waiting) {
			// Tell waiting service worker to skip waiting
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		} else {
			// If no waiting worker, just reload
			window.location.reload();
		}
	}

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

<!-- Update notification banner -->
{#if updateAvailable}
	<div class="update-banner">
		<div class="update-content">
			<span class="update-icon">🎉</span>
			<span class="update-text">Update baru tersedia!</span>
			<button class="update-btn" on:click={updateApp}>
				Update Sekarang
			</button>
		</div>
	</div>
{/if}

<div class="app-layout">
	<div class="app-container" class:auth-page={isAuthPage}>
		<slot />
	</div>
</div>

<style>
	.update-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.75rem 1rem;
		z-index: 9999;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.update-content {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.update-icon {
		font-size: 1.25rem;
	}

	.update-text {
		font-weight: 500;
		font-size: 0.95rem;
	}

	.update-btn {
		background: white;
		color: #667eea;
		border: none;
		padding: 0.5rem 1.25rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.update-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.update-btn:active {
		transform: translateY(0);
	}

	@media (max-width: 640px) {
		.update-content {
			flex-wrap: wrap;
			gap: 0.5rem;
			font-size: 0.85rem;
		}

		.update-text {
			flex: 1 1 100%;
			text-align: center;
			font-size: 0.85rem;
		}

		.update-btn {
			font-size: 0.85rem;
			padding: 0.4rem 1rem;
		}
	}

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
