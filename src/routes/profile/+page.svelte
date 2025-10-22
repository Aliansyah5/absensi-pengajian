<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/utils/supabase.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import {
		User, Mail, Shield, LogOut, Settings, Bell, HelpCircle,
		ExternalLink, Edit, Calendar, MapPin, Phone, Globe,
		Info, Smartphone, Monitor, Database, AlertCircle, Lock, Key
	} from 'lucide-svelte';

	let user = null;
	let isLoading = false;
	let isLoggingOut = false;
	let innerWidth = 0;
	let showLogoutConfirm = false;

	$: isDesktop = innerWidth >= 768;

	onMount(() => {
		auth.initialize();

		const unsubscribe = auth.subscribe(state => {
			if (!state.isLoading) {
				if (!state.isAuthenticated) {
					goto('/login');
					return;
				}
				user = state.user;
			}
		});

		return unsubscribe;
	});

	async function handleLogout() {
		isLoggingOut = true;
		try {
			await supabase.auth.signOut();
			auth.logout();
			goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat logout';
			alert('Gagal logout: ' + errorMessage);
		} finally {
			isLoggingOut = false;
			showLogoutConfirm = false;
		}
	}

	function confirmLogout() {
		showLogoutConfirm = true;
	}

	function getRoleLabel(role) {
		if (!role) return 'User';
		switch(role) {
			case 'super_admin': return 'Super Admin';
			case 'admin': return 'Administrator';
			default: return 'User';
		}
	}

	function getRoleIcon(role) {
		return (role === 'super_admin') ? Shield : User;
	}

	function getRoleColor(role) {
		if (!role) return 'badge-secondary';
		switch(role) {
			case 'super_admin': return 'badge-error';
			case 'admin': return 'badge-info';
			default: return 'badge-secondary';
		}
	}

	let showChangePassword = false;
	let passwordData = {
		oldPassword: '',
		newPassword: '',
		confirmPassword: ''
	};
	let passwordError = '';
	let isChangingPassword = false;

	function handleChangePassword() {
		showChangePassword = true;
		passwordError = '';
		passwordData = {
			oldPassword: '',
			newPassword: '',
			confirmPassword: ''
		};
	}

	async function submitChangePassword() {
		passwordError = '';

		// Validation
		if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
			passwordError = 'Semua field harus diisi';
			return;
		}

		if (passwordData.newPassword.length < 6) {
			passwordError = 'Password baru minimal 6 karakter';
			return;
		}

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			passwordError = 'Password baru dan konfirmasi tidak cocok';
			return;
		}

		isChangingPassword = true;

		try {
			// Get stored user credentials
			const storedUser = localStorage.getItem('auth_user');
			if (!storedUser) {
				throw new Error('User tidak ditemukan');
			}

			const userData = JSON.parse(storedUser);

			// Verify old password
			if (userData.profile.password !== passwordData.oldPassword) {
				throw new Error('Password lama tidak sesuai');
			}

			// Update password in database
			const { data, error } = await supabase
				.from('muser')
				.update({ password: passwordData.newPassword })
				.eq('username', userData.profile.username);

			if (error) throw error;

			// Update localStorage
			userData.profile.password = passwordData.newPassword;
			localStorage.setItem('auth_user', JSON.stringify(userData));

			alert('Password berhasil diubah!');
			showChangePassword = false;
			passwordData = {
				oldPassword: '',
				newPassword: '',
				confirmPassword: ''
			};
		} catch (error) {
			console.error('Change password error:', error);
			passwordError = error.message || 'Gagal mengubah password';
		} finally {
			isChangingPassword = false;
		}
	}

	function handleSettings() {
		goto('/settings');
	}

	function handleNotifications() {
		goto('/notifications');
	}

	function handleHelp() {
		goto('/help');
	}

	const menuItems = [
		{
			icon: Key,
			title: 'Change Password',
			description: 'Ubah password akun Anda',
			action: handleChangePassword,
			color: 'text-blue-600'
		},
		{
			icon: Settings,
			title: 'Pengaturan',
			description: 'Atur preferensi dan konfigurasi aplikasi',
			action: handleSettings,
			color: 'text-gray-600'
		},
		{
			icon: Bell,
			title: 'Notifikasi',
			description: 'Kelola pengaturan notifikasi dan pemberitahuan',
			action: handleNotifications,
			color: 'text-orange-600'
		},
		{
			icon: HelpCircle,
			title: 'Bantuan & Dukungan',
			description: 'FAQ, panduan penggunaan, dan kontak support',
			action: handleHelp,
			color: 'text-green-600'
		}
	];

	function formatDate(dateString) {
		if (!dateString) return '-';
		try {
			return new Date(dateString).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		} catch (error) {
			console.error('Error formatting date:', error);
			return '-';
		}
	}

	function getLastLoginStatus() {
		// Mock data - in real app this would come from user data
		return 'Hari ini, 14:30';
	}
