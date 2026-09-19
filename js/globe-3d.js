// js/globe-3d.js — Interactive Three.js 3D Holographic Globe for Dr. Stone Perseus Navigation
// Tác giả: Antigravity | Dự án: Dr. Stone Fan Website

import * as THREE from 'three';

class PerseusHologramGlobe {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 500;
    this.radius = 2.4;

    // Trạng thái tương tác
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotation = { x: 0.2, y: -1.2 };
    this.currentRotation = { x: 0.2, y: -1.2 };
    this.autoRotate = true;
    this.autoRotateSpeed = 0.0025;
    this.lastInteractionTime = performance.now();
    this.shockwaveTime = 0;
    this.routeProgress = 0;

    // Tọa độ các địa danh chuẩn Dr. Stone
    this.waypoints = [
      { id: 'arc-village', name: 'Làng Ishigami (Nhật Bản)', lat: 35.6, lon: 139.7, color: 0x00f5a0, label: 'TRẠM 1' },
      { id: 'arc-treasure', name: 'Đảo Kho Báu (Thái Bình Dương)', lat: 20.0, lon: 165.0, color: 0x00d4ff, label: 'TRẠM 2' },
      { id: 'arc-america', name: 'Tân Thành Phố Mỹ (California)', lat: 37.7, lon: -122.4, color: 0xf97316, label: 'TRẠM 3' },
      { id: 'arc-south-america', name: 'Tâm Chấn Hóa Đá (Manaus, Amazon)', lat: -3.1, lon: -60.0, color: 0xff3366, label: 'TÂM CHẤN', isEpicenter: true },
      { id: 'arc-moon', name: 'Mặt Trăng (Whyman)', lat: 0, lon: 0, color: 0xffffff, label: 'TRẠM 5', isMoon: true }
    ];

