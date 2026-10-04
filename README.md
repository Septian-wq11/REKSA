# REKSA - Sistem Kolaborasi Pascabencana

REKSA (Respon Cepat Tanggap Bencana) adalah platform aplikasi kolaborasi yang memfasilitasi koordinasi cepat dan terstruktur pascabencana antara masyarakat yang terdampak, posko komando, dan relawan lapangan.

## Fitur Utama

Aplikasi ini memiliki tiga mode akses utama (berdasarkan peran pengguna):

1. **Layanan Masyarakat (Citizen)**
   - Melaporkan kebutuhan darurat (Air Bersih, Makanan, Medis, dll).
   - Memantau perjalanan bantuan dan status verifikasi laporan secara *real-time*.
   - Konfirmasi penerimaan bantuan.

2. **Ringkasan Operasional Posko (Command Center)**
   - Dasbor pemantauan beban kerja dan kasus aktif yang perlu ditangani.
   - Peta Kebutuhan terintegrasi untuk melihat titik koordinat pelaporan.
   - Manajemen alokasi sumber daya dari berbagai instansi (BPBD, PMI, Mitra Lokal).

3. **Penugasan Lapangan (Responder)**
   - Manajemen daftar tugas bagi relawan dan petugas lapangan.
   - Navigasi dan rute pengiriman logistik bantuan.
   - Pelaporan status penyerahan bantuan ke posko.

## Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan arsitektur modern dan ringan:
- **Framework**: React.js
- **Build Tool**: Vite
- **Bahasa**: TypeScript
- **Styling**: Vanilla CSS (dengan sistem variabel dan *responsive design* kustom)

## Panduan Menjalankan Proyek Secara Lokal

Untuk menjalankan proyek ini di mesin lokal, pastikan Anda telah menginstal [Node.js](https://nodejs.org/) versi terbaru.

1. **Kloning repositori ini**
   ```bash
   git clone https://github.com/Septian-wq11/REKSA.git
   cd reksa-v1
   ```

2. **Instal dependensi**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan (Development Server)**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses melalui browser di alamat yang disediakan oleh Vite (secara bawaan: `http://localhost:5173/` atau `http://localhost:8443/`).

## Kontribusi

Proyek ini menggunakan alur kerja kontrol versi Git. Setiap perbaikan bug kecil, pembaruan desain antarmuka, dan optimasi fitur dikelola dalam *commit* terpisah secara atomik untuk menjaga rekam jejak repositori tetap rapi.