</script>

<svelte:head>
	<title>Profil - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader title="Profil" />

<main class="app-content" class:desktop={isDesktop}>
	{#if user}
		<div class="profile-container">
			<!-- User Profile Header -->
			<div class="profile-header">
				<div class="profile-card" class:desktop-layout={isDesktop}>
					<div class="profile-avatar-section">
						<div class="profile-avatar">
							<User size={isDesktop ? 40 : 32} />
						</div>
					</div>

					<div class="profile-info">
						<h2 class="profile-name">
							{user.profile?.full_name || 'Admin User'}
						</h2>
						<p class="profile-email">{user.profile?.email || user.email}</p>
						<div class="profile-role">
							<span class="role-badge {getRoleColor(user.profile?.role || 'admin')}">
								<svelte:component this={getRoleIcon(user.profile?.role)} size={14} />
								{getRoleLabel(user.profile?.role || 'admin')}
							</span>
						</div>
						<div class="last-login">
							<span class="last-login-text">Terakhir aktif: {getLastLoginStatus()}</span>
						</div>
					</div>

					{#if isDesktop}
						<div class="profile-actions">
							<button class="action-btn primary" on:click={handleChangePassword}>
								<Key size={16} />
								Change Password
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Account Details Section -->
			<div class="section">
				<h3 class="section-title">Informasi Akun</h3>
				<div class="account-details">
					<div class="detail-grid" class:desktop-layout={isDesktop}>
						<div class="detail-card">
							<div class="detail-icon email">
								<Mail size={18} />
							</div>
							<div class="detail-content">
								<div class="detail-label">Email</div>
								<div class="detail-value">{user?.email || 'admin@example.com'}</div>
							</div>
						</div>

						<div class="detail-card">
							<div class="detail-icon user">
								<User size={18} />
							</div>
							<div class="detail-content">
								<div class="detail-label">Username</div>
								<div class="detail-value">{user?.profile?.username || user?.email?.split('@')[0] || 'admin'}</div>
							</div>
						</div>

						<div class="detail-card">
							<div class="detail-icon role">
								<Shield size={18} />
							</div>
							<div class="detail-content">
								<div class="detail-label">Peran</div>
								<div class="detail-value role-text">
									{getRoleLabel(user?.profile?.role || 'user')}
								</div>
							</div>
						</div>

						<div class="detail-card">
							<div class="detail-icon date">
								<Calendar size={18} />
							</div>
							<div class="detail-content">
								<div class="detail-label">Bergabung</div>
								<div class="detail-value">{formatDate(user?.created_at)}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- App Information Section -->
			<div class="section">
				<h3 class="section-title">Informasi Aplikasi</h3>
				<div class="app-info-card">
					<div class="app-info-grid" class:desktop-layout={isDesktop}>
						<div class="info-item">
							<div class="info-icon">
								<Smartphone size={16} />
							</div>
							<div class="info-content">
								<span class="info-label">Versi Aplikasi</span>
								<span class="info-value">1.0.0</span>
							</div>
						</div>

						<div class="info-item">
							<div class="info-icon">
								<Calendar size={16} />
							</div>
							<div class="info-content">
								<span class="info-label">Build</span>
								<span class="info-value">2025.10.06</span>
							</div>
						</div>

						<div class="info-item">
							<div class="info-icon">
								<Globe size={16} />
							</div>
							<div class="info-content">
								<span class="info-label">Platform</span>
								<span class="info-value">Progressive Web App</span>
							</div>
						</div>

						<div class="info-item">
							<div class="info-icon">
								<Database size={16} />
							</div>
							<div class="info-content">
								<span class="info-label">Database</span>
								<span class="info-value">Supabase</span>
							</div>
						</div>
					</div>

					<div class="app-description">
						<p>Aplikasi Absensi Pengajian - Sistem manajemen kehadiran jamaah yang terintegrasi dengan database cloud untuk kemudahan akses dan sinkronisasi data real-time.</p>
					</div>
				</div>
			</div>

			<!-- Logout Section -->
			<div class="logout-section">
				<button class="logout-button" on:click={confirmLogout} disabled={isLoggingOut}>
					{#if isLoggingOut}
						<div class="logout-spinner"></div>
						<span>Logging out...</span>
					{:else}
						<LogOut size={20} />
						<span>Keluar dari Aplikasi</span>
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<div class="loading-container">
			<div class="loading-content">
				<div class="spinner"></div>
				<p class="loading-text">Memuat profil...</p>
			</div>
		</div>
	{/if}
</main>

<!-- Change Password Modal -->
{#if showChangePassword}
	<div class="modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="change-password-modal-title"
		tabindex="-1"
		on:click={() => showChangePassword = false}
		on:keydown={(e) => e.key === 'Escape' && (showChangePassword = false)}>
		<div class="modal-content modal-password"
			on:click|stopPropagation>
			<div class="modal-header">
				<Key size={24} class="modal-icon password-icon" />
				<h3 id="change-password-modal-title">Change Password</h3>
			</div>
			<div class="modal-body">
				<form on:submit|preventDefault={submitChangePassword}>
					<div class="form-group">
						<label for="old-password">Password Lama</label>
						<div class="input-with-icon">
							<Lock size={18} class="input-icon" />
							<input
								type="password"
								id="old-password"
								bind:value={passwordData.oldPassword}
								placeholder="Masukkan password lama"
								disabled={isChangingPassword}
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="new-password">Password Baru</label>
						<div class="input-with-icon">
							<Key size={18} class="input-icon" />
							<input
								type="password"
								id="new-password"
								bind:value={passwordData.newPassword}
								placeholder="Masukkan password baru (min. 6 karakter)"
								disabled={isChangingPassword}
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="confirm-password">Konfirmasi Password Baru</label>
						<div class="input-with-icon">
							<Key size={18} class="input-icon" />
							<input
								type="password"
								id="confirm-password"
								bind:value={passwordData.confirmPassword}
								placeholder="Konfirmasi password baru"
								disabled={isChangingPassword}
							/>
						</div>
					</div>

					{#if passwordError}
						<div class="error-message">
							<AlertCircle size={16} />
							{passwordError}
						</div>
					{/if}
				</form>
			</div>
			<div class="modal-actions">
				<button class="cancel-btn" on:click={() => showChangePassword = false} disabled={isChangingPassword}>
					Batal
				</button>
				<button class="confirm-btn password-confirm" on:click={submitChangePassword} disabled={isChangingPassword}>
					{#if isChangingPassword}
						<div class="btn-spinner"></div>
						Mengubah...
					{:else}
						Ubah Password
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Logout Confirmation Modal -->
{#if showLogoutConfirm}
	<div class="modal-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="logout-modal-title"
		tabindex="-1"
		on:click={() => showLogoutConfirm = false}
		on:keydown={(e) => e.key === 'Escape' && (showLogoutConfirm = false)}>
		<div class="modal-content"
			on:click|stopPropagation>
			<div class="modal-header">
				<AlertCircle size={24} class="modal-icon" />
				<h3 id="logout-modal-title">Konfirmasi Logout</h3>
			</div>
			<div class="modal-body">
				<p>Apakah Anda yakin ingin keluar dari aplikasi?</p>
			</div>
			<div class="modal-actions">
				<button class="cancel-btn" on:click={() => showLogoutConfirm = false}>Batal</button>
				<button class="confirm-btn" on:click={handleLogout} disabled={isLoggingOut}>
					{#if isLoggingOut}
						<div class="btn-spinner"></div>
						Logging out...
					{:else}
						Ya, Keluar
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<BottomNav />

<style>
	.app-content {
		min-height: calc(100vh - 120px);
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1rem 1rem 100px 1rem;
	}

	.app-content.desktop {
		padding: 2rem 2rem 2rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: 2rem;
	}

	.loading-content {
		text-align: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #0ea5e9;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}

	.profile-container {
		max-width: 100%;
	}

	/* Profile Header */
	.profile-header {
		margin-bottom: 2rem;
	}

	.profile-card {
		background: white;
		border-radius: 20px;
		padding: 2rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		position: relative;
	}

	.profile-card.desktop-layout {
		flex-direction: row;
		text-align: left;
		align-items: center;
		gap: 2rem;
	}

	.profile-avatar-section {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.profile-card.desktop-layout .profile-avatar-section {
		margin-bottom: 0;
	}

	.profile-avatar {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
	}

	.profile-info {
		flex: 1;
	}

	.profile-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.profile-email {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 1rem 0;
	}

	.profile-role {
		margin-bottom: 0.75rem;
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 50px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.role-badge.badge-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.role-badge.badge-info {
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #bfdbfe;
	}

	.role-badge.badge-secondary {
		background: #f9fafb;
		color: #374151;
		border: 1px solid #e5e7eb;
	}

	.last-login {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.profile-actions {
		display: flex;
		gap: 0.75rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
	}

	.action-btn.primary:hover {
		box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4);
		transform: translateY(-2px);
	}

	/* Section */
	.section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* Account Details */
	.account-details {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.detail-grid.desktop-layout {
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.detail-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #f1f5f9;
	}

	.detail-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.detail-icon.email {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	}

	.detail-icon.user {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.detail-icon.role {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	.detail-icon.date {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.detail-content {
		flex: 1;
	}

	.detail-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.detail-value {
		font-size: 0.875rem;
		color: #111827;
		font-weight: 500;
	}

	.detail-value.role-text {
		color: #7c3aed;
		font-weight: 600;
	}

	/* Menu List */
	.menu-list {
		background: white;
		border-radius: 16px;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 1.25rem 1.5rem;
		background: white;
		border: none;
		border-bottom: 1px solid #f8fafc;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		text-align: left;
		gap: 1rem;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-item:hover {
		background: #f8fafc;
	}

	.menu-item.desktop-layout:hover {
		background: #f1f5f9;
		transform: translateY(-1px);
	}

	.menu-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
		flex-shrink: 0;
	}

	.menu-content {
		flex: 1;
	}

	.menu-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.menu-description {
		font-size: 0.75rem;
		color: #6b7280;
		line-height: 1.4;
	}

	.menu-arrow {
		color: #9ca3af;
		transition: all 0.2s ease;
	}

	/* App Info */
	.app-info-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.app-info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.app-info-grid.desktop-layout {
		grid-template-columns: repeat(4, 1fr);
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
	}

	.info-icon {
		color: #6b7280;
		flex-shrink: 0;
	}

	.info-content {
		display: flex;
		flex-direction: column;
	}

	.info-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.info-value {
		font-size: 0.75rem;
		color: #111827;
		font-weight: 600;
		margin-top: 0.125rem;
	}

	.app-description {
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #f1f5f9;
	}

	.app-description p {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
		margin: 0;
	}

	/* Logout Section */
	.logout-section {
		margin-top: 2rem;
		padding: 1.5rem;
	}

	.logout-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
	}

	.logout-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
	}

	.logout-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.logout-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-width: 400px;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-content.modal-password {
		max-width: 450px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.modal-icon {
		color: #ef4444;
	}

	.modal-icon.password-icon {
		color: #0ea5e9;
	}

	.modal-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-body p {
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #f1f5f9;
	}

	.cancel-btn, .confirm-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.cancel-btn {
		background: #f9fafb;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.cancel-btn:hover {
		background: #f3f4f6;
	}

	.confirm-btn {
		background: #ef4444;
		color: white;
		border: 1px solid #ef4444;
	}

	.confirm-btn:hover:not(:disabled) {
		background: #dc2626;
		border-color: #dc2626;
	}

	.confirm-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Override for Change Password button */
	.confirm-btn.password-confirm {
		background: #0ea5e9;
		border-color: #0ea5e9;
	}

	.confirm-btn.password-confirm:hover:not(:disabled) {
		background: #0284c7;
		border-color: #0284c7;
	}

	.btn-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	/* Form Styles for Password Change */
	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.input-with-icon input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.input-with-icon input:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.input-with-icon input:disabled {
		background: #f9fafb;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 1rem;
	}

	/* Mobile Responsive */
	@media (max-width: 640px) {
		.app-content {
			padding: 1rem 1rem 100px 1rem;
		}

		.profile-card {
			padding: 1.5rem;
		}

		.profile-name {
			font-size: 1.25rem;
		}

		.detail-grid.desktop-layout {
			grid-template-columns: 1fr;
		}

		.app-info-grid.desktop-layout {
			grid-template-columns: 1fr;
		}

		.logout-section {
			padding: 1rem;
		}
	}
</style>
