<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let status = 'Memproses pembersihan cache...';
	let isLoading = true;
	let logs = [];

	function addLog(message) {
		logs = [...logs, `[${new Date().toLocaleTimeString()}] ${message}`];
		console.log(message);
	}

	onMount(async () => {
		try {
			addLog('🧹 Mulai membersihkan cache...');

			// 1. Unregister all service workers
			if ('serviceWorker' in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				addLog(`Menemukan ${registrations.length} service worker(s)`);

				for (let registration of registrations) {
					await registration.unregister();
					addLog('✅ Service worker berhasil di-unregister');
				}
			}

			// 2. Clear all caches
			if ('caches' in window) {
				const cacheNames = await caches.keys();
				addLog(`Menemukan ${cacheNames.length} cache(s)`);

				for (let cacheName of cacheNames) {
					await caches.delete(cacheName);
					addLog(`✅ Cache "${cacheName}" berhasil dihapus`);
				}
			}

			// 3. Clear sessionStorage (optional)
			sessionStorage.clear();
			addLog('✅ Session storage berhasil dibersihkan');

			status = '✅ Cache berhasil dibersihkan!';
			isLoading = false;
			addLog('🎉 Proses selesai! Redirect ke halaman utama dalam 3 detik...');

			setTimeout(() => {
				window.location.href = '/';
			}, 3000);

		} catch (error) {
			status = '❌ Error: ' + error.message;
			isLoading = false;
			addLog('❌ Error: ' + error.message);
		}
	});
</script>

<svelte:head>
	<title>Membersihkan Cache - Absensi Pengajian</title>
</svelte:head>

<div class="clear-cache-page">
	<div class="container">
		<div class="icon-container">
			{#if isLoading}
				<div class="spinner"></div>
			{:else if status.startsWith('✅')}
				<div class="success-icon">✅</div>
			{:else}
				<div class="error-icon">❌</div>
			{/if}
		</div>

		<h1>Membersihkan Cache</h1>
		<p class="status">{status}</p>

		<div class="logs-container">
			<h3>Log Proses:</h3>
			<div class="logs">
				{#each logs as log}
					<div class="log-item">{log}</div>
				{/each}
			</div>
		</div>

		{#if !isLoading}
			<button class="btn-home" on:click={() => goto('/')}>
				Kembali ke Beranda
			</button>
		{/if}
	</div>
</div>

<style>
	.clear-cache-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.container {
		background: white;
		border-radius: 16px;
		padding: 3rem 2rem;
		max-width: 600px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		text-align: center;
	}

	.icon-container {
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 80px;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.success-icon,
	.error-icon {
		font-size: 3rem;
		animation: scaleIn 0.3s ease-out;
	}

	@keyframes scaleIn {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 1rem;
	}

	.status {
		font-size: 1.1rem;
		color: #64748b;
		margin-bottom: 2rem;
		font-weight: 500;
	}

	.logs-container {
		margin-top: 2rem;
		text-align: left;
	}

	.logs-container h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #475569;
		margin-bottom: 0.75rem;
	}

	.logs {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.log-item {
		font-size: 0.85rem;
		color: #64748b;
		padding: 0.25rem 0;
		font-family: 'Courier New', monospace;
	}

	.btn-home {
		margin-top: 2rem;
		padding: 0.75rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.btn-home:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	@media (max-width: 640px) {
		.container {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.status {
			font-size: 1rem;
		}
	}
</style>
