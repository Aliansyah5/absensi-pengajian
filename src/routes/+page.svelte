<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';

	onMount(() => {
		auth.initialize();

		const unsubscribe = auth.subscribe(state => {
			if (!state.isLoading) {
				if (state.isAuthenticated) {
					goto('/dashboard');
				} else {
					goto('/login');
				}
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Absensi Pengajian</title>
</svelte:head>

<div class="loading-container">
	<div class="loading-spinner">
		<div class="spinner"></div>
		<p>Memuat aplikasi...</p>
	</div>
</div>

<style>
	.loading-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
	}

	.loading-spinner {
		text-align: center;
		color: var(--gray-600);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--gray-200);
		border-top: 3px solid var(--primary-500);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto var(--spacing-4);
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
