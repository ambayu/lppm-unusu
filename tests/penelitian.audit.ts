/**
 * Test Suite: Verifikasi & Audit Logika Filter/Search Halaman Penelitian
 * Menguji ketahanan fungsi filter dan perlakuan terhadap data null/undefined/anomali
 */

export interface PenelitianItemTest {
  id: number;
  judul?: string | null;
  ketua?: string | null;
  nidn?: string | null;
  anggota?: string | null;
  bidangFokus?: string | null;
  danaDisetujui?: number | null;
  sumberDana?: string | null;
  tahun?: number | null;
  status?: string | null;
  createdAt?: string | null;
}

export function filterPenelitian(
  list: (PenelitianItemTest | null | undefined)[],
  search: string,
  selectedBidangFokus: string
) {
  return list.filter((item) => {
    if (!item) return false;
    const q = (search || '').trim().toLowerCase();
    const judul = String(item.judul || '').toLowerCase();
    const ketua = String(item.ketua || '').toLowerCase();
    const nidn = String(item.nidn || '').toLowerCase();
    const bidangFokus = String(item.bidangFokus || '').toLowerCase();
    const sumberDana = String(item.sumberDana || '').toLowerCase();

    const matchSearch =
      !q ||
      judul.includes(q) ||
      ketua.includes(q) ||
      nidn.includes(q) ||
      bidangFokus.includes(q) ||
      sumberDana.includes(q);

    const matchBidang =
      selectedBidangFokus === 'SEMUA' ||
      bidangFokus.includes(selectedBidangFokus.toLowerCase());

    return matchSearch && matchBidang;
  });
}

export function calculateKPIs(list: (PenelitianItemTest | null | undefined)[]) {
  const safeList = list.filter((item): item is PenelitianItemTest => Boolean(item));
  const totalPenelitian = safeList.length;
  const countIT = safeList.filter((p) => {
    const bf = String(p?.bidangFokus || '').toLowerCase();
    return bf.includes('teknologi') || bf.includes('ai');
  }).length;
  const countPendidikan = safeList.filter((p) => {
    const bf = String(p?.bidangFokus || '').toLowerCase();
    return bf.includes('pendidikan') || bf.includes('aswaja');
  }).length;
  const totalDana = safeList.reduce((acc, curr) => {
    const val = Number(curr?.danaDisetujui);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return { totalPenelitian, countIT, countPendidikan, totalDana };
}

async function runPenelitianAudit() {
  console.log('=== TEST AUDIT PENCARIAN & FILTER HALAMAN PENELITIAN ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Skenario 1: Data bercampur null & undefined
  const testData: (PenelitianItemTest | null | undefined)[] = [
    null,
    undefined,
    {
      id: 1,
      judul: 'Implementasi NLP untuk Teks Aswaja',
      ketua: 'Dr. Ahmad Fauzi',
      nidn: '0123456789',
      anggota: null,
      bidangFokus: 'Aswaja dan Pendidikan',
      danaDisetujui: 20000000,
      sumberDana: 'Internal UNUSU',
      tahun: 2026,
      status: 'Disetujui',
      createdAt: '2026-05-01T10:00:00.000Z',
    },
    {
      id: 2,
      judul: null,
      ketua: undefined,
      nidn: null,
      anggota: undefined,
      bidangFokus: null,
      danaDisetujui: null,
      sumberDana: undefined,
      tahun: null,
      status: null,
      createdAt: null,
    },
    {
      id: 3,
      judul: 'Pengembangan IoT Smart Farming di Deli Serdang',
      ketua: 'Siti Aminah, M.Kom.',
      nidn: '0987654321',
      bidangFokus: 'Teknologi Informasi',
      danaDisetujui: 15000000,
      sumberDana: 'Hibah Kemendikbud',
      tahun: 2026,
      status: 'Disetujui',
      createdAt: '2026-06-15T08:30:00.000Z',
    },
  ];

  // Test 1: Tidak crash saat filter dijalankan pada data null/undefined
  try {
    const res = filterPenelitian(testData, '', 'SEMUA');
    assert(res.length === 3, 'Filter kosong: menyaring elemen null/undefined array dan mempertahankan item objek');
  } catch (e: any) {
    assert(false, `Filter melempar runtime exception: ${e.message}`);
  }

  // Test 2: Pencarian kata kunci pada judul yang sebagian null
  try {
    const resSearch = filterPenelitian(testData, 'nlp', 'SEMUA');
    assert(resSearch.length === 1 && resSearch[0]?.id === 1, 'Pencarian "nlp" menemukan data yang tepat tanpa crash pada judul null');
  } catch (e: any) {
    assert(false, `Pencarian kata kunci error: ${e.message}`);
  }

  // Test 3: Filter bidang fokus saat bidangFokus item bernilai null
  try {
    const resBidang = filterPenelitian(testData, '', 'Teknologi Informasi');
    assert(resBidang.length === 1 && resBidang[0]?.id === 3, 'Filter bidang fokus bekerja tepat tanpa error pada bidangFokus bernilai null');
  } catch (e: any) {
    assert(false, `Filter bidang fokus error: ${e.message}`);
  }

  // Test 4: Perhitungan KPI dengan dana null/undefined
  try {
    const kpi = calculateKPIs(testData);
    assert(kpi.totalPenelitian === 3, `Total penelitian valid terhitung 3 (aktual: ${kpi.totalPenelitian})`);
    assert(kpi.countIT === 1, `Hitungan IT terhitung 1 (aktual: ${kpi.countIT})`);
    assert(kpi.countPendidikan === 1, `Hitungan Pendidikan terhitung 1 (aktual: ${kpi.countPendidikan})`);
    assert(kpi.totalDana === 35000000, `Total alokasi dana valid terhitung 35.000.000 (aktual: ${kpi.totalDana})`);
  } catch (e: any) {
    assert(false, `Perhitungan KPI error: ${e.message}`);
  }

  console.log(`\nAudit Selesai: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runPenelitianAudit();
