import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//This is the starfield for the scene within the HTML pages.
function getStarfield({ numStars = 500 } = {}) {

  function randomSpherePoint() {
    const radius = Math.random() * 25 + 25;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }

  const verts = [];
  const colors = [];
  for (let i = 0; i < numStars; i++) {
    const pos = randomSpherePoint();
    const col = new THREE.Color().setHSL(0.6, 0.2, Math.random());
    verts.push(pos.x, pos.y, pos.z);
    colors.push(col.r, col.g, col.b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Points(geo, mat);
}


//canvasId, overlayId are the html headers for each section
function initScene(canvasId, overlayId, hasScroll = false, setup = null) {
  const canvas = document.getElementById(canvasId);
  const modalOverlay = document.getElementById(overlayId);
  if (!canvas || !modalOverlay) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 5;

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  scene.add(hemiLight);

  const stars = getStarfield({ numStars: 4500 });
  scene.add(stars);

  let scrollPosY = 0;
  const rate = 0.1;

  // onScroll and onAnimate hooks — setup() can override these
  let onScroll = null;
  let onAnimate = null;

  // Run custom setup if provided, passing scene/camera and hook setters
  if (setup) {
    setup(scene, camera, (scrollCb) => { onScroll = scrollCb; }, (animCb) => { onAnimate = animCb; });
  }

  if (hasScroll) {
    const scrollContainer = modalOverlay.querySelector('.modal-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', () => {
        scrollPosY = scrollContainer.scrollTop / scrollContainer.scrollHeight;
        if (onScroll) onScroll(scrollPosY);
      });
    }
  }

  let animating = false;
  let animFrameId;
  let initialized = false;

  function initSize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    initialized = true;
  }

  function animate() {
    if (!animating) return;
    animFrameId = requestAnimationFrame(animate);
    const goalPos = Math.PI * scrollPosY;
    stars.position.z -= (stars.position.z - goalPos * 8) * rate;
    if (onAnimate) onAnimate();
    renderer.render(scene, camera);
  }

  const observer = new MutationObserver(() => {
    if (modalOverlay.classList.contains('visible')) {
      if (!initialized) initSize();
      animating = true;
      animate();
    } else {
      animating = false;
      cancelAnimationFrame(animFrameId);
    }
  });

  observer.observe(modalOverlay, { attributes: true, attributeFilter: ['class'] });
}


export function initModalScenes() {
  initScene('about-me-canvas',      'about-me-modal',       true);
  initScene('snake-canvas',         'snake-modal',          true);
  initScene('calculator-canvas',    'calculator-modal',     true);
  initScene('this-site-canvas',     'this-site-modal',      true);


  initScene('air-freshener-canvas', 'air-freshener-modal',  true, (scene, camera, setOnScroll, setOnAnimate) => {
    camera.position.z = 8;

    const loader = new GLTFLoader();
    let model = null;
    let targetRotationY = 0;
    let currentRotationY = 0;

    loader.load('/airFreshenerPage/airFreshener.glb', (gltf) => {
      model = gltf.scene;
      //model.rotation.x = Math.PI / 2;
      model.scale.set(50, 50, 50);
      scene.add(model);
    });

    // On scroll: update target rotation
    setOnScroll((scrollPosY) => {
      targetRotationY = scrollPosY * Math.PI * 4; // full spins as you scroll
    });

    // On animate: smoothly lerp rotation toward target
    setOnAnimate(() => {
      if (!model) return;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;
      model.rotation.y = currentRotationY;
    });
  });
}
