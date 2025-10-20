<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';
	import { DatabaseService } from '$lib/utils/supabase.js';
	import { Eye, EyeOff, LogIn, AlertCircle, Database } from 'lucide-svelte';

	let username = '';
	let password = '';
	let isLoading = false;
	let isTesting = false;
	let error = '';
	let testResult = '';
	let showPassword = false;

	// Check if already authenticated
	onMount(() => {
		auth.initialize();

		const unsubscribe = auth.subscribe(state => {
			if (state.isAuthenticated && !state.isLoading) {
				goto('/dashboard');
			}
		});

		return unsubscribe;
	});

	async function handleLogin() {
		if (!username || !password) {
			error = 'Username dan password harus diisi';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const result = await DatabaseService.login(username, password);

			if (result.success) {
				auth.login(result.user);
				goto('/dashboard');
			} else {
				error = result.error || 'Login gagal. Periksa username dan password Anda.';
			}
		} catch (err) {
			error = 'Terjadi kesalahan saat login. Silakan coba lagi.';
			console.error('Login error:', err);
		} finally {
			isLoading = false;
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}

	async function testDatabaseConnection() {
		isTesting = true;
		testResult = '';
		error = '';

		try {
			const result = await DatabaseService.testConnection();
			if (result.success) {
				testResult = `✅ ${result.message} - Found ${result.data?.length || 0} users in database`;
				if (result.data?.length > 0) {
					testResult += `\n\nAvailable users:\n`;
					result.data.forEach(u => {
						testResult += `- Username: ${u.username || 'N/A'} (${u.full_name || u.email}) - Role: ${u.role}\n`;
					});
				}
			} else {
				testResult = `❌ ${result.message}: ${result.error}`;
			}
		} catch (err) {
			testResult = `❌ Connection failed: ${err.message}`;
		} finally {
			isTesting = false;
		}
	}

	// Register service worker
	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js')
				.then(() => console.log('Service Worker registered'))
				.catch(err => console.log('Service Worker registration failed:', err));
		}
	});
</script>

<svelte:head>
	<title>Login - Absensi Pengajian</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<!-- App Logo & Branding -->
		<div class="text-center mb-8">
			<div class="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
				<span class="text-3xl">📚</span>
			</div>
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Absensi Pengajian</h1>
			<p class="text-gray-600">Masuk untuk melanjutkan</p>
		</div>

		<!-- Login Card -->
		<div class="card mb-6">
			<!-- Error Alert -->
			{#if error}
				<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
					<AlertCircle size={20} class="text-red-500 mt-0.5 flex-shrink-0" />
					<span class="text-red-700 text-sm">{error}</span>
				</div>
			{/if}

			<form class="space-y-4" on:submit|preventDefault={handleLogin}>
				<!-- Username Field -->
				<div>
					<label for="username" class="form-label">Username</label>
					<input
						id="username"
						type="text"
						class="form-input"
						bind:value={username}
						placeholder="Masukkan username Anda"
						disabled={isLoading}
						on:keypress={handleKeyPress}
						autocomplete="username"
						required
					/>
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="form-label">Password</label>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							class="form-input pr-12"
							bind:value={password}
							placeholder="Masukkan password Anda"
							disabled={isLoading}
							on:keypress={handleKeyPress}
							autocomplete="current-password"
							required
						/>
						<button
							type="button"
							class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
							on:click={togglePasswordVisibility}
							tabindex="-1"
						>
							{#if showPassword}
								<EyeOff size={18} class="text-gray-500" />
							{:else}
								<Eye size={18} class="text-gray-500" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Login Button -->
				<button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
					{#if isLoading}
						<div class="spinner"></div>
						<span>Memproses...</span>
					{:else}
						<LogIn size={18} />
						<span>Masuk</span>
					{/if}
				</button>
			</form>
		</div>

		<!-- Footer -->
		<div class="text-center mt-6">
			<p class="text-xs text-gray-500">
				© 2025 IT Team. All rights reserved.
			</p>
		</div>
	</div>
</div>
