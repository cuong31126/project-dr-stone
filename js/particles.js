// js/particles.js — Three.js particle background + Senku GLB model
// ES Module — sử dụng importmap khai báo trong index.html

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/* ──────────────────────────────────────────
   INIT
   ────────────────────────────────────────── */
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const bg = new DrStoneScene(canvas);
  // Kiểm tra senku.glb — load nếu tồn tại
  fetch('assets/models/senku.glb', { method: 'HEAD' })
    .then(r => { if (r.ok) bg.loadModel('assets/models/senku.glb'); })
    .catch(() => bg.createGeometricPlaceholder());
}

/* ──────────────────────────────────────────
   SCENE CLASS
   ────────────────────────────────────────── */
function DrStoneScene(canvas) {
  const scene    = new THREE.Scene();
  const clock    = new THREE.Clock();
  const mouse    = new THREE.Vector2(0, 0);
  let   model    = null;
  let   scrollY  = 0;

  /* Renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping      = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  /* Camera */
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 6);

  /* Lights */
  const ambient = new THREE.AmbientLight(0x00d4ff, 0.6);
  const point1  = new THREE.PointLight(0x00d4ff, 3, 30);
  const point2  = new THREE.PointLight(0x39ff14, 2, 30);
  const point3  = new THREE.PointLight(0xffffff, 1, 15);
  point1.position.set( 5,  5,  4);
  point2.position.set(-5, -3,  3);
  point3.position.set( 0,  3,  2);
  scene.add(ambient, point1, point2, point3);

  /* ── Particles ── */
  const COUNT = window.innerWidth < 768 ? 2000 : 4000;
  const positions  = new Float32Array(COUNT * 3);
  const colors     = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  const sizes      = new Float32Array(COUNT);

  const palette = [
    new THREE.Color(0x00d4ff),  // cyan
    new THREE.Color(0x39ff14),  // neon green
    new THREE.Color(0x8b7355),  // stone
    new THREE.Color(0x4a6080),  // slate
    new THREE.Color(0xffffff),  // white
  ];

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const r  = Math.random() * 18 + 3;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    positions[i3]     = r * Math.sin(ph) * Math.cos(th);
    positions[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
    positions[i3 + 2] = r * Math.cos(ph);

    velocities[i3]     = (Math.random() - 0.5) * 0.003;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.0015;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.0025;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i3]     = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
    sizes[i]        = Math.random() * 2.5 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  /* ── Interactive Dynamic Lines (Molecular Constellation) ── */
  const MAX_LINES = 600;
  const linePositions = new Float32Array(MAX_LINES * 2 * 3);
  const lineColors    = new Float32Array(MAX_LINES * 2 * 3);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const constellationLines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(constellationLines);

  /* ── Mouse Unproject & Glow Light ── */
  const raycaster = new THREE.Raycaster();
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouseWorld = new THREE.Vector3(999, 999, 0); // Vị trí 3D của chuột

  const mouseLight = new THREE.PointLight(0x00d4ff, 3.5, 5);
  scene.add(mouseLight);

  /* ── Events ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;

    // Unproject to 3D world space at z = 0
    raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
    raycaster.ray.intersectPlane(planeZ, mouseWorld);
  });

  window.addEventListener('mouseleave', () => {
    mouseWorld.set(999, 999, 0);
  });

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ── Animate loop ── */
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Cập nhật vị trí nguồn sáng chuột nhẹ nhàng
    if (mouseWorld.x < 100) {
      mouseLight.position.set(mouseWorld.x, mouseWorld.y, 0.5);
    }

    // Move particles & find the top 4-5 CLOSEST particles to cursor in 3D
    const MAX_CONNECTED = 5;
    const MOUSE_RADIUS = 1.6;
    let closestList = [];

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Di chuyển tự do
      positions[i3]     += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      // Boundary wrap
      const B = 20;
      if (Math.abs(positions[i3])     > B) positions[i3]     *= -0.92;
      if (Math.abs(positions[i3 + 1]) > B) positions[i3 + 1] *= -0.92;
      if (Math.abs(positions[i3 + 2]) > B) positions[i3 + 2] *= -0.92;

      // Tính khoảng cách 3D thực tế tới chuột (chỉ xét hạt ở lớp gần z=0)
      if (mouseWorld.x < 100 && Math.abs(positions[i3 + 2]) < 2.0) {
        const dx = mouseWorld.x - positions[i3];
        const dy = mouseWorld.y - positions[i3 + 1];
        const dz = 0 - positions[i3 + 2];
        const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist3D < MOUSE_RADIUS) {
          // Hút cực nhẹ
          positions[i3]     += dx * 0.008;
          positions[i3 + 1] += dy * 0.008;

          closestList.push({
            x: positions[i3],
            y: positions[i3 + 1],
            z: positions[i3 + 2],
            d: dist3D
          });
        }
      }
    }
    geo.attributes.position.needsUpdate = true;

    // ── Chỉ vẽ đúng 4 - 5 tia thanh mảnh nối về hạt gần chuột nhất ──
    let lineIdx = 0;

    if (mouseWorld.x < 100 && closestList.length > 0) {
      // Sắp xếp hạt theo khoảng cách từ gần đến xa
      closestList.sort((a, b) => a.d - b.d);
      const chosen = closestList.slice(0, MAX_CONNECTED);

      for (let k = 0; k < chosen.length; k++) {
        const p = chosen[k];
        const alpha = Math.max(0, (1 - p.d / MOUSE_RADIUS) * 0.55); // Tia mờ nhẹ tinh tế

        const vIdx = lineIdx * 6;
        // Điểm 1: Vị trí hạt
        linePositions[vIdx]     = p.x;
        linePositions[vIdx + 1] = p.y;
        linePositions[vIdx + 2] = p.z;

        // Điểm 2: Vị trí con trỏ chuột
        linePositions[vIdx + 3] = mouseWorld.x;
        linePositions[vIdx + 4] = mouseWorld.y;
        linePositions[vIdx + 5] = 0;

        // Màu gradient sợi chỉ ánh sáng (Cyan thanh thoát)
        lineColors[vIdx]     = 0.0;
        lineColors[vIdx + 1] = 0.8 * alpha;
        lineColors[vIdx + 2] = 1.0 * alpha;

        lineColors[vIdx + 3] = 0.0;
        lineColors[vIdx + 4] = 0.9 * alpha;
        lineColors[vIdx + 5] = 0.7 * alpha;

        lineIdx++;
      }
    }

    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate    = true;
    lineGeo.setDrawRange(0, lineIdx * 2);

    // Rotate system
    particles.rotation.y = t * 0.035;
    particles.rotation.x = Math.sin(t * 0.018) * 0.08;

    // Camera parallax
    camera.position.x += (mouse.x * 0.25 - camera.position.x) * 0.04;
    camera.position.y += (mouse.y * 0.18 - camera.position.y) * 0.04;
    camera.position.z  = 6 + scrollY * 0.002;
    camera.lookAt(0, 0, 0);

    // Model animation
    if (model) {
      model.rotation.y = t * 0.4 + mouse.x * 0.2;
      model.position.y = -0.8 + Math.sin(t * 0.9) * 0.15;
    }

    renderer.render(scene, camera);
  })();

  /* ── Public: loadModel ── */
  this.loadModel = function(path) {
    const loader = new GLTFLoader();

    // Optional: Draco decompression
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);

    loader.load(
      path,
      (gltf) => {
        model = gltf.scene;

        // Normalize scale — scale up for prominent presentation
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = 3.8 / maxDim; // Tang kich thuoc model Senku
        model.scale.setScalar(scale);

        // Center and position to the right side of hero text
        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(
          2.3 - center.x * scale,   // Dat lech phai dep mat
          -0.6 - center.y * scale,  // Ha thap vua tam man hinh
          0   - center.z * scale
        );

        // Apply toon shader to all meshes
        model.traverse(child => {
          if (!child.isMesh) return;
          const originalColor = child.material?.color?.clone() || new THREE.Color(0xffffff);
          const originalMap   = child.material?.map || null;
          child.material = new THREE.MeshToonMaterial({
            color: originalColor,
            map:   originalMap,
            gradientMap: createToonGradient(),
          });
          child.castShadow    = true;
          child.receiveShadow = false;
        });

        scene.add(model);
        console.log('✅ Senku model loaded!');
      },
      (xhr) => {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(`Loading Senku: ${pct}%`);
      },
      (err) => {
        console.warn('Model load error, using placeholder:', err);
        this.createGeometricPlaceholder();
      }
    );
  };

  /* ── Public: placeholder ── */
  this.createGeometricPlaceholder = function() {
    const group = new THREE.Group();

    // Main icosahedron (sci-fi crystal)
    const geo1 = new THREE.IcosahedronGeometry(1.0, 1);
    const mat1 = new THREE.MeshPhongMaterial({
      color: 0x00d4ff, emissive: 0x002244,
      wireframe: false, transparent: true, opacity: 0.5,
      shininess: 80,
    });
    const mesh1 = new THREE.Mesh(geo1, mat1);
    group.add(mesh1);

    // Wireframe overlay
    const geo2 = new THREE.IcosahedronGeometry(1.02, 1);
    const mat2 = new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true, transparent: true, opacity: 0.6 });
    group.add(new THREE.Mesh(geo2, mat2));

    // Outer ring
    const geo3 = new THREE.TorusGeometry(1.5, 0.02, 8, 60);
    const mat3 = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(geo3, mat3);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    group.position.set(2.5, 0, 0);
    model = group;
    scene.add(group);
  };

  return this;
}

/* ──────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────── */


function createToonGradient() {
  const format  = THREE.LuminanceFormat;
  const data    = new Uint8Array([0, 128, 200, 255]);
  const texture = new THREE.DataTexture(data, 4, 1, format);
  texture.needsUpdate = true;
  return texture;
}
