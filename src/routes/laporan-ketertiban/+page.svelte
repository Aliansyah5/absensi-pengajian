<script>
	import { onMount, tick } from 'svelte';
	import { auth } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import { AbsensiService } from '$lib/services/absensi.js';
	import { JamaahService } from '$lib/services/masterData.js';
	import { supabase } from '$lib/utils/supabase.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { Calendar, Download, Filter, Users, Eye, FileText, Award, Clock, Percent, TrendingUp, BarChart3, BookOpen, GraduationCap } from 'lucide-svelte';

	let isLoading = true;
	let isLoadingHistory = false;
	let error = null;
	let innerWidth = 0;
	let selectedBulan = new Date().getMonth() + 1;
	let selectedTahun = new Date().getFullYear();
	let selectedGender = ''; // '' = Semua, 'L' = Putra, 'P' = Putri
	let selectedTingkat = ''; // '' = Semua, '1' = Tingkat 1, '2' = Tingkat 2, etc.

	// Main data for jamaah attendance report
	let jamaahAttendanceData = [];
	let selectedJamaah = null;
	let jamaahHistory = [];
	let showHistoryModal = false;
	let availableTingkat = []; // Dynamic tingkat from mkategori table

	$: isDesktop = innerWidth >= 768;

	const bulanNames = [
		'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
		'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
	];

	// Check authentication
	onMount(async () => {
		auth.initialize();

		const unsubscribe = auth.subscribe(async (state) => {
			if (!state.isLoading) {
				if (!state.isAuthenticated) {
					goto('/login');
					return;
				}

				await loadInitialData();
			}
		});

		return unsubscribe;
	});

	async function loadInitialData() {
		isLoading = true;
		error = null;
		try {
			// Debug database connection first
			await debugDatabaseConnection();

			// Load available tingkat from mkategori table
			await loadAvailableTingkat();

			await loadJamaahAttendanceData();
		} catch (error) {
			console.error('Error loading data:', error);
			error = 'Gagal memuat data laporan ketertiban. Silakan coba lagi.';
		} finally {
			isLoading = false;
		}
	}

	async function loadAvailableTingkat() {
		try {
			console.log('Loading available tingkat from mkategori...');

			const { data: kategoriData, error: kategoriError } = await supabase
				.from('mkategori')
				.select('id, category')
				.eq('active', 1)
				.order('id', { ascending: true });

			if (kategoriError) {
				console.error('Error loading kategori:', kategoriError);
				// Gunakan fallback tingkat jika query gagal
				availableTingkat = [
					{ tingkat: '1', category: 'Tingkat 1' },
					{ tingkat: '2', category: 'Tingkat 2' },
					{ tingkat: '3', category: 'Tingkat 3' },
					{ tingkat: '4', category: 'Tingkat 4' },
					{ tingkat: '5', category: 'Tingkat 5' }
				];
				return;
			}

			if (kategoriData && kategoriData.length > 0) {
				// Get unique tingkat values from mkategori
				const uniqueTingkat = [];
				const tingkatMap = new Map();

				kategoriData.forEach(item => {
					if (item.id && !tingkatMap.has(item.id)) {
						tingkatMap.set(item.id, true);
						uniqueTingkat.push({
							tingkat: item.id,
							category: item.category
						});
					}
				});

				availableTingkat = uniqueTingkat.sort((a, b) => parseInt(a.tingkat) - parseInt(b.tingkat));
				console.log('Available tingkat from mkategori:', availableTingkat);

			} else {
				// Fallback if no data
				availableTingkat = [
					{ tingkat: '1', category: 'Tingkat 1' },
					{ tingkat: '2', category: 'Tingkat 2' },
					{ tingkat: '3', category: 'Tingkat 3' },
					{ tingkat: '4', category: 'Tingkat 4' },
					{ tingkat: '5', category: 'Tingkat 5' }
				];
			}
		} catch (error) {
			console.error('Error loading available tingkat:', error);
			// Use fallback tingkat on error
			availableTingkat = [
				{ tingkat: '1', category: 'Tingkat 1' },
				{ tingkat: '2', category: 'Tingkat 2' },
				{ tingkat: '3', category: 'Tingkat 3' },
				{ tingkat: '4', category: 'Tingkat 4' },
				{ tingkat: '5', category: 'Tingkat 5' }
			];
		}
	}

	async function loadJamaahAttendanceData() {
		try {
			console.log('Loading jamaah attendance data...');

			// Prepare filters for jamaah
			const jamaahFilters = {};
			if (selectedGender) {
				jamaahFilters.jk = selectedGender;
			}
			if (selectedTingkat) {
				// Filter by kategori tingkat instead of direct tingkat
				// First get kategori IDs that match the selected tingkat
				const { data: kategoriForTingkat, error: kategoriError } = await supabase
					.from('mkategori')
					.select('id')
					.eq('id', selectedTingkat)
					.eq('active', 1);

				if (!kategoriError && kategoriForTingkat && kategoriForTingkat.length > 0) {
					const kategoriIds = kategoriForTingkat.map(k => k.id);
					jamaahFilters.kategori = kategoriIds; // Use kategori array for filtering
					console.log(`Filtering by tingkat ${selectedTingkat}, kategori IDs:`, kategoriIds);
				} else {
					console.warn(`No kategori found for tingkat ${selectedTingkat}`);
					// If no kategori found, set empty array to return no results
					jamaahFilters.kategori = [];
				}
			}

			// Get jamaah with filters applied
			const jamaahList = await JamaahService.getAllJamaah(jamaahFilters);
			const filterDescription = [
				selectedGender ? `Gender: ${selectedGender}` : '',
				selectedTingkat ? `Tingkat: ${selectedTingkat}` : ''
			].filter(Boolean).join(', ') || 'all filters';

			console.log('Loaded jamaah list:', jamaahList.length, 'jamaah found', `(${filterDescription})`);

			if (!jamaahList || jamaahList.length === 0) {
				console.warn('No jamaah data found');
				jamaahAttendanceData = [];
				return;
			}

            const year = parseInt(selectedTahun);
            const month = parseInt(selectedBulan);

            const startDateObj = new Date(year, month - 1, 1);
            const endDateObj = new Date(year, month, 0);

            // Format jadi YYYY-MM-DD di zona waktu lokal (misal WIB)
            const startDate = startDateObj.toLocaleDateString('en-CA'); // 'en-CA' => format ISO lokal
            const endDate = endDateObj.toLocaleDateString('en-CA');


			console.log('Date range:', startDate, 'to', endDate);
			console.log('Fetching attendance data from absensi and dabsensi tables...');

			const attendancePromises = jamaahList.map(async (jamaah) => {
				try {
					// Get attendance history for this jamaah in the selected period using real database
					let history = await AbsensiService.getLaporanAbsensiJamaah(jamaah.id, {
						tanggal_mulai: startDate,
						tanggal_akhir: endDate
					});

					console.log(`Raw history for ${jamaah.nama} (ID: ${jamaah.id}):`, history);

					// If main method returns empty, try the simple method
					if (!history || history.length === 0) {
						console.log(`Trying simple method for ${jamaah.nama}...`);
						try {
							history = await AbsensiService.getLaporanAbsensiJamaahSimple(jamaah.id, {
								tanggal_mulai: startDate,
								tanggal_akhir: endDate
							});
							console.log(`Simple method result for ${jamaah.nama}:`, history);
						} catch (simpleError) {
							console.error(`Simple method also failed for ${jamaah.nama}:`, simpleError);
						}
					}

					// Calculate attendance statistics from real data
					const totalSessions = history?.length || 0;
					const hadirCount = history?.filter(h => h.status === 'H').length || 0;
					const izinCount = history?.filter(h => h.status === 'I').length || 0;
					const absenCount = history?.filter(h => h.status === 'A').length || 0;

					const persentaseKehadiran = totalSessions > 0 ? (hadirCount / totalSessions * 100) : 0;

					console.log(`Jamaah ${jamaah.nama}: ${totalSessions} sessions, ${hadirCount} hadir, ${izinCount} izin, ${absenCount} absen (${persentaseKehadiran.toFixed(1)}%)`);

					return {
						...jamaah,
						total_sessions: totalSessions,
						hadir_count: hadirCount,
						izin_count: izinCount,
						absen_count: absenCount,
						persentase_kehadiran: persentaseKehadiran,
						history: history || []
					};
				} catch (jamaahError) {
					console.error(`Error loading attendance for jamaah ${jamaah.nama} (ID: ${jamaah.id}):`, jamaahError);

					// If there's a database error, try a direct query approach
					try {
						console.log(`Trying direct query for jamaah ${jamaah.nama}...`);

						// Direct query to dabsensi table with absensi data
						const { data: directHistory, error: directError } = await supabase
							.from('dabsensi')
							.select(`
								id,
								id_siswa,
								status,
								keterangan,
								created_at,
								absensi!inner(
									id,
									tgl,
									pengajian,
									mpengajian(nama_pengajian)
								)
							`)
							.eq('id_siswa', jamaah.id)
							.eq('absensi.active', 1);

						if (directError) {
							console.error(`Direct query failed for jamaah ${jamaah.nama}:`, directError);
						} else {
							console.log(`Direct query result for ${jamaah.nama}:`, directHistory);

							// If direct query has data, use it
							if (directHistory && directHistory.length > 0) {
								const totalSessions = directHistory.length;
								const hadirCount = directHistory.filter(h => h.status === 'H').length;
								const izinCount = directHistory.filter(h => h.status === 'I').length;
								const absenCount = directHistory.filter(h => h.status === 'A').length;
								const persentaseKehadiran = totalSessions > 0 ? (hadirCount / totalSessions * 100) : 0;

								console.log(`Direct query success for ${jamaah.nama}: ${totalSessions} sessions, ${persentaseKehadiran.toFixed(1)}%`);

								return {
									...jamaah,
									total_sessions: totalSessions,
									hadir_count: hadirCount,
									izin_count: izinCount,
									absen_count: absenCount,
									persentase_kehadiran: persentaseKehadiran,
									history: directHistory
								};
							}
						}
					} catch (directQueryError) {
						console.error(`Direct query error for ${jamaah.nama}:`, directQueryError);
					}

					// Return jamaah with zero attendance if all queries fail
					return {
						...jamaah,
						total_sessions: 0,
						hadir_count: 0,
						izin_count: 0,
						absen_count: 0,
						persentase_kehadiran: 0,
						history: []
					};
				}
			});			jamaahAttendanceData = await Promise.all(attendancePromises);

			// Sort by attendance percentage (highest first)
			jamaahAttendanceData.sort((a, b) => b.persentase_kehadiran - a.persentase_kehadiran);

			console.log('Final attendance data:', jamaahAttendanceData.length, 'jamaah processed');

		} catch (error) {
			console.error('Error loading jamaah attendance data:', error);
			console.error('Error details:', error.message);

			// Show a more informative fallback
			jamaahAttendanceData = [];

			// Optionally show user-friendly error message
			// You could set an error state here to show in the UI
		}
	}	function handlePeriodChange() {
		loadInitialData();
	}

	async function handleJamaahClick(jamaah) {
		selectedJamaah = jamaah;
		isLoadingHistory = true;

		try {
			console.log('Loading detailed history for jamaah:', jamaah.nama);

			// First, try to use the history already loaded with this jamaah
			if (jamaah.history && jamaah.history.length > 0) {
				console.log('Using already loaded history:', jamaah.history.length, 'records');
				console.log('Sample history structure:', jamaah.history[0]);
				jamaahHistory = jamaah.history;
				showHistoryModal = true;
				return;
			}

			// If no history in jamaah object, load detailed history for this jamaah
			// Get first day of selected month (day 1)
			const startDate = new Date(selectedTahun, selectedBulan - 1, 1).toISOString().split('T')[0];
			// Get last day of selected month (day 0 of next month = last day of current month)
			const endDate = new Date(selectedTahun, selectedBulan, 0).toISOString().split('T')[0];

			console.log(`Fetching fresh history for ${jamaah.nama} from ${startDate} to ${endDate}`);

			// Try the main method first
			let history = null;
			try {
				history = await AbsensiService.getLaporanAbsensiJamaah(jamaah.id, {
					tanggal_mulai: startDate,
					tanggal_akhir: endDate
				});
				console.log('Main method result:', history?.length || 0, 'records');
			} catch (mainError) {
				console.warn('Main method failed, trying simple method:', mainError.message);

				// Try the simple method as fallback
				try {
					history = await AbsensiService.getLaporanAbsensiJamaahSimple(jamaah.id, {
						tanggal_mulai: startDate,
						tanggal_akhir: endDate
					});
					console.log('Simple method result:', history?.length || 0, 'records');
				} catch (simpleError) {
					console.error('Simple method also failed:', simpleError.message);

					// Try direct query as last resort
					try {
						console.log('Trying direct query as last resort...');
						const { data: directHistory, error: directError } = await supabase
							.from('dabsensi')
							.select(`
								id,
								id_siswa,
								status,
								keterangan,
								created_at,
								updated_at,
								absensi!inner(
									id,
									tgl,
									pengajian,
									mpengajian(nama_pengajian)
								)
							`)
							.eq('id_siswa', jamaah.id)
							.eq('absensi.active', 1);

						if (directError) {
							throw directError;
						}

						// Use the direct query result with proper structure
						history = directHistory || [];

						console.log('Direct query result:', history.length, 'records');
					} catch (directError) {
						console.error('All methods failed:', directError.message);
						history = [];
					}
				}
			}

			jamaahHistory = history || [];
			console.log('Final history count:', jamaahHistory.length);
			showHistoryModal = true;
		} catch (error) {
			console.error('Error in handleJamaahClick:', error);

			// Still show modal but with empty history and error message
			jamaahHistory = [];
			showHistoryModal = true;

			// You can show error message in modal if needed
			console.warn('Failed to load attendance history, showing empty modal');
		} finally {
			isLoadingHistory = false;
		}
	}	function closeHistoryModal() {
		showHistoryModal = false;
		selectedJamaah = null;
		jamaahHistory = [];
	}

	function formatDate(dateString) {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Enhanced debug function to test database connectivity and data structure
	async function debugDatabaseConnection() {
		try {
			console.log('=== DEBUG: Testing database connection ===');

			// Test jamaah table
			const { data: jamaahTest, error: jamaahError } = await supabase
				.from('mjamaah')
				.select('id, nama, jk, id_kategori')
				.eq('active', 1)
				.limit(5);

			console.log('Jamaah test result:', { data: jamaahTest, error: jamaahError });

			// Test mkategori table structure and data
			const { data: kategoriTest, error: kategoriError } = await supabase
				.from('mkategori')
				.select('id, category, tingkat, active')
				.eq('active', 1)
				.limit(10);

			console.log('Kategori test result:', { data: kategoriTest, error: kategoriError });

			// Test absensi table structure and data
			const { data: absensiTest, error: absensiError } = await supabase
				.from('absensi')
				.select('id, tgl, pengajian, active, created_at')
				.eq('active', 1)
				.limit(5);

			console.log('Absensi test result:', { data: absensiTest, error: absensiError });

			// Test dabsensi table structure and data
			const { data: dabsensiTest, error: dabsensiError } = await supabase
				.from('dabsensi')
				.select('id, id_siswa, status, created_at')
				.limit(5);

			console.log('Dabsensi test result:', { data: dabsensiTest, error: dabsensiError });

			// Test relationship between jamaah and kategori
			const { data: jamaahKategoriTest, error: jamaahKategoriError } = await supabase
				.from('mjamaah')
				.select(`
					id,
					nama,
					jk,
					mkategori!inner(id, category, tingkat)
				`)
				.eq('active', 1)
				.eq('mkategori.active', 1)
				.limit(3);

			console.log('Jamaah-Kategori relation test:', { data: jamaahKategoriTest, error: jamaahKategoriError });

			// Test relationship between absensi and dabsensi
			const { data: relationTest, error: relationError } = await supabase
				.from('dabsensi')
				.select(`
					id,
					id_siswa,
					status,
					absensi!inner(id, tgl, pengajian, active)
				`)
				.eq('absensi.active', 1)
				.limit(3);

			console.log('Relation test result:', { data: relationTest, error: relationError });

			// Count total records in each table
			const { count: jamaahCount } = await supabase
				.from('mjamaah')
				.select('*', { count: 'exact', head: true })
				.eq('active', 1);

			const { count: kategoriCount } = await supabase
				.from('mkategori')
				.select('*', { count: 'exact', head: true })
				.eq('active', 1);

			const { count: absensiCount } = await supabase
				.from('absensi')
				.select('*', { count: 'exact', head: true })
				.eq('active', 1);

			const { count: dabsensiCount } = await supabase
				.from('dabsensi')
				.select('*', { count: 'exact', head: true });

			console.log('Record counts:', {
				jamaah: jamaahCount,
				kategori: kategoriCount,
				absensi: absensiCount,
				dabsensi: dabsensiCount
			});

			console.log('=== END DEBUG ===');
		} catch (error) {
			console.error('Debug database connection failed:', error);
		}
	}

	// Function to create sample attendance data for testing
	async function createSampleAttendanceData() {
		try {
			console.log('=== CREATING SAMPLE DATA ===');

			// First, get some jamaah IDs to work with
			const { data: jamaahList, error: jamaahError } = await supabase
				.from('mjamaah')
				.select('id, nama, jk')
				.eq('active', 1)
				.limit(5);

			if (jamaahError || !jamaahList || jamaahList.length === 0) {
				console.error('No jamaah found to create sample data');
				alert('Tidak ada data jamaah ditemukan. Pastikan tabel mjamaah memiliki data.');
				return;
			}

			console.log('Found jamaah for sample data:', jamaahList);

			// Create sample absensi sessions for current month
			const currentDate = new Date();
			const currentMonth = currentDate.getMonth();
			const currentYear = currentDate.getFullYear();

			// Create 4 sample sessions this month
			const sampleDates = [];
			for (let i = 1; i <= 4; i++) {
				const date = new Date(currentYear, currentMonth, i * 7); // Weekly sessions
				if (date <= currentDate) {
					sampleDates.push(date.toISOString().split('T')[0]);
				}
			}

			console.log('Creating sessions for dates:', sampleDates);

			let createdSessions = 0;
			const sampleStatuses = ['H', 'H', 'H', 'I', 'A']; // Mostly present, some absent/excuse

			for (const sessionDate of sampleDates) {
				// Check if absensi already exists for this date
				const { data: existingAbsensi, error: existingError } = await supabase
					.from('absensi')
					.select('id')
					.eq('tgl', sessionDate)
					.eq('active', 1)
					.limit(1)
					.single();

				let absensiId;

				if (existingError || !existingAbsensi) {
					// Create a new absensi session
					const { data: newAbsensi, error: createError } = await supabase
						.from('absensi')
						.insert({
							tgl: sessionDate,
							pengajian: 1, // Assuming pengajian ID 1 exists
							tempat: 1, // Assuming masjid ID 1 exists
							jam_mulai: '19:00',
							jam_akhir: '20:30',
							peserta: jamaahList.length.toString(),
							tingkat: '1',
							active: 1,
							user_modified: 'system',
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString()
						})
						.select('id')
						.single();

					if (createError) {
						console.error('Failed to create sample absensi for', sessionDate, ':', createError);
						continue;
					}

					absensiId = newAbsensi.id;
					console.log('Created new absensi session:', absensiId, 'for date:', sessionDate);
				} else {
					absensiId = existingAbsensi.id;
					console.log('Using existing absensi session:', absensiId, 'for date:', sessionDate);
				}

				// Create sample dabsensi records for each jamaah
				for (let i = 0; i < jamaahList.length; i++) {
					const jamaah = jamaahList[i];
					const status = sampleStatuses[i % sampleStatuses.length];

					// Check if record already exists
					const { data: existing } = await supabase
						.from('dabsensi')
						.select('id')
						.eq('id', absensiId)
						.eq('id_siswa', jamaah.id)
						.single();

					if (!existing) {
						const { data: newRecord, error: insertError } = await supabase
							.from('dabsensi')
							.insert({
								id: absensiId,
								id_siswa: jamaah.id,
								status: status,
								keterangan: status === 'I' ? 'Sakit' : status === 'A' ? 'Tanpa keterangan' : '',
								jam_datang: '19:00',
								user_modified: 'system',
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString()
							});

						if (insertError) {
							console.error(`Failed to create dabsensi for ${jamaah.nama}:`, insertError);
						} else {
							console.log(`Created dabsensi for ${jamaah.nama}: ${status} on ${sessionDate}`);
						}
					} else {
						console.log(`Dabsensi already exists for ${jamaah.nama} on ${sessionDate}`);
					}
				}

				createdSessions++;
			}

			console.log('=== SAMPLE DATA CREATION COMPLETE ===');
			alert(`Berhasil membuat ${createdSessions} sesi absensi dengan data kehadiran untuk ${jamaahList.length} jamaah. Silakan refresh halaman untuk melihat data.`);

			// Refresh the data
			await loadInitialData();

		} catch (error) {
			console.error('Failed to create sample data:', error);
			alert('Gagal membuat sample data: ' + error.message);
		}
	}	function getAttendanceLevel(percentage) {
		if (percentage >= 90) return { class: 'excellent', label: 'Sangat Baik', color: '#16a34a' };
		if (percentage >= 80) return { class: 'good', label: 'Baik', color: '#2563eb' };
		if (percentage >= 70) return { class: 'fair', label: 'Cukup', color: '#d97706' };
		return { class: 'poor', label: 'Kurang', color: '#dc2626' };
	}

	function getStatusLabel(status) {
		switch (status) {
			case 'H': return { label: 'Hadir', class: 'hadir', color: '#16a34a' };
			case 'I': return { label: 'Izin', class: 'izin', color: '#d97706' };
			case 'A': return { label: 'Absen', class: 'absen', color: '#dc2626' };
			default: return { label: 'Unknown', class: 'unknown', color: '#6b7280' };
		}
	}

	function toggleFilters() {
		console.log('Toggle filters clicked');
	}

	$: currentMonthYear = `${bulanNames[selectedBulan - 1]} ${selectedTahun}`;
</script>

<svelte:head>
	<title>Laporan Ketertiban - Absensi Pengajian</title>
</svelte:head>

<svelte:window bind:innerWidth />

<AppHeader
	title="Laporan Ketertiban"
	on:search-click={toggleFilters}
	showSearch={true}
/>

<main class="app-content" class:desktop={isDesktop}>
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-content">
				<div class="spinner"></div>
				<p class="loading-text">Memuat data laporan ketertiban...</p>
			</div>
		</div>
	{:else}
		<!-- Period Filter Section -->
		<div class="period-filter">
			<div class="filter-container">
				<div class="filter-header">
					<h3 class="filter-title">Periode Laporan</h3>
				</div>

				<div class="filter-grid">
					<div class="filter-group">
						<label for="bulan" class="filter-label">
							<Calendar size={16} />
							Bulan
						</label>
						<select
							id="bulan"
							bind:value={selectedBulan}
							on:change={handlePeriodChange}
							class="filter-select"
						>
							{#each bulanNames as bulan, index}
								<option value={index + 1}>{bulan}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="tahun" class="filter-label">
							<Clock size={16} />
							Tahun
						</label>
						<select
							id="tahun"
							bind:value={selectedTahun}
							on:change={handlePeriodChange}
							class="filter-select"
						>
							{#each [2023, 2024, 2025, 2026, 2027] as tahun}
								<option value={tahun}>{tahun}</option>
							{/each}
						</select>
					</div>

					<div class="filter-group">
						<label for="gender" class="filter-label">
							<Users size={16} />
							Jenis Kelamin
						</label>
						<select
							id="gender"
							bind:value={selectedGender}
							on:change={handlePeriodChange}
							class="filter-select"
						>
							<option value="">Semua</option>
							<option value="L">Laki-Laki</option>
							<option value="P">Perempuan</option>
						</select>
					</div>

					<div class="filter-group">
						<label for="tingkat" class="filter-label">
							<GraduationCap size={16} />
							Tingkat
						</label>
						<select
							id="tingkat"
							bind:value={selectedTingkat}
							on:change={handlePeriodChange}
							class="filter-select"
						>
							<option value="">Semua Tingkat</option>
							{#each availableTingkat as tingkat}
								<option value={tingkat.tingkat}>{tingkat.category}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>

		<!-- Period Banner -->
		<div class="period-banner">
			<div class="period-content">
				<div class="period-info">
					<Percent size={18} class="period-icon" />
					<div class="period-text">
						<span class="period-label">Laporan Ketertiban Jamaah:</span>
						<span class="period-value">
							{currentMonthYear}
							{#if selectedGender || selectedTingkat}
								-
								{#if selectedGender}
									{selectedGender === 'L' ? 'Putra' : 'Putri'}
								{/if}
								{#if selectedGender && selectedTingkat}
									,
								{/if}
								{#if selectedTingkat}
									Tingkat {selectedTingkat}
								{/if}
							{/if}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="error-banner">
				<div class="error-content">
					<span class="error-text">{error}</span>
					<button class="retry-button" on:click={loadInitialData}>
						Coba Lagi
					</button>
				</div>
			</div>
		{/if}

		<!-- Statistics Summary -->
		<div class="stats-section">
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-icon">
						<Users size={24} />
					</div>
					<div class="stat-info">
						<div class="stat-number">{jamaahAttendanceData.length}</div>
						<div class="stat-label">Total Jamaah</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon excellent">
						<Award size={24} />
					</div>
					<div class="stat-info">
						<div class="stat-number">{jamaahAttendanceData.filter(j => j.persentase_kehadiran >= 90).length}</div>
						<div class="stat-label">Sangat Baik (≥90%)</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon good">
						<TrendingUp size={24} />
					</div>
					<div class="stat-info">
						<div class="stat-number">{jamaahAttendanceData.filter(j => j.persentase_kehadiran >= 80 && j.persentase_kehadiran < 90).length}</div>
						<div class="stat-label">Baik (80-89%)</div>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon fair">
						<BarChart3 size={24} />
					</div>
					<div class="stat-info">
						<div class="stat-number">{jamaahAttendanceData.filter(j => j.persentase_kehadiran < 80).length}</div>
						<div class="stat-label">Perlu Perhatian (&lt;80%)</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Jamaah Attendance List -->
		<div class="report-content">
			<h3 class="section-title">Daftar Ketertiban Jamaah - {currentMonthYear}</h3>

			{#if jamaahAttendanceData.length > 0}
				<div class="jamaah-grid">
					{#each jamaahAttendanceData as jamaah}
						{@const level = getAttendanceLevel(jamaah.persentase_kehadiran)}
						<button
							class="jamaah-card"
							on:click={() => handleJamaahClick(jamaah)}
						>
							<div class="jamaah-header">
								<div class="jamaah-info">
									<h4 class="jamaah-name">{jamaah.nama}</h4>
									<div class="jamaah-meta">
										<span class="gender {jamaah.jk === 'L' ? 'male' : 'female'}">
											{jamaah.jk === 'L' ? 'Putra' : 'Putri'}
										</span>
										{#if jamaah.mkategori?.category}
											<span class="category">{jamaah.mkategori.category}</span>
										{/if}
										{#if jamaah.mkelompok?.nama_kelompok}
											<span class="kelompok">{jamaah.mkelompok.nama_kelompok}</span>
										{/if}
									</div>
								</div>
								<div class="attendance-percentage">
									<div class="percentage-circle" style="--color: {level.color}">
										<span class="percentage-text">{jamaah.persentase_kehadiran.toFixed(1)}%</span>
									</div>
								</div>
							</div>

							<div class="attendance-stats">
								<div class="stat-item">
									<span class="stat-label">Total Pengajian:</span>
									<span class="stat-value">{jamaah.total_sessions}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Hadir:</span>
									<span class="stat-value hadir">{jamaah.hadir_count}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Izin:</span>
									<span class="stat-value izin">{jamaah.izin_count}</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">Absen:</span>
									<span class="stat-value absen">{jamaah.absen_count}</span>
								</div>
							</div>

							<div class="attendance-level">
								<span class="level-badge {level.class}">{level.label}</span>
							</div>

							<div class="card-footer">
								<Eye size={16} />
								<span>Lihat Detail</span>
							</div>
						</button>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<Users size={48} class="empty-icon" />
					<h4 class="empty-title">Tidak ada data jamaah</h4>
					<p class="empty-description">Belum ada data ketertiban jamaah untuk periode {currentMonthYear}</p>
				</div>
			{/if}
		</div>
	{/if}
</main>

<!-- History Modal -->
{#if showHistoryModal && selectedJamaah}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={closeHistoryModal}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3 class="modal-title">Riwayat Kehadiran - {selectedJamaah.nama}</h3>
				<button class="modal-close" on:click={closeHistoryModal}>×</button>
			</div>

			<div class="modal-body">
				{#if isLoadingHistory}
					<div class="loading-container">
						<div class="loading-content">
							<div class="spinner"></div>
							<p class="loading-text">Memuat riwayat kehadiran...</p>
						</div>
					</div>
				{:else}
					<div class="jamaah-summary">
					<div class="summary-info">
						<span class="jamaah-name">{selectedJamaah.nama}</span>
						<div class="jamaah-details">
							<span class="gender {selectedJamaah.jk === 'L' ? 'male' : 'female'}">
								{selectedJamaah.jk === 'L' ? 'Putra' : 'Putri'}
							</span>
							{#if selectedJamaah.mkategori?.category}
								<span class="category">{selectedJamaah.mkategori.category}</span>
							{/if}
							{#if selectedJamaah.mkelompok?.nama_kelompok}
								<span class="kelompok">{selectedJamaah.mkelompok.nama_kelompok}</span>
							{/if}
						</div>
					</div>
					<div class="summary-stats">
						{#if selectedJamaah}
							{@const level = getAttendanceLevel(selectedJamaah.persentase_kehadiran)}
							<div class="summary-percentage" style="--color: {level.color}">
								{selectedJamaah.persentase_kehadiran.toFixed(1)}%
							</div>
							<span class="summary-level {level.class}">{level.label}</span>
						{/if}
					</div>
				</div>

				{#if jamaahHistory.length > 0}
					<div class="history-list">
						<h4 class="history-title">Riwayat Pengajian ({currentMonthYear})</h4>
						{#each jamaahHistory as history}
							{@const statusInfo = getStatusLabel(history.status)}
							{@const tanggalAbsensi = history.absensi?.tgl || history.created_at?.split('T')[0] || 'Tanggal tidak tersedia'}
							{@const namaPengajian = history.absensi?.mpengajian?.nama_pengajian || 'Pengajian'}
							<div class="history-item">
								<div class="history-date">
									<Calendar size={16} />
									<span>{formatDate(tanggalAbsensi)}</span>
								</div>
								<div class="history-pengajian">
									<BookOpen size={16} />
									<span>{namaPengajian}</span>
								</div>
								<div class="history-status">
									<span class="status-badge {statusInfo.class}" style="--color: {statusInfo.color}">
										{statusInfo.label}
									</span>
								</div>
								{#if history.keterangan}
									<div class="history-keterangan">
										<FileText size={14} />
										<span>{history.keterangan}</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-history">
						<BookOpen size={32} class="empty-icon" />
						<div class="empty-content">
							<h4>Belum Ada Riwayat Kehadiran</h4>
							<p>Tidak ada data kehadiran untuk <strong>{selectedJamaah?.nama}</strong> pada periode <strong>{currentMonthYear}</strong></p>
							<div class="empty-stats">
								<div class="stat">
									<span class="stat-label">Total Pengajian:</span>
									<span class="stat-value">{selectedJamaah?.total_sessions || 0}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Persentase Kehadiran:</span>
									<span class="stat-value">{selectedJamaah?.persentase_kehadiran?.toFixed(1) || 0}%</span>
								</div>
							</div>
							{#if selectedJamaah?.total_sessions === 0}
								<p class="empty-note">
									<em>Jamaah ini belum mengikuti pengajian pada periode yang dipilih atau data belum diinput.</em>
								</p>
							{/if}
						</div>
					</div>
				{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

<BottomNav />

<style>
	.app-content {
		min-height: calc(100vh - 64px);
		background: #f8fafc;
	}

	.app-content.desktop {
		padding-bottom: 2rem;
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

	/* Period Filter Section */
	.period-filter {
		background: white;
		border-bottom: 1px solid #f1f5f9;
		padding: 1.5rem 1rem;
	}

	.filter-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.filter-header {
		margin-bottom: 1.5rem;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.debug-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.debug-button {
		background: #f59e0b;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.debug-button:hover {
		background: #d97706;
	}

	.debug-button.sample {
		background: #10b981;
	}

	.debug-button.sample:hover {
		background: #059669;
	}

	.filter-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.filter-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: white;
		font-size: 0.875rem;
		color: #111827;
	}

	.filter-select:focus {
		outline: none;
		border-color: #0ea5e9;
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
	}

	/* Period Banner */
	.period-banner {
		background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
		color: white;
		padding: 1rem;
	}

	.period-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.period-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.period-icon {
		color: rgba(255, 255, 255, 0.9);
	}

	.period-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.period-label {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	.period-value {
		font-size: 0.875rem;
		font-weight: 600;
	}

	/* Error Banner */
	.error-banner {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		padding: 1rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.error-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.error-text {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.retry-button {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.retry-button:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
	}

	/* Statistics Section */
	.stats-section {
		padding: 1.5rem 1rem;
		background: white;
		border-bottom: 1px solid #f1f5f9;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		max-width: 800px;
		margin: 0 auto;
	}

	@media (min-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.stat-card {
		background: #f9fafb;
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid #f1f5f9;
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		background: #6b7280;
	}

	.stat-icon.excellent {
		background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	}

	.stat-icon.good {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}

	.stat-icon.fair {
		background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
	}

	.stat-info {
		flex: 1;
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
	}

	.stat-label {
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
		margin-top: 0.25rem;
	}

	/* Report Content */
	.report-content {
		padding: 1.5rem 1rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1.5rem 0;
		text-align: center;
	}

	.jamaah-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	@media (min-width: 768px) {
		.jamaah-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.jamaah-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.jamaah-card {
		background: white;
		border: 1px solid #f1f5f9;
		border-radius: 16px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.jamaah-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		border-color: #e2e8f0;
	}

	.jamaah-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.jamaah-info {
		flex: 1;
		min-width: 0;
	}

	.jamaah-name {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
	}

	.jamaah-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.gender,
	.category,
	.kelompok {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-weight: 500;
	}

	.gender.male {
		background: #dbeafe;
		color: #1e40af;
	}

	.gender.female {
		background: #fce7f3;
		color: #be185d;
	}

	.category {
		background: #f3e8ff;
		color: #7c3aed;
	}

	.kelompok {
		background: #ecfdf5;
		color: #059669;
	}

	.attendance-percentage {
		flex-shrink: 0;
	}

	.percentage-circle {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 3px solid var(--color);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.percentage-text {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color);
	}

	.attendance-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 12px;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.stat-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	.stat-value.hadir {
		color: #16a34a;
	}

	.stat-value.izin {
		color: #d97706;
	}

	.stat-value.absen {
		color: #dc2626;
	}

	.attendance-level {
		text-align: center;
		margin-bottom: 1rem;
	}

	.level-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.5rem 1rem;
		border-radius: 8px;
	}

	.level-badge.excellent {
		background: #dcfce7;
		color: #15803d;
	}

	.level-badge.good {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.level-badge.fair {
		background: #fef3c7;
		color: #b45309;
	}

	.level-badge.poor {
		background: #fee2e2;
		color: #b91c1c;
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
		font-weight: 500;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		background: white;
		border-radius: 16px;
		border: 1px solid #f1f5f9;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	:global(.empty-icon) {
		color: #d1d5db !important;
		margin-bottom: 1rem !important;
	}

	.empty-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.empty-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
		margin: 0;
	}

	/* Modal Styles */
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
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.modal-close {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: none;
		background: #f3f4f6;
		color: #6b7280;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.modal-body {
		padding: 1.5rem;
		max-height: calc(90vh - 120px);
		overflow-y: auto;
	}

	.jamaah-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 12px;
		margin-bottom: 1.5rem;
	}

	.summary-info .jamaah-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.5rem;
	}

	.jamaah-details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.summary-stats {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.summary-percentage {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 3px solid var(--color);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color);
	}

	.summary-level {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
	}

	.history-list {
		background: white;
		border-radius: 12px;
		border: 1px solid #f1f5f9;
	}

	.history-title {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
		padding: 1rem 1rem 0;
	}

	.history-item {
		padding: 1rem;
		border-bottom: 1px solid #f3f4f6;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.75rem;
		align-items: center;
	}

	.history-item:last-child {
		border-bottom: none;
	}

	.history-date,
	.history-pengajian {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.history-status {
		grid-column: 2;
		grid-row: 1 / 3;
	}

	.status-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		color: var(--color);
		background: color-mix(in srgb, var(--color) 10%, transparent);
	}

	.history-keterangan {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #9ca3af;
		font-style: italic;
		margin-top: 0.5rem;
	}

	.empty-history {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.empty-history :global(.empty-icon) {
		color: #d1d5db !important;
		margin-bottom: 1rem !important;
	}

	.empty-content h4 {
		color: #374151;
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.empty-content p {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.empty-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin: 1rem 0;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #f1f5f9;
	}

	.empty-stats .stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.empty-stats .stat-label {
		font-size: 0.75rem;
		color: #9ca3af;
		font-weight: 500;
	}

	.empty-stats .stat-value {
		font-size: 1rem;
		color: #374151;
		font-weight: 600;
	}

	.empty-note {
		font-size: 0.8rem !important;
		color: #9ca3af !important;
		font-style: italic;
		margin-top: 1rem !important;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.filter-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.attendance-stats {
			grid-template-columns: 1fr;
		}

		.jamaah-header {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.percentage-circle {
			width: 50px;
			height: 50px;
		}

		.percentage-text {
			font-size: 0.75rem;
		}

		.modal-overlay {
			padding: 0.5rem;
		}

		.jamaah-summary {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.history-item {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.history-status {
			grid-column: 1;
			grid-row: auto;
			justify-self: start;
		}
	}
</style>
