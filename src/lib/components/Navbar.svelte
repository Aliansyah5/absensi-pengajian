<script>
	import { auth } from '$lib/stores/auth.js';
	import { DatabaseService } from '$lib/utils/supabase.js';
	import { goto } from '$app/navigation';
	import { Menu, LogOut, User, Home, Users, CheckSquare, BarChart3 } from 'lucide-svelte';

	export let currentPage = 'dashboard';

	let isMobileMenuOpen = false;

	$: user = $auth.user;

	async function handleLogout() {
		await DatabaseService.logout();
		auth.logout();
		goto('/login');
	}

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	const menuItems = [
		{ id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
		{ id: 'jamaah', label: 'Data Jamaah', icon: Users, href: '/master/jamaah' },
		{ id: 'absensi', label: 'Input Absensi', icon: CheckSquare, href: '/absensi' },
		{ id: 'laporan', label: 'Laporan', icon: BarChart3, href: '/laporan' }
	];
</script>

<nav class="navbar">
	<div class="navbar-container">
		<!-- Logo and Title -->
		<div class="navbar-brand">
			<div class="logo">📚</div>
			<span class="brand-text">Absensi Pengajian</span>
		</div>

		<!-- Desktop Menu -->
		<div class="navbar-menu desktop-menu">
			{#each menuItems as item}
				<a
					href={item.href}
					class="menu-item {currentPage === item.id ? 'active' : ''}"
					on:click={closeMobileMenu}
				>
					<svelte:component this={item.icon} size={18} />
					<span>{item.label}</span>
				</a>
			{/each}
		</div>

		<!-- User Menu -->
		<div class="navbar-user">
			<div class="user-info">
				<User size={18} />
				<span class="user-name">{user?.profile?.full_name || 'Admin'}</span>
				<span class="user-role">{user?.profile?.role || 'admin'}</span>
			</div>
			<button class="logout-btn" on:click={handleLogout} title="Keluar">
				<LogOut size={18} />
			</button>
		</div>

		<!-- Mobile Menu Button -->
		<button class="mobile-menu-btn" on:click={toggleMobileMenu}>
			<Menu size={24} />
		</button>
	</div>

	<!-- Mobile Menu -->
	{#if isMobileMenuOpen}
		<div class="mobile-menu">
			{#each menuItems as item}
				<a
					href={item.href}
					class="mobile-menu-item {currentPage === item.id ? 'active' : ''}"
					on:click={closeMobileMenu}
				>
					<svelte:component this={item.icon} size={18} />
					<span>{item.label}</span>
				</a>
			{/each}
			<div class="mobile-user-section">
				<div class="mobile-user-info">
					<User size={18} />
					<div>
						<div class="mobile-user-name">{user?.profile?.full_name || 'Admin'}</div>
						<div class="mobile-user-role">{user?.profile?.role || 'admin'}</div>
					</div>
				</div>
				<button class="mobile-logout-btn" on:click={handleLogout}>
					<LogOut size={18} />
					<span>Keluar</span>
				</button>
			</div>
		</div>
	{/if}
</nav>

<style>
	.navbar {
		background: white;
		border-bottom: 1px solid var(--gray-200);
		box-shadow: var(--shadow-sm);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.navbar-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--spacing-4);
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
	}

	.navbar-brand {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		font-weight: 700;
		color: var(--gray-900);
	}

	.logo {
		font-size: 1.5rem;
		background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
		border-radius: var(--radius-md);
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.brand-text {
		font-size: var(--font-size-lg);
		font-weight: 600;
	}

	.desktop-menu {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-4);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--gray-600);
		font-weight: 500;
		transition: all 0.2s ease-in-out;
	}

	.menu-item:hover {
		background-color: var(--gray-100);
		color: var(--gray-900);
	}

	.menu-item.active {
		background-color: var(--primary-100);
		color: var(--primary-600);
	}

	.navbar-user {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-3);
		background-color: var(--gray-50);
		border-radius: var(--radius-md);
		border: 1px solid var(--gray-200);
	}

	.user-name {
		font-weight: 500;
		color: var(--gray-900);
		font-size: var(--font-size-sm);
	}

	.user-role {
		font-size: var(--font-size-xs);
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.logout-btn {
		background: none;
		border: none;
		color: var(--gray-500);
		cursor: pointer;
		padding: var(--spacing-2);
		border-radius: var(--radius-md);
		transition: all 0.2s ease-in-out;
	}

	.logout-btn:hover {
		background-color: var(--error-50);
		color: var(--error-600);
	}

	.mobile-menu-btn {
		display: none;
		background: none;
		border: none;
		color: var(--gray-600);
		cursor: pointer;
		padding: var(--spacing-2);
		border-radius: var(--radius-md);
	}

	.mobile-menu {
		display: none;
		background: white;
		border-top: 1px solid var(--gray-200);
		padding: var(--spacing-4);
	}

	.mobile-menu-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		padding: var(--spacing-3) var(--spacing-4);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--gray-600);
		font-weight: 500;
		margin-bottom: var(--spacing-2);
		transition: all 0.2s ease-in-out;
	}

	.mobile-menu-item:hover {
		background-color: var(--gray-100);
		color: var(--gray-900);
	}

	.mobile-menu-item.active {
		background-color: var(--primary-100);
		color: var(--primary-600);
	}

	.mobile-user-section {
		border-top: 1px solid var(--gray-200);
		margin-top: var(--spacing-4);
		padding-top: var(--spacing-4);
	}

	.mobile-user-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		padding: var(--spacing-3);
		background-color: var(--gray-50);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-3);
	}

	.mobile-user-name {
		font-weight: 500;
		color: var(--gray-900);
		font-size: var(--font-size-sm);
	}

	.mobile-user-role {
		font-size: var(--font-size-xs);
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.mobile-logout-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		width: 100%;
		background: none;
		border: 1px solid var(--error-200);
		color: var(--error-600);
		cursor: pointer;
		padding: var(--spacing-3);
		border-radius: var(--radius-md);
		font-weight: 500;
		transition: all 0.2s ease-in-out;
	}

	.mobile-logout-btn:hover {
		background-color: var(--error-50);
	}

	/* Responsive styles */
	@media (max-width: 768px) {
		.desktop-menu,
		.user-info {
			display: none;
		}

		.mobile-menu-btn {
			display: block;
		}

		.mobile-menu {
			display: block;
		}

		.brand-text {
			display: none;
		}

		.navbar-container {
			padding: 0 var(--spacing-3);
		}
	}

	@media (max-width: 480px) {
		.navbar-container {
			height: 56px;
		}

		.logo {
			width: 32px;
			height: 32px;
			font-size: 1.25rem;
		}
	}
</style>
