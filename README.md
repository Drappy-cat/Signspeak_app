Speech Recognition untuk Siswa Tunarungu

Aplikasi transkripsi suara real-time yang membantu siswa Tunarungu memahami percakapan lisan di lingkungan pendidikan. Suara guru diubah menjadi teks secara langsung di layar siswa, dengan tampilan yang ramah aksesibilitas.


✨ Fitur

🔊 Transkripsi real-time — suara guru diubah jadi teks langsung di layar siswa
🏫 Sesi kelas — guru membuat sesi dengan kode unik, siswa bergabung dengan kode tersebut
📜 Riwayat transkrip — siswa bisa membuka ulang transkrip sesi sebelumnya
⚙️ Pengaturan aksesibilitas — ukuran font, mode kontras tinggi, pilihan bahasa
📲 Installable ke HP — dibangun sebagai PWA, bisa ditambahkan ke home screen tanpa Play Store
🪶 Ringan — dioptimasi untuk device dengan spesifikasi rendah



🛠️ Tech stack

BagianTeknologiFrontendVite, React, TypeScriptInstallable appvite-plugin-pwaDatabase & realtimeSupabaseBackend (terpisah)LaravelSpeech-to-textAPI online (Google Cloud Speech-to-Text / alternatif)


📁 Struktur folder

src/
├─ pages/          # Login, DashboardGuru, DashboardSiswa, TranskripsiLive, Riwayat, Pengaturan
├─ lib/supabase.ts # koneksi ke Supabase
├─ types/          # tipe data (UserProfile, SesiKelas, TranskripEntry, dst)
└─ App.tsx         # navigasi antar halaman


🚀 Menjalankan di lokal

1. Clone repo dan install dependencies

bashgit clone <url-repo-ini>
cd speech-recognition-app
npm install

2. Salin file environment dan isi kredensial Supabase

bashcp .env.example .env

3. Jalankan development server

bashnpm run dev


📦 Build production

bashnpm run build
npm run preview

Buka hasil preview dari HP (satu jaringan wifi) lewat Chrome untuk mencoba opsi "Tambahkan ke layar utama".


🧭 Status pengembangan

Project ini masih dalam tahap awal. Yang masih perlu dikerjakan:


 Integrasi Supabase Auth (saat ini halaman login masih dummy)
 Backend Laravel untuk menerima audio stream & memanggil speech-to-text API
 Broadcast hasil transkrip ke channel Supabase Realtime
 Styling sesuai desain Figma
 Testing di device spesifikasi rendah
