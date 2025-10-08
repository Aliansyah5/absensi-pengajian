<script>
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { DatabaseService, formatters } from '$lib/utils/supabase.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { CheckSquare, Calendar, Users, Save, RotateCcw, AlertCircle, CheckCircle, User, Clock, MapPin, BookOpen } from 'lucide-svelte';

	let isLoading = true;
	let isSaving = false;
	let innerWidth = 0;
	let pengajianList = [];
	let jamaahList = [];
	let selectedPengajian = '';
	let selectedDate = new Date().toISOString().split('T')[0];
	let absensiData = {};
	let existingAbsensi = {};
	let message = { type: '', text: '' };

	$: isDesktop = innerWidth >= 768;

	// Check authentication
	onMount(async () => {
		auth.initialize();

		const unsubscribe = auth.subscribe(async (state) => {
			if (!state.isLoading) {
				if (!state.isAuthenticated) {
					goto('/login');
					return;
				}

				await loadPengajian();
			}
		});

		return unsubscribe;
	});

	async function loadPengajian() {
		try {
			const result = await DatabaseService.getPengajian();
			if (result.data) {
				pengajianList = result.data;
			}
		} catch (error) {
			console.error('Error loading pengajian:', error);
			showMessage('error', 'Gagal memuat data pengajian');
		} finally {
			isLoading = false;
		}
	}

	async function loadJamaahAndAbsensi() {
		if (!selectedPengajian) return;

		isLoading = true;
		try {
			// Load jamaah untuk kelompok yang sama dengan pengajian yang dipilih
			const pengajian = pengajianList.find(p => p.id === selectedPengajian);
			if (!pengajian) return;

			const jamaahResult = await DatabaseService.getJamaahByKategori(pengajian.mkelompok.mkategori.id);
			if (jamaahResult.data) {
				// Filter jamaah yang sesuai kelompok
				jamaahList = jamaahResult.data.filter(j => j.kelompok_id === pengajian.kelompok_id);
			}

			// Load existing absensi for the selected date
			const absensiResult = await DatabaseService.getAbsensiByTanggal(selectedDate, selectedPengajian);
			if (absensiResult.data) {
				existingAbsensi = {};
				absensiResult.data.forEach(item => {
					existingAbsensi[item.jamaah_id] = item.status_kehadiran;
				});
			} else {
				existingAbsensi = {};
			}

			// Initialize absensi data
			initializeAbsensiData();
		} catch (error) {
			console.error('Error loading jamaah and absensi:', error);
			showMessage('error', 'Gagal memuat data jamaah');
		} finally {
			isLoading = false;
		}
	}

	function initializeAbsensiData() {
		absensiData = {};
		jamaahList.forEach(jamaah => {
			absensiData[jamaah.id] = existingAbsensi[jamaah.id] || 'H'; // Default to 'Hadir'
		});
	}

	function handlePengajianChange() {
		loadJamaahAndAbsensi();
	}

	function handleDateChange() {
		if (selectedPengajian) {
			loadJamaahAndAbsensi();
		}
	}

	function setAllStatus(status) {
		jamaahList.forEach(jamaah => {
			absensiData[jamaah.id] = status;
		});
		// Trigger reactivity
		absensiData = { ...absensiData };
	}

	function getStatusCounts() {
		const counts = { H: 0, A: 0, I: 0 };
		Object.values(absensiData).forEach(status => {
			counts[status]++;
		});
		return counts;
	}

	async function saveAbsensi() {
		if (!selectedPengajian || jamaahList.length === 0) {
			showMessage('error', 'Pilih pengajian dan pastikan ada data jamaah');
			return;
		}

		isSaving = true;
		try {
			const currentUser = $auth.user;
			const absensiRecords = jamaahList.map(jamaah => ({
				jamaah_id: jamaah.id,
				pengajian_id: selectedPengajian,
				tanggal_absensi: selectedDate,
				status_kehadiran: absensiData[jamaah.id],
				user_input_id: currentUser?.id || null,
				waktu_absensi: new Date().toTimeString().split(' ')[0]
			}));

			// Save all records
			for (const record of absensiRecords) {
				const result = await DatabaseService.saveAbsensi(record);
				if (result.error) {
					throw new Error(`Gagal menyimpan absensi untuk ${jamaah.nama_lengkap}`);
				}
			}

			showMessage('success', `Berhasil menyimpan absensi untuk ${jamaahList.length} jamaah`);

			// Reload to get updated data
			await loadJamaahAndAbsensi();
		} catch (error) {
			console.error('Error saving absensi:', error);
			showMessage('error', error.message || 'Gagal menyimpan absensi');
		} finally {
			isSaving = false;
		}
	}

	function resetAbsensi() {
		initializeAbsensiData();
		showMessage('info', 'Data absensi telah direset');
	}

	function showMessage(type, text) {
		message = { type, text };
		setTimeout(() => {
			message = { type: '', text: '' };
		}, 5000);
	}

	function getPengajianInfo() {
		if (!selectedPengajian) return null;
		return pengajianList.find(p => p.id === selectedPengajian);
	}

	function getStatusLabel(status) {
		const statusMap = {
			'H': 'Hadir',
			'A': 'Absen',
			'I': 'Izin'
		};
		return statusMap[status] || status;
	}

	function getStatusClass(status) {
		const classMap = {
			'H': 'status-hadir',
			'A': 'status-absen',
			'I': 'status-izin'
		};
		return classMap[status] || '';
	}

	function getTodayFormatted() {
		const date = new Date(selectedDate);
		return date.toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	$: statusCounts = getStatusCounts();
	$: pengajianInfo = getPengajianInfo();
</script>

<svelte:head>
	<title>Input Absensi - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader title="Input Absensi" showBack={true} onBack={() => goto('/dashboard')} />

<main class="app-content" class:desktop={isDesktop}>
	{#if message.text}
		<div class="message-banner {message.type}">
			<div class="message-content">
				{#if message.type === 'success'}
					<CheckCircle size={18} />
				{:else if message.type === 'error'}
					<AlertCircle size={18} />
				{:else}
					<AlertCircle size={18} />
				{/if}
				<span class="message-text">{message.text}</span>
			</div>
		</div>
	{/if}

	<div class="absensi-container">
		{#if isLoading}
			<div class="loading-container">
				<div class="loading-content">
					<div class="spinner"></div>
					<p class="loading-text">Memuat data pengajian...</p>
				</div>
			</div>
		{:else}
			<!-- Selection Section -->
			<div class="section">
				<h2 class="section-title">Pilih Pengajian & Tanggal</h2>
				<div class="selection-card">
					<div class="selection-form" class:desktop-layout={isDesktop}>
						<div class="form-group">
							<label for="pengajian" class="form-label">
								<BookOpen size={16} />
								Pengajian
							</label>
							<select
								id="pengajian"
								bind:value={selectedPengajian}
								on:change={handlePengajianChange}
								class="form-select"
								required
							>
								<option value="">Pilih Pengajian</option>
								{#each pengajianList as pengajian}
									<option value={pengajian.id}>
										{pengajian.nama_pengajian} - {pengajian.mkelompok?.nama_kelompok || 'Unknown'}
									</option>
								{/each}
							</select>
						</div>

						<div class="form-group">
							<label for="tanggal" class="form-label">
								<Calendar size={16} />
								Tanggal
							</label>
							<input
								id="tanggal"
								type="date"
								bind:value={selectedDate}
								on:change={handleDateChange}
								class="form-input"
								required
							/>
						</div>
					</div>

					{#if pengajianInfo}
						<div class="pengajian-info">
							<div class="date-display">
								<Clock size={16} />
								<span>{getTodayFormatted()}</span>
							</div>

							<div class="info-grid" class:desktop-grid={isDesktop}>
								<div class="info-card">
									<div class="info-icon ustadz">
										<User size={18} />
									</div>
									<div class="info-content">
										<div class="info-label">Ustadz</div>
										<div class="info-value">{pengajianInfo.ustadz || '-'}</div>
									</div>
								</div>

								<div class="info-card">
									<div class="info-icon kelompok">
										<Users size={18} />
									</div>
									<div class="info-content">
										<div class="info-label">Kelompok</div>
										<div class="info-value">{pengajianInfo.mkelompok?.nama_kelompok || '-'}</div>
									</div>
								</div>

								<div class="info-card">
									<div class="info-icon kategori">
										<MapPin size={18} />
									</div>
									<div class="info-content">
										<div class="info-label">Kategori</div>
										<div class="info-value">
											<span class="badge {pengajianInfo.mkelompok?.mkategori?.kode_kategori === 'PUTRA' ? 'badge-info' : 'badge-warning'}">
												{pengajianInfo.mkelompok?.mkategori?.nama_kategori || '-'}
											</span>
										</div>
									</div>
								</div>

								<div class="info-card">
									<div class="info-icon jenis">
										<BookOpen size={18} />
									</div>
									<div class="info-content">
										<div class="info-label">Jenis</div>
										<div class="info-value">{pengajianInfo.jenis_pengajian}</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			{#if selectedPengajian && jamaahList.length > 0}
				<!-- Statistics Section -->
				<div class="section">
					<h2 class="section-title">Ringkasan Kehadiran</h2>
					<div class="stats-grid" class:desktop-layout={isDesktop}>
						<div class="stat-card hadir">
							<div class="stat-icon">
								<CheckSquare size={20} />
							</div>
							<div class="stat-content">
								<div class="stat-number">{statusCounts.H}</div>
								<div class="stat-label">Hadir</div>
							</div>
						</div>

						<div class="stat-card absen">
							<div class="stat-icon">
								<AlertCircle size={20} />
							</div>
							<div class="stat-content">
								<div class="stat-number">{statusCounts.A}</div>
								<div class="stat-label">Absen</div>
							</div>
						</div>

						<div class="stat-card izin">
							<div class="stat-icon">
								<Calendar size={20} />
							</div>
							<div class="stat-content">
								<div class="stat-number">{statusCounts.I}</div>
								<div class="stat-label">Izin</div>
							</div>
						</div>

						<div class="stat-card total">
							<div class="stat-icon">
								<Users size={20} />
							</div>
							<div class="stat-content">
								<div class="stat-number">{jamaahList.length}</div>
								<div class="stat-label">Total</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Bulk Actions -->
				<div class="section">
					<div class="bulk-actions">
						<div class="bulk-title">Aksi Cepat:</div>
						<div class="bulk-buttons" class:desktop-layout={isDesktop}>
							<button class="bulk-btn success" on:click={() => setAllStatus('H')}>
								<CheckSquare size={16} />
								Semua Hadir
							</button>
							<button class="bulk-btn error" on:click={() => setAllStatus('A')}>
								<AlertCircle size={16} />
								Semua Absen
							</button>
							<button class="bulk-btn warning" on:click={() => setAllStatus('I')}>
								<Calendar size={16} />
								Semua Izin
							</button>
							<button class="bulk-btn secondary" on:click={resetAbsensi}>
								<RotateCcw size={16} />
								Reset
							</button>
						</div>
					</div>
				</div>

				<!-- Jamaah List -->
				<div class="section">
					<h2 class="section-title">
						Daftar Kehadiran
						<span class="jamaah-count">{jamaahList.length} jamaah</span>
					</h2>
					<div class="jamaah-list">
						{#each jamaahList as jamaah, index}
							<div class="jamaah-card" class:desktop-layout={isDesktop}>
								<div class="jamaah-info">
									<div class="jamaah-avatar">
										{jamaah.nama_lengkap.charAt(0).toUpperCase()}
									</div>
									<div class="jamaah-details">
										<div class="jamaah-name">{jamaah.nama_lengkap}</div>
										<div class="jamaah-id">{jamaah.nomor_induk}</div>
									</div>
								</div>

								<div class="status-controls">
									<div class="status-buttons" class:mobile-stack={!isDesktop}>
										{#each ['H', 'A', 'I'] as status}
											<button
												class="status-btn {getStatusClass(status)} {absensiData[jamaah.id] === status ? 'active' : ''}"
												on:click={() => {
													absensiData[jamaah.id] = status;
													absensiData = { ...absensiData };
												}}
											>
												{getStatusLabel(status)}
											</button>
										{/each}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Save Action -->
				<div class="save-section">
					<button
						class="save-btn"
						class:saving={isSaving}
						on:click={saveAbsensi}
						disabled={isSaving}
					>
						{#if isSaving}
							<div class="save-spinner"></div>
							<span>Menyimpan...</span>
						{:else}
							<Save size={20} />
							<span>Simpan Absensi ({jamaahList.length} jamaah)</span>
						{/if}
					</button>
				</div>
			{:else if selectedPengajian && jamaahList.length === 0}
				<div class="empty-state">
					<div class="empty-icon">
						<Users size={64} />
					</div>
					<div class="empty-title">Tidak ada jamaah ditemukan</div>
					<div class="empty-description">
						Pastikan pengajian yang dipilih memiliki jamaah terdaftar dalam kelompok yang sesuai
					</div>
				</div>
			{/if}
		{/if}
	</div>
</main>

<BottomNav />

<style>
	.app-content {
		min-height: calc(100vh - 64px);
		background: #f8fafc;
	}

	.app-content.desktop {
		padding-bottom: 2rem;
	}

	.message-banner {
		padding: 1rem;
		margin-bottom: 0;
	}

	.message-banner.success {
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		border-bottom: 1px solid #34d399;
	}

	.message-banner.error {
		background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
		border-bottom: 1px solid #f87171;
	}

	.message-banner.info {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
		border-bottom: 1px solid #60a5fa;
	}

	.message-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.message-banner.success .message-content {
		color: #065f46;
	}

	.message-banner.error .message-content {
		color: #991b1b;
	}

	.message-banner.info .message-content {
		color: #1e3a8a;
	}

	.absensi-container {
		padding: 1.5rem 1rem;
	}

	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
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
		justify-content: space-between;
	}

	.jamaah-count {
		background: #e0f2fe;
		color: #0369a1;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Selection Card */
	.selection-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.selection-form {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.selection-form.desktop-layout {
		grid-template-columns: 1fr 1fr;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
	}

	.pengajian-info {
		border-top: 1px solid #f1f5f9;
		padding-top: 1.5rem;
	}

	.date-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #0ea5e9;
		font-weight: 500;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.info-grid.desktop-grid {
		grid-template-columns: repeat(2, 1fr);
	}

	.info-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}

	.info-icon {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.info-icon.ustadz {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	}

	.info-icon.kelompok {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.info-icon.kategori {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.info-icon.jenis {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.info-content {
		flex: 1;
		min-width: 0;
	}

	.info-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		margin-bottom: 0.125rem;
	}

	.info-value {
		font-size: 0.875rem;
		color: #111827;
		font-weight: 500;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.stats-grid.desktop-layout {
		grid-template-columns: repeat(4, 1fr);
	}

	.stat-card {
		background: white;
		border-radius: 16px;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.stat-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.stat-card.hadir .stat-icon {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.stat-card.absen .stat-icon {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	}

	.stat-card.izin .stat-icon {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.stat-card.total .stat-icon {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
	}

	.stat-content {
		text-align: center;
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		margin-top: 0.25rem;
	}

	/* Bulk Actions */
	.bulk-actions {
		background: white;
		border-radius: 16px;
		padding: 1.25rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.bulk-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 1rem;
	}

	.bulk-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.bulk-buttons.desktop-layout {
		grid-template-columns: repeat(4, 1fr);
	}

	.bulk-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		color: white;
	}

	.bulk-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.bulk-btn:active {
		transform: translateY(0);
	}

	.bulk-btn.success {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	}

	.bulk-btn.error {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	}

	.bulk-btn.warning {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.bulk-btn.secondary {
		background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
	}

	/* Jamaah List */
	.jamaah-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.jamaah-card {
		background: white;
		border-radius: 16px;
		padding: 1.25rem;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.jamaah-card.desktop-layout {
		padding: 1rem 1.5rem;
	}

	.jamaah-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.jamaah-avatar {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.125rem;
		flex-shrink: 0;
	}

	.jamaah-details {
		flex: 1;
		min-width: 0;
	}

	.jamaah-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.jamaah-id {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.status-controls {
		flex-shrink: 0;
	}

	.status-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.status-buttons.mobile-stack {
		flex-direction: column;
		gap: 0.375rem;
	}

	.status-btn {
		padding: 0.5rem 1rem;
		border: 2px solid;
		border-radius: 8px;
		background: white;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
		text-align: center;
	}

	.status-btn:hover {
		transform: scale(1.05);
	}

	.status-btn:active {
		transform: scale(0.95);
	}

	.status-btn.status-hadir {
		border-color: #10b981;
		color: #059669;
	}

	.status-btn.status-hadir.active {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
	}

	.status-btn.status-absen {
		border-color: #ef4444;
		color: #dc2626;
	}

	.status-btn.status-absen.active {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
	}

	.status-btn.status-izin {
		border-color: #f59e0b;
		color: #d97706;
	}

	.status-btn.status-izin.active {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
	}

	/* Save Section */
	.save-section {
		position: sticky;
		bottom: 80px;
		z-index: 30;
		margin-top: 2rem;
	}

	.save-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 16px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
	}

	.save-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4);
	}

	.save-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.save-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.save-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: white;
		border-radius: 16px;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.empty-icon {
		color: #d1d5db;
		margin-bottom: 1.5rem;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.75rem;
	}

	.empty-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.absensi-container {
			padding: 1rem;
		}

		.jamaah-card {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.jamaah-info {
			justify-content: flex-start;
		}

		.jamaah-avatar {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}

		.status-buttons {
			justify-content: center;
		}

		.bulk-buttons {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.save-section {
			bottom: 70px;
		}
	}
</style>
