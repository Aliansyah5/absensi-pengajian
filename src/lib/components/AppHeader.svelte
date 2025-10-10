<script>
	import { auth } from '$lib/stores/auth.js';
	import { ArrowLeft, Menu, Bell, Search } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	export let title = 'Absensi Pengajian';
	export let showBack = false;
	export let showMenu = true;
	export let showSearch = false;
	export let onBack = null;
	export let onMenuClick = null;
	export let onNotificationClick = null;

	const dispatch = createEventDispatcher();

	$: user = $auth.user;

	let innerWidth = 0;
	$: isDesktop = innerWidth >= 768;

	function handleBack() {
		if (onBack) {
			onBack();
		} else {
			// Smart navigation based on current location
			try {
				const currentPath = window.location.pathname;
                console.log('currentPath', currentPath, window.history.length > 1 && document.referrer);
				// Check if browser has history and it's not the first page
				if (window.history.length > 1 && document.referrer) {
					// Use browser back if there's actual history
					window.history.back();
				} else {
					// Intelligent fallback based on current path
                    console.log('currentPath', currentPath);
					if (currentPath.startsWith('/master/')) {
						// If in master section, go to master index
						window.location.href = '/master';
					} else if (currentPath.startsWith('/absensi')) {
						// If in absensi section, go to absensi list
						window.location.href = '/absensi-new';
					} else if (currentPath.startsWith('/jamaah')) {
						// If in jamaah section, go to jamaah list
						window.location.href = '/jamaah';
					} else if (currentPath.startsWith('/laporan')) {
						// If in laporan section, go to laporan index
						window.location.href = '/laporan';
					} else {
						// Default fallback to dashboard
						window.location.href = '/dashboard';
					}
				}
			} catch (error) {
				console.error('Navigation error:', error);
				// Safe fallback to dashboard
				window.location.href = '/dashboard';
			}
		}
	}

	function handleMenuClick() {
		if (onMenuClick) {
			onMenuClick();
		} else {
			dispatch('menu-click');
		}
	}

	function handleNotificationClick() {
		if (onNotificationClick) {
			onNotificationClick();
		} else {
			dispatch('notification-click');
		}
	}

	function handleSearchClick() {
		dispatch('search-click');
	}
</script>

<svelte:window bind:innerWidth />

<header class="app-header" class:desktop={isDesktop}>
	<div class="header-content">
		<!-- Left Section -->
		<div class="header-left">
			{#if showBack}
				<button
					class="header-btn back-btn"
					on:click={handleBack}
					aria-label="Kembali"
				>
					<ArrowLeft size={20} />
				</button>
			{/if}

			<div class="header-title">
				<h1 class="title-text">{title}</h1>
				{#if user?.profile?.full_name && !isDesktop}
					<p class="subtitle-text">Halo, {user.profile.full_name}</p>
				{/if}
			</div>
		</div>

		<!-- Right Section -->
		<div class="header-right">
			{#if showSearch}
				<button
					class="header-btn search-btn"
					on:click={handleSearchClick}
					aria-label="Cari"
				>
					<Search size={20} />
				</button>
			{/if}

			<!-- Notification Button */
			<button
				class="header-btn notification-btn"
				on:click={handleNotificationClick}
				aria-label="Notifikasi"
			>
				<Bell size={20} />
				<!-- Notification badge -->
				<span class="notification-badge" aria-hidden="true"></span>

			{#if showMenu}
				<button
					class="header-btn menu-btn"
					on:click={handleMenuClick}
					aria-label="Menu"
				>
					<Menu size={20} />
				</button>
			{/if}

			<!-- Desktop user info -->
			{#if user?.profile?.full_name && isDesktop}
				<div class="user-info desktop-only">
					<div class="user-avatar">
						{user.profile.full_name.charAt(0).toUpperCase()}
					</div>
					<div class="user-details">
						<span class="user-name">{user.profile.full_name}</span>
						<span class="user-role">Admin</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.app-header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(229, 231, 235, 0.5);
		transition: all 0.2s ease;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		gap: 1rem;
		min-height: 64px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: transparent;
		border: none;
		color: #374151;
		transition: all 0.2s ease;
		cursor: pointer;
		position: relative;
	}

	.header-btn:hover {
		background: #f3f4f6;
		transform: scale(1.05);
	}

	.header-btn:active {
		transform: scale(0.95);
	}

	.back-btn {
		margin-left: -0.5rem;
	}

	.notification-badge {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 8px;
		height: 8px;
		background: #ef4444;
		border-radius: 50%;
		border: 2px solid white;
	}

	.header-title {
		flex: 1;
		min-width: 0;
	}

	.title-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.subtitle-text {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #111827;
	}

	.user-role {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.desktop-only {
		display: none;
	}

	/* Desktop styles */
	.app-header.desktop {
		background: rgba(255, 255, 255, 0.98);
		border-bottom: 1px solid #e5e7eb;
	}

	.app-header.desktop .header-content {
		padding: 1.25rem 1.5rem;
	}

	.app-header.desktop .title-text {
		font-size: 1.25rem;
	}

	.app-header.desktop .desktop-only {
		display: flex;
	}

	.app-header.desktop .header-btn {
		width: 44px;
		height: 44px;
		border-radius: 14px;
	}

	.app-header.desktop .header-btn:hover {
		background: #f1f5f9;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.header-content {
			padding: 0.875rem 1rem;
		}

		.title-text {
			font-size: 1rem;
		}

		.subtitle-text {
			font-size: 0.6875rem;
		}

		.header-btn {
			width: 36px;
			height: 36px;
		}
	}

	/* Safe area support */
	@supports (padding-top: env(safe-area-inset-top)) {
		.header-content {
			padding-top: calc(1rem + env(safe-area-inset-top));
		}
	}
</style>
