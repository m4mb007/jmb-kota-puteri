# Manual Payment Receipt - Verification Guide

## ✅ Penambahbaikan Yang Dibuat

### 1. **Resit Boleh Dilihat Semula**
Bila admin upload resit semasa manual payment, resit akan:
- ✅ Disimpan ke database dalam field `receiptUrl`
- ✅ Disimpan secara fizikal di `/public/uploads/receipts/`
- ✅ Boleh dilihat semula dengan klik butang "Resit Manual" (warna ungu)
- ✅ Dibuka di tab baru untuk semakan

### 2. **Penunjuk Visual Yang Jelas**

#### Di Jadual Bil:
- 📎 Icon paperclip muncul di sebelah status jika bil ada resit
- Hover pada icon untuk lihat tooltip "Resit tersedia"

#### Di Butang Resit:
- **Resit biasa** (dari user): Butang putih dengan label "Resit"
- **Resit manual** (dari admin): Butang ungu dengan label "Resit Manual"
- Tooltip berbeza untuk menunjukkan jenis resit

## 🧪 Cara Menguji

### Test 1: Manual Payment Dengan Resit

1. **Sebagai Admin**, buka halaman Billing
2. Cari bil dengan status "BELUM BAYAR" (PENDING)
3. Klik butang "Bayaran Manual" (icon kad kredit biru)
4. Masukkan nombor rujukan (contoh: "CASH-001" atau "BANK-REF-123")
5. **Pilih fail resit** (JPG/PNG/PDF, max 5MB)
6. Sahkan pembayaran
7. ✅ Bil akan bertukar status ke "DIBAYAR" (APPROVED)

### Test 2: Lihat Resit Manual

1. Selepas manual payment, **refresh halaman**
2. Di baris bil yang sama:
   - Lihat status "DIBAYAR" dengan warna hijau
   - Lihat icon 📎 di sebelah status
   - Lihat butang **"Resit Manual"** berwarna ungu
3. **Klik butang "Resit Manual"**
4. ✅ Resit akan dibuka di tab baru
5. ✅ Fail sepatutnya boleh dilihat dengan jelas

### Test 3: Semak Rekod Database

```sql
-- Semak bil dengan resit
SELECT 
  id, 
  status, 
  receiptUrl,
  amount,
  createdAt
FROM "Bill"
WHERE receiptUrl IS NOT NULL
  AND receiptUrl LIKE '%manual-receipt%'
ORDER BY createdAt DESC
LIMIT 10;
```

### Test 4: Semak Fail Fizikal

```bash
# Semak folder receipts
ls -lah public/uploads/receipts/

# Cari manual receipts
ls -lah public/uploads/receipts/manual-receipt*

# Semak saiz fail (pastikan > 0 bytes)
du -h public/uploads/receipts/manual-receipt*
```

## 📋 Checklist Verification

- [ ] Admin boleh pilih resit (file input muncul)
- [ ] Validation file type berfungsi (tolak file .txt, .doc, etc)
- [ ] Validation file size berfungsi (tolak file > 5MB)
- [ ] Resit disimpan ke database (receiptUrl tidak NULL)
- [ ] Resit disimpan secara fizikal (file wujud di folder)
- [ ] Butang "Resit Manual" muncul selepas upload
- [ ] Butang berwarna ungu (purple) untuk manual receipt
- [ ] Icon 📎 muncul di status column
- [ ] Klik butang resit buka fail di tab baru
- [ ] Fail boleh dibaca/dilihat dengan betul (tiada 404)
- [ ] Status bil bertukar ke APPROVED automatically
- [ ] IncomeCollection tercatat di database

## 🔧 Troubleshooting

### Masalah: 404 Error Bila Klik Resit

**Check:**
1. Semak fail wujud di server:
   ```bash
   ls -la public/uploads/receipts/manual-receipt-*
   ```

2. Semak receiptUrl di database:
   ```sql
   SELECT receiptUrl FROM "Bill" WHERE id = 'BILL_ID_HERE';
   ```

3. Pastikan path betul:
   - ✅ Betul: `/uploads/receipts/manual-receipt-xxx.pdf`
   - ❌ Salah: `uploads/receipts/...` (tiada slash depan)
   - ❌ Salah: `/public/uploads/...` (ada public)

4. Restart development server:
   ```bash
   npm run dev
   ```

### Masalah: Resit Tidak Tersimpan

**Check:**
1. Folder permissions:
   ```bash
   chmod -R 755 public/uploads/receipts/
   ```

2. Folder wujud:
   ```bash
   mkdir -p public/uploads/receipts
   ```

3. Check server logs untuk error messages

### Masalah: Butang Resit Tidak Muncul

**Check:**
1. Refresh halaman (hard refresh: Cmd+Shift+R)
2. Check browser console untuk errors
3. Verify `receiptUrl` ada nilai di database
4. Check TypeScript types include `receiptUrl` field

## 📝 Implementation Details

### File Naming Convention
```
manual-receipt-{billId}-{timestamp}.{extension}
```
Contoh: `manual-receipt-cmkcxx2q30003zzsrtv9lqgzl-1768399804553.pdf`

### File Storage Path
- **Physical:** `/public/uploads/receipts/`
- **URL:** `/uploads/receipts/{filename}`
- **Database:** `Bill.receiptUrl` field

### Supported Formats
- ✅ `image/jpeg` (.jpg, .jpeg)
- ✅ `image/png` (.png)
- ✅ `application/pdf` (.pdf)

### Maximum File Size
- 5MB (5,242,880 bytes)

## 📊 Audit Log

Setiap manual payment dengan resit akan create audit log:
```
Action: MANUAL_PAYMENT
Details: Manual payment for Bill {billId} by admin (Ref: {referenceNumber})
```

## ✨ Features Tambahan

1. **Warna Berbeza Untuk Resit Manual**
   - Resit biasa: Putih/default
   - Resit manual: Ungu (purple)
   
2. **Tooltip Informasi**
   - Hover pada butang untuk lihat "Lihat Resit (Bayaran Manual)"
   
3. **Icon Paperclip**
   - Penunjuk cepat di jadual untuk tahu mana bil ada resit

4. **Validation Lengkap**
   - File type
   - File size
   - File existence
   - Reference number mandatory

## 🎯 Expected Behavior

**Sebelum Upload:**
```
Status: PENDING
receiptUrl: null
Butang: [Bayaran Manual]
Icon: Tiada
```

**Selepas Upload:**
```
Status: APPROVED
receiptUrl: "/uploads/receipts/manual-receipt-xxx.pdf"
Butang: [Resit Manual] (ungu)
Icon: 📎
```

**Bila Klik Resit:**
```
Action: Buka tab baru
URL: http://localhost:3000/uploads/receipts/manual-receipt-xxx.pdf
Result: Fail ditunjukkan (PDF viewer atau gambar)
```

## 📞 Support

Jika masih ada masalah, check:
1. Browser console (F12) untuk errors
2. Server logs untuk backend errors
3. Network tab untuk failed requests
4. File system untuk verify file exists

