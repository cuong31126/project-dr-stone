// js/globe-3d.js — Interactive High-Definition 3D Earth Globe for Dr. Stone Perseus Navigation
// Tác giả: Antigravity | Dự án: Dr. Stone Fan Website
// Đột phá: NASA HD Satellite Texture + Cloud Layer + Cyber Medusa Epicenter + Perseus 3D Flight Path

import * as THREE from 'three';

class PerseusHologramGlobe {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 520;
    this.radius = 2.4;

    // Trạng thái tương tác
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotation = { x: 0.15, y: -1.35 };
    this.currentRotation = { x: 0.15, y: -1.35 };
    this.autoRotate = true;
    this.autoRotateSpeed = 0.0018;
    this.lastInteractionTime = performance.now();
    this.shockwaveTime = 0;
    this.routeProgress = 0;
    this.currentTextureMode = 'satellite'; // 'satellite' | 'cyber'

    // Tọa độ các trạm hải trình chuẩn Dr. Stone
    this.waypoints = [
      { id: 'arc-village', name: 'Làng Ishigami (Nhật Bản)', lat: 35.6, lon: 139.7, color: 0x00f5a0, label: 'TRẠM 1' },
      { id: 'arc-treasure', name: 'Đảo Kho Báu (Thái Bình Dương)', lat: 20.0, lon: 165.0, color: 0x00d4ff, label: 'TRẠM 2' },
      { id: 'arc-america', name: 'Tân Thành Phố Mỹ (California)', lat: 37.7, lon: -122.4, color: 0xf97316, label: 'TRẠM 3' },
      { id: 'arc-south-america', name: 'Tâm Chấn Hóa Đá (Manaus, Amazon)', lat: -3.1, lon: -60.0, color: 0xff2255, label: 'TÂM CHẤN', isEpicenter: true },
      { id: 'arc-moon', name: 'Mặt Trăng (Whyman)', lat: 0, lon: 0, color: 0xdde4ec, label: 'TRẠM 5', isMoon: true }
    ];

    this.initScene();
    this.loadTexturesAndBuildGlobe();
    this.createAtmosphere();
    this.createPetrificationEpicenter();
    this.createWaypoints();
    this.createPerseusVoyageRoute();
    this.createMoon();
    this.setupEventListeners();
    this.bindWaypointButtons();
    this.setupModeSwitcher();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 7.0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    // Hệ thống ánh sáng không gian
    const ambientLight = new THREE.AmbientLight(0x1a2e4a, 1.8);
    this.scene.add(ambientLight);

    // Ánh sáng mặt trời chiếu từ góc Tây Bắc
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    this.sunLight.position.set(6, 4, 5);
    this.scene.add(this.sunLight);

    // Ánh sáng phản quang xanh neon nhẹ
    const rimLight = new THREE.DirectionalLight(0x00d4ff, 1.6);
    rimLight.position.set(-6, -3, -4);
    this.scene.add(rimLight);

