<script>
	import { createEventDispatcher } from 'svelte';
	import { AbsensiService } from '$lib/services/absensi.js';
	import { X, Calendar, MapPin, Users, BookOpen, Clock, User, DollarSign } from 'lucide-svelte';

	export let absensiId = null;
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let absensiData = null;
	let absensiDetail = [];
	let isLoading = true;
	let error = null;

	$: if (absensiId) {
		loadAbsensiData();
	}

	async function loadAbsensiData() {
		isLoading = true;
		error = null;
		try {
			const [headerData, detailData] = await Promise.all([
				AbsensiService.getAbsensiById(absensiId),
				AbsensiService.getAbsensiDetail(absensiId)
			]);
			absensiData = headerData;
			absensiDetail = detailData;
		} catch (err) {
			console.error('Error loading absensi data:', err);
			error = err.message;
		} finally {
			isLoading = false;
		}
	}

	function close() {
		dispatch('close');
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatTime(timeString) {
		if (!timeString) return '-';
		return timeString.slice(0, 5);
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'H': return 'Hadir';
			case 'I': return 'Izin';
			case 'A': return 'Alpha';
			case 'S': return 'Sakit';
			default: return status;
		}
	}

	function getStatusClass(status) {
		switch (status) {
			case 'H': return 'status-hadir';
			case 'I': return 'status-izin';
			case 'A': return 'status-alpha';
			case 'S': return 'status-sakit';
			default: return '';
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={close}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>Detail Absensi Pengajian</h2>
				<button class="btn-close" on:click={close}>
					<X size={20} />
				</button>
			</div>

			<div class="modal-body">
				{#if isLoading}
					<div class="loading-state">
						<div class="spinner"></div>
						<p>Memuat data absensi...</p>
					</div>
				{:else if error}
					<div class="error-state">
						<p>Error: {error}</p>
					</div>
				{:else if absensiData}
					<!-- Header Information -->
					<div class="info-section">
						<h3>Informasi Pengajian</h3>
						<div class="info-grid">
							<div class="info-item">
								<Calendar size={16} />
								<span class="label">Tanggal:</span>
								<span class="value">{formatDate(absensiData.tgl)}</span>
							</div>
							<div class="info-item">
								<Clock size={16} />
								<span class="label">Waktu:</span>
								<span class="value">{formatTime(absensiData.jam_mulai)} - {formatTime(absensiData.jam_akhir)}</span>
							</div>
							<div class="info-item">
								<BookOpen size={16} />
								<span class="label">Pengajian:</span>
								<span class="value">{absensiData.mpengajian?.nama_pengajian || '-'}</span>
							</div>
							<div class="info-item">
								<MapPin size={16} />
								<span class="label">Tempat:</span>
								<span class="value">{absensiData.mmasjid?.nama_masjid || '-'}</span>
							</div>
							<div class="info-item">
								<Users size={16} />
								<span class="label">Kelompok:</span>
								<span class="value">{absensiData.kelompok || '-'}</span>
							</div>
							<div class="info-item">
								<span class="label">Tingkat:</span>
								<span class="value">Tingkat {absensiData.tingkat || 1}</span>
							</div>
						</div>
					</div>

					<!-- Materi Section -->
					<div class="info-section">
						<h3>Materi Pengajian</h3>
						<div class="materi-grid">
							<div class="materi-item">
								<h4>Al-Quran</h4>
								<p><strong>Surah:</strong> {absensiData.malquran?.nama_surat || '-'}</p>
								<p><strong>Ayat:</strong> {absensiData.ayat_awal || '-'} - {absensiData.ayat_akhir || '-'}</p>
								<p><strong>Pengajar:</strong> {absensiData.pengajar_quran || '-'}</p>
							</div>
							<div class="materi-item">
								<h4>Hadist</h4>
								<p><strong>Kitab:</strong> {absensiData.mhadist?.nama_hadist || '-'}</p>
								<p><strong>Halaman:</strong> {absensiData.hal_awal || '-'} - {absensiData.hal_akhir || '-'}</p>
								<p><strong>Pengajar:</strong> {absensiData.pengajar_hadist || '-'}</p>
							</div>
						</div>
					</div>

					<!-- Additional Info -->
					<div class="info-section">
						<h3>Informasi Lainnya</h3>
						<div class="info-grid">
							<div class="info-item">
								<User size={16} />
								<span class="label">Penasehat:</span>
								<span class="value">{absensiData.penasehat || '-'}</span>
							</div>
							<div class="info-item">
								<DollarSign size={16} />
								<span class="label">Infaq:</span>
								<span class="value">Rp {(absensiData.infaq || 0).toLocaleString('id-ID')}</span>
							</div>
							<div class="info-item">
								<span class="label">Jumlah Peserta:</span>
								<span class="value">{absensiData.peserta || 0} jamaah</span>
							</div>
						</div>
					</div>

					<!-- Attendance Detail -->
					{#if absensiDetail.length > 0}
						<div class="info-section">
							<h3>Detail Kehadiran Jamaah</h3>
							<div class="attendance-table">
								<table>
									<thead>
										<tr>
											<th>No</th>
											<th>Nama Jamaah</th>
											<th>Kelompok</th>
											<th>Kategori</th>
											<th>Status</th>
											<th>Jam Datang</th>
											<th>Keterangan</th>
										</tr>
									</thead>
									<tbody>
										{#each absensiDetail as detail, index}
											<tr>
												<td>{index + 1}</td>
												<td class="nama-jamaah">{detail.mjamaah?.nama || '-'}</td>
												<td>{detail.mjamaah?.mkelompok?.nama_kelompok || '-'}</td>
												<td>{detail.mjamaah?.mkategori?.category || '-'}</td>
												<td>
													<span class="status-badge {getStatusClass(detail.status)}">
														{getStatusLabel(detail.status)}
													</span>
												</td>
												<td>{formatTime(detail.jam_datang)}</td>
												<td>{detail.keterangan || '-'}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Modal Footer with Edit Button -->
			{#if absensiData}
				<div class="modal-footer">
					<button class="btn-edit" on:click={() => dispatch('edit', { id: absensiId })}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
							<path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
						</svg>
						Edit Absensi
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
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
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		max-width: 900px;
		max-height: 90vh;
		width: 100%;
		overflow: hidden;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		border-bottom: 1px solid #e5e7eb;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	.btn-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: #f3f4f6;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #6b7280;
	}

	.btn-close:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.modal-body {
		padding: 2rem;
		overflow-y: auto;
		max-height: calc(90vh - 100px);
	}

	.modal-footer {
		padding: 1.5rem 2rem;
		border-top: 1px solid #e5e7eb;
		background: #f9fafb;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.btn-edit {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
	}

	.btn-edit:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.loading-state, .error-state {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
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

	.info-section {
		margin-bottom: 2rem;
	}

	.info-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.info-item :global(svg) {
		color: #6b7280;
		flex-shrink: 0;
	}

	.label {
		font-weight: 500;
		color: #374151;
		min-width: 80px;
	}

	.value {
		color: #1f2937;
		font-weight: 400;
	}

	.materi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.materi-item {
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
	}

	.materi-item h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
	}

	.materi-item p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		color: #374151;
	}

	.attendance-table {
		overflow-x: auto;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.attendance-table table {
		width: 100%;
		border-collapse: collapse;
	}

	.attendance-table th {
		background: #f8fafc;
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
		font-size: 0.875rem;
	}

	.attendance-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
		color: #374151;
	}

	.attendance-table tbody tr:hover {
		background: #f9fafb;
	}

	.nama-jamaah {
		font-weight: 500;
		color: #1f2937;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-hadir {
		background: #dcfce7;
		color: #166534;
	}

	.status-izin {
		background: #fef3c7;
		color: #92400e;
	}

	.status-alpha {
		background: #fecaca;
		color: #991b1b;
	}

	.status-sakit {
		background: #e0e7ff;
		color: #3730a3;
	}

	@media (max-width: 768px) {
		.modal-content {
			margin: 0.5rem;
			max-height: 95vh;
		}

		.modal-header {
			padding: 1rem 1.5rem;
		}

		.modal-body {
			padding: 1.5rem;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.materi-grid {
			grid-template-columns: 1fr;
		}

		.attendance-table {
			font-size: 0.8rem;
		}

		.attendance-table th,
		.attendance-table td {
			padding: 0.5rem;
		}
	}
</style>