    this.initScene();
    this.createGlobe();
    this.createAtmosphere();
    this.createPetrificationEpicenter();
    this.createWaypoints();
    this.createPerseusVoyageRoute();
    this.createMoon();
    this.setupEventListeners();
    this.bindWaypointButtons();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Ánh sáng Sci-Fi
    const ambientLight = new THREE.AmbientLight(0x0a192f, 2.5);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00d4ff, 2.0);
    dirLight1.position.set(5, 3, 5);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f5a0, 1.5);
    dirLight2.position.set(-5, -2, -3);
    this.scene.add(dirLight2);

    // Nhóm xoay toàn bộ địa cầu
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
  }

  // Chuyển đổi Tọa độ Địa lý (Lat, Lon) thành Vector3D trên mặt cầu
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

  // Tạo Texture Bản Đồ Địa Cầu Lục Địa Chuẩn Bằng HTML Canvas (Offline 100%)
  generateEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Nền đại dương sâu thẳm
    ctx.fillStyle = '#040b18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ lưới tọa độ kinh vĩ tuyến mờ
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Xích đạo nổi bật
    ctx.strokeStyle = 'rgba(0, 245, 160, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Vẽ các lục địa phủ cây xanh rêu phong (Kỷ nguyên 5738)
    ctx.fillStyle = '#0d3824';
    ctx.strokeStyle = '#00f5a0';
    ctx.lineWidth = 2.5;

    const toX = (lon) => ((lon + 180) / 360) * canvas.width;
    const toY = (lat) => ((90 - lat) / 180) * canvas.height;

    const drawPoly = (points) => {
      ctx.beginPath();
      ctx.moveTo(toX(points[0][0]), toY(points[0][1]));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(toX(points[i][0]), toY(points[i][1]));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // 1. Nam Mỹ (South America) — Đầy đủ lòng chảo Amazon
    drawPoly([
      [-81, 9], [-75, 12], [-60, 10], [-50, -1], [-35, -5],
      [-37, -13], [-42, -23], [-53, -33], [-65, -42], [-68, -54],
      [-75, -48], [-73, -38], [-71, -15], [-76, -4], [-81, 4]
    ]);

    // 2. Bắc Mỹ (North America)
    drawPoly([
      [-168, 65], [-140, 70], [-95, 75], [-60, 60], [-55, 48],
      [-70, 42], [-76, 35], [-81, 25], [-97, 26], [-97, 20],
      [-88, 16], [-78, 8], [-85, 10], [-105, 22], [-117, 32],
      [-124, 40], [-125, 49], [-135, 57], [-160, 58]
    ]);

    // 3. Châu Phi (Africa)
    drawPoly([
      [-17, 15], [-5, 36], [10, 37], [32, 31], [43, 12],
      [51, 12], [41, -11], [35, -24], [26, -34], [18, -34],
      [12, -18], [9, 5], [0, 6], [-10, 5], [-17, 15]
    ]);

    // 4. Châu Âu (Europe)
    drawPoly([
      [-10, 36], [0, 43], [-5, 48], [5, 54], [10, 60],
      [28, 71], [40, 65], [30, 46], [22, 38], [14, 38],
      [5, 36], [-9, 38]
    ]);

    // 5. Châu Á & Nhật Bản (Asia & Japan)
    drawPoly([
      [40, 65], [60, 70], [100, 78], [140, 72], [170, 65],
      [140, 50], [120, 32], [105, 20], [80, 13], [70, 22],
      [60, 25], [50, 30], [35, 33], [35, 48], [40, 60]
    ]);

    // Quần đảo Nhật Bản (Japan Archipelago)
    drawPoly([[130, 32], [132, 34], [136, 35], [140, 36], [142, 43], [140, 44], [135, 37], [130, 33]]);

    // 6. Châu Đại Dương (Australia)
    drawPoly([
      [114, -22], [123, -15], [136, -12], [142, -11], [150, -22],
      [153, -28], [148, -37], [138, -35], [129, -32], [115, -34]
    ]);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  createGlobe() {
    // 1. Khối cầu lục địa lõi
    const earthGeo = new THREE.SphereGeometry(this.radius, 64, 64);
    const earthTex = this.generateEarthTexture();

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.8,
      metalness: 0.2,
      emissive: 0x02161b,
      emissiveIntensity: 0.6
    });

    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.globeGroup.add(this.earthMesh);

    // 2. Lưới kinh vĩ tuyến Hologram phát sáng (Wireframe Cage)
    const wireGeo = new THREE.SphereGeometry(this.radius * 1.015, 36, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    this.wireMesh = new THREE.Mesh(wireGeo, wireMat);
    this.globeGroup.add(this.wireMesh);

    // 3. Vành đai xích đạo Cyber Neon
    const equatorGeo = new THREE.RingGeometry(this.radius * 1.1, this.radius * 1.15, 64);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: 0x00f5a0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const equator = new THREE.Mesh(equatorGeo, equatorMat);
    equator.rotation.x = Math.PI / 2;
    this.globeGroup.add(equator);
  }

  createAtmosphere() {
    // Lớp khí quyển phát quang Fresnel Glow
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.0, 0.85, 1.0, 1.0) * intensity * 0.7;
        }
      `
    });
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.scene.add(atmosphere);
  }

  // 💥 TÂM CHẤN HÓA ĐÁ TẠI MANAUS, BRAZIL (RỪNG AMAZON - NAM MỸ)
  createPetrificationEpicenter() {
    this.epicenterCoords = { lat: -3.1, lon: -60.0 };
    const epicPos = this.latLonToVector3(this.epicenterCoords.lat, this.epicenterCoords.lon, this.radius, 0.02);

    // Điểm nhân phát sáng năng lượng Medusa
    const coreGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff2255 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(epicPos);
    this.globeGroup.add(core);

    // Các vòng sóng xung kích lan tỏa (Concentric Pulsing Shockwave Rings)
    this.shockwaveRings = [];
    const ringCount = 3;

    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(0.12, 0.16, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(epicPos);
      ring.lookAt(0, 0, 0); // Hướng mặt phẳng vòng tròn áp sát bề mặt cầu
      this.globeGroup.add(ring);
      this.shockwaveRings.push({ mesh: ring, offset: i * (Math.PI * 2 / ringCount) });
    }

    // Cột tia sáng laser thẳng đứng bắn ra từ tâm chấn
    const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.8
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(this.latLonToVector3(this.epicenterCoords.lat, this.epicenterCoords.lon, this.radius, 0.6));
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), epicPos.clone().normalize());
    this.globeGroup.add(beam);
  }

  createWaypoints() {
    this.waypointMeshes = [];

    this.waypoints.forEach(wp => {
      if (wp.isMoon) return; // Mặt Trăng vẽ riêng

      const pos = this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.04);

      // Cột pin phát sáng
      const pinGeo = new THREE.CylinderGeometry(0.02, 0.005, 0.35, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: wp.color });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.18));
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      this.globeGroup.add(pin);

      // Viên ngọc phát quang trên đỉnh
      const beaconGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: wp.color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.35));
      this.globeGroup.add(beacon);

      this.waypointMeshes.push({ wp, beacon, pin });
    });
  }

  // Tuyến hải trình 3D cong vút của tàu Perseus
  createPerseusVoyageRoute() {
    const routePoints = [
      this.latLonToVector3(35.6, 139.7),   // Nhật Bản
      this.latLonToVector3(20.0, 165.0),   // Đảo Kho Báu
      this.latLonToVector3(30.0, -150.0, this.radius, 0.35), // Vượt Thái Bình Dương
      this.latLonToVector3(37.7, -122.4),  // California, Bắc Mỹ
      this.latLonToVector3(15.0, -95.0, this.radius, 0.25),  // Trung Mỹ
      this.latLonToVector3(9.0, -79.5),    // Kênh Panama
      this.latLonToVector3(-3.1, -60.0)    // Rừng Amazon, Nam Mỹ (Tâm chấn)
    ];

    const curve = new THREE.CatmullRomCurve3(routePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 128, 0.016, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85
    });
    const routeTube = new THREE.Mesh(tubeGeo, tubeMat);
    this.globeGroup.add(routeTube);

    // Hạt photon đại diện cho tàu Perseus lướt sóng
    const shipGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const shipMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
    this.shipMesh = new THREE.Mesh(shipGeo, shipMat);
    this.globeGroup.add(this.shipMesh);
    this.routeCurve = curve;
  }

  createMoon() {
    // Mặt Trăng bay trên quỹ đạo bao quanh Trái Đất (Arc Whyman)
    const moonGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x112233
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonOrbitRadius = 5.2;
    this.moonMesh.position.set(this.moonOrbitRadius, 1.2, 0);
    this.scene.add(this.moonMesh);

    // Vòng quỹ đạo Mặt Trăng
    const orbitGeo = new THREE.RingGeometry(this.moonOrbitRadius - 0.01, this.moonOrbitRadius + 0.01, 64);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15
    });
    const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    this.scene.add(orbitRing);
  }

  // Tương tác chuột & cảm ứng di động
  setupEventListeners() {
    const el = this.renderer.domElement;

    // Chuột xuống (Bắt đầu kéo)
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.lastInteractionTime = performance.now();
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Di chuyển chuột (Xoay cầu)
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * 0.005;
      this.targetRotation.x += deltaY * 0.005;

      // Giới hạn góc nghiêng trục đứng
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

    // Touch trên di động
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

    // Tự động điều chỉnh kích thước khung khi resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight || 500;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });

    this.setupModeSwitcher();
  }

  // Chuyển đổi linh hoạt giữa Địa Cầu 3D và Bản Đồ Phẳng 2D
  setupModeSwitcher() {
    const btn3D = document.getElementById('btn-toggle-globe-3d');
    const btn2D = document.getElementById('btn-toggle-map-2d');
    const wrap3D = document.getElementById('perseus-3d-globe-wrapper');
    const wrap2D = document.getElementById('perseus-2d-map-wrapper');
    const btnReset = document.getElementById('btn-reset-globe');

    if (btn3D && btn2D && wrap3D && wrap2D) {
      btn3D.addEventListener('click', () => {
        wrap3D.classList.remove('hidden');
        wrap2D.classList.add('hidden');
        btn3D.className = "px-3 py-1 rounded-lg bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)] cursor-pointer";
        btn2D.className = "px-3 py-1 rounded-lg text-[#8fa0ba] hover:text-white text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all cursor-pointer";

        setTimeout(() => {
          this.width = this.container.clientWidth;
          this.height = this.container.clientHeight || 500;
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
  }

  // Kết nối các nút Trạm Waypoint bên ngoài giao diện
  bindWaypointButtons() {
    const waypointButtons = document.querySelectorAll('.waypoint-btn');
    waypointButtons.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        const targetWp = this.waypoints[index];
        if (targetWp) {
          this.focusCoordinates(targetWp.lat, targetWp.lon);
        }
      });
    });
  }

  // Xoay quả cầu mượt mà đến tọa độ chỉ định
  focusCoordinates(lat, lon) {
    this.autoRotate = false;
    this.lastInteractionTime = performance.now();

    // Tính toán góc Euler để đưa tọa độ (lat, lon) về chính diện camera
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;

    this.targetRotation.x = phi * 0.6;
    this.targetRotation.y = -theta - Math.PI / 2;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();

    // Tự động xoay chậm sau 3 giây không chạm chuột
    if (!this.isDragging && now - this.lastInteractionTime > 3000) {
      this.targetRotation.y += this.autoRotateSpeed;
    }

    // Damping quán tính xoay mượt mà (Lerp)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    this.globeGroup.rotation.x = this.currentRotation.x;
    this.globeGroup.rotation.y = this.currentRotation.y;

    // Hiệu ứng sóng xung kích Medusa tại Nam Mỹ (Amazon)
    this.shockwaveTime += 0.025;
    if (this.shockwaveRings) {
      this.shockwaveRings.forEach(ringObj => {
        const progress = (this.shockwaveTime + ringObj.offset) % (Math.PI * 2);
        const scale = 1.0 + (progress / (Math.PI * 2)) * 3.5;
        const opacity = Math.max(0, 1.0 - progress / (Math.PI * 2));
        ringObj.mesh.scale.set(scale, scale, 1);
        ringObj.mesh.material.opacity = opacity * 0.85;
      });
    }

    // Chuyển động tàu Perseus lướt trên đường hải trình
    this.routeProgress = (this.routeProgress + 0.0018) % 1;
    if (this.shipMesh && this.routeCurve) {
      const shipPoint = this.routeCurve.getPointAt(this.routeProgress);
      this.shipMesh.position.copy(shipPoint);
    }

    // Quỹ đạo Mặt Trăng xoay chậm
    if (this.moonMesh) {
      const moonAngle = now * 0.0004;
      this.moonMesh.position.x = Math.cos(moonAngle) * this.moonOrbitRadius;
      this.moonMesh.position.z = Math.sin(moonAngle) * this.moonOrbitRadius;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Khởi tạo toàn cục an toàn
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
