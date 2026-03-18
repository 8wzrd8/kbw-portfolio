import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//this code is almost exactly as addStars() within star.js
//stars can generate below y=0 and parallax is needed for the scroll
function getStarfield({ numStars = 4500 } = {}) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(numStars * 3);
  const colors = new Float32Array(numStars * 3);

  const minDistance = 20;
  let i = 0;

  while (i < numStars * 3) {
    const x = (Math.random() - 0.5) * 300;
    const y = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;

    const distance = Math.sqrt(x * x + y * y + z * z);

    if (distance > minDistance) {
      positions[i]     = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      const col = new THREE.Color().setHSL(0.6, 0.2, Math.random());
      colors[i]     = col.r;
      colors[i + 1] = col.g;
      colors[i + 2] = col.b;

      i += 3;
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false
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

//called from main.js
export function initModalScenes() {
  //these are the only ones that are clickable AND open a page WITHIN the site
  initScene('about-me-canvas',      'about-me-modal',       true);
  initScene('snake-canvas',         'snake-modal',          true);
  initScene('calculator-canvas',    'calculator-modal',     true);
  initScene('this-site-canvas',     'this-site-modal',      true);

  //same as above; however, it has an animation of the air freshener
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

    // on scroll: update target rotation
    setOnScroll((scrollPosY) => {
      targetRotationY = scrollPosY * Math.PI * 4; // full spins as you scroll
    });

    // on animate: smoothly lerp rotation toward target
    setOnAnimate(() => {
      if (!model) return;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;
      model.rotation.y = currentRotationY;
    });
  });
}