    // Nhóm xoay toàn bộ địa cầu
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
  }

  latLonToVector3(lat, lon, radius = this.radius, altitude = 0) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const r = radius + altitude;
    return new THREE.Vector3(
      -(r * Math.sin(phi) * Math.cos(theta)),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  loadTexturesAndBuildGlobe() {
    const textureLoader = new THREE.TextureLoader();

    // 1. Quả Cầu Trái Đất Chính
    const earthGeo = new THREE.SphereGeometry(this.radius, 64, 64);

    // Tải Texture Vệ Tinh NASA và Texture Cyber Dark
    this.satTexture = textureLoader.load('assets/images/earth_atmos_2048.jpg');
    this.cyberTexture = textureLoader.load('assets/images/earth_dark.jpg');

    this.earthMaterial = new THREE.MeshStandardMaterial({
      map: this.satTexture,
      roughness: 0.65,
      metalness: 0.1,
      emissive: 0x051a24,
      emissiveIntensity: 0.4
    });

    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMaterial);
    this.globeGroup.add(this.earthMesh);

    // 2. Lớp Mây Khí Quyển 3D Bồng Bềnh (Cloud Layer)
    const cloudGeo = new THREE.SphereGeometry(this.radius * 1.018, 48, 48);
    const cloudTexture = textureLoader.load('assets/images/earth_clouds_1024.png');

    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMaterial);
    this.globeGroup.add(this.cloudMesh);

    // 3. Lưới Tọa Độ Kinh Vĩ Tuyến Hologram Neon (Sci-Fi Grid)
    const gridGeo = new THREE.SphereGeometry(this.radius * 1.025, 36, 18);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    this.gridMesh = new THREE.Mesh(gridGeo, gridMat);
    this.globeGroup.add(this.gridMesh);

    // 4. Vành đai xích đạo phát quang
    const equatorGeo = new THREE.RingGeometry(this.radius * 1.08, this.radius * 1.11, 64);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: 0x00f5a0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28
    });
    const equator = new THREE.Mesh(equatorGeo, equatorMat);
    equator.rotation.x = Math.PI / 2;
    this.globeGroup.add(equator);
  }

  createAtmosphere() {
    // Lớp hào quang xanh ngọc vũ trụ (Atmospheric Glow)
    const atmosGeo = new THREE.SphereGeometry(this.radius * 1.18, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.0, 0.85, 1.0, 1.0) * intensity * 0.8;
        }
      `
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.scene.add(atmosphere);
  }

  // 💥 TÂM CHẤN HÓA ĐÁ MEDUSA TẠI LÒNG CHẢO AMAZON (MANAUS, BRAZIL)
  createPetrificationEpicenter() {
    this.epicenterCoords = { lat: -3.1, lon: -60.0 };
    const epicPos = this.latLonToVector3(this.epicenterCoords.lat, this.epicenterCoords.lon, this.radius, 0.03);

    // 1. Điểm lõi phát sáng đỏ rực
    const coreGeo = new THREE.SphereGeometry(0.075, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff1144 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(epicPos);
    this.globeGroup.add(core);

    // 2. Vòng hào quang đa lớp
    const glowGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.5
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(epicPos);
    this.globeGroup.add(glow);

    // 3. Các vòng sóng xung kích Medusa lan tỏa tuần hoàn (Concentric Pulsing Waves)
    this.shockwaveRings = [];
    const ringCount = 3;

    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(0.12, 0.17, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffaa,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(epicPos);
      ring.lookAt(0, 0, 0); // Tiếp tuyến áp sát bề mặt địa cầu
      this.globeGroup.add(ring);
      this.shockwaveRings.push({ mesh: ring, offset: i * (Math.PI * 2 / ringCount) });
    }

    // 4. Cột tia sáng năng lượng bắn thẳng lên quỹ đạo
    const beamGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.4, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff2255,
      transparent: true,
      opacity: 0.85
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(this.latLonToVector3(this.epicenterCoords.lat, this.epicenterCoords.lon, this.radius, 0.7));
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), epicPos.clone().normalize());
    this.globeGroup.add(beam);
  }

  createWaypoints() {
    this.waypointMeshes = [];

    this.waypoints.forEach(wp => {
      if (wp.isMoon) return;

      const pos = this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.04);

      // Cột định vị
      const pinGeo = new THREE.CylinderGeometry(0.018, 0.006, 0.38, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: wp.color });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.19));
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      this.globeGroup.add(pin);

      // Viên ngọc phát quang trên đỉnh
      const beaconGeo = new THREE.SphereGeometry(0.05, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: wp.color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.38));
      this.globeGroup.add(beacon);

      this.waypointMeshes.push({ wp, beacon, pin });
    });
  }

  // Tuyến hải trình 3D cong vút của tàu Perseus
  createPerseusVoyageRoute() {
    const routePoints = [
      this.latLonToVector3(35.6, 139.7),   // Nhật Bản
      this.latLonToVector3(20.0, 165.0),   // Đảo Kho Báu
      this.latLonToVector3(32.0, -155.0, this.radius, 0.4), // Băng qua Thái Bình Dương
      this.latLonToVector3(37.7, -122.4),  // California, Bắc Mỹ
      this.latLonToVector3(18.0, -98.0, this.radius, 0.28),  // Vịnh Mexico / Trung Mỹ
      this.latLonToVector3(9.0, -79.5),    // Kênh Panama
      this.latLonToVector3(-3.1, -60.0)    // Rừng Amazon, Nam Mỹ (Tâm chấn)
    ];

    const curve = new THREE.CatmullRomCurve3(routePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 160, 0.018, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9
    });
    const routeTube = new THREE.Mesh(tubeGeo, tubeMat);
    this.globeGroup.add(routeTube);

    // Hạt photon đại diện cho tàu Perseus lướt sóng
    const shipGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const shipMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
    this.shipMesh = new THREE.Mesh(shipGeo, shipMat);
    this.globeGroup.add(this.shipMesh);
    this.routeCurve = curve;
  }

  createMoon() {
    // Mô hình Mặt Trăng 3D bay trên quỹ đạo
    const moonGeo = new THREE.SphereGeometry(0.36, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      roughness: 0.85,
      metalness: 0.1,
      emissive: 0x112233
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonOrbitRadius = 5.3;
    this.moonMesh.position.set(this.moonOrbitRadius, 1.2, 0);
    this.scene.add(this.moonMesh);

    // Vòng quỹ đạo phát sáng
    const orbitGeo = new THREE.RingGeometry(this.moonOrbitRadius - 0.015, this.moonOrbitRadius + 0.015, 64);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18
    });
    const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    this.scene.add(orbitRing);
  }

  setupEventListeners() {
    const el = this.renderer.domElement;

    // Chuột xuống
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.lastInteractionTime = performance.now();
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Di chuyển chuột
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.005;
      this.targetRotation.x += deltaY * 0.005;

      this.targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.targetRotation.x));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      this.lastInteractionTime = performance.now();
    });

    // Thả chuột
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Lăn chuột phóng to / thu nhỏ
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z += e.deltaY * 0.003;
      this.camera.position.z = Math.max(4.5, Math.min(10.0, this.camera.position.z));
      this.lastInteractionTime = performance.now();
    }, { passive: false });

    // Cảm ứng điện thoại
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.006;
      this.targetRotation.x += deltaY * 0.006;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight || 520;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
  }

  setupModeSwitcher() {
    const btn3D = document.getElementById('btn-toggle-globe-3d');
    const btn2D = document.getElementById('btn-toggle-map-2d');
    const wrap3D = document.getElementById('perseus-3d-globe-wrapper');
    const wrap2D = document.getElementById('perseus-2d-map-wrapper');
    const btnReset = document.getElementById('btn-reset-globe');
    const btnTheme = document.getElementById('btn-toggle-globe-theme');

    if (btn3D && btn2D && wrap3D && wrap2D) {
      btn3D.addEventListener('click', () => {
        wrap3D.classList.remove('hidden');
        wrap2D.classList.add('hidden');
        btn3D.className = "px-3 py-1 rounded-lg bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)] cursor-pointer";
        btn2D.className = "px-3 py-1 rounded-lg text-[#8fa0ba] hover:text-white text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all cursor-pointer";

        setTimeout(() => {
          this.width = this.container.clientWidth;
          this.height = this.container.clientHeight || 520;
          this.camera.aspect = this.width / this.height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(this.width, this.height);
        }, 50);
      });

      btn2D.addEventListener('click', () => {
        wrap3D.classList.add('hidden');
        wrap2D.classList.remove('hidden');
        btn2D.className = "px-3 py-1 rounded-lg bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)] cursor-pointer";
        btn3D.className = "px-3 py-1 rounded-lg text-[#8fa0ba] hover:text-white text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all cursor-pointer";
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.focusCoordinates(-3.1, -60.0);
      });
    }

    // Đổi qua lại giữa Vệ Tinh NASA và Cyber Dark
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        if (this.currentTextureMode === 'satellite') {
          this.currentTextureMode = 'cyber';
          this.earthMaterial.map = this.cyberTexture;
          this.earthMaterial.emissive.setHex(0x021a24);
          btnTheme.textContent = '⚡ Chế độ: Cyber Dark';
        } else {
          this.currentTextureMode = 'satellite';
          this.earthMaterial.map = this.satTexture;
          this.earthMaterial.emissive.setHex(0x051a24);
          btnTheme.textContent = '🛰️ Chế độ: Vệ Tinh HD';
        }
        this.earthMaterial.needsUpdate = true;
      });
    }
  }

  bindWaypointButtons() {
    const waypointButtons = document.querySelectorAll('.waypoint-btn');
    waypointButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const targetWp = this.waypoints[index];
        if (targetWp) {
          this.focusCoordinates(targetWp.lat, targetWp.lon);
        }
      });
    });
  }

  focusCoordinates(lat, lon) {
    this.autoRotate = false;
    this.lastInteractionTime = performance.now();

    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;

    this.targetRotation.x = phi * 0.6;
    this.targetRotation.y = -theta - Math.PI / 2;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();

    // Tự động xoay chậm sau 3 giây
    if (!this.isDragging && now - this.lastInteractionTime > 3000) {
      this.targetRotation.y += this.autoRotateSpeed;
    }

    // Damping quán tính xoay mượt mà (Lerp)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    this.globeGroup.rotation.x = this.currentRotation.x;
    this.globeGroup.rotation.y = this.currentRotation.y;

    // Lớp mây trôi nhẹ độc lập tạo chiều sâu 3D
    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += 0.0004;
    }

    // Hiệu ứng sóng xung kích Medusa tại Nam Mỹ
    this.shockwaveTime += 0.025;
    if (this.shockwaveRings) {
      this.shockwaveRings.forEach(ringObj => {
        const progress = (this.shockwaveTime + ringObj.offset) % (Math.PI * 2);
        const scale = 1.0 + (progress / (Math.PI * 2)) * 3.8;
        const opacity = Math.max(0, 1.0 - progress / (Math.PI * 2));
        ringObj.mesh.scale.set(scale, scale, 1);
        ringObj.mesh.material.opacity = opacity * 0.9;
      });
    }

    // Chuyển động tàu Perseus lướt trên đường hải trình
    this.routeProgress = (this.routeProgress + 0.0016) % 1;
    if (this.shipMesh && this.routeCurve) {
      const shipPoint = this.routeCurve.getPointAt(this.routeProgress);
      this.shipMesh.position.copy(shipPoint);
    }

    // Quỹ đạo Mặt Trăng xoay chậm quanh Trái Đất
    if (this.moonMesh) {
      const moonAngle = now * 0.00035;
      this.moonMesh.position.x = Math.cos(moonAngle) * this.moonOrbitRadius;
      this.moonMesh.position.z = Math.sin(moonAngle) * this.moonOrbitRadius;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

function initDrStoneGlobe() {
  const container = document.getElementById('perseus-3d-globe-wrapper');
  if (container && !window.drStoneGlobe) {
    window.drStoneGlobe = new PerseusHologramGlobe('perseus-3d-globe-wrapper');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDrStoneGlobe);
} else {
  initDrStoneGlobe();
}

export default PerseusHologramGlobe;
