// Browser harnesses must use Vite's package resolution, just like src/.
// Importing /node_modules/three/build/three.module.js bypasses dependency
// optimization and creates a second Three.js instance in the same page.
export * from 'three';
