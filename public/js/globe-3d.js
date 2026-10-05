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
    this.bikeProgress = 0;
    this.raftProgress = 0;
    this.isPaused = false;

    // Hướng ánh sáng mặt trời trong không gian (nghiêng từ góc Tây Bắc tạo vệt ngày/đêm)
    this.sunDirection = new THREE.Vector3(-2.2, 0.7, 1.4).normalize();

    // Tọa độ các trạm hải trình vòng quanh thế giới chuẩn xác 100% Cốt truyện Dr. Stone
    this.waypoints = [
      // 1. Nhật Bản
      {
        id: 'arc-japan',
        name: 'Làng Ishigami (Nhật Bản)',
        city: 'Vịnh Tokyo, Nhật Bản',
        vehicle: 'Chiến hạm Perseus 3D',
        resource: 'Khởi nguyên nền văn minh',
        desc: 'Senku cùng Vương Quốc Khoa Học đóng chiến hạm Perseus, chế tạo radar & động cơ đẩy vươn ra biển lớn.',
        lat: 35.68,
        lon: 139.76,
        color: 0x00f5a0,
        label: '01. NHẬT BẢN',
        sp: 15
      },
      // 2. Mỹ: Corn City
      {
        id: 'arc-corn',
        name: 'Thành Phố Ngô (Corn City)',
        city: 'California / Sacramento, Mỹ',
        vehicle: 'Chiến hạm Perseus (Đại Quyển 51.2°N)',
        resource: 'Ngô (Sản xuất rượu cồn hồi sinh)',
        desc: 'Vượt Bắc Thái Bình Dương đến San Francisco/Sacramento. Đối đầu nhóm TS. Xeno và lập Corn City.',
        lat: 38.58,
        lon: -121.49,
        color: 0xffd700,
        label: '02. MỸ (CORN CITY)',
        sp: 20
      },
      // 2b. Ecuador: Trạm Đổ Bộ Xe Máy
      {
        id: 'arc-ecuador',
        name: 'Cửa Biển Ecuador (Trạm Xe Máy)',
        city: 'Vịnh Guayaquil, Ecuador',
        vehicle: 'Xe Máy Cào Cào Vượt Dãy Andes',
        resource: 'Lắp ráp Xe Máy 2 bánh',
        desc: 'Nhóm đi thuyền xuôi biển bờ Tây xuống Ecuador, đổ bộ lắp ráp xe máy phóng vượt đỉnh tuyết Andes.',
        lat: -2.20,
        lon: -80.90,
        color: 0x00e5ff,
        label: '02b. ECUADOR (XE MÁY)',
        isTransit: true,
        sp: 20
      },
      // 3. Nam Mỹ: Superalloy City & Tâm Chấn Amazon
      {
        id: 'arc-south-america',
        name: 'Thành Phố Siêu Hợp Kim (Superalloy City)',
        city: 'Araxá & Lưu vực Amazon, Brazil',
        vehicle: 'Bè Gỗ Xuôi Dòng Sông Amazon',
        resource: 'Sắt, Nickel & Mỏ Quặng Siêu Hợp Kim',
        desc: 'Đóng bè gỗ xuôi dòng sông Amazon qua tâm chấn Medusa tới Araxá. Nơi Suika mất nhiều năm tự thức tỉnh.',
        lat: -19.59,
        lon: -46.94,
        color: 0xff2255,
        label: '03. NAM MỸ (SUPERALLOY)',
        isEpicenter: true,
        sp: 25
      },
      // 4. Tây Ban Nha: Fluorite City
      {
        id: 'arc-fluorite',
        name: 'Thành Phố Fluorite (Fluorite City)',
        city: 'Asturias / Madrid, Tây Ban Nha',
        vehicle: 'Tàu Buồm Vượt Đại Tây Dương',
        resource: 'Đá Fluorite (Làm thấu kính viễn vọng & IC)',
        desc: 'Băng qua Đại Tây Dương đến bờ biển Tây Ban Nha, khai thác quặng fluorite tinh khiết làm linh kiện máy tính.',
        lat: 40.41,
        lon: -3.70,
        color: 0x9b51e0,
        label: '04. TÂY BAN NHA (FLUORITE)',
        sp: 25
      },
      // 5. Ấn Độ: Math City
      {
        id: 'arc-math',
        name: 'Thành Phố Toán Học (Math City)',
        city: 'Mumbai / Goa, Ấn Độ',
        vehicle: 'Hải Trình Địa Trung Hải ➜ Kênh Suez',
        resource: 'Thiên tài Toán Học Sai Nanami',
        desc: 'Vượt qua Kênh Suez và Biển Đỏ đến Ấn Độ, tìm kiếm và hồi sinh Sai Nanami để lập trình quỹ đạo tên lửa.',
        lat: 19.07,
        lon: 72.87,
        color: 0x00d4ff,
        label: '05. ẤN ĐỘ (MATH CITY)',
        sp: 30
      },
      // 6. Indonesia: Rubber City
      {
        id: 'arc-rubber',
        name: 'Thành Phố Cao Su (Rubber City)',
        city: 'Kalimantan / Sumatra, Indonesia',
        vehicle: 'Hải Trình Vịnh Bengal ➜ Eo Malacca',
        resource: 'Cao Su Tự Nhiên (Vỏ bọc cách điện & Bánh xe)',
        desc: 'Tiến vào rừng nhiệt đới Đông Nam Á, khai thác mủ cao su tự nhiên phục vụ bọc dây điện cho siêu máy tính.',
        lat: -0.78,
        lon: 113.92,
        color: 0xff9900,
        label: '06. INDONESIA (RUBBER)',
        sp: 30
      },
      // 7. Úc: Aluminum City
      {
        id: 'arc-aluminum',
        name: 'Thành Phố Nhôm (Aluminum City)',
        city: 'Weipa / Queensland, Úc',
        vehicle: 'Hải Trình Biển Timor ➜ Bắc Úc',
        resource: 'Bauxite (Luyện Nhôm) & Uranium',
        desc: 'Cập cảng nước Úc thu thập quặng Bauxite luyện vỏ hợp kim nhôm siêu nhẹ và Uranium phục vụ lò phản ứng.',
        lat: -12.63,
        lon: 141.88,
        color: 0x39ff14,
        label: '07. ÚC (ALUMINUM CITY)',
        sp: 35
      },
      // 8. Đích: Mặt Trăng
      {
        id: 'arc-moon',
        name: 'Bệ Phóng Tên Lửa Mặt Trăng (Why-man)',
        city: 'Hồi Hương Nhật Bản ➜ Mặt Trăng',
        vehicle: 'Tên Lửa Khoa Học Đa Tầng',
        resource: 'Lắp ráp Siêu Máy Tính & Bệ Phóng',
        desc: 'Quay về Nhật Bản kết nối toàn bộ mạng lưới 6 thành phố vệ tinh, đóng tàu vũ trụ phóng thẳng lên Mặt Trăng!',
        lat: 0,
        lon: 0,
        color: 0xdde4ec,
        label: 'ĐÍCH: MẶT TRĂNG',
        isMoon: true,
        sp: 50
      }
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

  // 🏍️ MÔ HÌNH XE MÁY CÀO CÀO 3D MINI (VƯỢT ĐÈO TUYẾT DÃY ANDES)
  buildMotorcycleModel() {
    const bike = new THREE.Group();
    // 2 Bánh xe địa hình
    const wheelGeo = new THREE.TorusGeometry(0.018, 0.005, 8, 16);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x11161d });
    const wheelF = new THREE.Mesh(wheelGeo, wheelMat);
    wheelF.position.set(0, 0.02, 0.038);
    bike.add(wheelF);
    const wheelR = new THREE.Mesh(wheelGeo, wheelMat);
    wheelR.position.set(0, 0.02, -0.038);
    bike.add(wheelR);

    // Khung sườn xe cào cào thể thao màu cam neon đặc trưng
    const frameGeo = new THREE.BoxGeometry(0.016, 0.02, 0.055);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.35, metalness: 0.6 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.026, 0);
    bike.add(frame);

    // Bình xăng & yên xe
    const seatGeo = new THREE.BoxGeometry(0.014, 0.008, 0.03);
    const seatMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.037, -0.01);
    bike.add(seat);

    // Đèn pha phát quang vàng rực
    const lightGeo = new THREE.SphereGeometry(0.009, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0, 0.035, 0.04);
    bike.add(light);

    bike.scale.set(1.4, 1.4, 1.4);
    return bike;
  }

  // 🪵 MÔ HÌNH BÈ GỖ 3D MINI (XUÔI DÒNG SÔNG AMAZON QUA TÂM CHẤN MEDUSA)
  buildRaftModel() {
    const raft = new THREE.Group();
    // 5 thân cây gỗ ghép kết bè
    for (let i = -2; i <= 2; i++) {
      const logGeo = new THREE.CylinderGeometry(0.0075, 0.0075, 0.08, 8);
      logGeo.rotateX(Math.PI / 2);
      const logMat = new THREE.MeshStandardMaterial({ color: 0x7a4b26, roughness: 0.85 });
      const log = new THREE.Mesh(logGeo, logMat);
      log.position.set(i * 0.014, 0.008, 0);
      raft.add(log);
    }

    // Cọc buồm và tấm bạt xanh ngọc Senku
    const mastGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.055, 6);
    const mastMat = new THREE.MeshBasicMaterial({ color: 0xcd853f });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 0.032, 0);
    raft.add(mast);

    const sailGeo = new THREE.PlaneGeometry(0.035, 0.03);
    const sailMat = new THREE.MeshBasicMaterial({ color: 0x00f5a0, side: THREE.DoubleSide });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(0, 0.042, 0);
    raft.add(sail);

    raft.scale.set(1.4, 1.4, 1.4);
    return raft;
  }

  // 🌐 THIẾT LẬP TOÀN BỘ 7 CHẶNG HẢI TRÌNH & PHƯƠNG TIỆN CHUẨN XÁC 100% CỐT TRUYỆN
  createVoyageRoutesAndVehicles() {
    const ALT = 0.022; // Độ cao an toàn bám sát bề mặt địa cầu

    // ═══════════════════════════════════════════════════════════════
    // 1. CHẶNG 1: ĐẠI QUYỂN HÀNG LỘ (XANH LÁ) — NHẬT BẢN ➜ CORN CITY (CALIFORNIA)
    // ═══════════════════════════════════════════════════════════════
    const seaPoints = [
      this.latLonToVector3(35.68, 139.76, this.radius, ALT),    // Làng Ishigami (Nhật Bản)
      this.latLonToVector3(32.46, 139.77, this.radius, ALT),    // Quần đảo Izu (Đảo Kho Báu)
      this.latLonToVector3(35.68, 139.76, this.radius, ALT),    // Hồi hương Nhật Bản xuất phát
      this.latLonToVector3(43.5, 156.0, this.radius, ALT),      // Biển Kuril
      this.latLonToVector3(48.5, 172.0, this.radius, ALT),      // Bắc Thái Bình Dương
      this.latLonToVector3(51.2, -178.0, this.radius, ALT),     // Đỉnh vòng cung Aleutian (51.2°N)
      this.latLonToVector3(49.0, -160.0, this.radius, ALT),     // Vịnh Alaska
      this.latLonToVector3(45.0, -142.0, this.radius, ALT),     // Tiếp cận duyên hải bờ Tây
      this.latLonToVector3(40.0, -130.0, this.radius, ALT),     // Vùng biển Bắc California
      this.latLonToVector3(38.58, -121.49, this.radius, ALT)    // Corn City (Sacramento / San Francisco)
    ];

    this.seaCurve = new THREE.CatmullRomCurve3(seaPoints);
    const seaTubeGeo = new THREE.TubeGeometry(this.seaCurve, 180, 0.0055, 8, false);
    const seaTubeMat = new THREE.MeshBasicMaterial({
      color: 0x00f5a0,
      transparent: true,
      opacity: 0.95
    });
    this.globeGroup.add(new THREE.Mesh(seaTubeGeo, seaTubeMat));

    // Đường Hằng Hướng (Đỏ) của Ryusui đi thẳng theo vĩ tuyến
    const rhumbPoints = [];
    const numRhumb = 14;
    const startLon = 139.76;
    const endLon = -121.49 + 360;
    for (let i = 0; i <= numRhumb; i++) {
      const t = i / numRhumb;
      const lat = 35.68 + (38.58 - 35.68) * t;
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
    // 2a. CHẶNG 2A: ĐƯỜNG BIỂN BỜ TÂY THÁI BÌNH DƯƠNG — CORN CITY ➜ CỬA BIỂN ECUADOR
    // ═══════════════════════════════════════════════════════════════
    const route2SeaPoints = [
      this.latLonToVector3(38.58, -121.49, this.radius, ALT),   // Corn City
      this.latLonToVector3(34.05, -119.5, this.radius, ALT),    // Bờ biển Los Angeles
      this.latLonToVector3(27.8, -115.0, this.radius, ALT),     // Bán đảo Baja California
      this.latLonToVector3(20.5, -106.0, this.radius, ALT),     // Ngoài khơi Tây Mexico
      this.latLonToVector3(14.5, -95.0, this.radius, ALT),      // Vịnh Tehuantepec (Trung Mỹ)
      this.latLonToVector3(9.5, -86.0, this.radius, ALT),       // Vùng biển Costa Rica
      this.latLonToVector3(6.5, -81.0, this.radius, ALT),       // Vịnh Panama
      this.latLonToVector3(1.5, -80.5, this.radius, ALT),       // Tiếp cận xích đạo Ecuador
      this.latLonToVector3(-2.20, -80.90, this.radius, ALT)     // Cửa biển Ecuador (Vịnh Guayaquil - Trạm xe máy)
    ];
    this.route2SeaCurve = new THREE.CatmullRomCurve3(route2SeaPoints);
    const route2SeaGeo = new THREE.TubeGeometry(this.route2SeaCurve, 120, 0.005, 8, false);
    const route2SeaMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.95
    });
    this.globeGroup.add(new THREE.Mesh(route2SeaGeo, route2SeaMat));

    // ═══════════════════════════════════════════════════════════════
    // 2b. CHẶNG 2B: VƯỢT DÃY NÚI TUYẾT ANDES BẰNG XE MÁY — ECUADOR ➜ THƯỢNG NGUỒN AMAZON
    // ═══════════════════════════════════════════════════════════════
    const bikePoints = [
      this.latLonToVector3(-2.20, -80.90, this.radius, ALT),          // Cửa biển Ecuador (Vịnh Guayaquil)
      this.latLonToVector3(-1.80, -79.80, this.radius, ALT),          // Đồng bằng hạ lưu Guayas
      this.latLonToVector3(-1.46, -78.82, this.radius, ALT + 0.016),   // Chân núi tuyết Andes / Đỉnh Chimborazo
      this.latLonToVector3(-1.00, -78.40, this.radius, ALT + 0.018),   // Đèo cao núi tuyết Andes
      this.latLonToVector3(-0.95, -77.80, this.radius, ALT + 0.008),   // Hạ đèo xuống sườn đông Andes (Tena)
      this.latLonToVector3(-0.80, -75.50, this.radius, ALT)           // Thượng nguồn sông Amazon (Bến đóng bè gỗ)
    ];
    this.bikeCurve = new THREE.CatmullRomCurve3(bikePoints);
    const bikeTubeGeo = new THREE.TubeGeometry(this.bikeCurve, 60, 0.0048, 8, false);
    const bikeTubeMat = new THREE.MeshBasicMaterial({
      color: 0xff9900, // Cam Neon nổi bật đặc trưng cho xe máy leo núi
      transparent: true,
      opacity: 0.95
    });
    this.globeGroup.add(new THREE.Mesh(bikeTubeGeo, bikeTubeMat));

    // 🏍️ Xe máy cào cào 3D Mini vượt đèo tuyết Andes
    this.bikeGroup = this.buildMotorcycleModel();
    this.globeGroup.add(this.bikeGroup);

    // ═══════════════════════════════════════════════════════════════
    // 2c. CHẶNG 2C: XUÔI DÒNG SÔNG AMAZON BẰNG BÈ GỖ — THƯỢNG NGUỒN ➜ MANAUS ➜ ARAXÁ
    // ═══════════════════════════════════════════════════════════════
    const raftPoints = [
      this.latLonToVector3(-0.80, -75.50, this.radius, ALT),    // Thượng nguồn Sông Napo / Amazon
      this.latLonToVector3(-1.50, -72.00, this.radius, ALT),    // Dòng chính Amazon (Iquitos)
      this.latLonToVector3(-2.50, -66.00, this.radius, ALT),    // Rừng mưa Amazon sâu thẳm
      this.latLonToVector3(-3.12, -60.02, this.radius, ALT),    // Manaus (TÂM CHẤN TIA HÓA ĐÁ MEDUSA)
      this.latLonToVector3(-5.50, -56.00, this.radius, ALT),    // Xuôi dòng sông Tapajós
      this.latLonToVector3(-10.0, -52.00, this.radius, ALT),    // Cao nguyên Trung tâm Brazil
      this.latLonToVector3(-15.5, -48.50, this.radius, ALT),    // Tiếp cận bang Minas Gerais
      this.latLonToVector3(-19.59, -46.94, this.radius, ALT)    // Superalloy City (Araxá, Brazil)
    ];
    this.raftCurve = new THREE.CatmullRomCurve3(raftPoints);
    const raftTubeGeo = new THREE.TubeGeometry(this.raftCurve, 120, 0.005, 8, false);
    const raftTubeMat = new THREE.MeshBasicMaterial({
      color: 0x39ff14, // Xanh lục ngọc dòng sông rừng nhiệt đới Amazon
      transparent: true,
      opacity: 0.95
    });
    this.globeGroup.add(new THREE.Mesh(raftTubeGeo, raftTubeMat));

    // 🪵 Bè Gỗ 3D Mini xuôi dòng sông Amazon
    this.raftGroup = this.buildRaftModel();
    this.globeGroup.add(this.raftGroup);

    // ═══════════════════════════════════════════════════════════════
    // 3. CHẶNG 3: VƯỢT ĐẠI TÂY DƯƠNG — ARAXÁ ➜ TÂY BAN NHA (FLUORITE CITY)
    // ═══════════════════════════════════════════════════════════════
    const route3Points = [
      this.latLonToVector3(-19.59, -46.94, this.radius, ALT),   // Araxá, Brazil
      this.latLonToVector3(-23.0, -43.0, this.radius, ALT),     // Ra bờ biển Rio de Janeiro
      this.latLonToVector3(-15.0, -35.0, this.radius, ALT),     // Nam Đại Tây Dương
      this.latLonToVector3(0.0, -28.0, this.radius, ALT),       // Vượt Xích Đạo Đại Tây Dương
      this.latLonToVector3(18.0, -22.0, this.radius, ALT),      // Quần đảo Cape Verde
      this.latLonToVector3(28.5, -16.0, this.radius, ALT),      // Quần đảo Canary
      this.latLonToVector3(36.5, -9.0, this.radius, ALT),       // Mũi Bồ Đào Nha
      this.latLonToVector3(40.41, -3.70, this.radius, ALT)      // Fluorite City (Tây Ban Nha)
    ];
    this.route3Curve = new THREE.CatmullRomCurve3(route3Points);
    const route3Geo = new THREE.TubeGeometry(this.route3Curve, 100, 0.0045, 8, false);
    const route3Mat = new THREE.MeshBasicMaterial({
      color: 0x9b51e0, // Tím Fluorite huyền bí
      transparent: true,
      opacity: 0.85
    });
    this.globeGroup.add(new THREE.Mesh(route3Geo, route3Mat));

    // ═══════════════════════════════════════════════════════════════
    // 4. CHẶNG 4: ĐỊA TRUNG HẢI & KÊNH SUEZ — TÂY BAN NHA ➜ ẤN ĐỘ (MATH CITY)
    // ═══════════════════════════════════════════════════════════════
    const route4Points = [
      this.latLonToVector3(40.41, -3.70, this.radius, ALT),     // Tây Ban Nha
      this.latLonToVector3(36.14, -5.35, this.radius, ALT),     // Eo biển Gibraltar
      this.latLonToVector3(37.0, 5.0, this.radius, ALT),        // Biển Tây Địa Trung Hải
      this.latLonToVector3(34.0, 18.0, this.radius, ALT),       // Giữa Địa Trung Hải
      this.latLonToVector3(31.5, 31.0, this.radius, ALT),       // Cửa Kênh Suez (Ai Cập)
      this.latLonToVector3(24.0, 37.0, this.radius, ALT),       // Biển Đỏ (Red Sea)
      this.latLonToVector3(12.6, 43.3, this.radius, ALT),       // Eo biển Bab-el-Mandeb
      this.latLonToVector3(14.0, 55.0, this.radius, ALT),       // Vịnh Aden / Biển Ả Rập
      this.latLonToVector3(19.07, 72.87, this.radius, ALT)      // Math City (Mumbai, Ấn Độ)
    ];
    this.route4Curve = new THREE.CatmullRomCurve3(route4Points);
    const route4Geo = new THREE.TubeGeometry(this.route4Curve, 110, 0.0045, 8, false);
    const route4Mat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff, // Xanh Neon Kỹ Thuật Số Toán Học
      transparent: true,
      opacity: 0.85
    });
    this.globeGroup.add(new THREE.Mesh(route4Geo, route4Mat));

    // ═══════════════════════════════════════════════════════════════
    // 5. CHẶNG 5: VỊNH BENGAL & EO MALACCA — ẤN ĐỘ ➜ INDONESIA (RUBBER CITY)
    // ═══════════════════════════════════════════════════════════════
    const route5Points = [
      this.latLonToVector3(19.07, 72.87, this.radius, ALT),     // Mumbai, Ấn Độ
      this.latLonToVector3(7.0, 79.0, this.radius, ALT),        // Vòng qua Sri Lanka
      this.latLonToVector3(6.0, 88.0, this.radius, ALT),        // Vịnh Bengal
      this.latLonToVector3(4.0, 98.0, this.radius, ALT),        // Cửa Eo biển Malacca
      this.latLonToVector3(1.3, 103.8, this.radius, ALT),       // Singapore / Malacca
      this.latLonToVector3(-0.78, 113.92, this.radius, ALT)     // Rubber City (Indonesia)
    ];
    this.route5Curve = new THREE.CatmullRomCurve3(route5Points);
    const route5Geo = new THREE.TubeGeometry(this.route5Curve, 80, 0.0045, 8, false);
    const route5Mat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, // Hổ phách cao su tự nhiên
      transparent: true,
      opacity: 0.85
    });
    this.globeGroup.add(new THREE.Mesh(route5Geo, route5Mat));

    // ═══════════════════════════════════════════════════════════════
    // 6. CHẶNG 6: BIỂN TIMOR — INDONESIA ➜ ÚC (ALUMINUM CITY)
    // ═══════════════════════════════════════════════════════════════
    const route6Points = [
      this.latLonToVector3(-0.78, 113.92, this.radius, ALT),    // Indonesia
      this.latLonToVector3(-6.0, 118.0, this.radius, ALT),      // Biển Java / Flores
      this.latLonToVector3(-10.0, 126.0, this.radius, ALT),     // Biển Timor
      this.latLonToVector3(-11.5, 134.0, this.radius, ALT),     // Vùng biển Bắc Úc
      this.latLonToVector3(-12.63, 141.88, this.radius, ALT)    // Aluminum City (Weipa, Queensland, Úc)
    ];
    this.route6Curve = new THREE.CatmullRomCurve3(route6Points);
    const route6Geo = new THREE.TubeGeometry(this.route6Curve, 70, 0.0045, 8, false);
    const route6Mat = new THREE.MeshBasicMaterial({
      color: 0x76c843, // Xanh lục quặng nhôm & uranium
      transparent: true,
      opacity: 0.85
    });
    this.globeGroup.add(new THREE.Mesh(route6Geo, route6Mat));

    // ═══════════════════════════════════════════════════════════════
    // 7. CHẶNG 7: BIỂN SAN HÔ & THÁI BÌNH DƯƠNG — ÚC ➜ HỒI HƯƠNG NHẬT BẢN
    // ═══════════════════════════════════════════════════════════════
    const route7Points = [
      this.latLonToVector3(-12.63, 141.88, this.radius, ALT),   // Weipa, Úc
      this.latLonToVector3(-5.0, 148.0, this.radius, ALT),      // Biển Bismarck / Papua
      this.latLonToVector3(7.0, 145.0, this.radius, ALT),       // Quần đảo Mariana
      this.latLonToVector3(22.0, 142.0, this.radius, ALT),      // Quần đảo Ogasawara
      this.latLonToVector3(35.68, 139.76, this.radius, ALT)     // Hồi Hương Nhật Bản (Lắp ráp Tên Lửa)
    ];
    this.route7Curve = new THREE.CatmullRomCurve3(route7Points);
    const route7Geo = new THREE.TubeGeometry(this.route7Curve, 80, 0.0045, 8, false);
    const route7Mat = new THREE.MeshBasicMaterial({
      color: 0x80d0ff, // Lam khói tên lửa vũ trụ
      transparent: true,
      opacity: 0.85
    });
    this.globeGroup.add(new THREE.Mesh(route7Geo, route7Mat));
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

  selectWaypoint(wp) {
    if (!wp) return;
    this.awardWaypointPoints(wp);

    if (wp.isMoon) {
      this.targetRotation.x = 0;
      this.targetRotation.y = 0;
      this.camera.position.z = 8.5;
    } else {
      this.focusCoordinates(wp.lat, wp.lon);
    }

    this.updateMissionTelemetryCard(wp);

    // Cập nhật trạng thái active cho các nút bấm trong UI
    document.querySelectorAll('.waypoint-btn').forEach(btn => {
      const target = btn.getAttribute('data-target') || (btn.getAttribute('href') || '').replace('#', '');
      if (target === wp.id) {
        btn.classList.add('active-waypoint', 'border-[#00d4ff]', 'bg-[#00d4ff]/25', 'text-[#00d4ff]', 'shadow-[0_0_15px_rgba(0,212,255,0.4)]');
        btn.classList.remove('border-white/10', 'bg-white/[0.04]', 'text-[#8fa0ba]');
      } else {
        btn.classList.remove('active-waypoint', 'border-[#00d4ff]', 'bg-[#00d4ff]/25', 'text-[#00d4ff]', 'shadow-[0_0_15px_rgba(0,212,255,0.4)]');
        btn.classList.add('border-white/10', 'bg-white/[0.04]', 'text-[#8fa0ba]');
      }
    });
  }

  updateMissionTelemetryCard(wp) {
    const titleEl = document.getElementById('odyssey-telemetry-title');
    const badgeEl = document.getElementById('odyssey-telemetry-badge');
    const cityEl = document.getElementById('odyssey-telemetry-city');
    const vehicleEl = document.getElementById('odyssey-telemetry-vehicle');
    const resourceEl = document.getElementById('odyssey-telemetry-resource');
    const descEl = document.getElementById('odyssey-telemetry-desc');
    const coordsEl = document.getElementById('odyssey-telemetry-coords');

    if (titleEl) titleEl.textContent = wp.name;
    if (badgeEl) badgeEl.textContent = wp.label;
    if (cityEl) cityEl.textContent = wp.city;
    if (vehicleEl) vehicleEl.textContent = wp.vehicle;
    if (resourceEl) resourceEl.textContent = wp.resource;
    if (descEl) descEl.textContent = wp.desc;
    if (coordsEl) {
      if (wp.isMoon) {
        coordsEl.textContent = 'QUỸ ĐẠO MẶT TRĂNG · VỆ TINH TỰ NHIÊN (384.400 KM)';
      } else {
        const latStr = wp.lat >= 0 ? `${wp.lat.toFixed(2)}°N` : `${Math.abs(wp.lat).toFixed(2)}°S`;
        const lonStr = wp.lon >= 0 ? `${wp.lon.toFixed(2)}°E` : `${Math.abs(wp.lon).toFixed(2)}°W`;
        coordsEl.textContent = `TỌA ĐỘ VỆ TINH: ${latStr}, ${lonStr}`;
      }
    }
  }

  bindWaypointButtons() {
    const btns = document.querySelectorAll('.waypoint-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-target') || (btn.getAttribute('href') || '').replace('#', '');
        const wp = this.waypoints.find(w => w.id === targetId);
        if (wp) {
          e.preventDefault();
          this.selectWaypoint(wp);
        }
      });
    });

    // Mặc định chọn trạm đầu tiên (Nhật Bản) hoặc giữ nguyên
    const defaultWp = this.waypoints[0];
    if (defaultWp) {
      this.updateMissionTelemetryCard(defaultWp);
    }
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

    // 🏍️ 2. XE MÁY CÀO CÀO VƯỢT ĐÈO TUYẾT DÃY ANDES (Ecuador ➜ Thượng nguồn Amazon)
    this.bikeProgress = (this.bikeProgress + 0.0035) % 1;
    if (this.bikeGroup && this.bikeCurve) {
      const bPoint = this.bikeCurve.getPointAt(this.bikeProgress);
      const bNext = this.bikeCurve.getPointAt((this.bikeProgress + 0.01) % 1);

      this.bikeGroup.position.copy(bPoint);
      const bTangent = bNext.clone().sub(bPoint).normalize();
      this.bikeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), bTangent);

      // Rung động cơ xe máy
      const engineVibe = Math.sin(now * 0.03) * 0.0015;
      this.bikeGroup.position.addScaledVector(bPoint.clone().normalize(), engineVibe);
    }

    // 🪵 3. BÈ GỖ XUÔI DÒNG SÔNG AMAZON (Thượng nguồn ➜ Manaus ➜ Araxá)
    this.raftProgress = (this.raftProgress + 0.0018) % 1;
    if (this.raftGroup && this.raftCurve) {
      const rPoint = this.raftCurve.getPointAt(this.raftProgress);
      const rNext = this.raftCurve.getPointAt((this.raftProgress + 0.008) % 1);

      this.raftGroup.position.copy(rPoint);
      const rTangent = rNext.clone().sub(rPoint).normalize();
      this.raftGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rTangent);

      // Trôi êm nhấp nhô trên dòng nước Amazon
      const riverBobbing = Math.sin(now * 0.005) * 0.003;
      this.raftGroup.position.addScaledVector(rPoint.clone().normalize(), riverBobbing);
    }

    // 🧪 4. SENKU MINI 3D THÁM HIỂM TẠI TRẠM ĐÍCH
    this.landProgress = (this.landProgress + 0.0016) % 1;
    if (this.senkuGroup) {
      if (this.route2SeaCurve) {
        // Senku chỉ huy hải trình trên đường biển bờ Tây
        const sPoint = this.route2SeaCurve.getPointAt(this.landProgress);
        this.senkuGroup.position.copy(sPoint);
        const normal = sPoint.clone().normalize();
        this.senkuGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        const stepBob = Math.abs(Math.sin(now * 0.006)) * 0.003;
        this.senkuGroup.position.addScaledVector(normal, stepBob);
      }
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
  if (!container || window.drStoneGlobe) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!window.drStoneGlobe) {
            window.drStoneGlobe = new PerseusHologramGlobe('perseus-3d-globe-wrapper');
          }
          observer.disconnect();
        }
      });
    }, { rootMargin: '300px 0px' });
    observer.observe(container);
  } else {
    window.drStoneGlobe = new PerseusHologramGlobe('perseus-3d-globe-wrapper');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDrStoneGlobe);
} else {
  initDrStoneGlobe();
}

export default PerseusHologramGlobe;
