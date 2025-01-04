import * as THREE from 'three'; // Mengimpor Three.js
import { PerlinNoise } from './perlin.js'; // Jika menggunakan Perlin Noise eksternal
import { OrbitControls } from 'three-stdlib'; // Mengimpor OrbitControls

// Setup scene, camera, and renderer
const canvas = document.getElementById("three-canvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Tambahkan OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Untuk gerakan lebih halus
controls.dampingFactor = 0.1; // Faktor peredaman

// Create Grid Geometry
const size = 100;
const segments = 100;
const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

/*
const material = new THREE.MeshStandardMaterial({
  color: 0x88cc88,
  wireframe: false, // Nonaktifkan wireframe
  side: THREE.DoubleSide,
});
*/

// Shader Material untuk memberikan warna berbeda berdasarkan normal
const vertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vNormal = normalize(normalMatrix * normal); // Normal untuk fragment shader
    vPosition = position; // Kirim posisi ke fragment shader
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}


`;

const fragmentShader = `
varying vec3 vPosition;

void main() {
    // Warna pada berbagai ketinggian
    vec3 lowColor = vec3(0.0, 0.3, 0.0); // Hijau tua
    vec3 midLowColor = vec3(0.5, 0.8, 0.2); // Hijau muda
    vec3 midColor = vec3(1.0, 1.0, 0.0); // Kuning
    vec3 midHighColor = vec3(0.5, 0.8, 1.0); // Biru muda
    vec3 highColor = vec3(0.0, 0.0, 0.5); // Biru tua

    // Normalisasi posisi Y (misalnya dari -50 ke 50 menjadi 0 ke 1)
    float heightFactor = clamp((vPosition.z - (-3.0)) / 5.0, 0.0, 1.0);

    // Interpolasi warna berdasarkan ketinggian
    vec3 finalColor;
    if (heightFactor < 0.25) {
        finalColor = mix(lowColor, midLowColor, heightFactor / 0.25); // Hijau tua → Hijau muda
    } else if (heightFactor < 0.5) {
        finalColor = mix(midLowColor, midColor, (heightFactor - 0.25) / 0.25); // Hijau muda → Kuning
    } else if (heightFactor < 0.75) {
        finalColor = mix(midColor, midHighColor, (heightFactor - 0.5) / 0.25); // Kuning → Biru muda
    } else {
        finalColor = mix(midHighColor, highColor, (heightFactor - 0.75) / 0.25); // Biru muda → Biru tua
    }

    gl_FragColor = vec4(finalColor, 1.0);
}



`;

// Gunakan ShaderMaterial
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide, // Render kedua sisi
});


const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -Math.PI / 2; // Rotate to lay flat
scene.add(plane);

/*
Jika ingin menambahkan wireframe overlay, aktifkan kode ini:
const wireframe = new THREE.WireframeGeometry(geometry);
const wireframeMesh = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x000000 }));
scene.add(wireframeMesh);
*/

// Generate Perlin Noise Heightmap
for (let i = 0; i < geometry.attributes.position.count; i++) {
  const x = geometry.attributes.position.getX(i);
  const y = geometry.attributes.position.getY(i);
  const z = PerlinNoise.noise(x * 0.1, y * 0.1) * 5; // Adjust scale and height
  geometry.attributes.position.setZ(i, z);
}
geometry.attributes.position.needsUpdate = true;

// Add Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// Tambahkan DirectionalLight dari sisi kanan
const rightLight = new THREE.DirectionalLight(0xffffff, 0.8); // Cahaya putih dengan intensitas 0.8
rightLight.position.set(-20, 10, 0); // Posisi di kanan atas
rightLight.castShadow = true; // Aktifkan bayangan
scene.add(rightLight);

// Aktifkan shadow map pada renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Bayangan lembut

// Tambahkan shadow pada mesh
plane.receiveShadow = true;



// Tambahkan juga cahaya utama dari atas jika belum ada
const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(0, 20, 10);
mainLight.castShadow = true;
scene.add(mainLight);


// Add Camera
camera.position.set(0, 20, 50);
camera.lookAt(0, 0, 0);

// Raycaster for Interactivity
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(plane);

  if (intersects.length > 0) {
    const faceIndex = intersects[0].faceIndex; // Get the face index
    removeFace(faceIndex); // Remove the face
  }
});

/*

// Remove Face Function
function removeFace(faceIndex) {
  const index = geometry.index.array;
  index[faceIndex * 3] = -1; // Invalidate triangle vertices
  index[faceIndex * 3 + 1] = -1;
  index[faceIndex * 3 + 2] = -1;
  geometry.index.needsUpdate = true;
}

*/

// Remove Face Function (diperbarui untuk menghapus pasangan segitiga dalam satu grid)
function removeFace(faceIndex) {
  const index = geometry.index.array;
  
  // Hitung pasangan segitiga dalam grid
  const triangle1 = Math.floor(faceIndex / 2) * 2; // Indeks segitiga pertama dalam grid
  const triangle2 = triangle1 + 1; // Indeks segitiga kedua dalam grid

  // Invalidasi kedua segitiga dalam grid
  for (let i = 0; i < 3; i++) {
    index[triangle1 * 3 + i] = -1; // Segitiga pertama
    index[triangle2 * 3 + i] = -1; // Segitiga kedua
  }

  geometry.index.needsUpdate = true;
}


// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update OrbitControls
  renderer.render(scene, camera);
}
animate();
