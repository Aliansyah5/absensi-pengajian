<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { MasterDataService, PengajianService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import {
		Plus, Edit, Trash2, Eye, Search, RefreshCw, Save, X, ArrowLeft, BookOpen
	} from 'lucide-svelte';

	let isLoading = true;
	let isDataLoading = false;
	let isSaving = false;
	let isSuperAdmin = false;
	let showModal = false;
	let modalMode = 'create';
	let selectedItem = null;
	let formData = {};
	let formErrors = {};
	let message = { type: '', text: '', show: false };
	let searchQuery = '';

	let dataList = [];
	let filteredData = [];

	$: filteredData = filterData(dataList, searchQuery);

	onMount(async () => {
		await checkUserPermission();
		if (isSuperAdmin) {
			await loadData();
		}
		isLoading = false;
	});

	async function checkUserPermission() {
		try {
			isSuperAdmin = await MasterDataService.isSuperAdmin();
			if (!isSuperAdmin) {
				showMessage('error', 'Akses ditolak. Halaman ini hanya untuk Super Admin.');
				setTimeout(() => goto('/dashboard'), 2000);
			}
		} catch (error) {
			console.error('Error checking permission:', error);
			showMessage('error', 'Gagal memeriksa permission.');
		}
	}

	async function loadData() {
		isDataLoading = true;
		try {
			dataList = await PengajianService.getAllPengajian();
			console.log('Pengajian data loaded:', dataList);
		} catch (error) {
			console.error('Error loading data:', error);
			dataList = [];
			showMessage('error', 'Gagal memuat data');
		} finally {
			isDataLoading = false;
		}
	}

	function filterData(data, query) {
		if (!query.trim()) return data;
		const lowerQuery = query.toLowerCase();
		return data.filter(item =>
			item.nama?.toLowerCase().includes(lowerQuery) ||
			item.alamat?.toLowerCase().includes(lowerQuery) ||
			item.keterangan?.toLowerCase().includes(lowerQuery)
		);
	}

	function openModal(mode, item = null) {
		modalMode = mode;
		selectedItem = item;
		formErrors = {};

		if (mode === 'create') {
			formData = {
				nama: '',
				alamat: '',
				keterangan: '',
				active: 1
			};
		} else {
			formData = { ...item };
		}

		showModal = true;
	}

	function closeModal() {
		showModal = false;
		formData = {};
		formErrors = {};
		selectedItem = null;
	}

	function validateForm() {
		formErrors = {};

		if (!formData.nama?.trim()) {
			formErrors.nama = 'Nama pengajian wajib diisi';
		}

		return Object.keys(formErrors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			showMessage('error', 'Mohon lengkapi form dengan benar');
			return;
		}

		isSaving = true;
		try {
			if (modalMode === 'create') {
				await PengajianService.createPengajian(formData);
				showMessage('success', 'Data pengajian berhasil ditambahkan');
			} else {
				await PengajianService.updatePengajian(formData.id, formData);
				showMessage('success', 'Data pengajian berhasil diperbarui');
			}

			closeModal();
			await loadData();
		} catch (error) {
			console.error('Error saving data:', error);
			showMessage('error', `Gagal menyimpan data: ${error.message}`);
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete(item) {
		if (!confirm(`Apakah Anda yakin ingin menghapus "${item.nama}"?`)) {
			return;
		}

		try {
			await PengajianService.deletePengajian(item.id);
			showMessage('success', 'Data pengajian berhasil dihapus');
			await loadData();
		} catch (error) {
			console.error('Error deleting data:', error);
			showMessage('error', `Gagal menghapus data: ${error.message}`);
		}
	}

	function showMessage(type, text) {
		message = { type, text, show: true };
		setTimeout(() => {
			message.show = false;
		}, 3000);
	}

	function goBack() {
		goto('/master');
	}
</script>

<svelte:head>
	<title>Master Pengajian - Absensi Pengajian</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<AppHeader />

	<main class="container mx-auto px-4 py-6 pb-24">
		{#if isLoading}
			<div class="flex items-center justify-center py-20">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p class="text-gray-600">Memuat data...</p>
				</div>
			</div>
		{:else if isSuperAdmin}
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-3">
					<button on:click={goBack} class="btn-back">
						<ArrowLeft size={20} />
					</button>
					<div class="flex items-center gap-3">
						<div class="icon-badge bg-gradient-to-br from-blue-500 to-blue-600">
							<BookOpen size={24} color="white" />
						</div>
						<div>
							<h1 class="text-2xl font-bold text-gray-800">Master Pengajian</h1>
							<p class="text-sm text-gray-600">Kelola data pengajian</p>
						</div>
					</div>
				</div>
				<button on:click={() => openModal('create')} class="btn-primary">
					<Plus size={20} />
					<span class="ml-2">Tambah Data</span>
				</button>
			</div>

			<!-- Search and Actions -->
			<div class="search-container">
				<div class="search-wrapper">
					<Search size={20} class="search-icon" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari pengajian..."
						class="search-input"
					/>
					{#if searchQuery}
						<button on:click={() => searchQuery = ''} class="clear-btn">
							<X size={16} />
						</button>
					{/if}
				</div>
				<button on:click={loadData} class="btn-refresh" disabled={isDataLoading}>
					<RefreshCw size={20} class={isDataLoading ? 'animate-spin' : ''} />
				</button>
			</div>

			<!-- Results Info -->
			{#if searchQuery}
				<div class="results-info">
					Menampilkan {filteredData.length} dari {dataList.length} data
				</div>
			{/if}

			<!-- Data Grid -->
			{#if isDataLoading}
				<div class="flex justify-center py-12">
					<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
				</div>
			{:else if filteredData.length === 0}
				<div class="empty-state">
					<BookOpen size={48} class="mx-auto mb-4 text-gray-400" />
					<p class="text-gray-600 text-lg font-medium">
						{searchQuery ? 'Tidak ada data yang cocok' : 'Belum ada data pengajian'}
					</p>
					<p class="text-gray-500 text-sm">
						{searchQuery ? 'Coba kata kunci lain' : 'Klik tombol "Tambah Data" untuk menambahkan pengajian'}
					</p>
				</div>
			{:else}
				<div class="cards-grid">
					{#each filteredData as item (item.id)}
						<div class="data-card">
							<div class="card-header">
								<h3 class="card-title">{item.nama || '-'}</h3>
								<span class="badge {item.active === 1 ? 'badge-active' : 'badge-inactive'}">
									{item.active === 1 ? 'Aktif' : 'Nonaktif'}
								</span>
							</div>
							<div class="card-body">
								{#if item.alamat}
									<p class="card-text"><strong>Alamat:</strong> {item.alamat}</p>
								{/if}
								{#if item.keterangan}
									<p class="card-text"><strong>Keterangan:</strong> {item.keterangan}</p>
								{/if}
							</div>
							<div class="card-actions">
								<button on:click={() => openModal('view', item)} class="btn-action btn-view">
									<Eye size={16} />
									<span>Detail</span>
								</button>
								<button on:click={() => openModal('edit', item)} class="btn-action btn-edit">
									<Edit size={16} />
									<span>Edit</span>
								</button>
								<button on:click={() => handleDelete(item)} class="btn-action btn-delete">
									<Trash2 size={16} />
									<span>Hapus</span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</main>

	<!-- Modal -->
	{#if showModal}
		<div class="modal-overlay" on:click={closeModal}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h2 class="modal-title">
						{modalMode === 'create' ? 'Tambah' : modalMode === 'edit' ? 'Edit' : 'Detail'} Pengajian
					</h2>
					<button on:click={closeModal} class="modal-close">
						<X size={24} />
					</button>
				</div>

				<div class="modal-body">
					<div class="form-group">
						<label for="nama" class="form-label">
							Nama Pengajian <span class="text-red-500">*</span>
						</label>
						<input
							id="nama"
							type="text"
							bind:value={formData.nama}
							disabled={modalMode === 'view'}
							class="form-input {formErrors.nama ? 'input-error' : ''}"
							placeholder="Masukkan nama pengajian"
						/>
						{#if formErrors.nama}
							<p class="error-text">{formErrors.nama}</p>
						{/if}
					</div>

					<div class="form-group">
						<label for="alamat" class="form-label">Alamat</label>
						<textarea
							id="alamat"
							bind:value={formData.alamat}
							disabled={modalMode === 'view'}
							class="form-input"
							rows="3"
							placeholder="Masukkan alamat pengajian"
						/>
					</div>

					<div class="form-group">
						<label for="keterangan" class="form-label">Keterangan</label>
						<textarea
							id="keterangan"
							bind:value={formData.keterangan}
							disabled={modalMode === 'view'}
							class="form-input"
							rows="3"
							placeholder="Masukkan keterangan"
						/>
					</div>

					<div class="form-group">
						<label class="form-label">Status</label>
						<div class="flex items-center gap-4">
							<label class="flex items-center gap-2">
								<input
									type="radio"
									bind:group={formData.active}
									value={1}
									disabled={modalMode === 'view'}
								/>
								<span>Aktif</span>
							</label>
							<label class="flex items-center gap-2">
								<input
									type="radio"
									bind:group={formData.active}
									value={0}
									disabled={modalMode === 'view'}
								/>
								<span>Nonaktif</span>
							</label>
						</div>
					</div>
				</div>

				{#if modalMode !== 'view'}
					<div class="modal-footer">
						<button on:click={closeModal} class="btn-secondary" disabled={isSaving}>
							Batal
						</button>
						<button on:click={handleSubmit} class="btn-primary" disabled={isSaving}>
							{#if isSaving}
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							{:else}
								<Save size={16} class="mr-2" />
							{/if}
							Simpan
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Message Notification -->
	{#if message.show}
		<div class="fixed top-20 right-4 z-50 animate-slide-in">
			<div class="px-6 py-4 rounded-lg shadow-lg {message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white">
				<p class="font-medium">{message.text}</p>
			</div>
		</div>
	{/if}

	<BottomNav />
</div>

<style>
	.btn-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 0.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-back:hover {
		border-color: #3b82f6;
		color: #3b82f6;
	}

	.icon-badge {
		width: 48px;
		height: 48px;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-primary {
		display: flex;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.btn-secondary {
		padding: 0.75rem 1.5rem;
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		border-color: #9ca3af;
	}

	.search-container {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.search-wrapper {
		position: relative;
		flex: 1;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 3rem 0.75rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.clear-btn {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.clear-btn:hover {
		color: #6b7280;
		background: #f3f4f6;
	}

	.btn-refresh {
		padding: 0.75rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-refresh:hover:not(:disabled) {
		border-color: #3b82f6;
		color: #3b82f6;
	}

	.btn-refresh:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.results-info {
		padding: 0.75rem 1rem;
		background: #eff6ff;
		border-left: 4px solid #3b82f6;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		color: #1e40af;
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 1rem;
		border: 2px dashed #e5e7eb;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.data-card {
		background: white;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s;
		border: 2px solid transparent;
	}

	.data-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		border-color: #e5e7eb;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		flex: 1;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.badge-active {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-inactive {
		background: #fee2e2;
		color: #991b1b;
	}

	.card-body {
		margin-bottom: 1rem;
	}

	.card-text {
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.6;
		margin-bottom: 0.5rem;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}

	.btn-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;
		justify-content: center;
	}

	.btn-view {
		background: #eff6ff;
		color: #1e40af;
	}

	.btn-view:hover {
		background: #dbeafe;
	}

	.btn-edit {
		background: #fef3c7;
		color: #92400e;
	}

	.btn-edit:hover {
		background: #fde68a;
	}

	.btn-delete {
		background: #fee2e2;
		color: #991b1b;
	}

	.btn-delete:hover {
		background: #fecaca;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 1rem;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 2px solid #f3f4f6;
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.modal-close {
		padding: 0.5rem;
		background: transparent;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.modal-close:hover {
		background: #f3f4f6;
		color: #6b7280;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 2px solid #f3f4f6;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #374151;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-input:disabled {
		background: #f9fafb;
		cursor: not-allowed;
	}

	.input-error {
		border-color: #ef4444;
	}

	.error-text {
		margin-top: 0.5rem;
		color: #ef4444;
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.cards-grid {
			grid-template-columns: 1fr;
		}

		.btn-primary span {
			display: none;
		}

		.card-actions {
			flex-direction: column;
		}
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
