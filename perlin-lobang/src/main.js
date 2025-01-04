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
const material = new THREE.MeshStandardMaterial({
  color: 0x88cc88,
  wireframe: false, // Nonaktifkan wireframe
  side: THREE.DoubleSide,
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
