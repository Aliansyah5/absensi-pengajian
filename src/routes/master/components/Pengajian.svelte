<script>
	import { onMount } from 'svelte';
	import { PengajianService } from '$lib/services/masterData.js';
	import { Plus, Edit, Trash2, Eye } from 'lucide-svelte';

	let pengajianList = [];
	let showModal = false;
	let modalMode = 'create';
	let selectedItem = null;
	let formData = {};

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			pengajianList = await PengajianService.getAllPengajian();
		} catch (error) {
			console.error('Error loading pengajian data:', error);
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
		if (!confirm(`Apakah Anda yakin ingin menghapus ${item.nama_pengajian}?`)) {
			return;
		}

		try {
			await PengajianService.deletePengajian(item.id);
			await loadData();
		} catch (error) {
			console.error('Error deleting pengajian:', error);
		}
	}

	async function handleSave() {
		try {
			if (modalMode === 'create') {
				await PengajianService.createPengajian(formData);
			} else if (modalMode === 'edit') {
				await PengajianService.updatePengajian(selectedItem.id, formData);
			}
			showModal = false;
			await loadData();
		} catch (error) {
			console.error('Error saving pengajian:', error);
		}
	}
</script>

<div class="content-area">
	<div class="content-header">
		<div class="header-info">
			<h1>Pengajian</h1>
			<p class="data-count">{pengajianList.length} data</p>
		</div>
		<button class="add-button" on:click={handleAdd}>
			<Plus size={16} />
			<span>Tambah</span>
		</button>
	</div>

	<div class="data-table">
		{#if pengajianList.length === 0}
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
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each pengajianList as item, index}
							<tr>
								<td>{index + 1}</td>
								<td class="name-cell">{item.nama_pengajian}</td>
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
					Pengajian
				</h2>
				<button class="close-button" on:click={() => (showModal = false)}>×</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label>Nama Pengajian</label>
					<input
						type="text"
						bind:value={formData.nama_pengajian}
						disabled={modalMode === 'view'}
						placeholder="Masukkan nama pengajian"
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
