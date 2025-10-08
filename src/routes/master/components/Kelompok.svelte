<script>
	import { onMount } from 'svelte';
	import { KelompokService, DesaService, DaerahService } from '$lib/services/masterData.js';
	import { Plus, Edit, Trash2, Eye } from 'lucide-svelte';

	let kelompokList = [];
	let desaList = [];
	let daerahList = [];
	let showModal = false;
	let modalMode = 'create';
	let selectedItem = null;
	let formData = {};

	onMount(async () => {
		await loadData();
		await loadDesa();
		await loadDaerah();
	});

	async function loadData() {
		try {
			kelompokList = await KelompokService.getAllKelompok();
		} catch (error) {
			console.error('Error loading kelompok data:', error);
		}
	}

	async function loadDesa() {
		try {
			desaList = await DesaService.getAllDesa();
		} catch (error) {
			console.error('Error loading desa data:', error);
		}
	}

	async function loadDaerah() {
		try {
			daerahList = await DaerahService.getAllDaerah();
		} catch (error) {
			console.error('Error loading daerah data:', error);
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
		if (!confirm(`Apakah Anda yakin ingin menghapus ${item.nama_kelompok}?`)) {
			return;
		}

		try {
			await KelompokService.deleteKelompok(item.id);
			await loadData();
		} catch (error) {
			console.error('Error deleting kelompok:', error);
		}
	}

	async function handleSave() {
		try {
			if (modalMode === 'create') {
				await KelompokService.createKelompok(formData);
			} else if (modalMode === 'edit') {
				await KelompokService.updateKelompok(selectedItem.id, formData);
			}
			showModal = false;
			await loadData();
		} catch (error) {
			console.error('Error saving kelompok:', error);
		}
	}
</script>

<div class="content-area">
	<div class="content-header">
		<div class="header-info">
			<h1>Kelompok</h1>
			<p class="data-count">{kelompokList.length} data</p>
		</div>
		<button class="add-button" on:click={handleAdd}>
			<Plus size={16} />
			<span>Tambah</span>
		</button>
	</div>

	<div class="data-table">
		{#if kelompokList.length === 0}
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
							<th>Desa</th>
							<th>Daerah</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each kelompokList as item, index}
							<tr>
								<td>{index + 1}</td>
								<td class="name-cell">{item.nama_kelompok}</td>
								<td>{item.mdesa?.nama_desa || '-'}</td>
								<td>{item.mdaerah?.nama_daerah || '-'}</td>
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
					Kelompok
				</h2>
				<button class="close-button" on:click={() => (showModal = false)}>×</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label>Nama Kelompok</label>
					<input
						type="text"
						bind:value={formData.nama_kelompok}
						disabled={modalMode === 'view'}
						placeholder="Masukkan nama kelompok"
					/>
				</div>
				<div class="form-group">
					<label>Desa</label>
					<select bind:value={formData.desa_id} disabled={modalMode === 'view'}>
						<option value={null}>Pilih Desa</option>
						{#each desaList as desa}
							<option value={desa.id}>{desa.nama_desa}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label>Daerah</label>
					<select bind:value={formData.daerah_id} disabled={modalMode === 'view'}>
						<option value={null}>Pilih Daerah</option>
						{#each daerahList as daerah}
							<option value={daerah.id}>{daerah.nama_daerah}</option>
						{/each}
					</select>
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
