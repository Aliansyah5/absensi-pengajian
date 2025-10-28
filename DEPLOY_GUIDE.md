# 📝 Auto-Increment Cache Version

Script untuk otomatis increment `CACHE_NAME` di service worker setiap kali deploy.

## ✅ Setup

Sudah integrated di `package.json`. Hanya gunakan command yang tepat saat deploy.

## 🚀 Cara Menggunakan

### **Option 1: Deploy dengan auto-increment (RECOMMENDED)**

```bash
npm run deploy
```

Ini akan:

1. ✅ Auto-increment cache version (v4 → v5)
2. ✅ Build aplikasi
3. ✅ Deploy ke production

### **Option 2: Manual increment kemudian build**

```bash
node increment-cache.js
npm run build
```

### **Option 3: Increment + Build + Preview**

```bash
npm run deploy:auto
```

## 📋 Apa yang Dilakukan Script

### `increment-cache.js`

- Baca `static/sw.js`
- Cari: `const CACHE_NAME = "absensi-pengajian-v{X}"`
- Increment: `v{X}` → `v{X+1}`
- Update kembali file

### Contoh Output

```bash
✅ Cache version incremented: v4 → v5
📝 Updated: C:\xampp\...\static\sw.js
```

## 🔄 Workflow Deployment

```
1. Finish coding
   ↓
2. Run: npm run deploy
   ↓
3. Auto-increment cache version
   ↓
4. Build aplikasi
   ↓
5. Deploy ke server
   ↓
6. Push ke git (don't forget!)
```

## ⚠️ Penting!

**Jangan lupa increment cache sebelum deploy!**

- Jika skip increment → Cache lama masih digunakan
- Jika increment → User auto-update dalam 20 detik

## 🧪 Testing

### Test Increment Script

```bash
node increment-cache.js
```

### Test Build

```bash
npm run build
```

### Test Deploy

```bash
npm run deploy
```

## 📊 Version History

Tracking cache versions:

- v1-v3: Testing service worker
- v4: Initial network-first strategy
- v5: Improved auto-update logic
- v6+: Subsequent deployments

## 🎯 Best Practice

1. **Sebelum deploy:**

   ```bash
   npm run deploy  # Auto-increment + build
   ```

2. **Setelah deploy ke server:**

   ```bash
   git add .
   git commit -m "Deploy v{X}: [deskripsi perubahan]"
   git push
   ```

3. **User experience:**
   - User tidak perlu delete cache
   - Auto-update dalam 20 detik
   - Seamless new version loading

## 🔧 Manual Increment (jika diperlukan)

Jika perlu increment manual tanpa build:

```bash
node increment-cache.js
```

Kemudian commit:

```bash
git add static/sw.js
git commit -m "Increment cache version for deploy"
```

---

**Catatan:** Selalu gunakan `npm run deploy` untuk ensure cache increment + build sekaligus! 🚀
