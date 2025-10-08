<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { MasterDataService, PengajianService, DaerahService, DesaService, KelompokService, MasjidService, KategoriService, HadistService, AlQuranService, DapukanService, JamaahService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import {
		Database, Settings, Users, MapPin, Building, BookOpen,
		FileText, Plus, Edit, Trash2, Eye, Shield, AlertCircle,
		ChevronDown, Search, Filter, RefreshCw, Save, X
	} from 'lucide-svelte';

	let isLoading = true;
	let isDataLoading = false;
	let isSaving = false;
	let userRole = 'user';
	let isSuperAdmin = false;
	let selectedTab = 'pengajian';
	let showModal = false;
	let modalMode = 'create'; // 'create', 'edit', 'view'
	let selectedItem = null;
	let formData = {};
	let formErrors = {};
	let message = { type: '', text: '', show: false };
	let searchQuery = '';
	let innerWidth = 0;

	// Data arrays for each master table
	let pengajianList = [];
	let daerahList = [];
	let desaList = [];
	let kelompokList = [];
	let masjidList = [];
	let kategoriList = [];
	let hadistList = [];
	let alquranList = [];
	let dapukanList = [];
	let jamaahList = [];

	// Reactive variables
	$: isDesktop = innerWidth >= 768;
	$: filteredData = filterData(getCurrentData(), searchQuery);

	// Tab configuration with better icons and descriptions
	const tabs = [
		{ id: 'pengajian', label: 'Pengajian', icon: BookOpen, color: 'bg-blue-500', description: 'Kelola data pengajian' },
		{ id: 'daerah', label: 'Daerah', icon: MapPin, color: 'bg-green-500', description: 'Kelola data daerah' },
		{ id: 'desa', label: 'Desa', icon: Building, color: 'bg-orange-500', description: 'Kelola data desa' },
		{ id: 'kelompok', label: 'Kelompok', icon: Users, color: 'bg-purple-500', description: 'Kelola data kelompok' },
		{ id: 'masjid', label: 'Masjid', icon: Building, color: 'bg-indigo-500', description: 'Kelola data masjid' },
		{ id: 'kategori', label: 'Kategori', icon: FileText, color: 'bg-pink-500', description: 'Kelola kategori jamaah' },
		{ id: 'hadist', label: 'Hadist', icon: BookOpen, color: 'bg-yellow-500', description: 'Kelola data hadist' },
		{ id: 'alquran', label: 'Al-Quran', icon: BookOpen, color: 'bg-emerald-500', description: 'Kelola data Al-Quran' },
		{ id: 'dapukan', label: 'Dapukan', icon: Users, color: 'bg-cyan-500', description: 'Kelola data dapukan' },
		{ id: 'jamaah', label: 'Jamaah', icon: Users, color: 'bg-red-500', description: 'Kelola data jamaah' }
	];

	onMount(async () => {
		await checkUserPermission();
		if (isSuperAdmin) {
			await loadData();
		}
		isLoading = false;
	});

	async function checkUserPermission() {
		try {
			userRole = await MasterDataService.getUserRole();
			isSuperAdmin = await MasterDataService.isSuperAdmin();

			if (!isSuperAdmin) {
				showMessage('error', 'Akses ditolak. Halaman ini hanya untuk Super Admin.');
				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
			}
		} catch (error) {
			console.error('Error checking permission:', error);
			showMessage('error', 'Gagal memeriksa permission.');
		}
	}

	async function loadData() {
		isDataLoading = true;
		try {
			switch (selectedTab) {
				case 'pengajian':
					pengajianList = await PengajianService.getAllPengajian();
					break;
				case 'daerah':
					daerahList = await DaerahService.getAllDaerah();
					break;
				case 'desa':
					desaList = await DesaService.getAllDesa();
					break;
				case 'kelompok':
					kelompokList = await KelompokService.getAllKelompok();
					break;
				case 'masjid':
					masjidList = await MasjidService.getAllMasjid();
					break;
				case 'kategori':
					kategoriList = await KategoriService.getAllKategori();
					break;
				case 'hadist':
					hadistList = await HadistService.getAllHadist();
					break;
				case 'alquran':
					alquranList = await AlQuranService.getAllAlQuran();
					break;
				case 'dapukan':
					dapukanList = await DapukanService.getAllDapukan();
					break;
				case 'jamaah':
					jamaahList = await JamaahService.getAllJamaah();
					break;
			}
		} catch (error) {
			console.error('Error loading data:', error);
			showMessage('error', 'Gagal memuat data: ' + error.message);
		} finally {
			isDataLoading = false;
		}
	}

	function handleTabChange(tabId) {
		selectedTab = tabId;
		searchQuery = ''; // Reset search when changing tabs
		loadData();
	}

	function handleAdd() {
		modalMode = 'create';
		selectedItem = null;
		formData = {};
		formErrors = {};
		showModal = true;
	}

	function handleEdit(item) {
		modalMode = 'edit';
		selectedItem = item;
		formData = { ...item };
		formErrors = {};
		showModal = true;
	}

	function handleView(item) {
		modalMode = 'view';
		selectedItem = item;
		formData = { ...item };
		showModal = true;
	}

	async function handleDelete(item) {
		const itemName = getItemName(item);
		if (!confirm(`Apakah Anda yakin ingin menghapus "${itemName}"?\n\nData yang dihapus tidak dapat dikembalikan.`)) {
			return;
		}

		try {
			switch (selectedTab) {
				case 'pengajian':
					await PengajianService.deletePengajian(item.id);
					break;
				case 'daerah':
					await DaerahService.deleteDaerah(item.id);
					break;
				case 'desa':
					await DesaService.deleteDesa(item.id);
					break;
				case 'kelompok':
					await KelompokService.deleteKelompok(item.id);
					break;
				case 'masjid':
					await MasjidService.deleteMasjid(item.id);
					break;
				case 'kategori':
					await KategoriService.deleteKategori(item.id);
					break;
				case 'hadist':
					await HadistService.deleteHadist(item.id);
					break;
				case 'alquran':
					await AlQuranService.deleteAlQuran(item.id);
					break;
				case 'dapukan':
					await DapukanService.deleteDapukan(item.id);
					break;
				case 'jamaah':
					await JamaahService.deleteJamaah(item.id);
					break;
			}

			showMessage('success', `"${itemName}" berhasil dihapus`);
			await loadData();
		} catch (error) {
			console.error('Error deleting item:', error);
			showMessage('error', 'Gagal menghapus data: ' + error.message);
		}
	}

	async function handleSave() {
		// Validate form
		if (!validateForm()) {
			return;
		}

		isSaving = true;
		try {
			if (modalMode === 'create') {
				switch (selectedTab) {
					case 'pengajian':
						await PengajianService.createPengajian(formData);
						break;
					case 'daerah':
						await DaerahService.createDaerah(formData);
						break;
					case 'desa':
						await DesaService.createDesa(formData);
						break;
					case 'kelompok':
						await KelompokService.createKelompok(formData);
						break;
					case 'masjid':
						await MasjidService.createMasjid(formData);
						break;
					case 'kategori':
						await KategoriService.createKategori(formData);
						break;
					case 'hadist':
						await HadistService.createHadist(formData);
						break;
					case 'alquran':
						await AlQuranService.createAlQuran(formData);
						break;
					case 'dapukan':
						await DapukanService.createDapukan(formData);
						break;
					case 'jamaah':
						await JamaahService.createJamaah(formData);
						break;
				}
				showMessage('success', 'Data berhasil ditambahkan');
			} else if (modalMode === 'edit') {
				switch (selectedTab) {
					case 'pengajian':
						await PengajianService.updatePengajian(selectedItem.id, formData);
						break;
					case 'daerah':
						await DaerahService.updateDaerah(selectedItem.id, formData);
						break;
					case 'desa':
						await DesaService.updateDesa(selectedItem.id, formData);
						break;
					case 'kelompok':
						await KelompokService.updateKelompok(selectedItem.id, formData);
						break;
					case 'masjid':
						await MasjidService.updateMasjid(selectedItem.id, formData);
						break;
					case 'kategori':
						await KategoriService.updateKategori(selectedItem.id, formData);
						break;
					case 'hadist':
						await HadistService.updateHadist(selectedItem.id, formData);
						break;
					case 'alquran':
						await AlQuranService.updateAlQuran(selectedItem.id, formData);
						break;
					case 'dapukan':
						await DapukanService.updateDapukan(selectedItem.id, formData);
						break;
					case 'jamaah':
						await JamaahService.updateJamaah(selectedItem.id, formData);
						break;
				}
				showMessage('success', 'Data berhasil diperbarui');
			}

			showModal = false;
			await loadData();
		} catch (error) {
			console.error('Error saving data:', error);
			showMessage('error', 'Gagal menyimpan data: ' + error.message);
		} finally {
			isSaving = false;
		}
	}

	function validateForm() {
		formErrors = {};
		let isValid = true;

		switch (selectedTab) {
			case 'pengajian':
				if (!formData.nama_pengajian?.trim()) {
					formErrors.nama_pengajian = 'Nama pengajian wajib diisi';
					isValid = false;
				}
				break;
			case 'daerah':
				if (!formData.nama_daerah?.trim()) {
					formErrors.nama_daerah = 'Nama daerah wajib diisi';
					isValid = false;
				}
				break;
			case 'desa':
				if (!formData.nama_desa?.trim()) {
					formErrors.nama_desa = 'Nama desa wajib diisi';
					isValid = false;
				}
				break;
			case 'kategori':
				if (!formData.category?.trim()) {
					formErrors.category = 'Kategori wajib diisi';
					isValid = false;
				}
				break;
			case 'hadist':
				if (!formData.nama_hadist?.trim()) {
					formErrors.nama_hadist = 'Nama hadist wajib diisi';
					isValid = false;
				}
				if (!formData.jumlah_halaman || formData.jumlah_halaman < 1) {
					formErrors.jumlah_halaman = 'Jumlah halaman harus lebih dari 0';
					isValid = false;
				}
				break;
			case 'alquran':
				if (!formData.nama_surat?.trim()) {
					formErrors.nama_surat = 'Nama surat wajib diisi';
					isValid = false;
				}
				if (!formData.juz || formData.juz < 1 || formData.juz > 30) {
					formErrors.juz = 'Juz harus antara 1-30';
					isValid = false;
				}
				if (!formData.jumlah_ayat || formData.jumlah_ayat < 1) {
					formErrors.jumlah_ayat = 'Jumlah ayat harus lebih dari 0';
					isValid = false;
				}
				break;
			case 'dapukan':
				if (!formData.nama_dapukan?.trim()) {
					formErrors.nama_dapukan = 'Nama dapukan wajib diisi';
					isValid = false;
				}
				break;
		}

		return isValid;
	}

	function filterData(data, query) {
		if (!query.trim()) return data;
		
		const searchTerm = query.toLowerCase();
		return data.filter(item => {
			const itemName = getItemName(item).toLowerCase();
			return itemName.includes(searchTerm);
		});
	}

	function getItemName(item) {
		switch (selectedTab) {
			case 'pengajian': return item.nama_pengajian || '';
			case 'daerah': return item.nama_daerah || '';
			case 'desa': return item.nama_desa || '';
			case 'kelompok': return item.nama_kelompok || '';
			case 'masjid': return item.nama_masjid || '';
			case 'kategori': return item.category || '';
			case 'hadist': return item.nama_hadist || '';
			case 'alquran': return item.nama_surat || '';
			case 'dapukan': return item.nama_dapukan || '';
			case 'jamaah': return item.nama || '';
			default: return '';
		}
	}

	function getCurrentData() {
		switch (selectedTab) {
			case 'pengajian': return pengajianList;
			case 'daerah': return daerahList;
			case 'desa': return desaList;
			case 'kelompok': return kelompokList;
			case 'masjid': return masjidList;
			case 'kategori': return kategoriList;
			case 'hadist': return hadistList;
			case 'alquran': return alquranList;
			case 'dapukan': return dapukanList;
			case 'jamaah': return jamaahList;
			default: return [];
		}
	}

	function showMessage(type, text) {
		message = { type, text, show: true };
		setTimeout(() => {
			message.show = false;
		}, 3000);
	}

	function handleRefresh() {
		loadData();
	}

	function handleCloseModal() {
		showModal = false;
		formData = {};
		formErrors = {};
	}
</script>

<svelte:head>
	<title>Master Data - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader title="Master Data" showBack={true} />

{#if message.show}
	<div class="message {message.type}" class:desktop={isDesktop}>
		<div class="message-content">
			<AlertCircle size={20} />
			<span>{message.text}</span>
		</div>
	</div>
{/if}

{#if isLoading}
	<div class="loading-container">
		<div class="loading-content">
			<div class="spinner"></div>
			<p class="loading-text">Memuat data master...</p>
		</div>
	</div>
{:else if !isSuperAdmin}
	<div class="access-denied">
		<div class="access-content">
			<Shield size={80} class="access-icon" />
			<h2>Akses Ditolak</h2>
			<p>Halaman ini hanya dapat diakses oleh Super Admin.</p>
			<p class="access-subtitle">Silakan hubungi administrator untuk mendapatkan akses.</p>
		</div>
	</div>
{:else}
	<main class="app-content" class:desktop={isDesktop}>
		<!-- Tab Navigation -->
		<div class="tab-navigation" class:desktop={isDesktop}>
			<div class="tab-container">
				{#each tabs as tab}
					<button
						class="tab-button"
						class:active={selectedTab === tab.id}
						class:desktop={isDesktop}
						on:click={() => handleTabChange(tab.id)}
						title={tab.description}
					>
						<div class="tab-icon {tab.color}">
							<svelte:component this={tab.icon} size={18} />
						</div>
						<span class="tab-label">{tab.label}</span>
						{#if selectedTab === tab.id}
							<div class="tab-indicator"></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Content Area -->
		<div class="content-area" class:desktop={isDesktop}>
			<!-- Header with Search and Actions -->
			<div class="content-header">
				<div class="header-left">
					<div class="header-info">
						<h1>{tabs.find(t => t.id === selectedTab)?.label || 'Master Data'}</h1>
						<p class="header-description">{tabs.find(t => t.id === selectedTab)?.description}</p>
						<div class="data-stats">
							<span class="data-count">{filteredData.length} dari {getCurrentData().length} data</span>
							{#if searchQuery}
								<span class="search-info">• Hasil pencarian: "{searchQuery}"</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="header-actions">
					<div class="search-container">
						<Search size={18} class="search-icon" />
						<input
							type="text"
							placeholder="Cari data..."
							bind:value={searchQuery}
							class="search-input"
						/>
						{#if searchQuery}
							<button class="clear-search" on:click={() => searchQuery = ''}>
								<X size={16} />
							</button>
						{/if}
					</div>
					<button class="action-btn refresh" on:click={handleRefresh} disabled={isDataLoading} title="Refresh Data">
						<RefreshCw size={18} class:spin={isDataLoading} />
					</button>
					<button class="action-btn primary" on:click={handleAdd}>
						<Plus size={18} />
						<span>Tambah</span>
					</button>
				</div>
			</div>

			<!-- Data Table -->
			<div class="data-table" class:desktop={isDesktop}>
				{#if isDataLoading}
					<div class="loading-state">
						<div class="loading-spinner"></div>
						<p>Memuat data...</p>
					</div>
				{:else if filteredData.length === 0}
					<div class="empty-state">
						{#if searchQuery}
							<Search size={64} class="empty-icon" />
							<h3>Tidak ada hasil</h3>
							<p>Tidak ditemukan data yang cocok dengan pencarian "{searchQuery}"</p>
							<button class="clear-search-btn" on:click={() => searchQuery = ''}>
								Hapus Filter
							</button>
						{:else}
							<Database size={64} class="empty-icon" />
							<h3>Belum ada data</h3>
							<p>Klik tombol "Tambah" untuk menambahkan data baru</p>
							<button class="add-first-btn" on:click={handleAdd}>
								<Plus size={18} />
								Tambah Data Pertama
							</button>
						{/if}
					</div>
				{:else}
					<div class="table-container">
						<table class="data-table-grid">
							<thead>
								<tr>
									<th class="col-number">No</th>
									<th class="col-name">Nama</th>
									{#if selectedTab === 'kategori'}
										<th>Group</th>
									{/if}
									{#if selectedTab === 'kelompok'}
										<th>Desa</th>
										<th>Daerah</th>
									{/if}
									{#if selectedTab === 'masjid'}
										<th>Kelompok</th>
									{/if}
									{#if selectedTab === 'hadist'}
										<th>Halaman</th>
									{/if}
									{#if selectedTab === 'alquran'}
										<th>Juz</th>
										<th>Ayat</th>
									{/if}
									{#if selectedTab === 'jamaah'}
										<th>JK</th>
										<th>Kelompok</th>
									{/if}
									<th class="col-actions">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredData as item, index}
									<tr class="table-row">
										<td class="col-number">{index + 1}</td>
										<td class="col-name">
											<div class="name-cell">
												<span class="name-text">{getItemName(item)}</span>
												{#if item.created_at}
													<span class="name-meta">Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
												{/if}
											</div>
										</td>
										{#if selectedTab === 'kategori'}
											<td>
												<span class="badge secondary">{item.group || '-'}</span>
											</td>
										{/if}
										{#if selectedTab === 'kelompok'}
											<td>{item.mdesa?.nama_desa || '-'}</td>
											<td>{item.mdaerah?.nama_daerah || '-'}</td>
										{/if}
										{#if selectedTab === 'masjid'}
											<td>{item.mkelompok?.nama_kelompok || '-'}</td>
										{/if}
										{#if selectedTab === 'hadist'}
											<td>
												<span class="badge info">{item.jumlah_halaman} hal</span>
											</td>
										{/if}
										{#if selectedTab === 'alquran'}
											<td>
												<span class="badge primary">Juz {item.juz}</span>
											</td>
											<td>
												<span class="badge success">{item.jumlah_ayat} ayat</span>
											</td>
										{/if}
										{#if selectedTab === 'jamaah'}
											<td>
												<span class="badge {item.jk === 'L' ? 'primary' : 'secondary'}">{item.jk}</span>
											</td>
											<td>{item.mkelompok?.nama_kelompok || '-'}</td>
										{/if}
										<td class="col-actions">
											<div class="action-buttons">
												<button class="action-btn view" on:click={() => handleView(item)} title="Lihat Detail">
													<Eye size={14} />
												</button>
												<button class="action-btn edit" on:click={() => handleEdit(item)} title="Edit Data">
													<Edit size={14} />
												</button>
												<button class="action-btn delete" on:click={() => handleDelete(item)} title="Hapus Data">
													<Trash2 size={14} />
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</main>
{/if}

<BottomNav />

<style>
	/* ... */
</style>

<AppHeader title="Master Data" showBack={true} />

{#if message.show}
	<div class="message {message.type}">
		<AlertCircle size={16} />
		<span>{message.text}</span>
	</div>
{/if}

{#if isLoading}
	<div class="loading-container">
		<div class="loading-content">
			<div class="spinner"></div>
			<p class="loading-text">Memuat data master...</p>
		</div>
	</div>
{:else if !isSuperAdmin}
	<div class="access-denied">
		<Shield size={64} class="access-icon" />
		<h2>Akses Ditolak</h2>
		<p>Halaman ini hanya dapat diakses oleh Super Admin.</p>
	</div>
{:else}
	<main class="app-content">
		<!-- Tab Navigation -->
		<div class="tab-navigation">
			<div class="tab-container">
				{#each tabs as tab}
					<button
						class="tab-button"
						class:active={selectedTab === tab.id}
						on:click={() => handleTabChange(tab.id)}
					>
						<svelte:component this={tab.icon} size={16} />
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Content Area -->
		{#if selectedTab === 'pengajian'}
			<Pengajian />
		{:else if selectedTab === 'daerah'}
			<Daerah />
		{:else if selectedTab === 'desa'}
			<Desa />
		{:else if selectedTab === 'kelompok'}
			<Kelompok />
		{:else if selectedTab === 'masjid'}
			<Masjid />
		{:else if selectedTab === 'kategori'}
			<Kategori />
		{:else if selectedTab === 'hadist'}
			<Hadist />
		{:else if selectedTab === 'alquran'}
			<AlQuran />
		{:else}
			<div class="content-area">
				<!-- Header with Add Button -->
				<div class="content-header">
					<div class="header-info">
						<h1>{tabs.find(t => t.id === selectedTab)?.label || 'Master Data'}</h1>
						<p class="data-count">{getCurrentData().length} data</p>
					</div>
					<button class="add-button" on:click={handleAdd}>
						<Plus size={16} />
						<span>Tambah</span>
					</button>
				</div>

				<!-- Data Table -->
				<div class="data-table">
					{#if getCurrentData().length === 0}
						<div class="empty-state">
							<Database size={48} class="empty-icon" />
							<h3>Belum ada data</h3>
							<p>Klik tombol "Tambah" untuk menambahkan data baru.</p>
						</div>
					{:else}
						<div class="table-container">
							<table>
								<thead>
									<tr>
										<th>No</th>
										<th>Nama</th>
										{#if selectedTab === 'jamaah'}
											<th>JK</th>
											<th>Kelompok</th>
										{/if}
										<th>Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each getCurrentData() as item, index}
										<tr>
											<td>{index + 1}</td>
											<td class="name-cell">{getItemName(item)}</td>
											{#if selectedTab === 'jamaah'}
												<td>{item.jk}</td>
												<td>{item.mkelompok?.nama_kelompok || '-'}</td>
											{/if}
											<td class="action-cell">
												<button class="action-btn view" on:click={() => handleView(item)}>
													<Eye size={14} />
												</button>
												<button class="action-btn edit" on:click={() => handleEdit(item)}>
													<Edit size={14} />
												</button>
												<button class="action-btn delete" on:click={() => handleDelete(item)}>
													<Trash2 size={14} />
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</main>
{/if}

<!-- Modal for Create/Edit/View -->
{#if showModal}
	<div class="modal-overlay" on:click={() => showModal = false}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					{modalMode === 'create' ? 'Tambah' : modalMode === 'edit' ? 'Edit' : 'Detail'}
					{tabs.find(t => t.id === selectedTab)?.label}
				</h2>
				<button class="close-button" on:click={() => showModal = false}>×</button>
			</div>

			<div class="modal-body">
				<!-- Form fields based on selected tab -->
				{#if selectedTab === 'dapukan'}
					<div class="form-group">
						<label>Nama Dapukan</label>
						<input
							type="text"
							bind:value={formData.nama_dapukan}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama dapukan"
						/>
					</div>
					<div class="form-group">
						<label>Deskripsi</label>
						<textarea
							bind:value={formData.deskripsi}
							disabled={modalMode === 'view'}
							placeholder="Masukkan deskripsi dapukan"
						></textarea>
					</div>
				{/if}
			</div>

			{#if modalMode !== 'view'}
				<div class="modal-footer">
					<button class="cancel-button" on:click={() => showModal = false}>
						Batal
					</button>
					<button class="save-button" on:click={handleSave}>
						{modalMode === 'create' ? 'Simpan' : 'Update'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<BottomNav />

<style>
	.app-content {
		min-height: calc(100vh - 64px);
		background: #f8fafc;
		padding-bottom: 80px;
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		margin: 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.message.success {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.message.error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
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

	.access-denied {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: 2rem;
		text-align: center;
	}

	.access-icon {
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.tab-navigation {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		overflow-x: auto;
	}

	.tab-container {
		display: flex;
		padding: 0 1rem;
		min-width: max-content;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border: none;
		background: transparent;
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.tab-button:hover {
		color: #374151;
		background: #f9fafb;
	}

	.tab-button.active {
		color: #0ea5e9;
		border-bottom-color: #0ea5e9;
		background: #f0f9ff;
	}

	.content-area {
		padding: 1.5rem;
	}

	.content-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header-info h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}

	.data-count {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	.data-table {
		background: white;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		text-align: center;
	}

	.empty-icon {
		color: #d1d5db;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.empty-state p {
		color: #6b7280;
		margin: 0;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #f3f4f6;
	}

	th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	td {
		font-size: 0.875rem;
		color: #111827;
	}

	.name-cell {
		font-weight: 500;
	}

	.action-cell {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn.view {
		background: #f3f4f6;
		color: #6b7280;
	}

	.action-btn.view:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.action-btn.edit {
		background: #fef3c7;
		color: #d97706;
	}

	.action-btn.edit:hover {
		background: #fde68a;
		color: #b45309;
	}

	.action-btn.delete {
		background: #fee2e2;
		color: #dc2626;
	}

	.action-btn.delete:hover {
		background: #fecaca;
		color: #b91c1c;
	}

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
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.close-button {
		padding: 0.5rem;
		border: none;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
	}

	.close-button:hover {
		color: #374151;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #111827;
		background: white;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.form-group input:disabled,
	.form-group textarea:disabled,
	.form-group select:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.cancel-button {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-button:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.save-button {
		flex: 1;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-button:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		.content-area {
			padding: 1rem;
		}

		.content-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.add-button {
			justify-content: center;
		}

		.modal-content {
			margin: 0;
			border-radius: 0;
			max-height: 100vh;
		}
	}
</style>


<AppHeader title="Master Data" showBack={true} />

{#if message.show}
	<div class="message {message.type}">
		<AlertCircle size={16} />
		<span>{message.text}</span>
	</div>
{/if}

{#if isLoading}
	<div class="loading-container">
		<div class="loading-content">
			<div class="spinner"></div>
			<p class="loading-text">Memuat data master...</p>
		</div>
	</div>
{:else if !isSuperAdmin}
	<div class="access-denied">
		<Shield size={64} class="access-icon" />
		<h2>Akses Ditolak</h2>
		<p>Halaman ini hanya dapat diakses oleh Super Admin.</p>
	</div>
{:else}
	<main class="app-content">
		<!-- Tab Navigation -->
		<div class="tab-navigation">
			<div class="tab-container">
				{#each tabs as tab}
					<button
						class="tab-button"
						class:active={selectedTab === tab.id}
						on:click={() => handleTabChange(tab.id)}
					>
						<svelte:component this={tab.icon} size={16} />
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Content Area -->
		{#if selectedTab === 'pengajian'}
			<Pengajian />
		{:else if selectedTab === 'daerah'}
			<Daerah />
		{:else if selectedTab === 'desa'}
			<Desa />
		{:else if selectedTab === 'kelompok'}
			<Kelompok />
		{:else if selectedTab === 'masjid'}
			<Masjid />
		{:else if selectedTab === 'kategori'}
			<Kategori />
		{:else if selectedTab === 'hadist'}
			<Hadist />
		{:else if selectedTab === 'alquran'}
			<AlQuran />
		{:else if selectedTab === 'dapukan'}
			<Dapukan />
		{:else}
			<div class="content-area">
				<!-- Header with Add Button -->
				<div class="content-header">
					<div class="header-info">
						<h1>{tabs.find(t => t.id === selectedTab)?.label || 'Master Data'}</h1>
						<p class="data-count">{getCurrentData().length} data</p>
					</div>
					<button class="add-button" on:click={handleAdd}>
						<Plus size={16} />
						<span>Tambah</span>
					</button>
				</div>

				<!-- Data Table -->
				<div class="data-table">
					{#if getCurrentData().length === 0}
						<div class="empty-state">
							<Database size={48} class="empty-icon" />
							<h3>Belum ada data</h3>
							<p>Klik tombol "Tambah" untuk menambahkan data baru.</p>
						</div>
					{:else}
						<div class="table-container">
							<table>
								<thead>
									<tr>
										<th>No</th>
										<th>Nama</th>
										{#if selectedTab === 'jamaah'}
											<th>JK</th>
											<th>Kelompok</th>
										{/if}
										<th>Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each getCurrentData() as item, index}
										<tr>
											<td>{index + 1}</td>
											<td class="name-cell">{getItemName(item)}</td>
											{#if selectedTab === 'jamaah'}
												<td>{item.jk}</td>
												<td>{item.mkelompok?.nama_kelompok || '-'}</td>
											{/if}
											<td class="action-cell">
												<button class="action-btn view" on:click={() => handleView(item)}>
													<Eye size={14} />
												</button>
												<button class="action-btn edit" on:click={() => handleEdit(item)}>
													<Edit size={14} />
												</button>
												<button class="action-btn delete" on:click={() => handleDelete(item)}>
													<Trash2 size={14} />
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</main>
{/if}

<!-- Modal for Create/Edit/View -->
{#if showModal}
	<div class="modal-overlay" on:click={() => showModal = false}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					{modalMode === 'create' ? 'Tambah' : modalMode === 'edit' ? 'Edit' : 'Detail'}
					{tabs.find(t => t.id === selectedTab)?.label}
				</h2>
				<button class="close-button" on:click={() => showModal = false}>×</button>
			</div>

			<div class="modal-body">
				<!-- Form fields based on selected tab -->
				{#if selectedTab === 'hadist'}
					<div class="form-group">
						<label>Nama Hadist</label>
						<input
							type="text"
							bind:value={formData.nama_hadist}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama hadist"
						/>
					</div>
					<div class="form-group">
						<label>Jumlah Halaman</label>
						<input
							type="number"
							bind:value={formData.jumlah_halaman}
							disabled={modalMode === 'view'}
							placeholder="Masukkan jumlah halaman"
						/>
					</div>
				{:else if selectedTab === 'alquran'}
					<div class="form-group">
						<label>Nama Surat</label>
						<input
							type="text"
							bind:value={formData.nama_surat}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama surat"
						/>
					</div>
					<div class="form-group">
						<label>Juz</label>
						<input
							type="number"
							bind:value={formData.juz}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nomor juz"
						/>
					</div>
					<div class="form-group">
						<label>Jumlah Ayat</label>
						<input
							type="number"
							bind:value={formData.jumlah_ayat}
							disabled={modalMode === 'view'}
							placeholder="Masukkan jumlah ayat"
						/>
					</div>
				{:else if selectedTab === 'dapukan'}
					<div class="form-group">
						<label>Nama Dapukan</label>
						<input
							type="text"
							bind:value={formData.nama_dapukan}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama dapukan"
						/>
					</div>
					<div class="form-group">
						<label>Deskripsi</label>
						<textarea
							bind:value={formData.deskripsi}
							disabled={modalMode === 'view'}
							placeholder="Masukkan deskripsi dapukan"
						></textarea>
					</div>
				{/if}
			</div>

			{#if modalMode !== 'view'}
				<div class="modal-footer">
					<button class="cancel-button" on:click={() => showModal = false}>
						Batal
					</button>
					<button class="save-button" on:click={handleSave}>
						{modalMode === 'create' ? 'Simpan' : 'Update'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<BottomNav />

<style>
	.app-content {
		min-height: calc(100vh - 64px);
		background: #f8fafc;
		padding-bottom: 80px;
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		margin: 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.message.success {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.message.error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
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

	.access-denied {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: 2rem;
		text-align: center;
	}

	.access-icon {
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.tab-navigation {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		overflow-x: auto;
	}

	.tab-container {
		display: flex;
		padding: 0 1rem;
		min-width: max-content;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border: none;
		background: transparent;
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.tab-button:hover {
		color: #374151;
		background: #f9fafb;
	}

	.tab-button.active {
		color: #0ea5e9;
		border-bottom-color: #0ea5e9;
		background: #f0f9ff;
	}

	.content-area {
		padding: 1.5rem;
	}

	.content-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header-info h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}

	.data-count {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	.data-table {
		background: white;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		text-align: center;
	}

	.empty-icon {
		color: #d1d5db;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.empty-state p {
		color: #6b7280;
		margin: 0;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #f3f4f6;
	}

	th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	td {
		font-size: 0.875rem;
		color: #111827;
	}

	.name-cell {
		font-weight: 500;
	}

	.action-cell {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn.view {
		background: #f3f4f6;
		color: #6b7280;
	}

	.action-btn.view:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.action-btn.edit {
		background: #fef3c7;
		color: #d97706;
	}

	.action-btn.edit:hover {
		background: #fde68a;
		color: #b45309;
	}

	.action-btn.delete {
		background: #fee2e2;
		color: #dc2626;
	}

	.action-btn.delete:hover {
		background: #fecaca;
		color: #b91c1c;
	}

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
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.close-button {
		padding: 0.5rem;
		border: none;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
	}

	.close-button:hover {
		color: #374151;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #111827;
		background: white;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.form-group input:disabled,
	.form-group textarea:disabled,
	.form-group select:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.cancel-button {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-button:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.save-button {
		flex: 1;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-button:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		.content-area {
			padding: 1rem;
		}

		.content-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.add-button {
			justify-content: center;
		}

		.modal-content {
			margin: 0;
			border-radius: 0;
			max-height: 100vh;
		}
	}
</style>


<AppHeader title="Master Data" showBack={true} />

{#if message.show}
	<div class="message {message.type}">
		<AlertCircle size={16} />
		<span>{message.text}</span>
	</div>
{/if}

{#if isLoading}
	<div class="loading-container">
		<div class="loading-content">
			<div class="spinner"></div>
			<p class="loading-text">Memuat data master...</p>
		</div>
	</div>
{:else if !isSuperAdmin}
	<div class="access-denied">
		<Shield size={64} class="access-icon" />
		<h2>Akses Ditolak</h2>
		<p>Halaman ini hanya dapat diakses oleh Super Admin.</p>
	</div>
{:else}
	<main class="app-content">
		<!-- Tab Navigation -->
		<div class="tab-navigation">
			<div class="tab-container">
				{#each tabs as tab}
					<button
						class="tab-button"
						class:active={selectedTab === tab.id}
						on:click={() => handleTabChange(tab.id)}
					>
						<svelte:component this={tab.icon} size={16} />
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Content Area -->
		{#if selectedTab === 'pengajian'}
			<Pengajian />
		{:else if selectedTab === 'daerah'}
			<Daerah />
		{:else if selectedTab === 'desa'}
			<Desa />
		{:else if selectedTab === 'kelompok'}
			<Kelompok />
		{:else if selectedTab === 'masjid'}
			<Masjid />
		{:else}
			<div class="content-area">
				<!-- Header with Add Button -->
				<div class="content-header">
					<div class="header-info">
						<h1>{tabs.find(t => t.id === selectedTab)?.label || 'Master Data'}</h1>
						<p class="data-count">{getCurrentData().length} data</p>
					</div>
					<button class="add-button" on:click={handleAdd}>
						<Plus size={16} />
						<span>Tambah</span>
					</button>
				</div>

				<!-- Data Table -->
				<div class="data-table">
					{#if getCurrentData().length === 0}
						<div class="empty-state">
							<Database size={48} class="empty-icon" />
							<h3>Belum ada data</h3>
							<p>Klik tombol "Tambah" untuk menambahkan data baru.</p>
						</div>
					{:else}
						<div class="table-container">
							<table>
								<thead>
									<tr>
										<th>No</th>
										<th>Nama</th>
										{#if selectedTab === 'kategori'}
											<th>Group</th>
										{/if}
										{#if selectedTab === 'hadist' || selectedTab === 'alquran'}
											<th>Jumlah</th>
										{/if}
										{#if selectedTab === 'jamaah'}
											<th>JK</th>
											<th>Kelompok</th>
										{/if}
										<th>Aksi</th>
									</tr>
								</thead>
								<tbody>
									{#each getCurrentData() as item, index}
										<tr>
											<td>{index + 1}</td>
											<td class="name-cell">{getItemName(item)}</td>
											{#if selectedTab === 'kategori'}
												<td>{item.group || '-'}</td>
											{/if}
											{#if selectedTab === 'hadist'}
												<td>{item.jumlah_halaman} hal</td>
											{/if}
											{#if selectedTab === 'alquran'}
												<td>{item.jumlah_ayat} ayat</td>
											{/if}
											{#if selectedTab === 'jamaah'}
												<td>{item.jk}</td>
												<td>{item.mkelompok?.nama_kelompok || '-'}</td>
											{/if}
											<td class="action-cell">
												<button class="action-btn view" on:click={() => handleView(item)}>
													<Eye size={14} />
												</button>
												<button class="action-btn edit" on:click={() => handleEdit(item)}>
													<Edit size={14} />
												</button>
												<button class="action-btn delete" on:click={() => handleDelete(item)}>
													<Trash2 size={14} />
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</main>
{/if}

<!-- Modal for Create/Edit/View -->
{#if showModal}
	<div class="modal-overlay" on:click={() => showModal = false}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					{modalMode === 'create' ? 'Tambah' : modalMode === 'edit' ? 'Edit' : 'Detail'}
					{tabs.find(t => t.id === selectedTab)?.label}
				</h2>
				<button class="close-button" on:click={() => showModal = false}>×</button>
			</div>

			<div class="modal-body">
				<!-- Form fields based on selected tab -->
				{#if selectedTab === 'masjid'}
					<div class="form-group">
						<label>Nama Masjid</label>
						<input
							type="text"
							bind:value={formData.nama_masjid}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama masjid"
						/>
					</div>
				{:else if selectedTab === 'kategori'}
					<div class="form-group">
						<label>Kategori</label>
						<input
							type="text"
							bind:value={formData.category}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama kategori"
						/>
					</div>
					<div class="form-group">
						<label>Group</label>
						<input
							type="text"
							bind:value={formData.group}
							disabled={modalMode === 'view'}
							placeholder="Masukkan group kategori"
						/>
					</div>
				{:else if selectedTab === 'hadist'}
					<div class="form-group">
						<label>Nama Hadist</label>
						<input
							type="text"
							bind:value={formData.nama_hadist}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama hadist"
						/>
					</div>
					<div class="form-group">
						<label>Jumlah Halaman</label>
						<input
							type="number"
							bind:value={formData.jumlah_halaman}
							disabled={modalMode === 'view'}
							placeholder="Masukkan jumlah halaman"
						/>
					</div>
				{:else if selectedTab === 'alquran'}
					<div class="form-group">
						<label>Nama Surat</label>
						<input
							type="text"
							bind:value={formData.nama_surat}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama surat"
						/>
					</div>
					<div class="form-group">
						<label>Juz</label>
						<input
							type="number"
							bind:value={formData.juz}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nomor juz"
						/>
					</div>
					<div class="form-group">
						<label>Jumlah Ayat</label>
						<input
							type="number"
							bind:value={formData.jumlah_ayat}
							disabled={modalMode === 'view'}
							placeholder="Masukkan jumlah ayat"
						/>
					</div>
				{:else if selectedTab === 'dapukan'}
					<div class="form-group">
						<label>Nama Dapukan</label>
						<input
							type="text"
							bind:value={formData.nama_dapukan}
							disabled={modalMode === 'view'}
							placeholder="Masukkan nama dapukan"
						/>
					</div>
					<div class="form-group">
						<label>Deskripsi</label>
						<textarea
							bind:value={formData.deskripsi}
							disabled={modalMode === 'view'}
							placeholder="Masukkan deskripsi dapukan"
						></textarea>
					</div>
				{/if}
			</div>

			{#if modalMode !== 'view'}
				<div class="modal-footer">
					<button class="cancel-button" on:click={() => showModal = false}>
						Batal
					</button>
					<button class="save-button" on:click={handleSave}>
						{modalMode === 'create' ? 'Simpan' : 'Update'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<BottomNav />

<style>
	.app-content {
		min-height: calc(100vh - 64px);
		background: #f8fafc;
		padding-bottom: 80px;
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		margin: 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.message.success {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.message.error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
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

	.access-denied {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: 2rem;
		text-align: center;
	}

	.access-icon {
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.tab-navigation {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		overflow-x: auto;
	}

	.tab-container {
		display: flex;
		padding: 0 1rem;
		min-width: max-content;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		border: none;
		background: transparent;
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.tab-button:hover {
		color: #374151;
		background: #f9fafb;
	}

	.tab-button.active {
		color: #0ea5e9;
		border-bottom-color: #0ea5e9;
		background: #f0f9ff;
	}

	.content-area {
		padding: 1.5rem;
	}

	.content-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header-info h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}

	.data-count {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.add-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	.data-table {
		background: white;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		text-align: center;
	}

	.empty-icon {
		color: #d1d5db;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.empty-state p {
		color: #6b7280;
		margin: 0;
	}

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #f3f4f6;
	}

	th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	td {
		font-size: 0.875rem;
		color: #111827;
	}

	.name-cell {
		font-weight: 500;
	}

	.action-cell {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn.view {
		background: #f3f4f6;
		color: #6b7280;
	}

	.action-btn.view:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.action-btn.edit {
		background: #fef3c7;
		color: #d97706;
	}

	.action-btn.edit:hover {
		background: #fde68a;
		color: #b45309;
	}

	.action-btn.delete {
		background: #fee2e2;
		color: #dc2626;
	}

	.action-btn.delete:hover {
		background: #fecaca;
		color: #b91c1c;
	}

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
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.close-button {
		padding: 0.5rem;
		border: none;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
	}

	.close-button:hover {
		color: #374151;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #111827;
		background: white;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	.form-group input:disabled,
	.form-group textarea:disabled,
	.form-group select:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.cancel-button {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-button:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.save-button {
		flex: 1;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-button:hover {
		box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		.content-area {
			padding: 1rem;
		}

		.content-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.add-button {
			justify-content: center;
		}

		.modal-content {
			margin: 0;
			border-radius: 0;
			max-height: 100vh;
		}
	}
</style>
