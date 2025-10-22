<script>
	import { onMount } from 'svelte';
	import {
		Trash2,
		Pencil,
		PlusCircle,
		Search,
		X,
		Save,
		AlertCircle,
		ChevronLeft,
		ChevronRight,
		Eye
	} from 'lucide-svelte';

	export let service;
	export let title;
	export let columns;
	export let displayColumns = null; // Optional separate columns for table display
	export let keyField = 'id';
	export let foreignKeyLoaders = {}; // New prop for foreign key data loaders
	export let filters = []; // New prop for filter configurations

	let items = [];
	let isLoading = true;
	let message = { type: '', text: '', show: false };
	let showModal = false;
	let currentItem = {};
	let isEditing = false;
	let modalMode = 'create';
	let searchTerm = '';
	let currentPage = 1;
	let itemsPerPage = 10;
	let foreignKeyOptions = {}; // Store loaded foreign key options
	let filterValues = {}; // Store current filter values
	let mounted = false;
	let expandedCards = {}; // Track which cards are expanded

	// Use displayColumns for table if provided, otherwise use columns
	$: tableColumns = displayColumns || columns;

	function toggleCard(id) {
		expandedCards[id] = !expandedCards[id];
		expandedCards = { ...expandedCards }; // Trigger reactivity
	}

	$: filteredItems = items.filter((item) => {
		// Search filter
		if (searchTerm) {
			const searchMatch = Object.values(item).some((value) =>
				String(value).toLowerCase().includes(searchTerm.toLowerCase())
			);
			if (!searchMatch) return false;
		}

		// Custom filters
		for (const filter of filters) {
			const filterValue = filterValues[filter.key];
			if (filterValue && filterValue !== '') {
				if (item[filter.key] != filterValue) {
					return false;
				}
			}
		}

		return true;
	});

	$: paginatedItems = filteredItems.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	$: totalPages = Math.ceil(filteredItems.length / itemsPerPage);

	onMount(() => {
		console.log('CrudManager mounted with filters:', filters);
		fetchItems();
		mounted = true;
	});

	// Function to handle filter changes
	function handleFilterChange() {
		if (!mounted) return; // Don't refetch during initial mount
		currentPage = 1; // Reset to first page when filters change
		fetchItems();
	}

	// Function to clear all filters
	function clearFilters() {
		filterValues = {};
		handleFilterChange();
	}

	async function fetchItems() {
		isLoading = true;
		try {
			// Convert filter values to service format
			const serviceFilters = {};
			for (const filter of filters) {
				const value = filterValues[filter.key];
				if (value && value !== '') {
					// Map UI filter keys to service filter keys
					if (filter.key === 'id_kategori') {
						serviceFilters.kategori = value;
					} else if (filter.key === 'id_kelompok') {
						serviceFilters.kelompok = value;
					} else if (filter.key === 'jk') {
						serviceFilters.jk = value;
					}
				}
			}

			items = await service.getAll(serviceFilters);
			await loadForeignKeyOptions();
		} catch (error) {
			showMessage('error', `Gagal memuat data: ${error.message}`);
		} finally {
			isLoading = false;
		}
	}

	async function loadForeignKeyOptions() {
		if (!foreignKeyLoaders || Object.keys(foreignKeyLoaders).length === 0) return;

		try {
			const promises = Object.entries(foreignKeyLoaders).map(async ([key, loader]) => {
				const data = await loader();
				return [key, data];
			});

			const results = await Promise.all(promises);
			foreignKeyOptions = Object.fromEntries(results);
		} catch (error) {
			console.error('Error loading foreign key options:', error);
		}
	}

	function showMessage(type, text) {
		message = { type, text, show: true };
		setTimeout(() => {
			message.show = false;
		}, 3000);
	}

	function openModal(item = {}, mode = 'create') {
		if (mode === 'edit' || mode === 'view') {
			isEditing = mode === 'edit';
			currentItem = { ...item };
			modalMode = mode;
		} else {
			isEditing = false;
			currentItem = {};
			modalMode = 'create';
		}
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		currentItem = {};
	}

	async function handleSubmit() {
		try {
			// Filter out system fields and create clean data object
			const cleanData = {};
			columns
				.filter(col => !['id', 'created_at', 'updated_at', 'user_modified'].includes(col.key))
				.forEach(col => {
					if (currentItem[col.key] !== undefined) {
						cleanData[col.key] = currentItem[col.key];
					}
				});

			if (modalMode === 'edit' || isEditing) {
				await service.update(currentItem[keyField], cleanData);
				showMessage('success', 'Data berhasil diperbarui.');
			} else {
				await service.create(cleanData);
				showMessage('success', 'Data berhasil ditambahkan.');
			}
			fetchItems();
			closeModal();
		} catch (error) {
			showMessage('error', `Operasi gagal: ${error.message}`);
		}
	}

	async function handleDelete(id) {
		if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
			try {
				await service.delete(id);
				showMessage('success', 'Data berhasil dihapus.');
				fetchItems();
			} catch (error) {
				showMessage('error', `Gagal menghapus: ${error.message}`);
			}
		}
	}

	function formatValue(value, type, column, item) {
		// Handle computed fields
		if (column && column.computed && column.key === 'usia' && item.tgl_lahir) {
			const birthDate = new Date(item.tgl_lahir);
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
				age--;
			}
			return age >= 0 ? `${age} tahun` : '-';
		}

		if (!value) return '-';

		// Handle foreign key display
		if (column && column.foreignKey && foreignKeyOptions[column.foreignKey]) {
			const option = foreignKeyOptions[column.foreignKey].find(opt => opt.id == value);
			return option ? option.name : value;
		}

		// Handle display-only fields that should show related data
		if (column && column.displayField && item) {
			return item[column.displayField] || '-';
		}

		if (type === 'datetime') {
			try {
				const date = new Date(value);
				return date.toLocaleString('id-ID', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				});
			} catch (e) {
				return value;
			}
		}

		if (type === 'date') {
			try {
				const date = new Date(value);
				return date.toLocaleDateString('id-ID');
			} catch (e) {
				return value;
			}
		}

		return value;
	}

	function changePage(page) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}
