// ===================================================
// PWA SERVICE WORKER & MENU TOGGLE
// ===================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA ServiceWorker berhasil didaftarkan'))
      .catch(err => console.log('PWA ServiceWorker gagal', err));
  });
}

// Logika Tombol Hamburger Menu (HP)
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.querySelector('.main-content').addEventListener('click', () => {
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  }
});

// URL Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbzneHDGHeaJrXWBbbGL4Vz_5LXp2hpU4kV3DGtDTWoErUCHBZ9wbTpZkOvO1dBodObPPA/exec';

// ===================================================
// 1. LOGIKA HALAMAN LOGIN
// ===================================================
function selectRole(roleName, element) {
  document.querySelectorAll('.role-card').forEach(card => card.classList.remove('active'));
  element.classList.add('active');
  document.getElementById('selectedRole').value = roleName;

  const labelUser = document.getElementById('labelUsername');
  const inputUser = document.getElementById('username');
  const groupPass = document.getElementById('groupPassword');
  const inputPass = document.getElementById('password');

  if (roleName === 'Admin') {
    labelUser.textContent = 'Username Admin';
    inputUser.placeholder = 'Masukkan username admin';
    groupPass.style.display = 'block';
    inputPass.required = true;
  } else if (roleName === 'Walikelas') {
    labelUser.textContent = 'PegID / ID Wali Kelas';
    inputUser.placeholder = 'Contoh: PEG001';
    groupPass.style.display = 'none';
    inputPass.required = false;
  } else if (roleName === 'Siswa') {
    labelUser.textContent = 'NISN Siswa';
    inputUser.placeholder = 'Contoh: 0012345';
    groupPass.style.display = 'none';
    inputPass.required = false;
  }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnSubmit');
    const messageDiv = document.getElementById('message');

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Memeriksa...';
    messageDiv.style.color = '#0d6efd';
    messageDiv.textContent = 'Menghubungkan ke server...';

    const payload = {
      role: document.getElementById('selectedRole').value,
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value.trim()
    };

    fetch(scriptURL, {
      method: 'POST',
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
    .then(response => {
      if (!response.ok) throw new Error('Gagal terhubung ke server.');
      return response.json();
    })
    .then(data => {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Masuk';

      if (data.status === 'success') {
        messageDiv.style.color = '#198754';
        messageDiv.textContent = `Login Berhasil! Mengalihkan...`;
        
        localStorage.setItem('userSession', JSON.stringify(data.user));

        setTimeout(() => { 
          const roleLower = String(data.user.role || '').trim().toLowerCase();
          if (roleLower === 'admin') window.location.href = 'dashboard.html';
          else if (roleLower === 'walikelas') window.location.href = 'walikelas.html'; 
          else if (roleLower === 'siswa') window.location.href = 'siswa.html'; 
          else {
            messageDiv.style.color = '#dc3545';
            messageDiv.textContent = 'Role tidak dikenali: ' + data.user.role;
          }
        }, 1000);
      } else {
        messageDiv.style.color = '#dc3545';
        messageDiv.textContent = data.message;
      }
    })
    .catch(error => {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Masuk';
      messageDiv.style.color = '#dc3545';
      messageDiv.textContent = 'Gagal terhubung server.';
      console.error('Error:', error);
    });
  });
}

// ===================================================
// 2. LOGIKA HALAMAN DASHBOARD ADMIN
// ===================================================
const pageTitleElem = document.getElementById('pageTitle');

if (pageTitleElem) {
  const session = JSON.parse(localStorage.getItem('userSession'));
  if (!session || String(session.role || '').trim().toLowerCase() !== 'admin') {
    alert('Sesi habis atau akses ditolak.');
    window.location.href = 'index.html';
  } else {
    const adminLabel = document.getElementById('adminNameLabel');
    if (adminLabel) adminLabel.textContent = `Halo, ${session.nama}`;
  }
}

