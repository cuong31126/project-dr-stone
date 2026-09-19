// js/periodic-table.js — Three.js CSS3D Periodic Table tương tác 3D cho Dr. Stone

import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ELEMENTS_DATA, CATEGORY_COLORS } from '../data/elements.js';

/* ──────────────────────────────────────────
   STATE & OBJECTS
   ────────────────────────────────────────── */
let camera, scene, renderer, controls;
const objects = [];
const elementDomList = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };
let currentLayout = 'table';

// Dự án của Senku và các nguyên tố cấu thành
const SENKU_PROJECTS = {
  'all': null,
  'revival': { name: 'Nước Hồi Sinh', elements: ['H', 'C', 'N', 'O'], formula: 'HNO₃ + C₂H₅OH', desc: 'Dung dịch Axit Nitric kết hợp cồn chưng cất, phá vỡ liên kết hóa thạch bề mặt giải phóng con người.' },
  'sulfa': { name: 'Thuốc Sulfa Cứu Ruri', elements: ['S', 'Cl', 'Na', 'C', 'H', 'N', 'O'], formula: 'H₂SO₄ + NaCl + NaOH + Aniline', desc: 'Liều kháng sinh vĩ đại cứu sống nữ pháp sư Ruri khỏi căn bệnh viêm phổi mãn tính.' },
  'dynamo': { name: 'Máy Phát Điện & Sắt', elements: ['Fe', 'Cu', 'Zn'], formula: 'Đồng Cu + Sắt Fe + Kẽm Zn', desc: 'Trái tim thắp sáng màn đêm tiền sử và sản xuất dòng điện vô tận.' },
  'bulb': { name: 'Bóng Đèn Vonfram', elements: ['W', 'P', 'Si', 'C'], formula: 'Sợi Vonfram W + Thủy Tinh SiO₂ + Photpho P', desc: 'Thắp sáng bóng tối 3.700 năm, mở ra kỷ nguyên văn minh ánh sáng hiện đại.' },
  'lightbulb': { name: 'Bóng Đèn Vonfram', elements: ['W', 'P', 'Si', 'C'], formula: 'Sợi Vonfram W + Thủy Tinh SiO₂ + Photpho P', desc: 'Thắp sáng bóng tối 3.700 năm, mở ra kỷ nguyên văn minh ánh sáng hiện đại.' },
  'phone': { name: 'Máy Truyền Tin Vô Tuyến', elements: ['Ag', 'Cu', 'W', 'K', 'Na'], formula: 'Màng Rung Bạc Ag + Muối Rochelle', desc: 'Điện thoại vô tuyến cự ly xa kết nối chiến lược đè bẹp Đế Chế Tsukasa không đổ máu.' },
  'perseus': { name: 'Chiến Hạm Perseus & Động Cơ', elements: ['Fe', 'C', 'Cu', 'Zn', 'Ni'], formula: 'Thép Hợp Kim + Động Cơ Hơi Nước & Xăng', desc: 'Chiến hạm khoa học viễn chinh vượt Thái Bình Dương tìm nguồn gốc hóa đá.' },
  'platinum': { name: 'Cỗ Máy Hồi Sinh Vô Hạn', elements: ['Pt', 'N', 'H', 'O'], formula: 'Xúc Tác Bạch Kim Pt (NH₃ → HNO₃)', desc: 'Xúc tác điều chế vô tận Axit Nitric từ phân chim và amoniac.' }
};

const LAYOUT_CYCLE = ['sphere', 'helix', 'grid', 'table'];

export function cycleNextLayout() {
  const currentIdx = LAYOUT_CYCLE.indexOf(currentLayout);
  const nextIdx = (currentIdx + 1) % LAYOUT_CYCLE.length;
  const nextMode = LAYOUT_CYCLE[nextIdx];
  currentLayout = nextMode;
  transform(targets[nextMode], 1.4);
  updateModeBadge(nextMode);
}

function updateModeBadge(mode) {
  const modeText = document.getElementById('pt-mode-text');
  if (!modeText) return;
  const titles = {
    sphere: '🔮 Quả Cầu Nguyên Tố 3D',
    helix: '🧬 Chuỗi Xoắn Ốc DNA',
    grid: '🧊 Ma Trận Khối 3D',
    table: '📄 Bảng Tuần Hoàn Tiêu Chuẩn'
  };
  modeText.textContent = titles[mode] || mode;
}

