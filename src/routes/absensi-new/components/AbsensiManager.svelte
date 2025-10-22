<script>
	import { onMount } from 'svelte';
	import { AbsensiService } from '$lib/services/absensi.js';
	import { PengajianService, JamaahService, MasjidService, AlQuranService, HadistService, KelompokService, KategoriService } from '$lib/services/masterData.js';
	import AbsensiList from './AbsensiList.svelte';
	import AbsensiDetailView from './AbsensiDetailView.svelte';
	import PengajianForm from './PengajianForm.svelte';
	import JamaahList from './JamaahList.svelte';
	import { Calendar, Users, Save, CheckCircle, AlertCircle, RefreshCw, BookOpen, ArrowLeft } from 'lucide-svelte';

	let currentUser = null;
	let pengajianList = [];
	let jamaahList = [];
	let masjidList = [];
	let kelompokList = [];
	let alquranList = [];
	let hadistList = [];
	let kategoriList = [];
	let selectedDate = new Date().toISOString().split('T')[0];
	let selectedPengajian = null;
	let absensiData = {};
	let isLoading = true;
	let isSaving = false;
	let message = { type: '', text: '', show: false };
	let currentView = 'list'; // 'list', 'form-pengajian', 'check-absensi', 'view', 'edit'
	let activeTab = 'form-pengajian'; // for when in form view
	let viewingAbsensi = null;
	let editingAbsensi = null;

	// Form data for pengajian matching database schema
	let formData = {
		pengajian: null, // Will be set from pengajian dropdown
		tgl: selectedDate,
		tempat: '', // masjid ID
		kelompok: '', // kelompok ID
		tingkat: [], // Changed to multiple select array
		jam_mulai: '19:00',
		jam_akhir: '20:30',
		quran: null,
		pengajar_quran: '',
		ayat_awal: '',
		ayat_akhir: '',
		hadist: null,
		pengajar_hadist: '',
		hal_awal: '',
		hal_akhir: '',
		penasehat: '',
		infaq: 0
	};

	let existingAbsensiId = null;
	let innerWidth = 0;

	$: isDesktop = innerWidth >= 768;
	$: formData.tgl = selectedDate; // Keep date synchronized

	// Auto-fill masjid (tempat) based on selected kelompok
	$: if (formData.kelompok) {
		const selectedKelompok = kelompokList.find(k => k.id === parseInt(formData.kelompok));
		if (selectedKelompok) {
			// Find masjid that belongs to this kelompok
			const masjidForKelompok = masjidList.find(m => m.id_kelompok === selectedKelompok.id);
			if (masjidForKelompok) {
				formData.tempat = String(masjidForKelompok.id);
				console.log('Auto-filled masjid:', masjidForKelompok.nama_masjid, 'for kelompok:', selectedKelompok.nama_kelompok);
			}
		}
	}

	// Filter jamaah by selected tingkat (kategori) and kelompok
	$: filteredJamaahByFilters = jamaahList.filter(j => {
		// Filter by tingkat (kategori)
		let matchesTingkat = true;
		if (formData.tingkat && formData.tingkat.length > 0) {
			matchesTingkat = formData.tingkat.includes(j.id_kategori);
		}

		// Filter by kelompok
		let matchesKelompok = true;
		if (formData.kelompok) {
			matchesKelompok = j.id_kelompok === parseInt(formData.kelompok);
		}

		return matchesTingkat && matchesKelompok;
	});
	$: filteredJamaahLaki = filteredJamaahByFilters.filter(j => j.jk === 'L');
	$: filteredJamaahPerempuan = filteredJamaahByFilters.filter(j => j.jk === 'P');

	// Reactive: Update absensi data when filters change
	$: if (filteredJamaahByFilters && currentView === 'form-pengajian' && activeTab === 'check-absensi') {
		updateAbsensiDataForFilteredJamaah();
	}

	onMount(async () => {
		await loadInitialData();
	});

	async function loadInitialData() {
		isLoading = true;
		try {
			// Load master data
			const [pengajianResult, masjidResult, kelompokResult, alquranResult, hadistResult, kategoriResult] =
				await Promise.all([
					PengajianService.getAllPengajian(),
					MasjidService.getAllMasjid(),
					KelompokService.getAllKelompok(),
					AlQuranService.getAllAlQuran(),
					HadistService.getAllHadist(),
					KategoriService.getAllKategori()
				]);

			pengajianList = pengajianResult;
			// Don't load all jamaah initially - will be loaded after kelompok selection
			jamaahList = [];
			masjidList = masjidResult;
			kelompokList = kelompokResult;
			alquranList = alquranResult;
			hadistList = hadistResult;
			kategoriList = kategoriResult;

			// Debug: Log loaded data
			console.log('Loaded kelompok data:', kelompokResult);
			console.log('Loaded kategori data:', kategoriResult);

			// Don't auto-select pengajian - let user choose
			// selectedPengajian and formData.pengajian remain null

			// Initialize absensi data (empty initially)
			initializeAbsensiData();

		} catch (error) {
			console.error('Error loading data:', error);
			showMessage('error', `Gagal memuat data: ${error.message}`);
		} finally {
			isLoading = false;
		}
	}

	function initializeAbsensiData() {
		absensiData = {};
		// Use filteredJamaahByFilters if available, otherwise use all jamaahList
		const jamaahToProcess = filteredJamaahByFilters || jamaahList;
		jamaahToProcess.forEach(jamaah => {
			absensiData[jamaah.id] = {
				jamaah_id: jamaah.id,
				status_kehadiran: 'A', // Default to Alpha (Absent)
				keterangan: ''
			};
		});

		console.log('Initialized absensi data for', jamaahToProcess.length, 'jamaah with default Alpha status');
	}

	function updateAbsensiDataForFilteredJamaah() {
		// Preserve existing absensi data
		const existingData = { ...absensiData };

		// Reset absensi data
		absensiData = {};

		// Add data for filtered jamaah
		filteredJamaahByFilters.forEach(jamaah => {
			if (existingData[jamaah.id]) {
				// Keep existing data if jamaah was already in the list
				absensiData[jamaah.id] = existingData[jamaah.id];
			} else {
				// Initialize new jamaah with default Alpha status
				absensiData[jamaah.id] = {
					jamaah_id: jamaah.id,
					status_kehadiran: 'A', // Default to Alpha (Absent)
					keterangan: ''
				};
			}
		});

		console.log('Updated absensi data for', filteredJamaahByFilters.length, 'filtered jamaah');
	}

	async function syncJamaahData() {
		try {
			showMessage('info', 'Sinkronisasi data jamaah terbaru...');

			// Validate that kelompok is selected
			if (!formData.kelompok) {
				showMessage('error', 'Silakan pilih kelompok terlebih dahulu');
				return;
			}

			console.log('Sync jamaah for kelompok:', formData.kelompok, 'with tingkat:', formData.tingkat);

			// Use the new getJamaahByKelompok method that validates user access
			const newJamaahList = await AbsensiService.getJamaahByKelompok(
				formData.kelompok,
				formData.tingkat || []
			);

			console.log('Loaded LATEST jamaah data:', newJamaahList.length, 'jamaah found');

			// Preserve existing absensi data
			const existingData = { ...absensiData };

			// Initialize new structure for ALL current jamaah
			absensiData = {};
			newJamaahList.forEach(jamaah => {
				if (existingData[jamaah.id]) {
					// Keep existing attendance data if jamaah was already in the list
					absensiData[jamaah.id] = existingData[jamaah.id];
				} else {
					// Initialize new jamaah with default Alpha status
					absensiData[jamaah.id] = {
						jamaah_id: jamaah.id,
						status_kehadiran: 'A', // Default to Alpha (Absent)
						keterangan: ''
					};
				}
			});

			// Update jamaah list with latest data
			jamaahList = newJamaahList;

			const jumlahJamaah = newJamaahList.length;
			const jumlahBaru = newJamaahList.length - Object.keys(existingData).length;

			if (jumlahBaru > 0) {
				showMessage('success', `Data jamaah berhasil disinkronkan (${jumlahJamaah} jamaah, +${jumlahBaru} baru)`);
			} else {
				showMessage('success', `Data jamaah berhasil disinkronkan (${jumlahJamaah} jamaah ditemukan)`);
			}

		} catch (error) {
			console.error('Error syncing jamaah data:', error);
			showMessage('error', `Gagal sinkronisasi: ${error.message}`);
		}
	}

	function showMessage(type, text, duration = 3000) {
		message = { type, text, show: true };
		setTimeout(() => {
			message.show = false;
		}, duration);
	}

	async function handlePengajianSubmit(pengajianData) {
		try {
			// Update the formData with submitted data
			formData = { ...formData, ...pengajianData };

			// Set selectedPengajian from the form data
			if (pengajianData.pengajian) {
				selectedPengajian = { id: pengajianData.pengajian };
				formData.pengajian = pengajianData.pengajian;
			} else {
				showMessage('error', 'Silakan pilih pengajian terlebih dahulu');
				return;
			}

			// Save absensi header first (create mode)
			showMessage('info', 'Menyimpan data pengajian...');

			const absensiHeader = await AbsensiService.ensureAbsensiHeader({
				formData: formData,
				tanggal: selectedDate,
				pengajianId: selectedPengajian.id
			});

			if (!absensiHeader) {
				showMessage('error', 'Gagal menyimpan header pengajian');
				return;
			}

			// Store the absensi ID
			existingAbsensiId = absensiHeader.id;

			// Reload jamaah data based on selected kelompok and tingkat
			await syncJamaahData();

			showMessage('success', 'Data pengajian berhasil disimpan. Silakan input absensi jamaah.');

			// Move to absensi tab
			activeTab = 'check-absensi';

		} catch (error) {
			console.error('Error saving pengajian:', error);
			showMessage('error', `Gagal menyimpan pengajian: ${error.message}`);
		}
	}

	async function saveAbsensi() {
		if (!selectedPengajian) {
			showMessage('error', 'Silakan isi form pengajian terlebih dahulu');
			return;
		}

		isSaving = true;
		try {
			// Since auto-save handles individual records, this function now just
			// ensures the absensi header is complete and navigates back
			await AbsensiService.ensureAbsensiHeader({
				formData: formData,
				tanggal: selectedDate,
				pengajianId: selectedPengajian.id
			});

			showMessage('success', 'Absensi berhasil diselesaikan dan disimpan');

			// Reset form and go back to list
			currentView = 'list';
			activeTab = 'form-pengajian';
			selectedPengajian = null;
			existingAbsensiId = null;
			initializeAbsensiData();

		} catch (error) {
			console.error('Error finalizing absensi:', error);
			showMessage('error', `Gagal menyelesaikan sesi: ${error.message}`);
		} finally {
			isSaving = false;
		}
	}

	async function handleAbsensiChange(jamaahId, status, keterangan = '') {
		// Update local state immediately for UI responsiveness
		absensiData[jamaahId] = {
			jamaah_id: jamaahId,
			status_kehadiran: status,
			keterangan
		};

		// Auto-save to database silently (no UI feedback if authentication fails)
		await autoSaveAttendance(jamaahId, status, keterangan);
	}

	async function autoSaveAttendance(jamaahId, status, keterangan = '') {
		if (!selectedPengajian) {
			// Don't show error message, just log it
			console.log('No pengajian selected for auto-save');
			return;
		}

		try {
			// Ensure absensi header exists
			const absensiHeader = await AbsensiService.ensureAbsensiHeader({
				formData: formData,
				tanggal: selectedDate,
				pengajianId: selectedPengajian.id
			});

			// If header creation failed (likely due to auth), skip silently
			if (!absensiHeader) {
				console.log('Header creation failed, skipping auto-save');
				return;
			}

			// Store the absensi ID for future use
			if (!existingAbsensiId) {
				existingAbsensiId = absensiHeader.id;
			}

			// Update individual attendance
			const result = await AbsensiService.updateIndividualAttendance({
				absensiId: absensiHeader.id,
				jamaahId: jamaahId,
				status: status,
				keterangan: keterangan
			});

			// Only show success message if save was actually successful
			if (result) {
				showMessage('success', `Status ${getStatusLabel(status)} berhasil disimpan`, 1500);
			}

		} catch (error) {
			// Log error silently, don't show UI message
			console.log('Auto-save failed silently:', error);

			// Don't reset local state on auth errors to preserve user's selection
			// Only reset if it's a real data error
			if (error.message && !error.message.includes('tidak terautentikasi')) {
				if (absensiData[jamaahId]) {
					absensiData[jamaahId].status_kehadiran = '';
				}
			}
		}
	}	function getStatusLabel(status) {
		switch (status) {
			case 'H': return 'Hadir';
			case 'I': return 'Izin';
			case 'A': return 'Absen';
			default: return 'Unknown';
		}
	}

	// Navigation functions
	function handleAddNew() {
		currentView = 'form-pengajian';
		activeTab = 'form-pengajian';
	}

	function handleEditAbsensi(id) {
		editingAbsensi = id;
		currentView = 'edit';
		// Pre-load absensi data for editing
		loadAbsensiForEdit(id);
	}

	function handleViewAbsensi(id) {
		viewingAbsensi = id;
		currentView = 'view';
	}

	async function handleDeleteAbsensi(id) {
		if (confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
			try {
				await AbsensiService.deleteAbsensi(id);
				showMessage('success', 'Data absensi berhasil dihapus');
				// Refresh the list by reloading the current component
				window.location.reload();
			} catch (error) {
				console.error('Error deleting absensi:', error);
				showMessage('error', 'Gagal menghapus data absensi');
			}
		}
	}

	async function loadAbsensiForEdit(id) {
		isLoading = true; // Show loading indicator
		try {
			const absensi = await AbsensiService.getById(id);
			const detailData = await AbsensiService.getAbsensiDetail(id);

			if (absensi) {
				// Convert tingkat from comma-separated string to array
				let tingkatArray = [];
				if (absensi.tingkat) {
					if (typeof absensi.tingkat === 'string') {
						// Split comma-separated string and convert to numbers
						tingkatArray = absensi.tingkat.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t));
					} else {
						// Single number
						tingkatArray = [parseInt(absensi.tingkat)];
					}
				}

				// Populate form data with existing values using correct schema mapping
				formData = {
					pengajian: absensi.pengajian,
					tgl: new Date(absensi.tgl).toISOString().split('T')[0],
					tempat: absensi.tempat ? String(absensi.tempat) : '', // Ensure tempat is string
					kelompok: absensi.kelompok ? String(absensi.kelompok) : '', // Ensure kelompok is string
					tingkat: tingkatArray, // Convert tingkat to array
					jam_mulai: absensi.jam_mulai || '19:00',
					jam_akhir: absensi.jam_akhir || '20:30',
					quran: absensi.quran || '',
					pengajar_quran: absensi.pengajar_quran || '',
					ayat_awal: absensi.ayat_awal || '',
					ayat_akhir: absensi.ayat_akhir || '',
					hadist: absensi.hadist || '',
					pengajar_hadist: absensi.pengajar_hadist || '',
					hal_awal: absensi.hal_awal || '',
					hal_akhir: absensi.hal_akhir || '',
					penasehat: absensi.penasehat || '',
					infaq: absensi.infaq || 0
				};

				// Set date and pengajian
				selectedDate = formData.tgl;
				selectedPengajian = { id: absensi.pengajian };
				existingAbsensiId = id;

				// Reload jamaah data with proper filters to get the LATEST jamaah list
				console.log('[Edit Mode] Loading LATEST jamaah data with filters:', {
					kelompok: absensi.kelompok,
					tingkat: tingkatArray
				});

				// Use the new getJamaahByKelompok method that validates user access
				if (absensi.kelompok) {
					const reloadedJamaahList = await AbsensiService.getJamaahByKelompok(
						absensi.kelompok,
						tingkatArray || []
					);
					jamaahList = reloadedJamaahList;

					console.log('[Edit Mode] Reloaded LATEST jamaah:', reloadedJamaahList.length, 'jamaah found');

					// Wait for the next tick to ensure jamaahList is fully updated
					await new Promise(resolve => setTimeout(resolve, 100));

					// Initialize absensi data for ALL current jamaah (including new ones)
					initializeAbsensiData();

					// Populate absensi data with existing detail (preserve existing attendance)
					detailData.forEach(detail => {
						if (detail.id_siswa && absensiData[detail.id_siswa]) {
							// Only populate if jamaah still exists in current filtered list
							absensiData[detail.id_siswa] = {
								jamaah_id: detail.id_siswa,
								status_kehadiran: detail.status || 'A', // Default to Alpha if empty
								keterangan: detail.keterangan || ''
							};
						}
					});

					console.log('[Edit Mode] Populated absensi data:', Object.keys(absensiData).length, 'entries');
					console.log('[Edit Mode] Jamaah list length:', jamaahList.length);
					console.log('[Edit Mode] Filtered laki-laki:', filteredJamaahLaki.length);
					console.log('[Edit Mode] Filtered perempuan:', filteredJamaahPerempuan.length);

					// Switch to form view and open check-absensi tab
					currentView = 'form-pengajian';
					activeTab = 'check-absensi';

					showMessage('success', 'Data absensi berhasil dimuat untuk diedit');
				} else {
					console.error('[Edit Mode] No kelompok found in absensi data');
					showMessage('error', 'Data kelompok tidak ditemukan');
					jamaahList = [];
					initializeAbsensiData();
				}
			}
		} catch (error) {
			console.error('[Edit Mode] Error loading absensi:', error);
			showMessage('error', 'Gagal memuat data absensi untuk diedit');
		} finally {
			isLoading = false; // Hide loading indicator
		}
	}	function goBackToList() {
		currentView = 'list';
		selectedPengajian = null;
		existingAbsensiId = null;

		// Reset form data to default values
		formData = {
			pengajian: null,
			tgl: selectedDate,
			tempat: '',
			kelompok: '',
			tingkat: [], // Reset as empty array
			jam_mulai: '19:00',
			jam_akhir: '20:30',
			quran: null,
			pengajar_quran: '',
			ayat_awal: '',
			ayat_akhir: '',
			hadist: null,
			pengajar_hadist: '',
			hal_awal: '',
			hal_akhir: '',
			penasehat: '',
			infaq: 0
		};

		initializeAbsensiData();
	}