function logout() {
  localStorage.removeItem('userSession');
  window.location.href = 'index.html';
}

function formatRp(value) {
  let num = parseFloat(value) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function toComparableDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  const parts = String(val).split('/');
  if (parts.length === 3) {
    const d2 = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
}

function inDateRange(val, fromId, toId) {
  const from = document.getElementById(fromId)?.value;
  const to = document.getElementById(toId)?.value;
  if (!from && !to) return true;
  const d = toComparableDate(val);
  if (!d) return true;
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to + 'T23:59:59')) return false;
  return true;
}

function clearFilter(prefix) {
  ['search-', 'from-', 'to-', 'jenis-', 'role-', 'kelas-'].forEach(p => {
    const el = document.getElementById(p + prefix);
    if (el) el.value = '';
  });
  if (prefix === 'ts') renderTransaksiSiswa();
  if (prefix === 'ti') renderTransaksiInternal();
  if (prefix === 'tp') renderTarifPembayaran();
  if (prefix === 'akun') renderAkun();
  if (prefix === 'laporan') renderLaporan();
}

function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  if (id === 'modal-transaksi-siswa') {
    document.getElementById('form-ts').reset();
    document.getElementById('ts_sheetRow').value = '';
    document.getElementById('ts_pembayaran').innerHTML = '<option value="">-- Pilih Siswa terlebih dahulu --</option>';
    document.getElementById('modal-ts-title').textContent = 'Input Pembayaran Siswa';
  }
  if (id === 'modal-transaksi-internal') { document.getElementById('form-ti').reset(); document.getElementById('ti_sheetRow').value = ''; document.getElementById('modal-ti-title').textContent = 'Input Transaksi Internal'; }
  if (id === 'modal-jenis-pembayaran') { document.getElementById('form-tp').reset(); document.getElementById('tp_sheetRow').value = ''; document.getElementById('modal-tp-title').textContent = 'Pengaturan Tarif Pembayaran'; }
  if (id === 'modal-akun') {
    document.getElementById('form-akun').reset();
    document.getElementById('akun_sheetRow').value = '';
    document.getElementById('akun_password').required = true;
    document.getElementById('akun_password_hint').style.display = 'none';
    document.getElementById('modal-akun-title').textContent = 'Tambah Akun';
  }
}

// Navigasi Dashboard
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    navItems.forEach(nav => nav.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
    const targetId = this.getAttribute('data-target');
    document.getElementById(targetId)?.classList.add('active');
    if (pageTitleElem) pageTitleElem.textContent = this.textContent.replace(/[^a-zA-Z0-9 &]/g, '').trim();
    loadDataForSection(targetId);
  });
});

function loadDataForSection(sectionId) {
  if (sectionId === 'transaksi-siswa') loadTransaksiSiswa();
  if (sectionId === 'transaksi-internal') loadTransaksiInternal();
  if (sectionId === 'jenis-pembayaran') loadTarifPembayaran();
  if (sectionId === 'manajemen-akun') loadAkun();
  if (sectionId === 'laporan-total') loadLaporanTotal();
}

// Data Storage Dashboard
let rawTs = [], filteredTs = [], rawTi = [], filteredTi = [], rawTp = [], filteredTp = [], rawAkun = [], filteredAkun = [], rawLaporan = [], filteredLaporan = [];
let tsModalSiswaList = [], tsModalTarifList = [];