/* ──────────────────────────────────────────
   INIT FUNCTION
   ────────────────────────────────────────── */
export function initPeriodicTable() {
  const container = document.getElementById('pt-container');
  if (!container) return;

  const width = container.clientWidth || 1050;
  const height = container.clientHeight || 500;

  // 1. Camera — goc nhin chuan thang dung
  camera = new THREE.PerspectiveCamera(40, width / height, 1, 10000);
  camera.position.set(0, 0, 2700);

  // 2. Scene
  scene = new THREE.Scene();

  // 3. Build CSS3D Element Objects
  ELEMENTS_DATA.forEach((item, i) => {
    const el = createElementDOM(item, i);
    elementDomList.push({ el, item });
    const objectCSS = new CSS3DObject(el);
    objectCSS.position.x = Math.random() * 2000 - 1000;
    objectCSS.position.y = Math.random() * 2000 - 1000;
    objectCSS.position.z = Math.random() * 2000 - 1000;
    scene.add(objectCSS);
    objects.push(objectCSS);
  });

  // 4. Calculate Coordinates for 4 Layouts
  calcTablePositions();
  calcSpherePositions();
  calcHelixPositions();
  calcGridPositions();

  // 5. CSS3DRenderer
  renderer = new CSS3DRenderer();
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // 6. OrbitControls (Co khoa truc dung — chu khong bao gio bi lon nguoc)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 700;
  controls.maxDistance = 5000;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.minPolarAngle = Math.PI * 0.15; // Giới hạn góc nghiêng trên, không lật đỉnh
  controls.maxPolarAngle = Math.PI * 0.82; // Giới hạn góc nghiêng dưới, không lật đáy

  // 7. Xử lý Zoom chuột & Cuộn trang
  controls.enableZoom = false;
  container.addEventListener('mouseenter', () => {
    controls.enableZoom = true;
  });
  container.addEventListener('mouseleave', () => {
    controls.enableZoom = false;
  });
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
  }, { passive: false });

  // 8. Hỗ trợ Click-to-Cycle trên trang chủ (khi không có hàng nút điều khiển)
  const isHomepageMode = !document.getElementById('btn-pt-table');
  if (isHomepageMode) {
    let pointerDownPos = { x: 0, y: 0, time: 0 };
    container.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY, time: Date.now() };
    });
    container.addEventListener('pointerup', (e) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dt = Date.now() - pointerDownPos.time;
      // Nhấp chuột nhẹ (không phải kéo xoay 3D)
      if (Math.hypot(dx, dy) < 8 && dt < 400) {
        cycleNextLayout();
      }
    });

    const badge = document.getElementById('pt-mode-badge');
    if (badge) {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleNextLayout();
      });
    }
  }

  // 9. Event Listeners
  setupLayoutButtons();
  setupZoomButtons();
  setupProjectFilterButtons();
  setupResize(container);

  // Initial layout:
  // - Nếu là trang chủ: Bắt đầu từ 'sphere' (Quả cầu 3D) như yêu cầu của người dùng
  // - Nếu là trang chi tiết: Bắt đầu từ 'table' (Bảng tuần hoàn phẳng chuẩn)
  if (isHomepageMode) {
    currentLayout = 'sphere';
    transform(targets.sphere, 1.8);
    updateModeBadge('sphere');
  } else {
    currentLayout = 'table';
    transform(targets.table, 1.8);
    updateModeBadge('table');
  }

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

/* ──────────────────────────────────────────
   DOM ELEMENT BUILDER
   ────────────────────────────────────────── */
