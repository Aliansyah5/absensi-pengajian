<script>
	import { page } from '$app/stores';
	import { Home, Users, CheckSquare, Settings, User } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.js';
	import { onMount } from 'svelte';

	const allMenuItems = [
		{ id: 'dashboard', label: 'Beranda', icon: Home, href: '/dashboard' },
		{ id: 'jamaah', label: 'Jamaah', icon: Users, href: '/master/jamaah' },
		{ id: 'absensi', label: 'Absensi', icon: CheckSquare, href: '/absensi-new' },
		{ id: 'master', label: 'Master', icon: Settings, href: '/master', requireSuperAdmin: true },
		{ id: 'profile', label: 'Profil', icon: User, href: '/profile' }
	];

	let userRole = 'user';
	let menuItems = [];

	$: currentPath = $page.url.pathname;

	let innerWidth = 0;
	$: isDesktop = innerWidth >= 768;

	onMount(() => {
		const unsubscribe = auth.subscribe(state => {
			if (state.user?.profile?.role) {
				userRole = state.user.profile.role;
			}
			// Filter menu items based on role
			menuItems = allMenuItems.filter(item => {
				if (item.requireSuperAdmin) {
					return userRole === 'super_admin';
				}
				return true;
			});
		});

		return unsubscribe;
	});

	function isActive(href) {
		return currentPath === href || (href === '/dashboard' && currentPath === '/');
	}

	function handleNavigation(href) {
		goto(href);
	}
</script>

<svelte:window bind:innerWidth />

<nav class="bottom-nav" class:desktop={isDesktop}>
	<div class="nav-container">
		{#each menuItems as item}
			<button
				class="nav-item"
				class:active={isActive(item.href)}
				on:click={() => handleNavigation(item.href)}
				aria-label={item.label}
			>
				<div class="nav-icon-container">
					<svelte:component
						this={item.icon}
						size={isDesktop ? 22 : 20}
						class="nav-icon"
					/>
					{#if isActive(item.href)}
						<div class="active-indicator"></div>
					{/if}
				</div>
				<span class="nav-label">{item.label}</span>
			</button>
		{/each}
	</div>
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border-top: 1px solid rgba(229, 231, 235, 0.5);
		z-index: 50;
		transition: all 0.3s ease;
	}

	.nav-container {
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: 0.5rem 0;
		min-height: 60px;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		min-width: 0;
		flex: 1;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #6b7280;
		border-radius: 12px;
	}

	.nav-item.active {
		color: #0ea5e9;
	}

	.nav-item:active {
		transform: scale(0.95);
	}

	.nav-icon-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
	}

	.nav-icon {
		transition: all 0.2s ease;
	}

	.active-indicator {
		position: absolute;
		bottom: -2px;
		left: 50%;
		transform: translateX(-50%);
		width: 4px;
		height: 4px;
		background: #0ea5e9;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: translateX(-50%) scale(1);
		}
		50% {
			opacity: 0.7;
			transform: translateX(-50%) scale(1.2);
		}
	}

	.nav-label {
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		transition: all 0.2s ease;
	}

	/* Desktop styles */
	.bottom-nav.desktop {
		max-width: 480px;
		border-radius: 0;
		border-left: 1px solid rgba(229, 231, 235, 0.5);
		border-right: 1px solid rgba(229, 231, 235, 0.5);
	}

	.bottom-nav.desktop .nav-container {
		padding: 0.75rem 0;
		min-height: 70px;
	}

	.bottom-nav.desktop .nav-item {
		padding: 0.75rem 0.5rem;
		gap: 0.375rem;
		border-radius: 14px;
	}

	.bottom-nav.desktop .nav-item:hover {
		background: #f8fafc;
		transform: translateY(-1px);
	}

	.bottom-nav.desktop .nav-label {
		font-size: 0.8125rem;
	}

	/* Large desktop adjustments */
	@media (min-width: 1024px) {
		.bottom-nav.desktop {
			max-width: 420px;
			border-radius: 24px 24px 0 0;
			box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
		}
	}

	/* Extra large screens */
	@media (min-width: 1280px) {
		.bottom-nav.desktop {
			max-width: 450px;
		}
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.nav-container {
			padding: 0.375rem 0;
			min-height: 56px;
		}

		.nav-item {
			padding: 0.375rem 0.25rem;
			gap: 0.125rem;
		}

		.nav-label {
			font-size: 0.6875rem;
		}
	}

	/* Safe area support */
	@supports (padding-bottom: env(safe-area-inset-bottom)) {
		.nav-container {
			padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
		}

		.bottom-nav.desktop .nav-container {
			padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
		}

		@media (max-width: 640px) {
			.nav-container {
				padding-bottom: calc(0.375rem + env(safe-area-inset-bottom));
			}
		}
	}

	/* Hide on auth pages or when explicitly hidden */
	:global(.auth-page) .bottom-nav {
		display: none;
	}
</style>
