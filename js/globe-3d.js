// js/globe-3d.js — Next-Gen 3D Earth Globe for Dr. Stone Perseus Navigation (V3.0)
// Tác giả: Antigravity | Dự án: Dr. Stone Fan Website
// Cải tiến V3.0:
// 1. Khôi phục lớp mây bồng bềnh (earth_clouds_1024.png) quay êm đềm, bỏ gợn sóng sọc.
// 2. Tải và tích hợp mô hình 3D thực tế senku.glb (GLTFLoader + DRACOLoader) thu nhỏ thám hiểm.
// 3. Khắc phục triệt để các đường line bị cắt: Đoạn đỏ đi thẳng theo vĩ tuyến bám mặt cầu, đoạn vàng nối trọn vẹn từ California đến tận lõi Amazon không bị đứt 2 đầu.
// 4. Trái Đất quay chậm êm dịu (speed: 0.00045), đúng chiều vật lý từ Tây sang Đông (quay từ trái sang phải khi nhìn vào xích đạo).
// 5. Cho phép zoom cực cận (2.9) soi rõ từng chi tiết tàu và mô hình Senku.

'use strict';

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class PerseusHologramGlobe {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 520;
    this.radius = 2.4;

    // Trạng thái tương tác & Góc nhìn ban đầu khóa thẳng vào Bắc Thái Bình Dương
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotation = { x: 0.22, y: -2.35 };
    this.currentRotation = { x: 0.22, y: -2.35 };
    this.autoRotate = true;
    // Tốc độ quay chậm rãi, êm đềm chuẩn tự nhiên
    this.autoRotateSpeed = 0.00045;
    this.lastInteractionTime = performance.now();
    this.shockwaveTime = 0;
    this.seaProgress = 0;
    this.landProgress = 0;
    this.isPaused = false;

    // Hướng ánh sáng mặt trời trong không gian (nghiêng từ góc Tây Bắc tạo vệt ngày/đêm)
    this.sunDirection = new THREE.Vector3(-2.2, 0.7, 1.4).normalize();

    // Tọa độ các trạm hải trình chuẩn xác 100% Cốt truyện Dr. Stone
    this.waypoints = [
      // 1. Trạm khởi nguyên: Làng Ishigami (Bán đảo Izu / Vịnh Tokyo)
      { id: 'arc-village', name: 'Làng Ishigami (Nhật Bản)', lat: 35.65, lon: 139.75, color: 0x00f5a0, label: 'TRẠM 1', sp: 15 },

      // 2. Trạm Đảo Kho Báu: Đảo Aogashima / Quần đảo Izu (Sát ngay phía Nam Tokyo)
      { id: 'arc-treasure', name: 'Đảo Kho Báu (Quần đảo Izu)', lat: 32.46, lon: 139.77, color: 0x00d4ff, label: 'TRẠM 2', sp: 20 },

      // 3. Trạm Bắc Mỹ: California (Vùng đất bắp / ngô)
      { id: 'arc-america', name: 'Tân Thành Phố Mỹ (California)', lat: 37.77, lon: -122.42, color: 0xffd700, label: 'TRẠM 3', sp: 25 },

      // 4. Trạm Nam Mỹ: Tâm Chấn Hóa Đá Medusa (Manaus, Amazon)
      { id: 'arc-south-america', name: 'Tâm Chấn Hóa Đá (Manaus, Amazon)', lat: -3.12, lon: -60.02, color: 0xff2255, label: 'TÂM CHẤN', isEpicenter: true, sp: 30 },

      // 5. Trạm Cuối: Mặt Trăng (Why-man)
      { id: 'arc-moon', name: 'Mặt Trăng (Why-man)', lat: 0, lon: 0, color: 0xdde4ec, label: 'ĐÍCH ĐẾN', isMoon: true, sp: 50 }
    ];

    this.initScene();
    this.loadTexturesAndBuildGlobe();
    this.createClouds();
    this.createAtmosphere();
    this.createPetrificationEpicenter();
    this.createWaypoints();
    this.createVoyageRoutesAndVehicles();
    this.loadSenkuGLBModel();
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

    // Ánh sáng môi trường
    const ambientLight = new THREE.AmbientLight(0x18263d, 1.3);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
    sunLight.position.copy(this.sunDirection).multiplyScalar(10);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00d4ff, 1.3);
    rimLight.position.set(6, -4, -5);
    this.scene.add(rimLight);

    // 🌍 Độ nghiêng trục Trái Đất chuẩn thiên văn 23.4° (Earth Astronomical Tilt)
    this.earthTiltGroup = new THREE.Group();
    this.earthTiltGroup.rotation.z = -23.4 * (Math.PI / 180);
    this.scene.add(this.earthTiltGroup);

    // Nhóm xoay Trái Đất tự do quanh trục nghiêng
    this.globeGroup = new THREE.Group();
    this.earthTiltGroup.add(this.globeGroup);
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
    const earthGeo = new THREE.SphereGeometry(this.radius, 64, 64);

    this.dayTexture = textureLoader.load('assets/earth-daymap-4k.jpg');
    this.nightTexture = textureLoader.load('assets/images/earth_dark.jpg');

    // ☀️ Custom Day/Night Blend Shader chuẩn, trong trẻo, không gợn sọc kì lạ
    const earthVS = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const earthFS = `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform vec3 sunDirection;
      uniform vec3 cameraWorldPos;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        float sunOrientation = dot(sunDirection, normal);

        // Chuyển tiếp ngày/đêm mềm mại
        float dayMix = smoothstep(-0.22, 0.42, sunOrientation);

        vec3 dayColor = texture2D(dayTexture, vUv).rgb;
        vec3 nightColor = texture2D(nightTexture, vUv).rgb * 1.55;

        vec3 finalColor = mix(nightColor, dayColor, dayMix);

        // Phản chiếu ánh nắng tự nhiên trên mặt đại dương (Ocean Specular)
        if (dayMix > 0.05) {
          float isOcean = clamp((dayColor.b - dayColor.r * 0.6) * 2.2, 0.0, 1.0);
          vec3 viewDir = normalize(cameraWorldPos - vWorldPosition);
          vec3 reflectDir = reflect(-sunDirection, normal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
          vec3 oceanGlint = vec3(0.0, 0.85, 1.0) * spec * isOcean * 0.35;
          finalColor += oceanGlint * dayMix;
        }

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: this.dayTexture },
        nightTexture: { value: this.nightTexture },
        sunDirection: { value: this.sunDirection },
        cameraWorldPos: { value: this.camera.position }
      },
      vertexShader: earthVS,
      fragmentShader: earthFS
    });

    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMaterial);
    this.globeGroup.add(this.earthMesh);
  }

  // ☁️ KHÔI PHỤC LỚP MÂY BỒNG BỀNH QUAY CHẬM QUANH TRÁI ĐẤT
  createClouds() {
    const textureLoader = new THREE.TextureLoader();
    const cloudsTexture = textureLoader.load('assets/images/earth_clouds_1024.png');

    const cloudsGeo = new THREE.SphereGeometry(this.radius * 1.009, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    this.globeGroup.add(this.cloudsMesh);
  }

  createAtmosphere() {
    // 🌌 Lớp Khí Quyển Quang Học Fresnel (Fresnel Rim Glow)
    const atmosGeo = new THREE.SphereGeometry(this.radius * 1.022, 64, 64);

    const fresnelVS = `
      varying float vReflectionFactor;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vec3 viewDir = normalize(worldPosition.xyz - cameraPosition);

        vReflectionFactor = 0.06 + 1.25 * pow(1.0 + dot(viewDir, worldNormal), 3.8);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fresnelFS = `
      varying float vReflectionFactor;

      void main() {
        float f = clamp(vReflectionFactor, 0.0, 1.0);
        vec3 cyanNeon = vec3(0.0, 0.83, 1.0);
        gl_FragColor = vec4(cyanNeon, f * 0.9);
      }
    `;

    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: fresnelVS,
      fragmentShader: fresnelFS,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });

    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.globeGroup.add(atmosphere);
  }

  // 💥 Tâm chấn hóa đá Medusa tại Lòng chảo Amazon (Manaus, Brazil)
  createPetrificationEpicenter() {
    this.epicenterCoords = { lat: -3.12, lon: -60.02 };
    const epicPos = this.latLonToVector3(this.epicenterCoords.lat, this.epicenterCoords.lon, this.radius, 0.022);

    // 1. Lõi phát sáng đỏ rực
    const coreGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff1144 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.copy(epicPos);
    this.globeGroup.add(core);

    // 2. Vòng sóng xung kích Medusa lan tỏa
    this.shockwaveRings = [];
    const ringCount = 3;

    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(0.05, 0.075, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f5a0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(epicPos);
      ring.lookAt(0, 0, 0);
      this.globeGroup.add(ring);
      this.shockwaveRings.push({ mesh: ring, offset: i * (Math.PI * 2 / ringCount) });
    }

    // 3. Cột tia sáng năng lượng bắn lên không gian
    const beamGeo = new THREE.CylinderGeometry(0.006, 0.006, 1.1, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff2255,
      transparent: true,
      opacity: 0.75
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(this.latLonToVector3(this.epicenterCoords.lat, this.epicenterCoords.lon, this.radius, 0.55));
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), epicPos.clone().normalize());
    this.globeGroup.add(beam);
  }

  // 📍 Các điểm ghim hải trình: Tinh gọn, thanh thoát, tọa độ chuẩn xác
  createWaypoints() {
    this.waypointMeshes = [];

    this.waypoints.forEach(wp => {
      if (wp.isMoon) return;

      const pos = this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.018);

      // Cột định vị nhỏ gọn thanh thoát (Micro Pin)
      const pinGeo = new THREE.CylinderGeometry(0.004, 0.0015, 0.12, 6);
      const pinMat = new THREE.MeshBasicMaterial({ color: wp.color });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.06));
      pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      this.globeGroup.add(pin);

      // Viên ngọc phát quang nhỏ gọn trên đỉnh
      const beaconGeo = new THREE.SphereGeometry(0.018, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: wp.color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(this.latLonToVector3(wp.lat, wp.lon, this.radius, 0.12));
      this.globeGroup.add(beacon);

      this.waypointMeshes.push({ wp, beacon, pin });
    });
  }

  // ⛵ MÔ HÌNH CHIẾN HẠM PERSEUS 3D MINI (Phóng to sắc nét)
  buildPerseusShipModel() {
    const ship = new THREE.Group();

    // Thân thuyền Perseus bọc thép (Hull)
    const hullGeo = new THREE.ConeGeometry(0.028, 0.11, 4);
    hullGeo.rotateX(Math.PI / 2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x1a2634,
      metalness: 0.7,
      roughness: 0.25
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.scale.set(0.65, 0.4, 1.0);
    ship.add(hull);

    // Boong tàu
    const deckGeo = new THREE.BoxGeometry(0.024, 0.008, 0.07);
    const deckMat = new THREE.MeshBasicMaterial({ color: 0x8b5a2b });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 0.01, -0.01);
    ship.add(deck);

    // Cột buồm chính
    const mastGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.08, 6);
    const mastMat = new THREE.MeshBasicMaterial({ color: 0xc5d4ea });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 0.045, 0.005);
    ship.add(mast);

    // Cánh buồm chính trắng phát quang viền Neon Cyan
    const sailGeo = new THREE.PlaneGeometry(0.05, 0.06);
    const sailMat = new THREE.MeshBasicMaterial({
      color: 0xf0faff,
      side: THREE.DoubleSide
    });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(0, 0.048, 0.005);
    ship.add(sail);

    // Viền buồm phát quang Neon Cyan
    const sailEdgeGeo = new THREE.RingGeometry(0.024, 0.027, 4);
    const sailEdgeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide });
    const sailEdge = new THREE.Mesh(sailEdgeGeo, sailEdgeMat);
    sailEdge.position.set(0, 0.048, 0.006);
    ship.add(sailEdge);

    // Buồm tam giác mũi tàu
    const jibGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0.012, 0.045,
      0, 0.065, 0.005,
      0, 0.012, 0.005
    ]);
    jibGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const jibMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide });
    const jib = new THREE.Mesh(jibGeo, jibMat);
    ship.add(jib);

    // Phóng to con thuyền lên 1.6 lần để nhìn rõ rệt và uy phong hơn
    ship.scale.set(1.6, 1.6, 1.6);

    return ship;
  }

  // 🧪 TẢI MÔ HÌNH 3D SENKU TỪ FILE senku.glb (PHÓNG TO RÕ NÉT ĐỂ THÁM HIỂM)
  loadSenkuGLBModel() {
    this.senkuGroup = new THREE.Group();
    this.globeGroup.add(this.senkuGroup);

    // Vòng phát quang vàng cam dưới chân
    const auraGeo = new THREE.RingGeometry(0.1, 0.2, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    aura.rotation.x = Math.PI / 2;
    this.senkuGroup.add(aura);

    // Loader GLB + Draco Decoder
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      'assets/models/senku.glb',
      (gltf) => {
        const model = gltf.scene;

        // Tính BoundingBox để scale thu nhỏ chuẩn xác (phóng to lên chiều cao 0.15)
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetHeight = 0.3; // Tăng từ 0.09 lên 0.15 để dễ quan sát hơn
        const scale = targetHeight / (maxDim || 1);
        model.scale.set(scale, scale, scale);

        // Căn chỉnh tâm chân chạm đất
        model.position.y = 0.002;

        this.senkuGroup.add(model);
      },
      undefined,
      (error) => {
        console.warn('Fallback Procedural Senku:', error);
        // Fallback mô hình đơn giản phóng to tương ứng
        const bodyGeo = new THREE.CylinderGeometry(0.016, 0.025, 0.07, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4a373 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.038;
        this.senkuGroup.add(body);

        const hairGeo = new THREE.ConeGeometry(0.022, 0.06, 6);
        const hairMat = new THREE.MeshBasicMaterial({ color: 0x76c843 });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.y = 0.095;
        this.senkuGroup.add(hair);
      }
    );
  }

  // 🌐 KHẮC PHỤC CÁC ĐƯỜNG LINE BỊ CẮT VÀ THIẾT LẬP LỘ TRÌNH CHUẨN
  createVoyageRoutesAndVehicles() {
    const ALT = 0.022; // Độ cao an toàn bám sát bề mặt, không bao giờ bị chìm vào lòng đất

    // ═══════════════════════════════════════════════════════════════
    // 1. CHẶNG 1: ĐẠI QUYỂN HÀNG LỘ (XANH LÁ) — NHẬT BẢN ➜ CALIFORNIA
    // ═══════════════════════════════════════════════════════════════
    const seaPoints = [
      this.latLonToVector3(35.65, 139.75, this.radius, ALT),    // 1. Làng Ishigami (Nhật Bản)
      this.latLonToVector3(32.46, 139.77, this.radius, ALT),    // 2. Quần đảo Izu (Đảo Kho Báu)
      this.latLonToVector3(35.65, 139.75, this.radius, ALT),    // 3. Hồi hương Nhật Bản
      this.latLonToVector3(43.5, 156.0, this.radius, ALT),      // 4. Biển Kuril
      this.latLonToVector3(48.5, 172.0, this.radius, ALT),      // 5. Tiến vào Bắc Thái Bình Dương
      this.latLonToVector3(51.2, -178.0, this.radius, ALT),     // 6. Đỉnh vòng cung Aleutian (51.2°N)
      this.latLonToVector3(49.0, -160.0, this.radius, ALT),     // 7. Xuôi nam qua Vịnh Alaska
      this.latLonToVector3(45.0, -142.0, this.radius, ALT),     // 8. Tiếp cận bờ Tây
      this.latLonToVector3(40.0, -130.0, this.radius, ALT),     // 9. Vùng biển duyên hải
      this.latLonToVector3(37.77, -122.42, this.radius, ALT)    // 10. Cập cảng California (chính xác chân ghim)
    ];

    this.seaCurve = new THREE.CatmullRomCurve3(seaPoints);
    const seaTubeGeo = new THREE.TubeGeometry(this.seaCurve, 180, 0.0055, 8, false);
    const seaTubeMat = new THREE.MeshBasicMaterial({
      color: 0x00f5a0,
      transparent: true,
      opacity: 0.95
    });
    this.globeGroup.add(new THREE.Mesh(seaTubeGeo, seaTubeMat));

    // ═══════════════════════════════════════════════════════════════
    // 2. ĐƯỜNG ĐỎ CỦA RYUSUI: ĐI THẲNG THEO VĨ TUYẾN, BÁM MẶT BIỂN (KHÔNG BỊ CẮT)
    // ═══════════════════════════════════════════════════════════════
    // Nội suy 14 điểm đều đặn theo kinh độ từ Tokyo đến California, vĩ độ giữ thẳng quanh 35-37°N
    const rhumbPoints = [];
    const numRhumb = 14;
    const startLon = 139.75;
    const endLon = -122.42 + 360; // 237.58
    for (let i = 0; i <= numRhumb; i++) {
      const t = i / numRhumb;
      const lat = 35.65 + (37.77 - 35.65) * t; // Đường thẳng tắp theo vĩ tuyến
      let lon = startLon + (endLon - startLon) * t;
      if (lon > 180) lon -= 360;
      rhumbPoints.push(this.latLonToVector3(lat, lon, this.radius, ALT));
    }
    const rhumbCurve = new THREE.CatmullRomCurve3(rhumbPoints);
    const rhumbTubeGeo = new THREE.TubeGeometry(rhumbCurve, 120, 0.0035, 6, false);
    const rhumbTubeMat = new THREE.MeshBasicMaterial({
      color: 0xff3b5c,
      transparent: true,
      opacity: 0.45,
      wireframe: true
    });
    this.globeGroup.add(new THREE.Mesh(rhumbTubeGeo, rhumbTubeMat));

    // ⛵ Chiến hạm Perseus 3D Mini rẽ sóng trên đường biển
    this.shipGroup = this.buildPerseusShipModel();
    this.globeGroup.add(this.shipGroup);

    // ═══════════════════════════════════════════════════════════════
    // 3. CHẶNG 2: ĐƯỜNG VÀNG LỤC ĐỊA — NỐI TRỌN VẸN CALIFORNIA ➜ AMAZON (KHÔNG BỊ ĐỨT 2 ĐẦU)
    // ═══════════════════════════════════════════════════════════════
    // Bố trí 14 điểm trung gian dày đặc bám sát theo lục địa châu Mỹ, xuất phát đúng California và chạm đúng tâm chấn Amazon
    const landPoints = [
      this.latLonToVector3(37.77, -122.42, this.radius, ALT),   // 1. Chân ghim California
      this.latLonToVector3(34.05, -118.24, this.radius, ALT),   // 2. Los Angeles
      this.latLonToVector3(29.0, -111.0, this.radius, ALT),     // 3. Vịnh California / Bắc Mexico
      this.latLonToVector3(24.0, -104.0, this.radius, ALT),     // 4. Cao nguyên Mexico
      this.latLonToVector3(19.4, -99.1, this.radius, ALT),      // 5. Trung tâm Mexico
      this.latLonToVector3(15.5, -92.5, this.radius, ALT),      // 6. Nam Mexico / Guatemala
      this.latLonToVector3(12.0, -86.0, this.radius, ALT),      // 7. Nicaragua
      this.latLonToVector3(9.0, -79.5, this.radius, ALT),       // 8. Kênh đào Panama
      this.latLonToVector3(7.0, -76.0, this.radius, ALT),       // 9. Vịnh Darien / Colombia
      this.latLonToVector3(4.5, -73.0, this.radius, ALT),       // 10. Dãy Andes / Bogota
      this.latLonToVector3(1.0, -68.5, this.radius, ALT),       // 11. Lưu vực sông Rio Negro
      this.latLonToVector3(-1.0, -64.0, this.radius, ALT),      // 12. Tiếp cận lưu vực Amazon
      this.latLonToVector3(-2.2, -61.5, this.radius, ALT),      // 13. Cận cảnh Manaus
      this.latLonToVector3(-3.12, -60.02, this.radius, ALT)     // 14. Đúng tâm chấn Manaus, Amazon
    ];

    this.landCurve = new THREE.CatmullRomCurve3(landPoints);
    const landTubeGeo = new THREE.TubeGeometry(this.landCurve, 140, 0.005, 8, false);
    const landTubeMat = new THREE.MeshBasicMaterial({
      color: 0xffd700, // Vàng kim khoa học sắc nét
      transparent: true,
      opacity: 0.95
    });
    this.globeGroup.add(new THREE.Mesh(landTubeGeo, landTubeMat));
  }

  createMoon() {
    const moonGeo = new THREE.SphereGeometry(0.3, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xdde4ec,
      roughness: 0.85,
      metalness: 0.1,
      emissive: 0x101a26
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonOrbitRadius = 5.2;
    this.moonMesh.position.set(this.moonOrbitRadius, 1.2, 0);
    this.scene.add(this.moonMesh);

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

    // 🔍 LĂN CHUỘT ZOOM CẬN CẢNH (Cho phép zoom sát 2.9)
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z += e.deltaY * 0.0035;
      this.camera.position.z = Math.max(2.9, Math.min(9.5, this.camera.position.z));
      this.lastInteractionTime = performance.now();
    }, { passive: false });

    // Cảm ứng Mobile / Tablet
    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDistance = null;

    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.lastInteractionTime = performance.now();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.hypot(dx, dy);
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;

        this.targetRotation.y += deltaX * 0.006;
        this.targetRotation.x += deltaY * 0.006;
        this.targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.targetRotation.x));

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        this.lastInteractionTime = performance.now();
      } else if (e.touches.length === 2 && initialPinchDistance) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);
        const diff = initialPinchDistance - currentDistance;

        this.camera.position.z += diff * 0.008;
        this.camera.position.z = Math.max(2.9, Math.min(9.5, this.camera.position.z));
        initialPinchDistance = currentDistance;
        this.lastInteractionTime = performance.now();
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
      initialPinchDistance = null;
    });

    // Resize cửa sổ
    window.addEventListener('resize', () => {
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

    if (btn3D && btn2D && wrap3D && wrap2D) {
      btn3D.addEventListener('click', () => {
        this.isPaused = false;
        wrap3D.classList.remove('hidden');
        wrap2D.classList.add('hidden');
        btn3D.className = "px-3.5 py-1.5 rounded-lg bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)] cursor-pointer";
        btn2D.className = "px-3.5 py-1.5 rounded-lg text-[#8fa0ba] hover:text-white text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all cursor-pointer";

        setTimeout(() => {
          this.width = this.container.clientWidth;
          this.height = this.container.clientHeight || 520;
          this.camera.aspect = this.width / this.height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(this.width, this.height);
        }, 60);
      });

      btn2D.addEventListener('click', () => {
        this.isPaused = true;
        wrap3D.classList.add('hidden');
        wrap2D.classList.remove('hidden');
        btn2D.className = "px-3.5 py-1.5 rounded-lg bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)] cursor-pointer";
        btn3D.className = "px-3.5 py-1.5 rounded-lg text-[#8fa0ba] hover:text-white text-xs font-['Orbitron'] font-bold flex items-center gap-1.5 transition-all cursor-pointer";
      });
    }
  }

  focusCoordinates(lat, lon) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    this.targetRotation.x = phi - Math.PI / 2;
    this.targetRotation.y = -theta - Math.PI / 2;
    this.autoRotate = false;
    this.lastInteractionTime = performance.now();
  }

  awardWaypointPoints(wp) {
    if (!wp) return;
    try {
      const storageKey = 'drstone_visited_waypoints';
      let visited = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!visited.includes(wp.id)) {
        visited.push(wp.id);
        localStorage.setItem(storageKey, JSON.stringify(visited));
        if (window.CitizenPass && typeof window.CitizenPass.addSciencePoints === 'function') {
          window.CitizenPass.addSciencePoints(wp.sp || 15, `Khám phá Trạm Hải Trình: ${wp.name}`);
        }
      }
    } catch (err) {
      console.warn('CitizenPass integration note:', err);
    }
  }

  bindWaypointButtons() {
    const btns = document.querySelectorAll('.waypoint-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const href = btn.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const wp = this.waypoints.find(w => w.id === targetId);
          if (wp) {
            e.preventDefault();
            this.awardWaypointPoints(wp);

            if (wp.isMoon) {
              this.targetRotation.x = 0;
              this.targetRotation.y = 0;
              this.camera.position.z = 8.5;
            } else {
              this.focusCoordinates(wp.lat, wp.lon);
            }
          }
        }
      });
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isPaused) return;

    const now = performance.now();

    // 🌍 TRÁI ĐẤT TỰ QUAY TỪ TÂY SANG ĐÔNG (Quay từ Trái sang Phải, tốc độ êm dịu)
    if (!this.isDragging && now - this.lastInteractionTime > 3000) {
      this.targetRotation.y += this.autoRotateSpeed;
    }

    // Damping quán tính xoay mượt mà (Lerp)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    this.globeGroup.rotation.x = this.currentRotation.x;
    this.globeGroup.rotation.y = this.currentRotation.y;

    // ☁️ Lớp mây trôi nhẹ nhàng độc lập
    if (this.cloudsMesh) {
      this.cloudsMesh.rotation.y += 0.00035;
    }

    if (this.earthMaterial && this.earthMaterial.uniforms.cameraWorldPos) {
      this.earthMaterial.uniforms.cameraWorldPos.value.copy(this.camera.position);
    }

    // Hiệu ứng sóng xung kích Medusa tại Nam Mỹ
    this.shockwaveTime += 0.025;
    if (this.shockwaveRings) {
      this.shockwaveRings.forEach(ringObj => {
        const progress = (this.shockwaveTime + ringObj.offset) % (Math.PI * 2);
        const scale = 1.0 + (progress / (Math.PI * 2)) * 3.5;
        const opacity = Math.max(0, 1.0 - progress / (Math.PI * 2));
        ringObj.mesh.scale.set(scale, scale, 1);
        ringObj.mesh.material.opacity = opacity * 0.75;
      });
    }

    // ⛵ 1. CHIẾN HẠM PERSEUS RẼ SÓNG ĐƯỜNG BIỂN (Nhật Bản ➜ California)
    this.seaProgress = (this.seaProgress + 0.0014) % 1;
    if (this.shipGroup && this.seaCurve) {
      const currentPoint = this.seaCurve.getPointAt(this.seaProgress);
      const nextProgress = (this.seaProgress + 0.004) % 1;
      const nextPoint = this.seaCurve.getPointAt(nextProgress);

      this.shipGroup.position.copy(currentPoint);
      const tangent = nextPoint.clone().sub(currentPoint).normalize();
      this.shipGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Nhấp nhô nhẹ theo sóng biển
      const bobbing = Math.sin(now * 0.004) * 0.004;
      this.shipGroup.position.addScaledVector(currentPoint.clone().normalize(), bobbing);
    }

    // 🧪 2. SENKU MINI 3D THÁM HIỂM LỤC ĐỊA (California ➜ Amazon)
    this.landProgress = (this.landProgress + 0.0016) % 1;
    if (this.senkuGroup && this.landCurve) {
      const currentPoint = this.landCurve.getPointAt(this.landProgress);
      const nextProgress = (this.landProgress + 0.004) % 1;
      const nextPoint = this.landCurve.getPointAt(nextProgress);

      this.senkuGroup.position.copy(currentPoint);

      // Đứng thẳng hướng vuông góc với tâm Trái Đất
      const normal = currentPoint.clone().normalize();
      this.senkuGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Bước đi nhấp nhô nhẹ
      const stepBobbing = Math.abs(Math.sin(now * 0.006)) * 0.003;
      this.senkuGroup.position.addScaledVector(normal, stepBobbing);
    }

    // Quỹ đạo Mặt Trăng xoay chậm quanh Trái Đất
    if (this.moonMesh) {
      const moonAngle = now * 0.00032;
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
