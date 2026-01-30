import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
// Removed OrbitControls import
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';
import LocomotiveScroll from 'locomotive-scroll';

const scroll = new LocomotiveScroll();

// Set up scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 3.5);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Removed Orbit Controls section

// Tone mapping
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// Effect Composer & RGB Shift Pass
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0030; // subtle RGB shift effect
composer.addPass(rgbShiftPass);

// Environment map setup using HDRI
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const rgbeLoader = new RGBELoader();
let model;
rgbeLoader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr',
  (hdrEquirect) => {
    const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
    scene.environment = envMap;
    hdrEquirect.dispose();
    pmremGenerator.dispose();

    // Basic ambient light for glTF model
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    // Load 3D model (DamagedHelmet.gltf)
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      './public/DamagedHelmet.gltf',
      (gltf) => {
        model = gltf.scene
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);
      },
      undefined,
      (error) => {
        console.error('Failed to load glTF model:', error);
      }
    );
  }
);

window.addEventListener("mousemove", (e) => {
  if(model) {
    const rotationX = (e.clientX/window.innerWidth - .5) * (Math.PI * .3);
    const rotationY = (e.clientY/window.innerHeight - .5) * (Math.PI * .3);
    gsap.to(model.rotation, {
      y: rotationX,
      x: rotationY,
      duration: 0.9,
      ease: "power2.out"
    });
  }
})

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
})

// Animation loop with postprocessing
function animate() {
  requestAnimationFrame(animate);
  // Removed controls.update();
  composer.render();
}
animate();

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});