</script>

<svelte:window bind:innerWidth />

<div class="absensi-manager">
	{#if message.show}
		<div class="message {message.type}">
			<AlertCircle size={20} />
			<span>{message.text}</span>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading-container">
			<div class="loading-content">
				<div class="spinner"></div>
				<p class="loading-text">Memuat data absensi...</p>
			</div>
		</div>
	{:else if currentView === 'list'}
		<!-- List View -->
		<AbsensiList
			on:add-new={handleAddNew}
			on:edit={e => handleEditAbsensi(e.detail.id)}
			on:delete={e => handleDeleteAbsensi(e.detail.id)}
		/>
	{:else if currentView === 'view'}
		<!-- View Modal -->
		<AbsensiDetailView
			absensiId={viewingAbsensi}
			on:close={() => {
				currentView = 'list';
				viewingAbsensi = null;
			}}
			on:edit={(e) => {
				handleEditAbsensi(e.detail.id);
			}}
		/>
	{:else}
		<!-- Form View -->
		<!-- Header Section -->
		<header class="absensi-header">
			<div class="header-content">
				<div class="header-title">
					<div>
						<h1>Input Absensi Pengajian</h1>
						<p class="header-subtitle">Kelola absensi jamaah pengajian</p>
					</div>
				</div>
				<div class="header-actions">
					<div class="date-selector">
						<Calendar size={18} />
						<input type="date" bind:value={selectedDate} />
					</div>
				</div>
			</div>
		</header>

		<!-- Tab Navigation -->
		<div class="tab-navigation">
			<button
				class="tab-button"
				class:active={activeTab === 'form-pengajian'}
				on:click={() => activeTab = 'form-pengajian'}
			>
				<BookOpen size={18} />
				<span>Form Pengajian</span>
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'check-absensi'}
				class:disabled={!selectedPengajian}
				on:click={() => selectedPengajian && (activeTab = 'check-absensi')}
			>
				<Users size={18} />
				<span>Check Absensi</span>
			</button>
		</div>

		<!-- Tab Content -->
		<div class="tab-content">
			{#if activeTab === 'form-pengajian'}
				<PengajianForm
					{selectedDate}
					{pengajianList}
					{masjidList}
					{kelompokList}
					{alquranList}
					{hadistList}
					{kategoriList}
					{formData}
					on:submit={e => handlePengajianSubmit(e.detail)}
				/>
			{:else if activeTab === 'check-absensi'}
				<div class="absensi-content">
					<!-- Sync Button -->
					<div class="sync-section">
						<button class="btn-sync-jamaah" on:click={syncJamaahData}>
							<RefreshCw size={18} />
							<span>Sync Jamaah</span>
						</button>
					</div>

					<div class="jamaah-sections">
						<!-- Jamaah Laki-laki -->
						<JamaahList
							title="Jamaah Laki-laki"
							jamaahList={filteredJamaahLaki}
							{absensiData}
							showSavingIndicator={false}
							on:absensiChange={e => handleAbsensiChange(e.detail.jamaahId, e.detail.status, e.detail.keterangan)}
						/>

						<!-- Jamaah Perempuan -->
						<JamaahList
							title="Jamaah Perempuan"
							jamaahList={filteredJamaahPerempuan}
							{absensiData}
							showSavingIndicator={false}
							on:absensiChange={e => handleAbsensiChange(e.detail.jamaahId, e.detail.status, e.detail.keterangan)}
						/>
					</div>

					<!-- Save Button -->
					<div class="save-section">
						<div class="auto-save-info">
							<CheckCircle size={16} />
							<span>Pilihan absensi tersimpan otomatis</span>
						</div>
						<button
							class="btn-save secondary"
							on:click={saveAbsensi}
							disabled={isSaving}
						>
							{#if isSaving}
								<div class="save-spinner"></div>
								<span>Menyimpan...</span>
							{:else}
								<Save size={20} />
								<span>Selesai & Kembali</span>
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.absensi-manager {
		min-height: calc(100vh - 120px);
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1.5rem;
		padding-bottom: 120px; /* Add extra padding for bottom navbar */
	}

	/* Header Section */
	.absensi-header {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.header-title h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
		color: #1f2937;
		background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.btn-back {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #f3f4f6;
		color: #374151;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 1rem;
	}

	.btn-back:hover {
		background: #e5e7eb;
		transform: translateX(-2px);
	}

	.header-subtitle {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0.25rem 0 0 0;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.date-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #f9fafb;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		color: #374151;
	}

	.date-selector input {
		border: none;
		background: transparent;
		font-size: 0.875rem;
		color: #374151;
	}

	.date-selector input:focus {
		outline: none;
	}

	.btn-sync {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.btn-sync:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
	}

	/* Tab Navigation */
	.tab-navigation {
		display: flex;
		background: white;
		border-radius: 16px;
		padding: 0.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		padding: 1rem 1.5rem;
		border: none;
		background: transparent;
		border-radius: 12px;
		font-weight: 500;
		font-size: 0.875rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tab-button:hover:not(.disabled) {
		background: #f9fafb;
		color: #374151;
	}

	.tab-button.active {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
	}

	.tab-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Tab Content */
	.tab-content {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
		overflow: hidden;
	}

	.absensi-content {
		padding: 2rem;
	}

	.sync-section {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.btn-sync-jamaah {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.btn-sync-jamaah:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
	}

	.jamaah-sections {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.save-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding-top: 2rem;
		border-top: 1px solid #f3f4f6;
	}

	.auto-save-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #10b981;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.5rem 1rem;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 8px;
	}

	.btn-save {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
		min-width: 200px;
		justify-content: center;
	}

	.btn-save.secondary {
		background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
		box-shadow: 0 4px 12px rgba(107, 114, 128, 0.2);
	}

	.btn-save:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
	}

	.btn-save.secondary:hover:not(:disabled) {
		box-shadow: 0 8px 20px rgba(107, 114, 128, 0.3);
	}

	.btn-save:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.save-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	/* Loading State */
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
		border-top: 3px solid #3b82f6;
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

	/* Messages */
	.message {
		position: fixed;
		top: 80px;
		right: 1.5rem;
		z-index: 1000;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 500;
		font-size: 0.875rem;
		animation: slideIn 0.3s ease;
		max-width: 400px;
	}

	.message.success {
		background: rgba(220, 252, 231, 0.95);
		color: #166534;
		border: 1px solid #86efac;
	}

	.message.error {
		background: rgba(254, 242, 242, 0.95);
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.message.info {
		background: rgba(239, 246, 255, 0.95);
		color: #1d4ed8;
		border: 1px solid #93c5fd;
	}

	@keyframes slideIn {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.absensi-manager {
			padding: 1rem;
			padding-bottom: 140px; /* Increase bottom padding for mobile */
		}

		.absensi-header {
			padding: 1.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			flex-direction: column;
		}

		.jamaah-sections {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.tab-button {
			flex-direction: column;
			padding: 1rem 0.75rem;
			gap: 0.25rem;
		}

		.tab-button span {
			display: block; /* Show text on mobile */
			font-size: 0.75rem;
			line-height: 1;
		}

		.absensi-content {
			padding: 1rem;
		}

		.sync-section {
			margin-bottom: 1rem;
		}

		.btn-sync-jamaah {
			font-size: 0.8rem;
			padding: 0.75rem 1.25rem;
		}
	}
</style>
