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

		// Register service worker with aggressive auto-update detection
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js')
				.then((reg) => {
					registration = reg;
					console.log('[App] Service Worker registered:', reg);

					// Check for updates every 20 seconds (more aggressive)
					setInterval(() => {
						console.log('[App] Checking for updates...');
						reg.update();
					}, 20000);

					// Also check on visibility change (when app comes to foreground)
					document.addEventListener('visibilitychange', () => {
						if (!document.hidden) {
							console.log('[App] App came to foreground, checking for updates...');
							reg.update();
						}
					});

					// Detect when new service worker is waiting
					reg.addEventListener('updatefound', () => {
						const newWorker = reg.installing;

						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// New service worker available
								updateAvailable = true;
								console.log('[App] New version available! Auto-updating in 3 seconds...');

								// Auto-update after 3 seconds
								setTimeout(() => {
									updateApp();
								}, 3000);
							}
						});
					});

					// Listen for SW update message
					navigator.serviceWorker.addEventListener('message', (event) => {
						if (event.data && event.data.type === 'SW_UPDATED') {
							console.log('[App] Received SW_UPDATED message:', event.data.version);
							updateAvailable = true;

							// Auto-reload
							setTimeout(() => {
								window.location.reload();
							}, 1000);
						}
					});
				})
				.catch((err) => {
					console.error('[App] Service Worker registration failed:', err);
				});

			// Listen for controller change (new SW activated)
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				console.log('[App] New service worker activated, reloading...');
				setTimeout(() => {
					window.location.reload();
				}, 500);
			});
		}

		return unsubscribe;
	});

	function updateApp() {
		console.log('[App] Updating app...');
		if (registration && registration.waiting) {
			// Tell waiting service worker to skip waiting
			console.log('[App] Telling waiting SW to skip waiting');
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		} else {
			// If no waiting worker, just reload
			console.log('[App] No waiting SW, reloading page');
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
			<span class="update-icon">🚀</span>
			<span class="update-text">Updating aplikasi... Halaman akan di-reload secara otomatis</span>
			<div class="update-spinner"></div>
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
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
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
		animation: slideUp 1s ease-in-out infinite;
	}

	@keyframes slideUp {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	.update-text {
		font-weight: 500;
		font-size: 0.95rem;
		flex: 1;
	}

	.update-spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
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

		.update-spinner {
			width: 16px;
			height: 16px;
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
