<script>
	import { onMount } from 'svelte';
	import { KategoriService } from '$lib/services/masterData.js';
	import { Plus, Edit, Trash2, Eye } from 'lucide-svelte';

	let kategoriList = [];
	let showModal = false;
	let modalMode = 'create';
	let selectedItem = null;
	let formData = {};

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			kategoriList = await KategoriService.getAllKategori();
		} catch (error) {
			console.error('Error loading kategori data:', error);
		}
	}

	function handleAdd() {
		modalMode = 'create';
		selectedItem = null;
		formData = {};
		showModal = true;
	}

	function handleEdit(item) {
		modalMode = 'edit';
		selectedItem = item;
		formData = { ...item };
		showModal = true;
	}

	function handleView(item) {
		modalMode = 'view';
		selectedItem = item;
		formData = { ...item };
		showModal = true;
	}

	async function handleDelete(item) {
		if (!confirm(`Apakah Anda yakin ingin menghapus ${item.category}?`)) {
			return;
		}

		try {
			await KategoriService.deleteKategori(item.id);
			await loadData();
		} catch (error) {
			console.error('Error deleting kategori:', error);
		}
	}

	async function handleSave() {
		try {
			if (modalMode === 'create') {
				await KategoriService.createKategori(formData);
			} else if (modalMode === 'edit') {
				await KategoriService.updateKategori(selectedItem.id, formData);
			}
			showModal = false;
			await loadData();
		} catch (error) {
			console.error('Error saving kategori:', error);
		}
	}
</script>

<div class="content-area">
	<div class="content-header">
		<div class="header-info">
			<h1>Kategori</h1>
			<p class="data-count">{kategoriList.length} data</p>
		</div>
		<button class="add-button" on:click={handleAdd}>
			<Plus size={16} />
			<span>Tambah</span>
		</button>
	</div>

	<div class="data-table">
		{#if kategoriList.length === 0}
			<div class="empty-state">
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
							<th>Group</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each kategoriList as item, index}
							<tr>
								<td>{index + 1}</td>
								<td class="name-cell">{item.category}</td>
								<td>{item.group || '-'}</td>
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

{#if showModal}
	<div class="modal-overlay" on:click={() => (showModal = false)}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>
					{modalMode === 'create' ? 'Tambah' : modalMode === 'edit' ? 'Edit' : 'Detail'}
					Kategori
				</h2>
				<button class="close-button" on:click={() => (showModal = false)}>×</button>
			</div>

			<div class="modal-body">
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
			</div>

			{#if modalMode !== 'view'}
				<div class="modal-footer">
					<button class="cancel-button" on:click={() => (showModal = false)}>Batal</button>
					<button class="save-button" on:click={handleSave}>
						{modalMode === 'create' ? 'Simpan' : 'Update'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
