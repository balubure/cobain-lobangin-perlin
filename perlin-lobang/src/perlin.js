/*
// Contoh implementasi sederhana Perlin Noise sederhana
export class PerlinNoise {
    static noise(x, y) {
      return Math.sin(x) * Math.cos(y); // Contoh sederhana
    }
  }
    */

  export class PerlinNoise {
    static fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10); // Fungsi fade untuk interpolasi
    }
  
    static lerp(a, b, t) {
      return a + t * (b - a); // Linear interpolation
    }
  
    static grad(hash, x, y) {
      // Ambil gradien berdasarkan hash, menghasilkan vektor arah acak
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
      return (h & 1 ? -u : u) + (h & 2 ? -v : v); // Gradien berbasis hash
    }
  
    static noise(x, y) {
        
      // Menyusun grid
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
  
      
      // Menghitung fraksi posisi
      x -= Math.floor(x);
      y -= Math.floor(y);
  
      // Fungsi fade untuk kehalusan
      const u = PerlinNoise.fade(x);
      const v = PerlinNoise.fade(y);
  
      // Peta nilai gradien untuk 4 titik di grid
      const p = PerlinNoise.p;
  
      const a = p[X] + Y;
      const b = p[X + 1] + Y;
  
      const grad1 = PerlinNoise.grad(p[a], x, y);
      const grad2 = PerlinNoise.grad(p[b], x - 1, y);
      const grad3 = PerlinNoise.grad(p[a + 1], x, y - 1);
      const grad4 = PerlinNoise.grad(p[b + 1], x - 1, y - 1);
  
      // Interpolasi untuk menghitung nilai akhir
      const lerp1 = PerlinNoise.lerp(grad1, grad2, u);
      const lerp2 = PerlinNoise.lerp(grad3, grad4, u);
      return PerlinNoise.lerp(lerp1, lerp2, v);
    }
  
    // Perlin noise permutation table
    static p = [];
    static generatePermutation() {
      for (let i = 0; i < 256; i++) {
        PerlinNoise.p[i] = i;
      }
  
      // Shuffling the permutation table
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [PerlinNoise.p[i], PerlinNoise.p[j]] = [PerlinNoise.p[j], PerlinNoise.p[i]];
      }
  
      // Duplicate the permutation table to avoid overflow
      for (let i = 0; i < 256; i++) {
        PerlinNoise.p[256 + i] = PerlinNoise.p[i];
      }
    }
  }
  
  // Generate permutation table once when PerlinNoise is used
  PerlinNoise.generatePermutation();
  
  