const DENDA_PER_HARI = 1000;

const DEFAULT_DATA = {
  users: [
    { username: "admin", password: "123", nama: "Administrator Perpustakaan" }
  ],
  sessionUser: null,
  buku: [
    { kode: "B001", judul: "Pengantar Ilmu Perpustakaan dan Informasi", pengarang: "Sulistyo-Basuki", penerbit: "Gramedia", tahun: "2019", kategori: "Ilmu Perpustakaan", isbn: "978-979-403-123-4", stok: 5 },
    { kode: "B002", judul: "Manajemen Perpustakaan Digital", pengarang: "Wiji Suwarno", penerbit: "Ar-Ruzz Media", tahun: "2021", kategori: "Teknologi Informasi", isbn: "978-602-313-456-7", stok: 3 },
    { kode: "B003", judul: "Katalogisasi Deskriptif Berbasis RDA", pengarang: "Putu Laxman Pendit", penerbit: "Sagung Seto", tahun: "2020", kategori: "Pengolahan Bahan Pustaka", isbn: "978-602-271-789-0", stok: 4 }
  ],
  anggota: [
    { id: "AGT001", nama: "Budi Santoso", prodi: "S1 Ilmu Perpustakaan", hp: "081234567890", alamat: "Tembalang, Semarang" },
    { id: "AGT002", nama: "Siti Aminah", prodi: "S1 Sastra Indonesia", hp: "089876543210", alamat: "Banyumanik, Semarang" }
  ],
  sirkulasi: []
};

// Perbaiki password default menjadi admin123
DEFAULT_DATA.users[0].password = "admin123";

function loadDB() {
  const raw = localStorage.getItem("perpus_db_v1");
  if (!raw) {
    localStorage.setItem("perpus_db_v1", JSON.stringify(DEFAULT_DATA));
    return structuredClone(DEFAULT_DATA);
  }
  return JSON.parse(raw);
}

function saveDB(db) {
  localStorage.setItem("perpus_db_v1", JSON.stringify(db));
}

let db = loadDB();

function notify(msg, type = "success") {
  document.getElementById("alertBox").innerHTML =
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function updateNavbar() {
  const isLoggedIn = !!db.sessionUser;
  document.getElementById("adminNav").classList.toggle("d-none", !isLoggedIn);
  document.getElementById("btnLoginNav").classList.toggle("d-none", isLoggedIn);
}

function showPage(page) {
  const adminPages = ["dashboard", "bibliografi", "anggota", "sirkulasi", "akun"];
  if (adminPages.includes(page) && !db.sessionUser) {
    page = "login";
  }

  ["opac", "login", "dashboard", "bibliografi", "anggota", "sirkulasi", "akun"].forEach(p => {
    document.getElementById("page-" + p).classList.toggle("d-none", p !== page);
  });

  if (page === "opac") renderOPAC();
  if (page === "dashboard") renderDashboard();
  if (page === "bibliografi") renderBuku();
  if (page === "anggota") renderAnggota();
  if (page === "sirkulasi") renderSirkulasi();
  if (page === "akun") renderUsers();
}

// LOGIN & LOGOUT
function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value;
  const found = db.users.find(x => x.username === u && x.password === p);
  if (!found) {
    notify("Username atau password salah!", "danger");
    return;
  }
  db.sessionUser = found.username;
  saveDB(db);
  updateNavbar();
  notify("Berhasil login sebagai " + found.nama);
  showPage("dashboard");
}

function logout() {
  db.sessionUser = null;
  saveDB(db);
  updateNavbar();
  showPage("opac");
}

function resetDemoData() {
  if (!confirm("Kembalikan semua data contoh ke awal?")) return;
  const currentUser = db.sessionUser;
  db = structuredClone(DEFAULT_DATA);
  db.sessionUser = currentUser;
  saveDB(db);
  notify("Data contoh berhasil direset.");
  renderDashboard();
}