function createElementDOM(item, index) {
  const cat = CATEGORY_COLORS[item.category] || { border: 'rgba(0,212,255,0.4)', glow: 'rgba(0,212,255,0.2)', badge: '#00d4ff', text: 'Khác' };
  const isSenku = !!item.drStone;

  const el = document.createElement('div');
  el.className = `pt-element ${isSenku ? 'is-senku' : ''}`;
  el.dataset.symbol = item.symbol;
  el.dataset.number = item.number;

  el.style.borderColor = isSenku ? '#00e5ff' : cat.border;
  el.style.boxShadow = isSenku 
    ? '0 0 16px rgba(0, 229, 255, 0.35), inset 0 0 10px rgba(0, 229, 255, 0.1)' 
    : `0 0 8px ${cat.glow}`;

  el.innerHTML = `
    ${isSenku ? '<span class="senku-badge" title="Phát minh Senku">🧪 SENKU</span>' : ''}
    <div class="pt-number" style="color: ${cat.badge}">${item.number}</div>
    <div class="pt-symbol">${item.symbol}</div>
    <div class="pt-name">${item.name}</div>
    <div class="pt-mass">${item.mass}</div>
  `;

  // Click event:
  // - Trên trang chủ (không có nút bấm): Nhấp chuột chuyển tuần hoàn chế độ
  // - Trên trang chi tiết (khoahoc3d.html): Mở modal tra cứu chi tiết nguyên tố
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!document.getElementById('btn-pt-table')) {
      cycleNextLayout();
    } else {
      openElementModal(item);
    }
  });

  return el;
}

/* ──────────────────────────────────────────
   COORDINATES GENERATORS
   ────────────────────────────────────────── */
function calcTablePositions() {
  ELEMENTS_DATA.forEach((item) => {
    const obj = new THREE.Object3D();
    obj.position.x = (item.col * 140) - 1330;
    obj.position.y = -(item.row * 165) + 880;
    obj.position.z = 0;
    targets.table.push(obj);
  });
}

function calcSpherePositions() {
  const count = ELEMENTS_DATA.length;
  const radius = 780;
  const vector = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;

    const obj = new THREE.Object3D();
    obj.position.setFromSphericalCoords(radius, phi, theta);

    vector.copy(obj.position).multiplyScalar(2);
    obj.lookAt(vector);

    targets.sphere.push(obj);
  }
}

function calcHelixPositions() {
  const count = ELEMENTS_DATA.length;
  const vector = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const theta = i * 0.175 + Math.PI;
    const y = -(i * 8.5) + 480;

    const obj = new THREE.Object3D();
    obj.position.setFromCylindricalCoords(800, theta, y);

    vector.x = obj.position.x * 2;
    vector.y = obj.position.y;
    vector.z = obj.position.z * 2;
    obj.lookAt(vector);

    targets.helix.push(obj);
  }
}

function calcGridPositions() {
  for (let i = 0; i < ELEMENTS_DATA.length; i++) {
    const obj = new THREE.Object3D();
    obj.position.x = ((i % 5) * 360) - 720;
    obj.position.y = (-(Math.floor(i / 5) % 5) * 360) + 720;
    obj.position.z = (Math.floor(i / 25) * 800) - 1600;
    targets.grid.push(obj);
  }
}

/* ──────────────────────────────────────────
   TRANSFORM ENGINE (GSAP)
   ────────────────────────────────────────── */
function transform(targetList, duration = 1.4) {
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const target = targetList[i];

    if (window.gsap) {
      window.gsap.to(obj.position, {
        x: target.position.x,
        y: target.position.y,
        z: target.position.z,
        duration: Math.random() * 0.6 + duration,
        ease: 'power2.inOut'
      });
      window.gsap.to(obj.rotation, {
        x: target.rotation.x,
        y: target.rotation.y,
        z: target.rotation.z,
        duration: Math.random() * 0.6 + duration,
        ease: 'power2.inOut'
      });
    } else {
      obj.position.copy(target.position);
      obj.rotation.copy(target.rotation);
    }
  }
}

/* ──────────────────────────────────────────
   LAYOUT & ZOOM BUTTONS
   ────────────────────────────────────────── */
