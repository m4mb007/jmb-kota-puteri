# SYSTEM REQUIREMENTS DOCUMENT (SRD) - Strata Townhouse Management System

Dokumen ini merangkumi keperluan sistem (functional & non-functional) bagi pembangunan sistem pengurusan strata untuk Townhouse (rumah atas & rumah bawah).

**Kegunaan Dokumen:**
* Rujukan pembangunan (developer)
* Rujukan pengurusan (JMB / MC)
* Dokumen kawalan skop (scope control)

**Nada Sistem:** Jelas, Praktikal, Defensible.

## 1. LATAR BELAKANG SISTEM

**1.1 Jenis Pembangunan**
* Build-for-client (custom system)
* Bukan SaaS

**1.2 Jenis Hartanah**
* Townhouse
* Struktur: Rumah atas & rumah bawah
* Anggaran unit: 
    * 178 lot
    * 356 unit (atas + bawah)

**1.3 Contoh Unit**
* J-13-1 → Unit Bawah
* J-13-2 → Unit Atas

## 2. DEFINISI ENTITI UTAMA

**2.1 Lot**
* Rumah induk
* Contoh: J-13

**2.2 Unit**
* Sub-unit kepada lot
* Setiap lot mempunyai:
    * 1 unit atas
    * 1 unit bawah

**2.3 Parking**
* **a) Parking Aksesori (Accessory Parcel)**
    * 2 petak parkir tetap bagi setiap unit
    * Parkir terikat kepada unit
    * Bukan common property
* **b) Parking Common / Free**
    * Parkir bersama
    * Tidak terikat kepada mana-mana unit
    * First come, first serve

## 3. PENGGUNA & PERANAN (USER ROLES)

**3.1 Senarai Peranan**
* Super Admin (Developer / System Owner)
* JMB / MC
* Management Staff
* Owner
* Tenant

**Nota:** Tiada peranan Guard buat masa ini.

## 4. FUNCTIONAL REQUIREMENTS

**4.1 Authentication & User Management**
* Sistem mesti menyokong login berasaskan email & password
* Sistem mesti menyokong role-based access
* Seorang pengguna boleh mempunyai lebih daripada satu unit

**4.2 Unit & Resident Management**
* Sistem mesti menyimpan maklumat lot & unit
* Sistem mesti membezakan unit atas dan unit bawah
* Sistem mesti menyokong pertukaran owner / tenant

**4.3 Parking Management**
* **4.3.1 Parking Aksesori**
    * Sistem mesti merekod 2 petak parkir bagi setiap unit
    * Parking aksesori hanya boleh dilihat oleh resident
    * Perubahan parkir hanya boleh dibuat oleh admin
* **4.3.2 Parking Common**
    * Sistem mesti merekod petak parkir common
    * Parking common tidak terikat kepada unit
    * Sistem mesti memaparkan notis bahawa parking common bukan hak eksklusif

**4.4 Billing & Maintenance Fee**
* Sistem mesti menjana bil bulanan mengikut unit
* Setiap unit hanya mempunyai satu bil bagi satu bulan
* Sistem mesti menyokong upload resit bayaran
* Admin mesti boleh approve / reject bayaran
* Sistem mesti menyimpan sejarah bil dan bayaran

**4.5 Complaint Management**
* **4.5.1 Aduan Umum**
    * Resident mesti boleh menghantar aduan
    * Aduan mesti mempunyai kategori dan penerangan
    * Sistem mesti menyokong upload gambar
    * Aduan mesti mempunyai status: Open, In Progress, Closed
* **4.5.2 Aduan Parking**
    * Sistem mesti membezakan aduan: Parking Unit, Parking Common
    * Sistem mesti memaparkan popup makluman bagi aduan parking common
    * Sistem mesti merekod pengesahan pengguna sebelum aduan dihantar
    * Aduan parking common mesti ditanda sebagai makluman (Info / Low Priority)

**4.6 Notice & Announcement**
* Admin mesti boleh mencipta notis
* Sistem mesti menyokong sasaran notis: Semua unit, Unit atas sahaja, Unit bawah sahaja
* Sistem mesti menyokong lampiran PDF

**4.7 Audit Log**
* Sistem mesti merekod aktiviti penting: Login, Kelulusan bayaran, Status aduan
* Audit log hanya boleh diakses oleh admin

## 5. NON-FUNCTIONAL REQUIREMENTS

**5.1 Security**
* Password mesti disimpan secara hashed
* API mesti menggunakan token authentication

**5.2 Performance**
* Sistem mesti menyokong sekurang-kurangnya 500 pengguna aktif

**5.3 Availability**
* Sistem mesti tersedia sekurang-kurangnya 99% uptime (best effort)

**5.4 Scalability**
* Sistem mesti boleh menyokong penambahan modul tanpa ubah struktur asas

## 6. FEATURE YANG TIDAK TERMASUK (CURRENT EXCLUSION)
* Modul guard
* Live enforcement parking
* Plate number verification
* Payment gateway

**Nota:** Semua ciri ini adalah *future-ready* dan boleh ditambah kemudian.

## 7. ASSUMPTION & LIMITATION
* Pengurusan bertanggungjawab ke atas kandungan data
* Sistem tidak menggantikan keputusan JMB
* Aduan parking common direkod sebagai makluman sahaja

## 8. ACCEPTANCE CRITERIA
* Sistem dianggap diterima apabila:
    * Semua keperluan fungsional utama dipenuhi
    * Demo kepada JMB dilaksanakan
    * Tiada isu kritikal (blocker)
