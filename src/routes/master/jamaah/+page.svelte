<script>
	import CrudManager from '$lib/components/master/CrudManager.svelte';
	import { JamaahService } from '$lib/services/masterData.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';

	const columns = [
		// Basic Information
		{ key: 'nama', label: 'Nama Lengkap', required: true, section: 'Data Pribadi' },
		{ key: 'tgl_lahir', label: 'Tanggal Lahir', type: 'date' },
		{ key: 'jk', label: 'Jenis Kelamin', type: 'select', required: true, options: [
			{ value: 'L', label: 'Laki-laki' },
			{ value: 'P', label: 'Perempuan' }
		]},
		{ key: 'status_nikah', label: 'Status Nikah', type: 'select', options: [
			{ value: '0', label: 'Belum Menikah' },
			{ value: '1', label: 'Sudah Menikah' }
		]},
        	{ key: 'id_kategori', label: 'Kategori', foreignKey: 'kategori', required: true },
		{ key: 'id_kelompok', label: 'Kelompok', foreignKey: 'kelompok', required: true },
		{ key: 'id_dapukan', label: 'Dapukan', foreignKey: 'dapukan' },

		// Contact Information
		{ key: 'alamat', label: 'Alamat', type: 'textarea', section: 'Kontak & Alamat' },
		{ key: 'email', label: 'Email'  },
		{ key: 'telp_murid', label: 'Telepon Murid' },

		// Education Information
		{ key: 'pendidikan', label: 'Tingkat Pendidikan', type: 'select', section: 'Pendidikan', options: [
			{ value: '1', label: 'SD' },
			{ value: '2', label: 'SMP' },
			{ value: '3', label: 'SMA/SMK' },
			{ value: '4', label: 'D3' },
			{ value: '5', label: 'S1' },
			{ value: '6', label: 'S2' },
			{ value: '7', label: 'S3' }
		]},
		{ key: 'sekolah', label: 'Sekolah/Universitas' },
		{ key: 'jurusan', label: 'Jurusan' },

		// Guardian Information
		{ key: 'walimurid', label: 'Nama Wali', section: 'Data Wali' },
		{ key: 'telp_wali', label: 'Telepon Wali' },
		{ key: 'alamat_wali', label: 'Alamat Wali', type: 'textarea' },
		{ key: 'email_wali', label: 'Email Wali'  },


	];

	const displayColumns = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'usia', label: 'Usia', computed: true },
		{ key: 'id_kategori', label: 'Kategori', foreignKey: 'kategori' },
		{ key: 'id_kelompok', label: 'Kelompok', foreignKey: 'kelompok' },
		{ key: 'jk', label: 'JK' }
	];

	const filters = [
		{
			key: 'jk',
			label: 'Jenis Kelamin',
			type: 'select',
			options: [
				{ value: 'L', label: 'Laki-laki' },
				{ value: 'P', label: 'Perempuan' }
			]
		},
		{
			key: 'id_kategori',
			label: 'Kategori',
			foreignKey: 'kategori'
		},
		{
			key: 'id_kelompok',
			label: 'Kelompok',
			foreignKey: 'kelompok'
		}
	];

	const foreignKeyLoaders = {
		kategori: async () => {
			const data = await JamaahService.getAllKategori();
			return data.map(item => ({ id: item.id, name: item.category }));
		},
		kelompok: async () => {
			const data = await JamaahService.getAllKelompok();
			return data.map(item => ({ id: item.id, name: item.nama_kelompok }));
		},
		dapukan: async () => {
			const data = await JamaahService.getAllDapukan();
			return data.map(item => ({ id: item.id, name: item.nama_dapukan }));
		}
	};

	const service = {
		getAll: JamaahService.getAllJamaah,
		create: JamaahService.createJamaah,
		update: JamaahService.updateJamaah,
		delete: JamaahService.deleteJamaah,
	};
</script>

<svelte:head>
	<title>Master Jamaah - Absensi Pengajian</title>
</svelte:head>

<AppHeader title="Master Jamaah" showBack={true} />

<main class="app-content">
	<CrudManager
		{service}
		{columns}
		{displayColumns}
		{foreignKeyLoaders}
		{filters}
		title="Jamaah"
		showGenderIcon={true}
		showCategoryBadge={true}
	/>
</main>

<BottomNav />

<style>
	.app-content {
		padding: 1rem 1rem 100px 1rem;
	}
</style>
