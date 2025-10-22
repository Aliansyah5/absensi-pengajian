<script>
	import { createEventDispatcher } from 'svelte';
	import { Clock, MapPin, Users, BookOpen, DollarSign, User } from 'lucide-svelte';

	export let selectedDate;
	export let pengajianList = []; // Add pengajianList export
	export let masjidList = [];
	export let kelompokList = [];
	export let alquranList = [];
	export let hadistList = [];
	export let kategoriList = [];
	export let formData = null; // Accept external formData for editing

	const dispatch = createEventDispatcher();

	// Initialize form data with schema-matching field names
	let localFormData = {
		pengajian: '', // Will be set from pengajian dropdown
		tgl: selectedDate,
		tempat: '', // masjid ID
		kelompok: '', // kelompok ID
		tingkat: [], // Changed to multiple select array
		jam_mulai: '19:00',
		jam_akhir: '20:30',
		quran: '', // alquran ID
		pengajar_quran: '',
		ayat_awal: '',
		ayat_akhir: '',
		hadist: '',
		pengajar_hadist: '',
		hal_awal: '',
		hal_akhir: '',
		penasehat: '',
		infaq: 0
	};

	// Use external formData if provided (for editing), otherwise use local
	$: currentFormData = formData || localFormData;
	$: currentFormData.tgl = selectedDate;

	// Filter masjid berdasarkan kelompok yang dipilih
	$: filteredMasjidList = currentFormData.kelompok
		? masjidList.filter(m => m.id_kelompok === parseInt(currentFormData.kelompok))
		: masjidList;

	function handleSubmit() {
		// Validate required fields
		if (!currentFormData.pengajian) {
			alert('Silakan pilih pengajian');
			return;
		}

		if (!currentFormData.tempat) {
			alert('Silakan pilih masjid');
			return;
		}

		if (!currentFormData.kelompok) {
			alert('Silakan pilih kelompok');
			return;
		}

		if (!currentFormData.tingkat || currentFormData.tingkat.length === 0) {
			alert('Silakan pilih minimal satu tingkat');
			return;
		}

		// Dispatch the current form data
		dispatch('submit', { ...currentFormData });
	}

	function handleTingkatChange(kategoriId) {
		if (currentFormData.tingkat.includes(kategoriId)) {
			currentFormData.tingkat = currentFormData.tingkat.filter(id => id !== kategoriId);
		} else {
			currentFormData.tingkat = [...currentFormData.tingkat, kategoriId];
		}
	}
</script>