// OPAC
function renderOPAC() {
  const kriteria = document.getElementById("opacKriteria").value;
  const kw = document.getElementById("opacKeyword").value.trim().toLowerCase();

  const filtered = db.buku.filter(b => {
    if (!kw) return true;
    if (kriteria === "judul") return b.judul.toLowerCase().includes(kw);
    if (kriteria === "pengarang") return b.pengarang.toLowerCase().includes(kw);
    if (kriteria === "penerbit") return b.penerbit.toLowerCase().includes(kw);
    if (kriteria === "tahun") return String(b.tahun).toLowerCase().includes(kw);
    if (kriteria === "kategori") return b.kategori.toLowerCase().includes(kw);
    return [b.kode, b.judul, b.pengarang, b.penerbit, b.tahun, b.kategori].some(v => String(v).toLowerCase().includes(kw));
  });

  document.getElementById("opacCount").textContent = `Menampilkan ${filtered.length} koleksi pustaka`;
  document.getElementById("opacBody").innerHTML = filtered.map(b => `
    <tr>
      <td><span class="badge bg-secondary">${b.kode}</span></td>
      <td><strong>${b.judul}</strong><br><small class="text-muted">ISBN: ${b.isbn || "-"}</small></td>
      <td>${b.pengarang}</td>
      <td>${b.penerbit} (${b.tahun})</td>
      <td>${b.kategori}</td>
      <td>${b.stok > 0
        ? `<span class="badge bg-success">Tersedia (${b.stok} eks)</span>`
        : `<span class="badge bg-danger">Dipinjam Semua</span>`}</td>
    </tr>
  `).join("");
}

// DASHBOARD
function renderDashboard() {
  const userObj = db.users.find(u => u.username === db.sessionUser);
  document.getElementById("activeUserLabel").textContent = userObj ? `${userObj.nama} (${userObj.username})` : db.sessionUser;
  document.getElementById("statStok").textContent = db.buku.reduce((acc, b) => acc + Number(b.stok), 0) + " Eks";
  document.getElementById("statAnggota").textContent = db.anggota.length + " Orang";
  document.getElementById("statPinjam").textContent = db.sirkulasi.filter(s => s.status === "Dipinjam").length + " Trx";
}

