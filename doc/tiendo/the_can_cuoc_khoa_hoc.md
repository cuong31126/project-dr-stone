# DAC TA TINH NANG: THE CAN CUOC VUONG QUOC KHOA HOC (SCIENCE PASS)

## 1. Muc tieu
Thay the tinh nang Dang nhap / Dang ky truyen thong bang co che gamification phu hop voi chu de anime Dr. Stone.
He thong khong su dung backend hay database MySQL, toan bo du lieu duoc quan ly qua Trinh duyet (LocalStorage API).
Muc tieu chinh la gay an tuong trong ho so portfolio va cung cap tinh nang ca nhan hoa (bookmark tap phim, luu lich su xem).

---

## 2. Cau truc du lieu (LocalStorage Schema)

Key luu tru: `drstone_citizen_profile`

Dinh dang JSON:
```json
{
  "id": "citizen_1726798800000",
  "nickname": "Senku Fan",
  "faction": "science",
  "factionName": "Vuong Quoc Khoa Hoc",
  "role": "alchemist",
  "roleTitle": "Nha Gia Kim",
  "avatarUrl": "assets/images/characters/senku.jpg",
  "joinedDate": "2026-09-20",
  "level": 1,
  "sciencePoints": 100,
  "bookmarks": ["s1_ep1", "s1_ep2"]
}
```

