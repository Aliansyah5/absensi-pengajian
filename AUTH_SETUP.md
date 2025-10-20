# Setup Authentication System - Username & Password

## Perubahan Database

Sistem login telah diubah dari **email & password** menjadi **username & password** dengan password plain text (tanpa enkripsi).

### 1. Jalankan SQL Migration

Jalankan file SQL berikut di Supabase SQL Editor:

```
database/add_auth_columns.sql
```

SQL ini akan:

- Menambahkan kolom `username` dan `password` ke tabel `muser`
- Set default username dari email existing
- Set default password 'password123'
- Membuat sample users untuk testing
- Membuat index untuk performa

### 2. Sample Users

Setelah menjalankan SQL migration, Anda akan memiliki user berikut:

| Username | Password | Role        | Full Name     |
| -------- | -------- | ----------- | ------------- |
| admin    | admin123 | super_admin | Administrator |
| user     | user123  | user        | User Biasa    |

### 3. Cara Login

1. Buka aplikasi di browser: `http://localhost:5175/login`
2. Masukkan username (contoh: `admin`)
3. Masukkan password (contoh: `admin123`)
4. Klik "Masuk"

### 4. Test Connection

Untuk memverifikasi koneksi database dan melihat user yang tersedia:

1. Di halaman login, klik button "Test Connection"
2. Akan muncul list user dengan username dan role mereka

## Perubahan Code

### DatabaseService.login()

- Parameter berubah dari `(email, password)` menjadi `(username, password)`
- Query menggunakan `eq("username", username)` instead of `eq("email", email)`
- Password check: `password !== userData.password` (plain text comparison)

### Login Page

- Input field berubah dari "Email" menjadi "Username"
- Type input dari `type="email"` menjadi `type="text"`
- Validation message disesuaikan

### Auth Store

- Tetap sama, menyimpan data user di localStorage
- Menambahkan field `username` di user object

## Security Note

⚠️ **PENTING untuk Production:**

Sistem ini menggunakan **plain text password** untuk keperluan development/demo.

Untuk production, Anda HARUS:

1. Install bcrypt: `npm install bcrypt`
2. Hash password saat registrasi:
   ```javascript
   const bcrypt = require("bcrypt");
   const hashedPassword = await bcrypt.hash(password, 10);
   ```
3. Verify password saat login:
   ```javascript
   const isValid = await bcrypt.compare(password, userData.password);
   ```

## Troubleshooting

### Error: "Username tidak ditemukan"

- Pastikan kolom `username` sudah ada di tabel `muser`
- Jalankan SQL migration: `database/add_auth_columns.sql`
- Check dengan query: `SELECT username, password, active FROM muser;`

### Error: "Password salah"

- Pastikan password yang diinput sesuai dengan data di database
- Password case-sensitive
- Default password sample user: `admin123` atau `user123`

### Column "username" does not exist

- Jalankan migration SQL untuk menambahkan kolom
- Atau manual ALTER TABLE:
  ```sql
  ALTER TABLE muser ADD COLUMN username VARCHAR(50) UNIQUE;
  ALTER TABLE muser ADD COLUMN password VARCHAR(255);
  ```

## Manual User Creation

Untuk membuat user baru secara manual:

```sql
INSERT INTO muser (email, username, password, full_name, role, active)
VALUES
  ('newuser@example.com', 'newuser', 'password123', 'New User', 'user', 1);
```

## Fitur Tambahan

- Auto-save login session (24 jam)
- Test Connection button untuk debugging
- Error messages yang informatif
- Support untuk role-based access (super_admin, admin, user)
