/**
 * js/firebase-auth.js
 * Tích hợp Google OAuth (Firebase Authentication) & Firebase Realtime Database
 * Cho Hệ Thống Thẻ Căn Cước Vương Quốc Khoa Học (Citizen Pass)
 * Dự án: Dr. Stone Fan Experience
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  onValue 
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js';

// Cấu hình Firebase project iotdemo31126
const firebaseConfig = {
  apiKey: "AIzaSyBJ8fOqYxTJjtkOWmQiF6y8KsqZz7itmBI",
  authDomain: "iotdemo31126.firebaseapp.com",
  databaseURL: "https://iotdemo31126-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iotdemo31126",
  storageBucket: "iotdemo31126.firebasestorage.app",
  messagingSenderId: "905365432316",
  appId: "1:905365432316:web:7a276ece1519c7b460f479",
  measurementId: "G-EJXLE3MNQX"
};

// Khởi tạo Firebase App
let app, auth, db, provider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
  provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  console.log('⚡ Firebase Kingdom of Science kết nối thành công!');
} catch (err) {
  console.warn('⚠️ Lỗi khởi tạo Firebase SDK:', err);
}

/**
 * Đăng nhập bằng tài khoản Google thật
 */
export async function loginWithGoogle() {
  if (!auth || !provider) {
    alert('Không thể kết nối dịch vụ Google Firebase! Vui lòng tải lại trang.');
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('✅ Google User Thức Tỉnh:', user.displayName, user.email, user.uid);

    // Kiểm tra xem user đã có hồ sơ trên Realtime Database chưa
    const userRef = ref(db, `citizens/${user.uid}`);
    const snapshot = await get(userRef);

    let profile;
    const today = new Date().toLocaleDateString('vi-VN');

    if (snapshot.exists()) {
      // User cũ: Đồng bộ hồ sơ từ Cloud về
      profile = snapshot.val();
      profile.lastLogin = new Date().toISOString();
      if (!profile.googlePhotoURL && user.photoURL) {
        profile.googlePhotoURL = user.photoURL;
      }
      await update(userRef, { 
        lastLogin: profile.lastLogin,
        googlePhotoURL: profile.googlePhotoURL || '' 
      });
      console.log('🔄 Đã đồng bộ hồ sơ Cloud của cư dân:', profile.nickname);

      if (window.CitizenPass) {
        window.CitizenPass.saveProfile(profile);
        window.CitizenPass.showToast('⚡ CHÀO MỪNG TRỞ LẠI!', `Cư dân <b>${profile.nickname}</b> đã đăng nhập! (${profile.sciencePoints} SP)`, 'emerald');
        window.CitizenPass.closeModal('citizen-reg-modal');
        setTimeout(() => {
          window.CitizenPass.openPassModal();
        }, 400);
      }
    } else {
      // User mới: Tạo hồ sơ khởi đầu với thông tin thật từ Google
      const randomHex = Math.floor(1000 + Math.random() * 9000);
      const citizenId = `KOS-5738-${randomHex}`;

      profile = {
        uid: user.uid,
        id: citizenId,
        nickname: user.displayName || 'Nhà Khoa Học',
        email: user.email,
        avatarUrl: user.photoURL || 'assets/images/characters/hd/senku.png',
        googlePhotoURL: user.photoURL || '',
        faction: 'science',
        factionName: 'Vương Quốc Khoa Học',
        role: 'alchemist',
        roleTitle: 'Nhà Giả Kim Tinh Hoa',
        joinedDate: today,
        lastLogin: new Date().toISOString(),
        petrificationYears: 3719,
        sciencePoints: 100, // Thưởng 100 SP khi thức tỉnh
        customQuote: '10 tỷ phần trăm tôi sẽ phục hưng nền văn minh!'
      };

      // Lưu hồ sơ mới vào Cloud Realtime Database
      await set(userRef, profile);
      console.log('✨ Đã tạo hồ sơ cư dân mới trên Cloud Firebase:', profile.id);

      if (window.CitizenPass) {
        window.CitizenPass.saveProfile(profile);
        window.CitizenPass.showToast('🧪 THỨC TỈNH THÀNH CÔNG!', `Chào mừng cư dân mới <b>${profile.nickname}</b>! (+100 SP)`, 'emerald');
        
        // Mở modal tùy chỉnh để người dùng chọn Phe Phái & Vai Trò
        setTimeout(() => {
          window.CitizenPass.openRegistrationModal(true, true);
        }, 500);
      }

      // Bắn thông báo lên Discord nếu có tích hợp
      if (typeof window.sendCitizenAwakenToDiscord === 'function') {
        window.sendCitizenAwakenToDiscord(profile);
      }
    }

    return profile;
  } catch (err) {
    console.error('❌ Lỗi đăng nhập Google Auth:', err);
    if (err.code === 'auth/operation-not-allowed') {
      alert('⚠️ CHƯA BẬT GOOGLE SIGN-IN TRÊN FIREBASE CONSOLE!\n\nCách kích hoạt (mất 30 giây):\n1. Vào link: https://console.firebase.google.com/project/iotdemo31126/authentication/providers\n2. Bấm vào nhà cung cấp "Google"\n3. Bật công tắc "Enable"\n4. Chọn Email hỗ trợ dự án (Project support email) rồi bấm nút "Save"\n5. Quay lại đây đăng nhập là thành công 100%!');
    } else if (err.code === 'auth/popup-blocked') {
      alert('⚠️ Trình duyệt vừa chặn popup đăng nhập Google. Vui lòng cho phép popup để tiếp tục!');
    } else if (err.code !== 'auth/popup-closed-by-user') {
      alert('Đăng nhập Google thất bại: ' + (err.message || 'Lỗi không xác định'));
    }
    return null;
  }
}

/**
 * Đăng xuất tài khoản Google
 */
export async function logoutGoogle() {
  if (auth) {
    try {
      await signOut(auth);
      console.log('🚪 Đã đăng xuất Google Auth');
    } catch (e) {
      console.warn('Lỗi signOut Google:', e);
    }
  }
}

/**
 * Đồng bộ điểm SP và hồ sơ lên Firebase Cloud khi có thay đổi
 */
export async function syncProfileToCloud(profile) {
  if (!db || !profile || !profile.uid) return;
  try {
    const userRef = ref(db, `citizens/${profile.uid}`);
    await update(userRef, {
      nickname: profile.nickname,
      faction: profile.faction,
      factionName: profile.factionName,
      role: profile.role,
      roleTitle: profile.roleTitle,
      avatarUrl: profile.avatarUrl,
      customQuote: profile.customQuote,
      sciencePoints: profile.sciencePoints || 100,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Không thể đồng bộ lên Firebase Cloud:', err);
  }
}

/**
 * Lắng nghe tổng số lượng cư dân thức tỉnh trên Cloud để cập nhật Live Radar
 */
export function listenToCitizensCount(callback) {
  if (!db) return;
  const citizensRef = ref(db, 'citizens');
  onValue(citizensRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const count = Object.keys(data).length;
      if (typeof callback === 'function') {
        callback(count);
      }
    }
  });
}

// Gán hàm vào window để citizen-pass.js hoặc HTML có thể gọi
window.loginWithGoogle = loginWithGoogle;
window.logoutGoogle = logoutGoogle;
window.syncProfileToCloud = syncProfileToCloud;
window.listenToCitizensCount = listenToCitizensCount;