Dinh nghia cac truong:
- `id`: Chuoi dinh danh duy nhat tao tu timestamp.
- `nickname`: Ten nguoi dung nhap vao (do dai 2 - 20 ky tu, khong chua ky tu dac biet nguy hiem).
- `faction`: 
  - `science`: Vuong Quoc Khoa Hoc (Senku), tong mau chu dao: Xanh ngoc (#10b981 / #00f5a0).
  - `might`: De Quoc Suc Manh (Tsukasa), tong mau chu dao: Do cam (#ef4444 / #f97316).
- `role`:
  - `alchemist`: Nha Gia Kim (phu hop phe science).
  - `craftsman`: Tho Thu Cong (Kaseki - phu hop phe science).
  - `scout`: Trinh Sat (Chrome - phu hop phe science).
  - `warrior`: Chien Binh (Kohaku / Hyoga - phu hop phe might hoac science).
- `bookmarks`: Mang chua ID cac tap phim da danh dau yeu thich.

---

## 3. Luong trai nghiem nguoi dung (User Flow)

### 3.1. Trang thai chua dang ky (Default / Guest)
- Tren thanh Navbar hien thi nut: "Gia nhap Vuong Quoc" (kem icon the can cuoc hoac tia set khoa hoc).
- Khi nguoi dung click vao nut, he thong kich hoat Modal tao the (Citizen Registration Modal).

### 3.2. Modal nhap thong tin
Modal hien thi dang pop-up glassmorphism (kinh mo, nen toi):
1. Input text: "Nhap biet danh cua ban".
2. Radio card chon Phe phai (Faction):
   - Option A: Vuong Quoc Khoa Hoc (Bieu tuong binh thi nghiem, vien mau xanh ngoc).
   - Option B: De Quoc Suc Manh (Bieu tuong nam dam, vien mau do cam).
3. Select hoac Radio chon Vai tro (Role):
   - Danh sach: Nha Gia Kim, Tho Thu Cong, Trinh Sat, Chien Binh.
4. Nut xac nhan: "Kich Hoat The Can Cuoc".

### 3.3. Hieu ung sau khi kich hoat
- Modal dong lai hoac chuyen sang man hinh xem the 3D.
- Hien thi The Can Cuoc 3D Hologram (interactive card nghieng theo toa do chuot - 3D tilt effect).
- Am thanh chuc mung (audio click/chime tuy chon).
- Du lieu duoc luu vao `localStorage.setItem('drstone_citizen_profile', JSON.stringify(profile))`.

### 3.4. Trang thai da dang ky (Authenticated Guest)
- Tren Navbar, nut "Gia nhap Vuong Quoc" duoc thay the bang:
  - Avatar nho cua vai tro da chon.
  - Ten biet danh nguoi dung.
  - Huy hieu phe phai (badge mau xanh hoac do).
- Khi click vao Avatar tren Navbar:
  - Menu drop-down hoac modal mo ra the can cuoc de xem lai.
  - Nut "Doi thong tin" (Cap nhat biet danh/vai tro).
  - Nut "Roi khoi Vuong Quoc" (Dang xuat: xoa localStorage va dua ve guest state).

---

## 4. Tich hop voi cac tinh nang khac tren Web

### 4.1. Bookmark tap phim
- Moi card tap phim tren trang danh sach co icon trai tim / danh dau.
- Neu nguoi dung da co The Can Cuoc: click de them/xoa tap phim khoi mang `bookmarks` trong profile.
- Neu chua co the: click vao bookmark se tu dong mo modal moi tao the.

### 4.2. Diem khoa hoc (Science Points)
- Moi lan danh dau xem 1 tap phim hoac click doc thong tin nhan vat: tang 10 diem khoa hoc.
- Diem so duoc cap nhat truc tiep tren The Can Cuoc 3D.

---

## 5. Thiet ke ky thuat (Technical Implementation)

### 5.1. Cau truc tep tin lien quan
- `js/citizen-pass.js`: Module rieng biet quan ly toan bo logic the can cuoc.
- `index.html`: Chua template cua Modal dang ky va container chua The Can Cuoc 3D.
- `css/custom.css`: Quy dinh style 3D transform (`perspective`, `rotateX`, `rotateY`, gradient hologram).

### 5.2. Cac ham chinh trong js/citizen-pass.js
1. `getCitizenProfile()`: Doc du lieu tu LocalStorage, tra ve object hoac null.
2. `saveCitizenProfile(data)`: Ghi du lieu vao LocalStorage va kich hoat su kien `citizenProfileUpdated`.
3. `openCitizenModal()`: Mo popup dang ky hoac popup xem the.
4. `closeCitizenModal()`: Dong popup.
5. `renderNavbarCitizenState()`: Kiem tra localStorage de render nut "Gia nhap" hoac dropdown "User Profile".
6. `initCard3DTilt(cardElement)`: Xu ly su kien `mousemove` tren the de tao goc nghieng 3D va hieu ung phan chieu anh sang (specular glare).
7. `logoutCitizen()`: Xoa key khoi LocalStorage va reset UI Navbar.

---

## 6. Yeu cau giao dien The Can Cuoc 3D (Design Rules)

- Ti le the: Chuan ID card (khoang 85.6mm x 53.98mm, tuong duong 340px x 215px tren web).
- Hieu ung nen: Nen dark carbon hoac phien da bi hoa thach (Stone texture) ket hop mach dien tu phat sang neon (glow circuit lines).
- Hieu ung Hologram: Su dung gradient `linear-gradient(135deg, rgba(255,255,255,0.2), transparent)` thay doi theo vi tri chuot.
- Font chu: Orbitron cho ID/Code, Rajdhani cho ten va vai tro, Inter cho ngay thang.
- Khong dung thu vien nang: Dung CSS 3D transform thuan de dat 60 FPS muot ma.

---

## 7. Ke hoach trien khai (Roadmap)

1. **Buoc 1**: Tao file `js/citizen-pass.js` voi cac ham xu ly du lieu LocalStorage co ban.
2. **Buoc 2**: Them HTML Modal dang ky va markup The Can Cuoc vao `index.html`.
3. **Buoc 3**: Them CSS hieu ung 3D tilt va holo shine vao `css/custom.css`.
4. **Buoc 4**: Gan su kien click tren Navbar de mo Modal va cap nhat trang thai sau khi luu.
5. **Buoc 5**: Tich hop luu bookmark tap phim vao du lieu citizen pass.
