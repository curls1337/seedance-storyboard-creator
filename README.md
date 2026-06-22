# Seedance Storyboard & AI Prompt Generator

A modern single-page AI tool designed to generate step-by-step cooking storyboard infographics and a single unified prompt to animate the storyboard on Seedance.

## 🚀 Fitur Utama
1. **Master Image Grid Prompt:** Menghasilkan 1 prompt detail untuk membuat seluruh panel storyboard infografis dalam 1 gambar (dengan teks/timestamp bahasa Indonesia yang digambar langsung di gambar).
2. **Master Seedance Prompt:** Cukup menggunakan 1 prompt tunggal ini di Seedance AI untuk menggerakkan/menganimasikan gambar infografis gabungan di atas secara berurutan.
3. **4 Template Resep Bawaan:**
   - Indomie Nyemek Viral (11 Langkah)
   - Nasi Goreng Spesial (7 Langkah)
   - Sate Ayam Madura (6 Langkah)
   - Es Kopi Susu Gula Aren (5 Langkah)
4. **CORS Bypass Proxy:** Server Node.js bawaan berfungsi sebagai proxy untuk meneruskan request ke API target tanpa terkena blokir CORS di browser.

## 💻 Cara Menjalankan Lokal
1. Pastikan Anda memiliki [Node.js](https://nodejs.org/) terinstall.
2. Clone repository ini.
3. Jalankan server:
   ```bash
   npm start
   ```
4. Buka **http://localhost:3000** di browser Anda.

## 🌐 Deploy ke Sevalla.com
Aplikasi ini sudah dikonfigurasi untuk siap dideploy ke **Sevalla**:
1. Masuk ke dashboard **Sevalla.com**.
2. Hubungkan akun GitHub Anda dan pilih repository `curls1337/seedance-storyboard-creator`.
3. Sevalla akan mendeteksi aplikasi ini sebagai Node.js secara otomatis.
4. Konfigurasi Deployment:
   - **Build Command:** Kosongkan atau masukkan `npm install`.
   - **Start Command:** `npm start` (otomatis mendeteksi script `start` di `package.json`).
   - **Port:** Sevalla akan secara otomatis menyuntikkan port melalui environment variable `PORT` yang telah didukung oleh `server.js`.
5. Klik **Deploy** dan aplikasi Anda akan aktif dengan domain publik gratis dari Sevalla!