// 1. TRANSAKSI SISWA
function loadTransaksiSiswa() {
  const tbody = document.getElementById('tbody-transaksi-siswa');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">⏳ Memuat data...</td></tr>';
  fetch(scriptURL + '?action=getTransaksiSiswa')
    .then(r => r.json())
    .then(res => { rawTs = (res.status === 'success') ? res.data : []; renderTransaksiSiswa(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTransaksiSiswa() {
  const tbody = document.getElementById('tbody-transaksi-siswa');
  if (!tbody) return;
  const q = (document.getElementById('search-ts')?.value || '').toLowerCase().trim();
  filteredTs = rawTs.filter(r => {
    const matchesSearch = !q || [r.nama, r.nisn, r.kelas, r.pembayaran].some(v => String(v || '').toLowerCase().includes(q));
    const matchesDate = inDateRange(r.tanggal, 'from-ts', 'to-ts');
    return matchesSearch && matchesDate;
  });
  document.getElementById('count-ts').textContent = `Menampilkan ${filteredTs.length} dari ${rawTs.length} transaksi`;
  if (filteredTs.length > 0) {
    tbody.innerHTML = filteredTs.map(r => `
      <tr>
        <td>${escapeHtml(r.tanggal)}</td>
        <td><strong>${escapeHtml(r.nama)}</strong><br><small style="color:gray;">${escapeHtml(r.nisn)}</small></td>
        <td><span style="padding:2px 6px; border-radius:4px; font-size:12px; background:#e2e3e5; font-weight:bold;">${escapeHtml(r.kelas || '-')}</span></td>
        <td>${escapeHtml(r.pembayaran)}</td>
        <td style="color:green; font-weight:bold;">${formatRp(r.nominal)}</td>
        <td>${escapeHtml(r.admin) || '-'}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon btn-edit" onclick="editTransaksiSiswa(${r.sheetRow})">✏️ Edit</button>
            <button class="btn-icon btn-delete" onclick="deleteTransaksiSiswa(${r.sheetRow})">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function openAddTsModal() {
  Promise.all([
    fetch(scriptURL + '?action=getAccounts').then(r => r.json()),
    fetch(scriptURL + '?action=getTarifPembayaran').then(r => r.json())
  ]).then(([resAkun, resTarif]) => {
    if (resAkun.status === 'success') tsModalSiswaList = resAkun.data.filter(a => String(a.role).toLowerCase() === 'siswa');
    if (resTarif.status === 'success') tsModalTarifList = resTarif.data;

    const selectSiswa = document.getElementById('ts_siswaSelect');
    selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' +
      tsModalSiswaList.map(s => `<option value="${escapeHtml(s.idLogin)}|${escapeHtml(s.nama)}|${escapeHtml(s.kelas)}">${escapeHtml(s.idLogin)} - ${escapeHtml(s.nama)} (Kelas ${escapeHtml(s.kelas)})</option>`).join('');

    document.getElementById('ts_pembayaran').innerHTML = '<option value="">-- Pilih Siswa terlebih dahulu --</option>';
    document.getElementById('ts_nominal').value = '';
    document.getElementById('modal-ts-title').textContent = 'Input Pembayaran Siswa';
    openModal('modal-transaksi-siswa');
  }).catch(err => alert('Gagal memuat data siswa/tarif: ' + err.message));
}

document.getElementById('ts_siswaSelect')?.addEventListener('change', function() {
  const val = this.value;
  const selectPembayaran = document.getElementById('ts_pembayaran');
  if (!val) {
    selectPembayaran.innerHTML = '<option value="">-- Pilih Siswa terlebih dahulu --</option>';
    document.getElementById('ts_nominal').value = '';
    return;
  }
  const siswaKelas = val.split('|')[2] || '';
  const filteredTarif = tsModalTarifList.filter(t => {
    const target = String(t.targetKelas || '').toLowerCase();
    return target.includes('semua') || target.includes(siswaKelas.toLowerCase());
  });

  selectPembayaran.innerHTML = '<option value="">-- Pilih Jenis Pembayaran --</option>' +
    filteredTarif.map(t => `<option value="${escapeHtml(t.namaPembayaran)}" data-nominal="${t.nominalTarif}">${escapeHtml(t.namaPembayaran)} (${formatRp(t.nominalTarif)})</option>`).join('');
});

document.getElementById('ts_pembayaran')?.addEventListener('change', function() {
  const selectedOpt = this.options[this.selectedIndex];
  if (selectedOpt && selectedOpt.dataset.nominal) {
    document.getElementById('ts_nominal').value = selectedOpt.dataset.nominal;
  }
});

function editTransaksiSiswa(sheetRow) {
  const item = rawTs.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  openAddTsModal();
  setTimeout(() => {
    document.getElementById('ts_sheetRow').value = item.sheetRow;
    document.getElementById('modal-ts-title').textContent = 'Edit Transaksi Siswa';
    const selectSiswa = document.getElementById('ts_siswaSelect');
    for (let i = 0; i < selectSiswa.options.length; i++) {
      if (selectSiswa.options[i].value.startsWith(item.nisn + '|')) {
        selectSiswa.selectedIndex = i;
        selectSiswa.dispatchEvent(new Event('change'));
        break;
      }
    }
    setTimeout(() => {
      document.getElementById('ts_pembayaran').value = item.pembayaran;
      document.getElementById('ts_nominal').value = item.nominal;
    }, 100);
  }, 300);
}

function deleteTransaksiSiswa(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi siswa ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteTransaksiSiswa', sheetRow: sheetRow }) })
  .then(r => r.json())
  .then(res => { alert(res.message || 'Transaksi berhasil dihapus.'); loadTransaksiSiswa(); })
  .catch(err => alert('Gagal menghapus: ' + err.message));
}

// 2. TRANSAKSI INTERNAL
function loadTransaksiInternal() {
  const tbody = document.getElementById('tbody-transaksi-internal');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">⏳ Memuat data...</td></tr>';
  fetch(scriptURL + '?action=getTransaksiInternal')
    .then(r => r.json())
    .then(res => { rawTi = (res.status === 'success') ? res.data : []; renderTransaksiInternal(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTransaksiInternal() {
  const tbody = document.getElementById('tbody-transaksi-internal');
  if (!tbody) return;
  const q = (document.getElementById('search-ti')?.value || '').toLowerCase().trim();
  const jenisFilter = document.getElementById('jenis-ti')?.value;
  filteredTi = rawTi.filter(r => {
    const matchesSearch = !q || String(r.keterangan || '').toLowerCase().includes(q);
    const matchesJenis = !jenisFilter || r.jenis === jenisFilter;
    const matchesDate = inDateRange(r.tanggal, 'from-ti', 'to-ti');
    return matchesSearch && matchesJenis && matchesDate;
  });
  document.getElementById('count-ti').textContent = `Menampilkan ${filteredTi.length} dari ${rawTi.length} transaksi`;
  if (filteredTi.length > 0) {
    tbody.innerHTML = filteredTi.map(r => {
      let badge = r.jenis === 'Pemasukan' ? '<span style="color:green;font-weight:bold;">(+) Pemasukan</span>' : '<span style="color:red;font-weight:bold;">(-) Pengeluaran</span>';
      return `
        <tr>
          <td>${escapeHtml(r.tanggal)}</td>
          <td>${badge}</td>
          <td>${escapeHtml(r.keterangan)}</td>
          <td style="font-weight:bold;">${formatRp(r.nominal)}</td>
          <td>${escapeHtml(r.admin) || '-'}</td>
          <td>
            <div class="row-actions">
              <button class="btn-icon btn-edit" onclick="editTransaksiInternal(${r.sheetRow})">✏️ Edit</button>
              <button class="btn-icon btn-delete" onclick="deleteTransaksiInternal(${r.sheetRow})">🗑️ Hapus</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function editTransaksiInternal(sheetRow) {
  const item = rawTi.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  document.getElementById('ti_sheetRow').value = item.sheetRow;
  document.getElementById('ti_jenis').value = item.jenis;
  document.getElementById('ti_keterangan').value = item.keterangan;
  document.getElementById('ti_nominal').value = item.nominal;
  document.getElementById('modal-ti-title').textContent = 'Edit Transaksi Internal';
  openModal('modal-transaksi-internal');
}

function deleteTransaksiInternal(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi internal ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteTransaksiInternal', sheetRow: sheetRow }) })
  .then(r => r.json())
  .then(res => { alert(res.message || 'Transaksi berhasil dihapus.'); loadTransaksiInternal(); })
  .catch(err => alert('Gagal menghapus: ' + err.message));
}

// 3. TARIF PEMBAYARAN
function loadTarifPembayaran() {
  const tbody = document.getElementById('tbody-tarif-pembayaran');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">⏳ Memuat data...</td></tr>';
  fetch(scriptURL + '?action=getTarifPembayaran')
    .then(r => r.json())
    .then(res => { rawTp = (res.status === 'success') ? res.data : []; renderTarifPembayaran(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderTarifPembayaran() {
  const tbody = document.getElementById('tbody-tarif-pembayaran');
  if (!tbody) return;
  const q = (document.getElementById('search-tp')?.value || '').toLowerCase().trim();
  filteredTp = rawTp.filter(r => !q || [r.namaPembayaran, r.targetKelas].some(v => String(v || '').toLowerCase().includes(q)));
  document.getElementById('count-tp').textContent = `Menampilkan ${filteredTp.length} dari ${rawTp.length} tarif`;
  if (filteredTp.length > 0) {
    tbody.innerHTML = filteredTp.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.namaPembayaran)}</strong></td>
        <td>${escapeHtml(r.targetKelas)}</td>
        <td style="font-weight:bold;">${formatRp(r.nominalTarif)}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon btn-edit" onclick="editTarifPembayaran(${r.sheetRow})">✏️ Edit</button>
            <button class="btn-icon btn-delete" onclick="deleteTarifPembayaran(${r.sheetRow})">🗑️ Hapus</button>
          </div>
        </td>
      </tr>`).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function editTarifPembayaran(sheetRow) {
  const item = rawTp.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  document.getElementById('tp_sheetRow').value = item.sheetRow;
  document.getElementById('tp_nama').value = item.namaPembayaran;
  document.getElementById('tp_kelas').value = item.targetKelas;
  document.getElementById('tp_nominal').value = item.nominalTarif;
  document.getElementById('modal-tp-title').textContent = 'Edit Tarif Pembayaran';
  openModal('modal-jenis-pembayaran');
}

function deleteTarifPembayaran(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus tarif pembayaran ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteTarifPembayaran', sheetRow: sheetRow }) })
  .then(r => r.json())
  .then(res => { alert(res.message || 'Tarif berhasil dihapus.'); loadTarifPembayaran(); })
  .catch(err => alert('Gagal menghapus: ' + err.message));
}

// 4. MANAJEMEN AKUN
function loadAkun() {
  const tbody = document.getElementById('tbody-akun');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">⏳ Memuat data...</td></tr>';
  fetch(scriptURL + '?action=getAccounts')
    .then(r => r.json())
    .then(res => { rawAkun = (res.status === 'success') ? res.data : []; renderAkun(); })
    .catch(() => { tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Gagal memuat data.</td></tr>'; });
}

function renderAkun() {
  const tbody = document.getElementById('tbody-akun');
  if (!tbody) return;
  const q = (document.getElementById('search-akun')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('role-akun')?.value;
  filteredAkun = rawAkun.filter(r => {
    const matchesSearch = !q || [r.idLogin, r.nama, r.kelas].some(v => String(v || '').toLowerCase().includes(q));
    const matchesRole = !roleFilter || String(r.role).toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });
  document.getElementById('count-akun').textContent = `Menampilkan ${filteredAkun.length} dari ${rawAkun.length} akun`;
  if (filteredAkun.length > 0) {
    tbody.innerHTML = filteredAkun.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.idLogin)}</strong></td>
        <td>${escapeHtml(r.nama)}</td>
        <td><span style="padding: 3px 8px; border-radius: 4px; font-size:12px; background:#e2e3e5; font-weight:bold;">${escapeHtml(r.role)}</span></td>
        <td>${escapeHtml(r.kelas) || '-'}</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon btn-edit" onclick="editAkun(${r.sheetRow})">✏️ Edit</button>
            <button class="btn-icon btn-delete" onclick="deleteAkun(${r.sheetRow})">🗑️ Hapus</button>
          </div>
        </td>
      </tr>`).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada data yang cocok.</td></tr>';
  }
}

function openAddAkunModal() {
  document.getElementById('form-akun').reset();
  document.getElementById('akun_sheetRow').value = '';
  document.getElementById('akun_password').required = true;
  document.getElementById('akun_password_hint').style.display = 'none';
  document.getElementById('modal-akun-title').textContent = 'Tambah Akun';
  openModal('modal-akun');
}

function editAkun(sheetRow) {
  const item = rawAkun.find(r => r.sheetRow === sheetRow);
  if (!item) return alert('Data tidak ditemukan.');
  document.getElementById('akun_sheetRow').value = item.sheetRow;
  document.getElementById('akun_role').value = item.role;
  document.getElementById('akun_idLogin').value = item.idLogin;
  document.getElementById('akun_nama').value = item.nama;
  document.getElementById('akun_kelas').value = item.kelas || '';
  document.getElementById('akun_password').value = '';
  document.getElementById('akun_password').required = false;
  document.getElementById('akun_password_hint').style.display = 'block';
  document.getElementById('modal-akun-title').textContent = 'Edit Akun';
  openModal('modal-akun');
}

function deleteAkun(sheetRow) {
  if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;
  fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: 'deleteAccount', sheetRow: sheetRow }) })
  .then(r => r.json())
  .then(res => { alert(res.message || 'Akun berhasil dihapus.'); loadAkun(); })
  .catch(err => alert('Gagal menghapus: ' + err.message));
}

// 5. LAPORAN
function loadLaporanTotal() {
  Promise.all([
    fetch(scriptURL + '?action=getTransaksiSiswa').then(r => r.json()),
    fetch(scriptURL + '?action=getTransaksiInternal').then(r => r.json())
  ]).then(([resTs, resTi]) => {
    const listTs = (resTs.status === 'success') ? resTs.data : [];
    const listTi = (resTi.status === 'success') ? resTi.data : [];

    let totalPemasukan = 0, totalPengeluaran = 0;
    rawLaporan = [];

    listTs.forEach(item => {
      let nom = parseFloat(item.nominal) || 0;
      totalPemasukan += nom;
      rawLaporan.push({
        tanggal: item.tanggal,
        sumber: 'Siswa (' + item.nama + ')',
        kelas: item.kelas || '-',
        keterangan: item.pembayaran,
        jenis: 'Pemasukan',
        nominal: nom,
        admin: item.admin
      });
    });

    listTi.forEach(item => {
      let nom = parseFloat(item.nominal) || 0;
      if (item.jenis === 'Pemasukan') totalPemasukan += nom;
      else totalPengeluaran += nom;
      rawLaporan.push({
        tanggal: item.tanggal,
        sumber: 'Internal',
        kelas: '-',
        keterangan: item.keterangan,
        jenis: item.jenis,
        nominal: nom,
        admin: item.admin
      });
    });

    document.getElementById('total-pemasukan').textContent = formatRp(totalPemasukan);
    document.getElementById('total-pengeluaran').textContent = formatRp(totalPengeluaran);
    document.getElementById('saldo-total').textContent = formatRp(totalPemasukan - totalPengeluaran);

    // Populate Dropdown Filter Kelas
    const kelasSelect = document.getElementById('kelas-laporan');
    if (kelasSelect) {
      const uniqueKelas = [...new Set(rawLaporan.map(r => r.kelas).filter(k => k && k !== '-'))].sort();
      kelasSelect.innerHTML = '<option value="">Semua Kelas</option>' +
        uniqueKelas.map(k => `<option value="${escapeHtml(k)}">Kelas ${escapeHtml(k)}</option>`).join('');
    }

    renderLaporan();
  }).catch(err => alert('Gagal memuat laporan: ' + err.message));
}

function renderLaporan() {
  const tbody = document.getElementById('tbody-laporan');
  if (!tbody) return;
  const jenisFilter = document.getElementById('jenis-laporan')?.value;
  const kelasFilter = document.getElementById('kelas-laporan')?.value;

  filteredLaporan = rawLaporan.filter(r => {
    const matchesJenis = !jenisFilter || r.jenis === jenisFilter;
    const matchesKelas = !kelasFilter || r.kelas === kelasFilter;
    const matchesDate = inDateRange(r.tanggal, 'from-laporan', 'to-laporan');
    return matchesJenis && matchesKelas && matchesDate;
  });

  let pMasuk = 0, pKeluar = 0;
  filteredLaporan.forEach(r => {
    if (r.jenis === 'Pemasukan') pMasuk += r.nominal;
    else pKeluar += r.nominal;
  });

  document.getElementById('periode-pemasukan').textContent = formatRp(pMasuk);
  document.getElementById('periode-pengeluaran').textContent = formatRp(pKeluar);
  document.getElementById('periode-selisih').textContent = formatRp(pMasuk - pKeluar);
  document.getElementById('count-laporan').textContent = `Menampilkan ${filteredLaporan.length} transaksi`;

  if (filteredLaporan.length > 0) {
    tbody.innerHTML = filteredLaporan.map(r => {
      let badge = r.jenis === 'Pemasukan' ? '<span style="color:green;font-weight:bold;">Pemasukan</span>' : '<span style="color:red;font-weight:bold;">Pengeluaran</span>';
      return `
        <tr>
          <td>${escapeHtml(r.tanggal)}</td>
          <td>${escapeHtml(r.sumber)}</td>
          <td><span style="padding:2px 6px; border-radius:4px; font-size:12px; background:#e2e3e5;">${escapeHtml(r.kelas)}</span></td>
          <td>${escapeHtml(r.keterangan)}</td>
          <td>${badge}</td>
          <td style="font-weight:bold;">${formatRp(r.nominal)}</td>
          <td>${escapeHtml(r.admin) || '-'}</td>
        </tr>`;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada data laporan untuk periode ini.</td></tr>';
  }
}

// EXPORT LAPORAN
function exportLaporanExcel() {
  if (filteredLaporan.length === 0) return alert('Tidak ada data laporan untuk diekspor.');
  const dataForExcel = filteredLaporan.map((r, idx) => ({
    'No': idx + 1,
    'Tanggal': r.tanggal,
    'Sumber': r.sumber,
    'Kelas': r.kelas,
    'Keterangan': r.keterangan,
    'Jenis': r.jenis,
    'Nominal (Rp)': r.nominal,
    'Petugas': r.admin || '-'
  }));
  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
  XLSX.writeFile(workbook, `Laporan-Keuangan-${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportLaporanPDF() {
  if (filteredLaporan.length === 0) return alert('Tidak ada data laporan untuk diekspor.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Laporan Keuangan MTs Al-Fatah", 14, 15);
  doc.setFontSize(10);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

  const tableRows = filteredLaporan.map((r, idx) => [idx + 1, r.tanggal, r.sumber, r.kelas, r.keterangan, r.jenis, formatRp(r.nominal), r.admin || '-']);
  doc.autoTable({ startY: 28, head: [['No', 'Tanggal', 'Sumber', 'Kelas', 'Keterangan', 'Jenis', 'Nominal', 'Petugas']], body: tableRows, theme: 'grid', headStyles: { fillColor: [13, 110, 253] } });
  doc.save(`Laporan-Keuangan-${new Date().toISOString().slice(0,10)}.pdf`);
}

// FORM SUBMISSION HANDLERS DASHBOARD
document.getElementById('form-ts')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-ts');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('ts_sheetRow').value;
  const parts = document.getElementById('ts_siswaSelect').value.split('|');
  const session = JSON.parse(localStorage.getItem('userSession')) || {};

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify({
      action: sheetRow ? 'updateTransaksiSiswa' : 'addTransaksiSiswa',
      sheetRow: sheetRow,
      nisn: parts[0],
      namaSiswa: parts[1],
      kelas: parts[2] || '',
      pembayaran: document.getElementById('ts_pembayaran').value,
      nominal: document.getElementById('ts_nominal').value,
      admin: session.nama
    })
  })
  .then(r => r.json())
  .then(res => { 
    if (res.status === 'success') {
      alert(res.message || 'Berhasil disimpan!'); 
      closeModal('modal-transaksi-siswa'); 
      loadTransaksiSiswa(); 
    } else {
      alert(res.message || 'Gagal menyimpan transaksi.');
    }
  })
  .catch(err => alert('Gagal menyimpan: ' + err.message))
  .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
});

document.getElementById('form-ti')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-ti');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('ti_sheetRow').value;
  const session = JSON.parse(localStorage.getItem('userSession')) || {};

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify({
      action: sheetRow ? 'updateTransaksiInternal' : 'addTransaksiInternal',
      sheetRow: sheetRow,
      jenis: document.getElementById('ti_jenis').value,
      keterangan: document.getElementById('ti_keterangan').value,
      nominal: document.getElementById('ti_nominal').value,
      admin: session.nama
    })
  })
  .then(r => r.json())
  .then(res => { 
    if (res.status === 'success') {
      alert(res.message || 'Berhasil disimpan!'); 
      closeModal('modal-transaksi-internal'); 
      loadTransaksiInternal(); 
    } else {
      alert(res.message || 'Gagal menyimpan transaksi.');
    }
  })
  .catch(err => alert('Gagal menyimpan: ' + err.message))
  .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
});

document.getElementById('form-tp')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-tp');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('tp_sheetRow').value;
  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify({
      action: sheetRow ? 'updateTarifPembayaran' : 'addTarifPembayaran',
      sheetRow: sheetRow,
      namaPembayaran: document.getElementById('tp_nama').value,
      targetKelas: document.getElementById('tp_kelas').value,
      nominalTarif: document.getElementById('tp_nominal').value
    })
  })
  .then(r => r.json())
  .then(res => { 
    if (res.status === 'success') {
      alert(res.message || 'Berhasil disimpan!'); 
      closeModal('modal-jenis-pembayaran'); 
      loadTarifPembayaran(); 
    } else {
      alert(res.message || 'Gagal menyimpan tarif.');
    }
  })
  .catch(err => alert('Gagal menyimpan: ' + err.message))
  .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
});

document.getElementById('form-akun')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-akun');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const sheetRow = document.getElementById('akun_sheetRow').value;
  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify({
      action: sheetRow ? 'updateAccount' : 'addAccount',
      sheetRow: sheetRow,
      role: document.getElementById('akun_role').value,
      idLogin: document.getElementById('akun_idLogin').value,
      nama: document.getElementById('akun_nama').value,
      kelas: document.getElementById('akun_kelas').value,
      password: document.getElementById('akun_password').value
    })
  })
  .then(r => r.json())
  .then(res => {
    if (res.status === 'success') { 
      alert(res.message || 'Berhasil disimpan!'); 
      closeModal('modal-akun'); 
      loadAkun(); 
    } else {
      alert('Error: ' + res.message);
    }
  })
  .catch(err => alert('Gagal menyimpan: ' + err.message))
  .finally(() => { btn.disabled = false; btn.textContent = 'Simpan'; });
});

// Pemuatan Awal Data saat Halaman Loaded
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('tbody-transaksi-siswa')) {
    loadTransaksiSiswa();
  }
});