<div class="pengajian-form">
	<div class="form-header">
		<h2>Form Data Pengajian</h2>
		<p>Isi data pengajian terlebih dahulu sebelum input absensi</p>
	</div>

	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-grid">
			<!-- Basic Information -->
			<div class="form-section">
				<h3 class="section-title">
					<Clock size={18} />
					<span>Informasi Dasar</span>
				</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="pengajian">Pengajian</label>
						<select id="pengajian" bind:value={currentFormData.pengajian} required>
							<option value="">Pilih Pengajian</option>
							{#each pengajianList as pengajian}
								<option value={pengajian.id}>{pengajian.nama_pengajian}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label for="tanggal">Tanggal Pengajian</label>
						<input
							type="date"
							id="tanggal"
							bind:value={currentFormData.tgl}
							required
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="jam_mulai">Jam Mulai</label>
						<input
							type="time"
							id="jam_mulai"
							bind:value={currentFormData.jam_mulai}
							required
						/>
					</div>
					<div class="form-group">
						<label for="jam_akhir">Jam Akhir</label>
						<input
							type="time"
							id="jam_akhir"
							bind:value={currentFormData.jam_akhir}
							required
						/>
					</div>
				</div>
			</div>

			<!-- Location & Group -->
			<div class="form-section">
				<h3 class="section-title">
					<MapPin size={18} />
					<span>Lokasi & Kelompok</span>
				</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="kelompok">Kelompok</label>
						<select id="kelompok" bind:value={currentFormData.kelompok} required>
							<option value="">Pilih Kelompok</option>
							{#each kelompokList as kelompok}
								<option value={String(kelompok.id)}>{kelompok.nama_kelompok}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label for="masjid">Tempat (Masjid)</label>
						<select id="masjid" bind:value={currentFormData.tempat} required disabled={!currentFormData.kelompok}>
							<option value="">
								{#if !currentFormData.kelompok}
									Pilih Kelompok Dulu
								{:else if filteredMasjidList.length === 0}
									Tidak ada masjid untuk kelompok ini
								{:else}
									Pilih Masjid
								{/if}
							</option>
							{#each filteredMasjidList as masjid}
								<option value={String(masjid.id)}>{masjid.nama_masjid}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label>Tingkat</label>
						<div class="tingkat-checkboxes">
							{#each kategoriList as kategori}
								<label class="checkbox-item">
									<input
										type="checkbox"
										value={kategori.id}
										checked={currentFormData.tingkat.includes(kategori.id)}
										on:change={() => handleTingkatChange(kategori.id)}
									/>
									<span class="checkbox-label">{kategori.category}</span>
								</label>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Al-Quran Section -->
			<div class="form-section">
				<h3 class="section-title">
					<BookOpen size={18} />
					<span>Materi Al-Quran</span>
				</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="alquran">Surah</label>
						<select id="alquran" bind:value={currentFormData.quran}>
							<option value="">Pilih Surah</option>
							{#each alquranList as alquran}
								<option value={alquran.id}>{alquran.nama_surat}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label for="pengajar_quran">Pengajar Al-Quran</label>
						<input
							type="text"
							id="pengajar_quran"
							bind:value={currentFormData.pengajar_quran}
							placeholder="Nama pengajar"
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="ayat_awal">Ayat Awal</label>
						<input
							type="number"
							id="ayat_awal"
							bind:value={currentFormData.ayat_awal}
							placeholder="1"
							min="1"
						/>
					</div>
					<div class="form-group">
						<label for="ayat_akhir">Ayat Akhir</label>
						<input
							type="number"
							id="ayat_akhir"
							bind:value={currentFormData.ayat_akhir}
							placeholder="10"
							min="1"
						/>
					</div>
				</div>
			</div>

			<!-- Hadist Section -->
			<div class="form-section">
				<h3 class="section-title">
					<BookOpen size={18} />
					<span>Materi Hadist</span>
				</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="hadist">Kitab Hadist</label>
						<select id="hadist" bind:value={currentFormData.hadist}>
							<option value="">Pilih Kitab Hadist</option>
							{#each hadistList as hadist}
								<option value={hadist.id}>{hadist.nama_hadist}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label for="pengajar_hadist">Pengajar Hadist</label>
						<input
							type="text"
							id="pengajar_hadist"
							bind:value={currentFormData.pengajar_hadist}
							placeholder="Nama pengajar"
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="hal_awal">Halaman Awal</label>
						<input
							type="number"
							id="hal_awal"
							bind:value={currentFormData.hal_awal}
							placeholder="1"
							min="1"
						/>
					</div>
					<div class="form-group">
						<label for="hal_akhir">Halaman Akhir</label>
						<input
							type="number"
							id="hal_akhir"
							bind:value={currentFormData.hal_akhir}
							placeholder="10"
							min="1"
						/>
					</div>
				</div>
			</div>

			<!-- Additional Information -->
			<div class="form-section">
				<h3 class="section-title">
					<User size={18} />
					<span>Informasi Tambahan</span>
				</h3>

				<div class="form-row">
					<div class="form-group">
						<label for="penasehat">Penasehat</label>
						<input
							type="text"
							id="penasehat"
							bind:value={currentFormData.penasehat}
							placeholder="Nama penasehat"
						/>
					</div>
					<div class="form-group">
						<label for="infaq">Infaq (Rp)</label>
						<input
							type="number"
							id="infaq"
							bind:value={currentFormData.infaq}
							min="0"
							step="1000"
							placeholder="0"
						/>
					</div>
				</div>
			</div>
		</div>

		<div class="form-footer">
			<button type="submit" class="btn-submit">
				<BookOpen size={18} />
				<span>Lanjut ke Absensi</span>
			</button>
		</div>
	</form>
</div>

<style>
	.pengajian-form {
		padding: 2rem;
	}

	.form-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.form-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.form-header p {
		color: #6b7280;
		margin: 0;
	}

	.form-grid {
		display: grid;
		gap: 2rem;
	}

	.form-section {
		background: #f9fafb;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-row:last-child {
		margin-bottom: 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		background: white;
		transition: all 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.kategori-checkboxes,
	.tingkat-checkboxes {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.tingkat-radios {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.checkbox-item,
	.radio-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		transition: background-color 0.2s ease;
	}

	.checkbox-item:hover,
	.radio-item:hover {
		background: #f9fafb;
	}

	.checkbox-item input[type="checkbox"],
	.radio-item input[type="radio"] {
		width: 18px;
		height: 18px;
		accent-color: #3b82f6;
		cursor: pointer;
	}

	.checkbox-label,
	.radio-label {
		font-size: 0.875rem;
		color: #374151;
		font-weight: 500;
	}

	.form-footer {
		display: flex;
		justify-content: center;
		padding-top: 2rem;
		margin-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.btn-submit {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
		min-width: 200px;
		justify-content: center;
	}

	.btn-submit:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.pengajian-form {
			padding: 1rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.form-section {
			padding: 1rem;
		}
	}
</style>