</script>

<div class="crud-manager">
	{#if message.show}
		<div class="message {message.type}">
			<AlertCircle size={20} />
			<span>{message.text}</span>
		</div>
	{/if}

	<!-- Header Section -->
	<header class="crud-header">
		<div class="header-content">
			<div class="header-title">
				<div>
					<h1>Master {title}</h1>
					<p class="header-subtitle">Kelola data {title.toLowerCase()}</p>
				</div>
			</div>
			<div class="header-actions">
				<div class="search-container">
					<Search size={18} class="search-icon" />
					<input
						type="text"
						placeholder="Cari data {title.toLowerCase()}..."
						bind:value={searchTerm}
					/>
				</div>
				<button class="btn-primary" on:click={() => openModal()}>
					<PlusCircle size={18} />
					<span>Tambah {title}</span>
				</button>
			</div>
		</div>
	</header>

	<!-- Filters Section -->
	{#if filters && filters.length > 0}
		<div class="filters-section">
			<div class="filters-content">
				<h3 class="filters-title">Filter Data</h3>
				<div class="filters-grid">
					{#each filters as filter}
						<div class="filter-group">
							<label for="filter-{filter.key}">{filter.label}</label>
							{#if filter.type === 'select' && filter.options}
								<select
									id="filter-{filter.key}"
									bind:value={filterValues[filter.key]}
									on:change={handleFilterChange}
									class="filter-select"
								>
									<option value="">Semua {filter.label}</option>
									{#each filter.options as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							{:else if filter.foreignKey && foreignKeyOptions[filter.foreignKey]}
								<select
									id="filter-{filter.key}"
									bind:value={filterValues[filter.key]}
									on:change={handleFilterChange}
									class="filter-select"
								>
									<option value="">Semua {filter.label}</option>
									{#each foreignKeyOptions[filter.foreignKey] as option}
										<option value={option.id}>{option.name}</option>
									{/each}
								</select>
							{:else}
								<input
									type={filter.type || 'text'}
									id="filter-{filter.key}"
									bind:value={filterValues[filter.key]}
									placeholder="Filter {filter.label}"
									class="filter-input"
								/>
							{/if}
						</div>
					{/each}
					<div class="filter-actions">
						<button
							class="btn-secondary btn-clear"
							on:click={clearFilters}
						>
							<X size={16} />
							<span>Reset Filter</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Stats Bar -->
	{#if !isLoading}
		<div class="stats-bar">
			<div class="stats-item">
				<span>Total Data: <strong>{items.length}</strong></span>
			</div>
			<div class="stats-item">
				<span>Ditampilkan: <strong>{filteredItems.length}</strong></span>
			</div>
			<div class="stats-item">
				<span>Halaman: <strong>{currentPage} dari {totalPages}</strong></span>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p class="loading-text">Memuat data {title.toLowerCase()}...</p>
		</div>
	{:else if filteredItems.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Search size={32} />
			</div>
			<h3 class="empty-title">
				{searchTerm ? 'Data tidak ditemukan' : `Belum ada data ${title.toLowerCase()}`}
			</h3>
			<p class="empty-description">
				{searchTerm ?
					`Tidak ada data yang cocok dengan pencarian "${searchTerm}"` :
					`Klik tombol "Tambah ${title}" untuk menambah data baru`
				}
			</p>
			{#if searchTerm}
				<button class="btn-secondary" on:click={() => searchTerm = ''}>
					<X size={16} />
					<span>Bersihkan Pencarian</span>
				</button>
			{:else}
				<button class="btn-primary" on:click={() => openModal()}>
					<PlusCircle size={18} />
					<span>Tambah {title} Pertama</span>
				</button>
			{/if}
		</div>
	{:else}
		<!-- Card View (All Devices) -->
		<div class="cards-container">
			{#each paginatedItems as item, index (item[keyField])}
				<div class="data-card {expandedCards[item[keyField]] ? 'expanded' : 'collapsed'}" style="animation-delay: {index * 0.05}s">
					<div class="card-header" on:click={() => toggleCard(item[keyField])}>
						<div class="card-info">
							<div class="card-number">#{(currentPage - 1) * itemsPerPage + index + 1}</div>
							<div class="card-preview">
								{#each tableColumns.filter(col => !['id', 'created_at', 'updated_at', 'user_modified'].includes(col.key)).slice(0, 2) as column}
									<span class="preview-item">
										{formatValue(item[column.key], column.type, column, item)}
									</span>
								{/each}
							</div>
						</div>
						<div class="card-toggle">
							<button
								class="btn-toggle"
								type="button"
								title="{expandedCards[item[keyField]] ? 'Tutup' : 'Buka'}"
							>
								<ChevronRight size={16} class="chevron {expandedCards[item[keyField]] ? 'rotated' : ''}" />
							</button>
						</div>
					</div>
					{#if expandedCards[item[keyField]]}
						<div class="card-body">
							{#each tableColumns.filter(col => !['id', 'created_at', 'updated_at', 'user_modified'].includes(col.key)) as column}
								<div class="card-field">
									<span class="field-label">{column.label}</span>
									<span class="field-value">{formatValue(item[column.key], column.type, column, item)}</span>
								</div>
							{/each}
							<div class="card-actions-bottom">
								<button
									class="btn-action view"
									on:click|stopPropagation={() => openModal(item, 'view')}
									title="Lihat {title}"
								>
									<Eye size={16} />
									<span>Lihat</span>
								</button>
								<button
									class="btn-action edit"
									on:click|stopPropagation={() => openModal(item, 'edit')}
									title="Edit {title}"
								>
									<Pencil size={16} />
									<span>Edit</span>
								</button>
								<button
									class="btn-action danger"
									on:click|stopPropagation={() => handleDelete(item[keyField])}
									title="Hapus {title}"
								>
									<Trash2 size={16} />
									<span>Hapus</span>
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="pagination">
				<button
					on:click={() => changePage(currentPage - 1)}
					disabled={currentPage === 1}
					title="Halaman Sebelumnya"
				>
					<ChevronLeft size={16} />
				</button>
				<span>Halaman {currentPage} dari {totalPages}</span>
				<button
					on:click={() => changePage(currentPage + 1)}
					disabled={currentPage === totalPages}
					title="Halaman Berikutnya"
				>
					<ChevronRight size={16} />
				</button>
			</div>
		{/if}
	{/if}
</div>

{#if showModal}
	<div class="modal-backdrop" on:click={closeModal}>
		<div class="modal-content" on:click|stopPropagation>
			<header class="modal-header">
				<h2>
					{modalMode === 'create' ? 'Tambah' : modalMode === 'edit' ? 'Edit' : 'Lihat'} {title}
				</h2>
				<button class="btn-icon" on:click={closeModal}><X size={20} /></button>
			</header>
			<form on:submit|preventDefault={handleSubmit}>
				<div class="modal-body">
					{#each columns.filter(col => !['id', 'created_at', 'updated_at', 'user_modified'].includes(col.key) && !col.displayOnly) as column}
						{#if column.section}
							<div class="form-section">
								<h4 class="section-title">{column.section}</h4>
							</div>
						{/if}
						<div class="form-group">
							<label for={column.key}>{column.label}</label>
							{#if column.type === 'select' && column.options}
								<select
									id={column.key}
									bind:value={currentItem[column.key]}
									disabled={modalMode === 'view'}
									required={column.required === true}
								>
									<option value="">Pilih {column.label}</option>
									{#each column.options as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							{:else if column.foreignKey && foreignKeyOptions[column.foreignKey]}
								<select
									id={column.key}
									bind:value={currentItem[column.key]}
									disabled={modalMode === 'view'}
									required={column.required === true}
								>
									<option value="">Pilih {column.label}</option>
									{#each foreignKeyOptions[column.foreignKey] as option}
										<option value={option.id}>{option.name}</option>
									{/each}
								</select>
							{:else if column.type === 'textarea'}
								<textarea
									id={column.key}
									bind:value={currentItem[column.key]}
									disabled={modalMode === 'view'}
									required={column.required === true}
									rows="3"
								></textarea>
							{:else}
								<input
									type={column.type || 'text'}
									id={column.key}
									bind:value={currentItem[column.key]}
									disabled={modalMode === 'view'}
									required={column.required === true}
								/>
							{/if}
						</div>
					{/each}
				</div>
				{#if modalMode !== 'view'}
					<footer class="modal-footer">
						<button type="button" class="btn-secondary" on:click={closeModal}>Batal</button>
						<button type="submit" class="btn-primary">
							<Save size={18} />
							<span>{modalMode === 'create' ? 'Simpan' : 'Perbarui'}</span>
						</button>
					</footer>
				{:else}
					<footer class="modal-footer">
						<button type="button" class="btn-secondary" on:click={closeModal}>Tutup</button>
					</footer>
				{/if}
			</form>
		</div>
	</div>
{/if}

<style>
	.crud-manager {
		min-height: calc(100vh - 120px);
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1.5rem;
	}

	/* Header Section */
	.crud-header {
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

	.header-title {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		flex: 1;
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

	.header-subtitle {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0.25rem 0 0 0;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-shrink: 0;
	}

	/* Search Container */
	.search-container {
		position: relative;
		min-width: 280px;
		height: 48px;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #6b7280;
		z-index: 1;
	}

	.search-container input {
		width: 100%;
		height: 100%;
		padding: 0.875rem 1rem 0.875rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 0.875rem;
		background: #f9fafb;
		transition: all 0.2s ease;
	}

	.search-container input:focus {
		outline: none;
		border-color: #3b82f6;
		background: white;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
	}

	/* Buttons */
	.btn-primary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		border: none;
		padding: 0.875rem 1.5rem;
		height: 48px;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
		white-space: nowrap;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
	}

	.btn-secondary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: white;
		color: #374151;
		border: 2px solid #e5e7eb;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	/* Filters Section */
	.filters-section {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.filters-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.filters-title {
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		align-items: end;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-select,
	.filter-input {
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		background: #f9fafb;
		transition: all 0.2s ease;
	}

	.filter-select:focus,
	.filter-input:focus {
		outline: none;
		border-color: #3b82f6;
		background: white;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
	}

	.filter-actions {
		display: flex;
		align-items: end;
	}

	.btn-clear {
		height: fit-content;
		font-size: 0.75rem;
		padding: 0.75rem 1rem;
	}

	/* Stats Bar */
	.stats-bar {
		background: white;
		border-radius: 12px;
		padding: 1rem 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.stats-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Cards Container */
	.cards-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
	}

	.data-card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: fadeInUp 0.3s ease-out;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.data-card.collapsed:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
		border-color: #3b82f6;
	}

	.data-card.expanded {
		border-color: #3b82f6;
		box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}

	.data-card.expanded .card-header {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
		border-bottom: 1px solid #93c5fd;
	}

	.card-header:active {
		background: #e0f2fe;
	}

	.card-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		min-width: 0;
	}

	.card-number {
		font-size: 0.875rem;
		font-weight: 700;
		color: #3b82f6;
		background: white;
		padding: 0.375rem 0.875rem;
		border-radius: 8px;
		border: 1px solid #dbeafe;
		flex-shrink: 0;
	}

	.card-preview {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		overflow: hidden;
		flex: 1;
		min-width: 0;
	}

	.preview-item {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-item:nth-child(2) {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.card-toggle {
		flex-shrink: 0;
	}

	.btn-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 2px solid #3b82f6;
		background: white;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #3b82f6;
	}

	.btn-toggle:hover {
		background: #eff6ff;
		transform: scale(1.1);
	}

	.btn-toggle:active {
		transform: scale(0.95);
	}

	.chevron {
		transition: transform 0.3s ease;
	}

	.chevron.rotated {
		transform: rotate(90deg);
	}

	.card-body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		animation: slideDown 0.3s ease;
		background: #fafbfc;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			max-height: 0;
			padding-top: 0;
			padding-bottom: 0;
		}
		to {
			opacity: 1;
			max-height: 2000px;
			padding-top: 1.25rem;
			padding-bottom: 1.25rem;
		}
	}

	.card-actions-bottom {
		display: flex;
		gap: 0.75rem;
		padding-top: 0.75rem;
		margin-top: 0.75rem;
		border-top: 2px solid #e5e7eb;
	}

	.btn-action {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	.btn-action:active {
		transform: scale(0.95);
	}

	.btn-action.view {
		background: #f0f9ff;
		color: #0284c7;
		border: 1px solid #bae6fd;
	}

	.btn-action.view:hover {
		background: #e0f2fe;
		border-color: #7dd3fc;
	}

	.btn-action.edit {
		background: #dbeafe;
		color: #1d4ed8;
		border: 1px solid #93c5fd;
	}

	.btn-action.edit:hover {
		background: #bfdbfe;
		border-color: #60a5fa;
	}

	.btn-action.danger {
		background: #fee2e2;
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.btn-action.danger:hover {
		background: #fecaca;
		border-color: #f87171;
	}

	.card-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
		border-left: 3px solid #e5e7eb;
		transition: all 0.2s ease;
	}

	.card-field:hover {
		background: #f3f4f6;
		border-left-color: #3b82f6;
	}

	.field-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.field-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
		word-break: break-word;
		line-height: 1.5;
	}

	/* Empty field value */
	.field-value:empty::before {
		content: '-';
		color: #9ca3af;
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.pagination button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: 2px solid #e5e7eb;
		background: white;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #6b7280;
	}

	.pagination button:hover:not(:disabled) {
		border-color: #3b82f6;
		color: #3b82f6;
		background: #f0f9ff;
	}

	.pagination button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pagination span {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	/* Loading State */
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #f1f5f9;
		text-align: center;
	}

	.empty-icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
		color: #9ca3af;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.empty-description {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
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

	@keyframes slideIn {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: white;
		border-radius: 20px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		border: 1px solid #f1f5f9;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2rem 1rem 2rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.modal-header h2 {
		font-size: 1.375rem;
		font-weight: 700;
		margin: 0;
		color: #1f2937;
	}

	.modal-body {
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		background: #f9fafb;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		background: white;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
	}

	.form-group input:disabled,
	.form-group select:disabled,
	.form-group textarea:disabled {
		background: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
		border-color: #d1d5db;
	}

	.form-section {
		margin: 2rem 0 1rem 0;
		padding-top: 1rem;
		border-top: 2px solid #e5e7eb;
	}

	.form-section:first-child {
		margin-top: 0;
		padding-top: 0;
		border-top: none;
	}

	.section-title {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 700;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: #f9fafb;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border-left: 4px solid #3b82f6;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		padding: 1rem 2rem 2rem 2rem;
		border-top: 1px solid #f3f4f6;
		gap: 1rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.crud-manager {
			padding: 1rem;
		}

		.crud-header {
			padding: 1.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			flex-direction: column;
		}

		.search-container {
			min-width: auto;
		}

		.header-title h1 {
			font-size: 1.5rem;
		}

		.modal-content {
			margin: 1rem;
		}

		.modal-header,
		.modal-body,
		.modal-footer {
			padding: 1.5rem;
		}

		.stats-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.pagination {
			flex-wrap: wrap;
			padding: 1rem;
		}

		.pagination button {
			width: 36px;
			height: 36px;
		}

		.pagination span {
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.crud-manager {
			padding: 0.5rem;
		}

		.crud-header {
			padding: 1rem;
		}

		.header-title h1 {
			font-size: 1.25rem;
		}

		.btn-primary,
		.btn-secondary {
			font-size: 0.8rem;
			padding: 0.75rem 1.25rem;
			height: 44px;
		}

		.search-container input {
			font-size: 0.8rem;
			height: 44px;
		}

		.actions-cell {
			flex-direction: column;
		}

		.message {
			right: 0.5rem;
			left: 0.5rem;
			max-width: none;
			font-size: 0.8rem;
		}

		.data-card {
			border-radius: 12px;
		}

		.card-header {
			padding: 0.875rem 1rem;
		}

		.card-info {
			gap: 0.75rem;
		}

		.card-preview {
			gap: 0.125rem;
		}

		.preview-item {
			font-size: 0.8rem;
		}

		.preview-item:nth-child(2) {
			font-size: 0.7rem;
		}

		.card-body {
			padding: 1rem;
			gap: 0.75rem;
		}

		.card-actions-bottom {
			flex-direction: column;
			gap: 0.5rem;
		}

		.btn-action {
			font-size: 0.8rem;
			padding: 0.75rem;
		}

		.card-field {
			padding: 0.625rem;
		}

		.field-label {
			font-size: 0.65rem;
		}

		.field-value {
			font-size: 0.8rem;
		}

		.btn-icon-small {
			width: 30px;
			height: 30px;
		}

		.card-number {
			font-size: 0.8rem;
			padding: 0.25rem 0.75rem;
		}

		.stats-bar {
			padding: 0.875rem 1rem;
			font-size: 0.8rem;
		}

		.filters-section {
			padding: 1rem;
		}

		.modal-content {
			max-width: 100%;
			border-radius: 16px 16px 0 0;
			max-height: 95vh;
		}

		.modal-header h2 {
			font-size: 1.125rem;
		}
	}
</style>
