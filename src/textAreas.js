import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

//Called from main to load all the constellation models
export function createTextAreas(scene, camera, renderer) {
  
  const loader = new GLTFLoader();
  const clickable = [];

  // Path - All models can be found in /public/constellationModels
  // Position - Three categories: in front, in line, behind
  // Scale - All are scale 2 except title and asu logo
  // userData - This is id header for each html page in index.html, used for 
  //            when we make thing clickable. ASU and Credits lead to links, hence the difference in userData
  // rotationX - I made these models in blender, so all glb models have to be rotated by Math.PI / 2
  // useLookAt - all models point towards (0, 0, 0) ~ Camera .
  function loadLabel(path, position, scale, userData, rotationX = Math.PI / 2, useLookAt = true) {
    loader.load(path, (gltf) => {
      const model = gltf.scene;
      model.rotation.x = rotationX;
      model.scale.setScalar(scale);
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 3,
            fog: false
          });
        }
      });
      const pivot = new THREE.Group();
      pivot.position.set(...position);
      pivot.add(model);
      if (useLookAt) pivot.lookAt(0, 0, 0);
      Object.assign(pivot.userData, userData);
      scene.add(pivot);
      if (Object.keys(userData).length > 0) clickable.push(pivot);
    });
  }

  loadLabel('/constellationModels/aboutMeModel.glb',      [25, 12.5, 15],   3, { modalId: 'about-me-modal' });
  loadLabel('/constellationModels/thisSiteModel.glb',     [-25, 12.5, 15],  3, { modalId: 'this-site-modal' });

  loadLabel('/constellationModels/asuModel.glb',          [-25, 10, 0],   3, { type: 'link', url: 'https://app.joinhandshake.com/profiles/xzw9dx' });
  loadLabel('/constellationModels/snakeModel.glb',        [25, 10, 0],    3, { modalId: 'snake-modal' });

  loadLabel('/constellationModels/calculatorModel.glb',   [-25, 12.5, -15], 3, { modalId: 'calculator-modal' });
  loadLabel('/constellationModels/airFreshenerModel.glb', [25, 12.5, -15],  3, { modalId: 'air-freshener-modal' });
  
  loadLabel('/constellationModels/creditsModel.glb',      [0, 10, -20],    3, { modalId: 'credits-modal' });
  loadLabel('/constellationModels/titleModel.glb',        [0, 12.5, 25],    4, {});

  //Close button handler for all modals
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      overlay.classList.remove('visible');
      setTimeout(() => { overlay.style.display = 'none'; }, 500);
    });
  });

  // Raycaster for hover and click
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('mousemove', (e) => {
    //Converts pixel ratios to device coordinates 
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Every time the user moves the mouse we fire a ray from 
    // the camera to the mouse, and check if we hit anyting clickable.
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickable, true);
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  });

  window.addEventListener('click', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    //Again, we fire an array
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickable, true);

    //.glb models are made up of many child meshes; however,
    // our actual html data (userData) is hooked on the parent pivot.
    // So we have to walk up the obj's hierarchy to reach the parent 
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData.modalId && !obj.userData.type) {
        obj = obj.parent;
      }

      //This means the user clicked on ASU or Credits
      if (obj.userData.type === 'link') {
        window.open(obj.userData.url, '_blank');
      } 
      //All other models: aboutMe, snake, airFreshener, calculator, thisSite.
      else if (obj.userData.modalId) {
        const overlay = document.getElementById(obj.userData.modalId);
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { overlay.classList.add('visible'); });
        });
      }
    }
  });
}