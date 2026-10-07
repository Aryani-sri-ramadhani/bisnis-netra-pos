# Kasir Bisnis Netra

Contoh aplikasi POS (point of sale) berbasis web yang **sederhana dan ramah pembaca layar**, untuk UMKM anggota Pertuni di platform **Bisnis Netra**. Dibuat universal: tiap pemilik usaha mengisi sendiri daftar produk/jasa dan harganya, sehingga cocok untuk berbagai jenis usaha (kuliner, kopi, jasa, kerajinan, dan lain-lain).

## Fitur

- **Penjualan** — pilih produk, jumlah, diskon, dan cara bayar (tunai / transfer / piutang); kirim struk ke WhatsApp.
- **Pengeluaran** — catat belanja bahan, listrik, sewa, dan lainnya.
- **Piutang** — daftar pembeli yang belum bayar, dengan tombol tandai lunas.
- **Riwayat** — perbaiki tanggal atau hapus transaksi.
- **Produk & harga** — kelola daftar jualan.
- **Laporan keuangan (SAK EMKM)** — Laba Rugi, Neraca, dan Catatan atas Laporan Keuangan; bisa diunduh sebagai file Excel. Dilindungi PIN.
- **Modal, pengambilan pribadi, dan aset** — agar uang usaha terpisah dari uang pribadi dan neraca akurat.
- **Cadangkan & pulihkan data.**

## Aksesibilitas

Dirancang ramah pembaca layar (TalkBack/VoiceOver/NVDA): HTML bermakna, label pada setiap kolom, pemindahan fokus saat pindah layar, indikator fokus tebal, tombol besar, kontras tinggi, dan pengumuman suara termasuk angka yang dieja.

## Catatan teknis (untuk pengembang)

- Struktur file: `index.html` (kerangka), `styles.css`, `db.js` (penyimpanan), `utils.js` (fungsi bantu), `screens.js` (semua layar), `sw.js` (offline), `manifest.json`, `xlsx.full.min.js` (pembuat Excel, berjalan offline), dan ikon.
- **Versi contoh ini menyimpan data di perangkat** (localStorage) agar bisa langsung dicoba. Untuk dipasang sebagai fasilitas di website Bisnis Netra, bagian penyimpanan (`db.js`) perlu diarahkan ke login dan database server melalui API; bagian tampilan dan laporan tidak perlu diubah.
- Tanpa kerangka kerja (framework), hanya HTML, CSS, dan JavaScript biasa.