function setupLayoutButtons() {
  const modes = ['table', 'sphere', 'helix', 'grid'];
  modes.forEach(mode => {
    const btn = document.getElementById(`btn-pt-${mode}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (currentLayout === mode) return;
      currentLayout = mode;

      modes.forEach(m => {
        const b = document.getElementById(`btn-pt-${m}`);
        if (b) {
          b.classList.remove('bg-[#00e5ff]', 'text-black', 'shadow-[0_0_20px_rgba(0,229,255,0.5)]');
          b.classList.add('bg-white/5', 'text-[#94a3b8]');
        }
      });
      btn.classList.remove('bg-white/5', 'text-[#94a3b8]');
      btn.classList.add('bg-[#00e5ff]', 'text-black', 'shadow-[0_0_20px_rgba(0,229,255,0.5)]');

      transform(targets[mode], 1.4);
    });
  });
}

function setupZoomButtons() {
  // Zoom In button
  const btnZoomIn = document.getElementById('btn-pt-zoom-in');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      const targetZ = Math.max(camera.position.z - 450, 700);
      if (window.gsap) {
        window.gsap.to(camera.position, { z: targetZ, duration: 0.5, ease: 'power2.out' });
      } else {
        camera.position.z = targetZ;
      }
    });
  }

  // Zoom Out button
  const btnZoomOut = document.getElementById('btn-pt-zoom-out');
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      const targetZ = Math.min(camera.position.z + 450, 4800);
      if (window.gsap) {
        window.gsap.to(camera.position, { z: targetZ, duration: 0.5, ease: 'power2.out' });
      } else {
        camera.position.z = targetZ;
      }
    });
  }

  // Reset camera view button
  const btnReset = document.getElementById('btn-pt-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (window.gsap) {
        window.gsap.to(camera.position, { x: 0, y: 0, z: 2700, duration: 0.8, ease: 'power2.out' });
        window.gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 0.8, ease: 'power2.out' });
      } else {
        camera.position.set(0, 0, 2700);
        controls.target.set(0, 0, 0);
      }
      controls.reset();
    });
  }
}

/* ──────────────────────────────────────────
   BỘ LỌC DỰ ÁN SENKU (PROJECT FILTER)
   ────────────────────────────────────────── */
function setupProjectFilterButtons() {
  const filterBtns = document.querySelectorAll('[data-project-filter]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const projKey = btn.getAttribute('data-project-filter');

      // Update active state on buttons
      filterBtns.forEach(b => {
        b.classList.remove('active', 'border-[#fbbf24]', 'text-[#fbbf24]', 'bg-[#fbbf24]/15');
        b.classList.add('border-white/10', 'text-[#94a3b8]');
      });
      btn.classList.remove('border-white/10', 'text-[#94a3b8]');
      btn.classList.add('active', 'border-[#fbbf24]', 'text-[#fbbf24]', 'bg-[#fbbf24]/15');

      applyProjectFilter(projKey);
    });
  });
}

function applyProjectFilter(projKey) {
  const project = SENKU_PROJECTS[projKey];
  const infoBar = document.getElementById('project-filter-info');

  if (!project || projKey === 'all') {
    // Reset all elements: hiện rõ toàn bộ 118 nguyên tố
    elementDomList.forEach(({ el }) => {
      el.classList.remove('is-dimmed', 'is-highlighted');
    });
    if (infoBar) {
      infoBar.innerHTML = `
        <span class="text-xs text-[#64748b] font-['Rajdhani']">
          ● Đang hiển thị toàn bộ 118 nguyên tố. Click vào bất kỳ nguyên tố nào để xem chi tiết!
        </span>
      `;
    }
    return;
  }

  // Highlight cac nguyen to thuoc du an, giu cac nguyen to khac mo nhe
  elementDomList.forEach(({ el, item }) => {
    if (project.elements.includes(item.symbol)) {
      el.classList.remove('is-dimmed');
      el.classList.add('is-highlighted');
    } else {
      el.classList.add('is-dimmed');
      el.classList.remove('is-highlighted');
    }
  });

  // Display project info bar
  if (infoBar) {
    infoBar.classList.remove('hidden');
    infoBar.innerHTML = `
      <div class="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4 py-2 rounded-xl bg-[#fbbf24]/10 border border-[#fbbf24]/40 text-[#fbbf24] font-['Rajdhani'] text-xs md:text-sm font-bold shadow-[0_0_20px_rgba(251,191,36,0.2)]">
        <span>⚡ Dự án: <strong>${project.name}</strong></span>
        <span class="text-white/30 hidden sm:inline">|</span>
        <span class="text-white font-mono text-xs">Các chất: [${project.elements.join(', ')}]</span>
        <span class="text-white/30 hidden sm:inline">|</span>
        <span class="text-[#38bdf8] text-xs">🧪 ${project.formula}</span>
      </div>
    `;
  }
}

function setupResize(container) {
  window.addEventListener('resize', () => {
    const w = container.clientWidth || 1050;
    const h = container.clientHeight || 500;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

/* ──────────────────────────────────────────
   MODAL POPUP CHO NGUYÊN TỐ
   ────────────────────────────────────────── */
export function openElementModal(item) {
  let modal = document.getElementById('element-modal');
  if (!modal) return;

  const cat = CATEGORY_COLORS[item.category] || { badge: '#00d4ff', text: 'Nguyên tố' };
  const hasLore = !!item.drStone;

  const content = document.getElementById('element-modal-content');
  if (content) {
    content.innerHTML = `
      <div class="relative bg-[#0a1122] border ${hasLore ? 'border-[#00e5ff]/60 shadow-[0_0_40px_rgba(0,229,255,0.25)]' : 'border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)]'} rounded-2xl p-6 md:p-8 max-w-lg w-full">
        <!-- Close Button -->
        <button id="close-element-modal" class="absolute top-4 right-4 text-[#64748b] hover:text-[#e8f4f8] text-2xl font-bold transition-colors cursor-pointer">✕</button>

        <!-- Header -->
        <div class="flex items-center gap-5 mb-6">
          <div class="w-20 h-24 rounded-xl flex flex-col items-center justify-center border-2 ${hasLore ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-[#00e5ff]' : 'border-white/20 bg-white/5 text-white'}">
            <span class="text-xs font-['Orbitron'] font-bold">${item.number}</span>
            <span class="text-3xl font-black font-['Orbitron']">${item.symbol}</span>
            <span class="text-[0.65rem] text-[#64748b]">${item.mass}</span>
          </div>
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wider mb-1" style="background: ${cat.border}; color: #fff;">
              ${cat.text}
            </span>
            <h3 class="font-['Orbitron'] text-2xl font-black text-[#e8f4f8]">${item.name}</h3>
            <p class="text-xs text-[#64748b]">Nguyên tố thứ ${item.number} trong Bảng Tuần Hoàn</p>
          </div>
        </div>

        ${hasLore ? `
          <!-- Dr Stone Lore Section -->
          <div class="p-4 rounded-xl bg-gradient-to-br from-[#00e5ff]/10 to-transparent border border-[#00e5ff]/30 mb-5">
            <div class="flex items-center gap-2 mb-2 text-[#00e5ff] font-['Rajdhani'] font-bold text-sm uppercase tracking-wider">
              <span>⚡ PHÁT MINH CỦA SENKU</span>
            </div>
            <h4 class="font-['Orbitron'] text-base font-bold text-[#e8f4f8] mb-1">${item.drStone.title}</h4>
            <div class="inline-block font-mono text-xs px-2.5 py-1 rounded bg-black/60 text-[#38bdf8] border border-[#38bdf8]/40 mb-3">
              🧪 Công thức: ${item.drStone.recipe}
            </div>
            <p class="text-sm text-[#cbd5e1] leading-relaxed mb-3">${item.drStone.desc}</p>
            <div class="border-l-2 border-[#00e5ff] pl-3 italic text-xs text-[#94a3b8]">
              "${item.drStone.quote}" — <strong>Ishigami Senku</strong>
            </div>
          </div>
        ` : `
          <div class="p-4 rounded-xl bg-white/5 border border-white/10 mb-5">
            <p class="text-sm text-[#64748b] leading-relaxed">
              Nguyên tố hóa học trong tự nhiên, góp phần tạo nên các hợp chất và vật chất trong vũ trụ của Vương Quốc Khoa Học.
            </p>
          </div>
        `}

        <div class="flex justify-end">
          <button id="btn-close-el-modal" class="px-5 py-2 rounded-lg font-['Rajdhani'] font-bold text-sm uppercase tracking-wider bg-white/10 hover:bg-white/20 text-[#e8f4f8] transition-colors cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const closeBtn = document.getElementById('close-element-modal');
    const closeBtn2 = document.getElementById('btn-close-el-modal');
    const closeHandler = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    };
    if (closeBtn) closeBtn.onclick = closeHandler;
    if (closeBtn2) closeBtn2.onclick = closeHandler;
  }
}

// Global invocation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initPeriodicTable();
});