// BIBLIOGRAFI
function bukaFormBuku(idx = null) {
  document.getElementById("bukuEditIndex").value = idx === null ? "" : idx;
  document.getElementById("modalBukuTitle").textContent = idx === null ? "Tambah Buku" : "Edit Buku";
  if (idx === null) {
    ["bKode", "bJudul", "bPengarang", "bPenerbit", "bTahun", "bKategori", "bIsbn", "bStok"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("bKode").disabled = false;
  } else {
    const b = db.buku[idx];
    bKode.value = b.kode; bKode.disabled = true;
    bJudul.value = b.judul; bPengarang.value = b.pengarang;
    bPenerbit.value = b.penerbit; bTahun.value = b.tahun;
    bKategori.value = b.kategori; bIsbn.value = b.isbn || ""; bStok.value = b.stok;
  }
}

function simpanBuku(e) {
  e.preventDefault();
  const idxVal = document.getElementById("bukuEditIndex").value;
  const item = {
    kode: bKode.value.trim(),
    judul: bJudul.value.trim(),
    pengarang: bPengarang.value.trim(),
    penerbit: bPenerbit.value.trim(),
    tahun: bTahun.value.trim(),
    kategori: bKategori.value.trim(),
    isbn: bIsbn.value.trim(),
    stok: Number(bStok.value)
  };
  if (idxVal === "") {
    db.buku.unshift(item);
  } else {
    db.buku[Number(idxVal)] = item;
  }
  saveDB(db);
  bootstrap.Modal.getInstance(document.getElementById("modalBuku")).hide();
  renderBuku();
  notify("Data bibliografi disimpan.");
}

function hapusBuku(idx) {
  if (!confirm("Hapus buku ini?")) return;
  db.buku.splice(idx, 1);
  saveDB(db);
  renderBuku();
}

function renderBuku() {
  document.getElementById("bukuBody").innerHTML = db.buku.map((b, i) => `
    <tr>
      <td class="text-center"><svg class="barcode-buku" jsvalue="${b.kode}" jsheight="32" jswidth="1.4" jsfontsize="11"></svg></td>
      <td><strong>${b.judul}</strong><br><small>ISBN: ${b.isbn || "-"}</small></td>
      <td>${b.pengarang}</td>
      <td>${b.penerbit} (${b.tahun})</td>
      <td>${b.kategori}</td>
      <td>${b.stok}</td>
      <td class="no-print">
        <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#modalBuku" onclick="bukaFormBuku(${i})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="hapusBuku(${i})">Hapus</button>
      </td>
    </tr>
  `).join("");
  JsBarcode(".barcode-buku").init();
}

// ANGGOTA
function bukaFormAnggota(idx = null) {
  document.getElementById("modalAnggotaTitle").textContent = idx === null ? "Tambah Anggota" : "Edit Anggota";
  document.getElementById("anggotaMode").value = idx === null ? "add" : idx;
  if (idx === null) {
    ["aId", "aNama", "aProdi", "aHp", "aAlamat"].forEach(id => document.getElementById(id).value = "");
    aId.disabled = false;
  } else {
    const a = db.anggota[idx];
    aId.value = a.id; aId.disabled = true;
    aNama.value = a.nama; aProdi.value = a.prodi; aHp.value = a.hp; aAlamat.value = a.alamat;
  }
}

function simpanAnggota(e) {
  e.preventDefault();
  const mode = document.getElementById("anggotaMode").value;
  const item = {
    id: aId.value.trim(),
    nama: aNama.value.trim(),
    prodi: aProdi.value.trim(),
    hp: aHp.value.trim(),
    alamat: aAlamat.value.trim()
  };
  if (mode === "add") {
    if (db.anggota.some(x => x.id === item.id)) {
      notify("ID Anggota sudah digunakan!", "danger");
      return;
    }
    db.anggota.push(item);
  } else {
    db.anggota[Number(mode)] = item;
  }
  saveDB(db);
  bootstrap.Modal.getInstance(document.getElementById("modalAnggota")).hide();
  renderAnggota();
  notify("Data anggota disimpan.");
}

function hapusAnggota(idx) {
  if (!confirm("Hapus anggota ini?")) return;
  db.anggota.splice(idx, 1);
  saveDB(db);
  renderAnggota();
}

function lihatKartu(idx) {
  const a = db.anggota[idx];
  document.getElementById("kartuNama").textContent = a.nama;
  document.getElementById("kartuProdi").textContent = `${a.prodi} • ${a.id}`;
  JsBarcode("#kartuBarcode", a.id, { height: 32, width: 1.5, fontSize: 12 });
}

function cetakKartu() {
  const content = document.getElementById("areaKartu").innerHTML;
  const win = window.open("", "", "width=400,height=350");
  win.document.write(`<html><body style="font-family:sans-serif;text-align:center;padding:20px;">${content}</body></html>`);
  win.document.close();
  win.print();
}

function renderAnggota() {
  document.getElementById("anggotaBody").innerHTML = db.anggota.map((a, i) => `
    <tr>
      <td><strong>${a.id}</strong></td>
      <td>${a.nama}</td>
      <td>${a.prodi}</td>
      <td>${a.hp}</td>
      <td>${a.alamat}</td>
      <td class="no-print">
        <button class="btn btn-info btn-sm text-white" data-bs-toggle="modal" data-bs-target="#modalKartu" onclick="lihatKartu(${i})">🪪 Kartu</button>
        <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#modalAnggota" onclick="bukaFormAnggota(${i})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="hapusAnggota(${i})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

// SIRKULASI
function hitungHariTelat(tglTempo, tglAcuan) {
  const msPerHari = 1000 * 60 * 60 * 24;
  const d1 = new Date(tglTempo + "T00:00:00");
  const d2 = new Date(tglAcuan + "T00:00:00");
  const diff = Math.floor((d2 - d1) / msPerHari);
  return diff > 0 ? diff : 0;
}

function renderSirkulasi() {
  const today = new Date().toISOString().slice(0, 10);
  const plus7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  if (!tglPinjam.value) tglPinjam.value = today;
  if (!tglTempo.value) tglTempo.value = plus7;

  pinjamAnggota.innerHTML = db.anggota.map(a => `<option value="${a.id}">${a.id} - ${a.nama}</option>`).join("");
  pinjamBuku.innerHTML = db.buku
    .map((b, i) => ({ ...b, idx: i }))
    .filter(b => b.stok > 0)
    .map(b => `<option value="${b.idx}">[${b.kode}] ${b.judul} (Stok: ${b.stok})</option>`)
    .join("");

  sirkulasiBody.innerHTML = db.sirkulasi.map((s, idx) => {
    const tglBand = s.status === "Dipinjam" ? today : s.tglKembali;
    const telat = hitungHariTelat(s.tglTempo, tglBand);
    const denda = telat * DENDA_PER_HARI;
    return `
      <tr>
        <td>${s.namaAnggota}<br><small class="text-muted">${s.idAnggota}</small></td>
        <td>[${s.kodeBuku}] ${s.judulBuku}</td>
        <td>${s.tglPinjam}</td>
        <td>${s.tglTempo}</td>
        <td>${s.tglKembali || "-"}</td>
        <td>${telat > 0
          ? `<span class="text-danger fw-bold">Telat ${telat} hari (Rp ${denda.toLocaleString("id-ID")})</span>`
          : `<span class="text-success">Tepat Waktu (Rp 0)</span>`}</td>
        <td>${s.status === "Dipinjam"
          ? `<button class="btn btn-success btn-sm" onclick="kembalikanBuku(${idx})">Kembalikan</button>`
          : `<span class="badge bg-secondary">Kembali</span>`}</td>
      </tr>
    `;
  }).join("");
}

function handlePinjam(e) {
  e.preventDefault();
  const a = db.anggota.find(x => x.id === pinjamAnggota.value);
  const bIdx = Number(pinjamBuku.value);
  const b = db.buku[bIdx];
  if (!a || !b || b.stok <= 0) {
    notify("Stok buku habis atau data tidak valid.", "danger");
    return;
  }
  b.stok -= 1;
  db.sirkulasi.unshift({
    idAnggota: a.id,
    namaAnggota: a.nama,
    kodeBuku: b.kode,
    judulBuku: b.judul,
    tglPinjam: tglPinjam.value,
    tglTempo: tglTempo.value,
    tglKembali: null,
    status: "Dipinjam"
  });
  saveDB(db);
  renderSirkulasi();
  notify("Peminjaman berhasil! Stok buku berkurang 1.");
}

function kembalikanBuku(idx) {
  const s = db.sirkulasi[idx];
  if (s.status !== "Dipinjam") return;
  const today = new Date().toISOString().slice(0, 10);
  s.tglKembali = today;
  s.status = "Kembali";

  const b = db.buku.find(x => x.kode === s.kodeBuku);
  if (b) b.stok += 1;

  const telat = hitungHariTelat(s.tglTempo, today);
  const denda = telat * DENDA_PER_HARI;
  saveDB(db);
  renderSirkulasi();
  notify(`Buku dikembalikan. Keterlambatan: ${telat} hari | Denda: Rp ${denda.toLocaleString("id-ID")}.`);
}

// AKUN & PASSWORD
function handleGantiPassword(e) {
  e.preventDefault();
  const u = db.users.find(x => x.username === db.sessionUser);
  if (!u) return;
  u.password = passBaru.value;
  passBaru.value = "";
  saveDB(db);
  notify("Password berhasil diganti!");
}

function handleTambahUser(e) {
  e.preventDefault();
  const uname = newUsername.value.trim();
  if (db.users.some(x => x.username === uname)) {
    notify("Username sudah ada!", "danger");
    return;
  }
  db.users.push({
    username: uname,
    nama: newNama.value.trim(),
    password: newPassword.value
  });
  newUsername.value = "";
  newNama.value = "";
  newPassword.value = "";
  saveDB(db);
  renderUsers();
  notify("Username admin baru berhasil ditambahkan!");
}

function renderUsers() {
  usersBody.innerHTML = db.users.map(u => `
    <tr><td><strong>${u.username}</strong></td><td>${u.nama}</td></tr>
  `).join("");
}

// INIT
updateNavbar();
showPage("opac");
