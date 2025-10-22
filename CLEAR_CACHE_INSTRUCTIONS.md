# Cara Clear Cache Browser

## Masalah: Refresh di Dashboard Redirect ke Absensi

### Penyebab:

1. Service Worker cache versi lama
2. Browser cache outdated
3. localStorage bisa jadi corrupt

---

## ✅ Solusi (Pilih salah satu):

### Opsi 1: Hard Refresh (Tercepat)

**Chrome/Edge:**

- Windows: `Ctrl + Shift + R` atau `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**

- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

---

### Opsi 2: Clear Cache Manual

#### Chrome/Edge:

1. Tekan `F12` untuk buka DevTools
2. Klik tab **Application**
3. Di sidebar kiri, klik **Service Workers**
4. Klik tombol **Unregister** untuk service worker `absensi-pengajian`
5. Klik **Storage** di sidebar
6. Klik **Clear site data**
7. Centang semua opsi
8. Klik **Clear site data**
9. Refresh halaman (`F5`)

#### Firefox:

1. Tekan `F12` untuk buka DevTools
2. Klik tab **Storage**
3. Klik kanan pada domain → **Delete All**
4. Refresh halaman (`F5`)

---

### Opsi 3: Clear via Browser Settings

#### Chrome:

1. Tekan `Ctrl + Shift + Delete`
2. Pilih **Time range: All time**
3. Centang:
   - Browsing history
   - Cookies and other site data
   - Cached images and files
4. Klik **Clear data**

#### Firefox:

1. Tekan `Ctrl + Shift + Delete`
2. Pilih **Time range to clear: Everything**
3. Centang semua
4. Klik **Clear Now**

---

### Opsi 4: Unregister Service Worker via Console

1. Buka DevTools (`F12`)
2. Buka tab **Console**
3. Paste dan Enter:

```javascript
navigator.serviceWorker.getRegistrations().then(function (registrations) {
  for (let registration of registrations) {
    registration.unregister();
    console.log("Service Worker unregistered");
  }
});
```

4. Refresh halaman (`Ctrl + F5`)

---

## 🔍 Verifikasi Cache Sudah Clear

1. Buka DevTools (`F12`)
2. Buka tab **Application** (Chrome) atau **Storage** (Firefox)
3. Cek **Service Workers** → Harusnya kosong atau status "waiting to activate"
4. Cek **Cache Storage** → Harusnya ada `absensi-pengajian-v2` (bukan v1)
5. Cek **Local Storage** → Harusnya ada `auth_user`

---

## 🎯 Test Behaviour yang Benar

Setelah clear cache:

1. **Akses `/`** → Auto redirect ke `/dashboard` ✅
2. **Akses `/dashboard`** → Tampil dashboard ✅
3. **Refresh di `/dashboard`** → Tetap di dashboard (TIDAK redirect ke absensi) ✅
4. **Klik menu Beranda** → Navigate ke `/dashboard` ✅

---

## ⚠️ Catatan untuk Developer

### Perubahan yang Dilakukan:

1. ✅ Service Worker cache version update: `v1` → `v2`
2. ✅ Updated cached URLs (remove `/absensi`, add `/absensi-new`)
3. ✅ Added `replaceState: true` to login redirect di dashboard
4. ✅ Removed auto-redirect logic yang tidak perlu

### File yang Diubah:

- `static/sw.js` - Cache version bump & URL update
- `src/routes/dashboard/+page.svelte` - Added replaceState to login redirect

---

## 🚀 Development Mode

Untuk development, **disable cache**:

1. Buka DevTools (`F12`)
2. Buka tab **Network**
3. Centang **Disable cache**
4. Keep DevTools terbuka saat development

---

## 📱 Mobile Testing

Untuk mobile browser:

1. **Android Chrome:**

   - Settings → Privacy → Clear browsing data
   - Pilih "All time"
   - Clear data

2. **iOS Safari:**
   - Settings → Safari → Clear History and Website Data
   - Confirm
