import './style.css';
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { addStars, addShootingStars } from './stars.js';
import { initModalScenes } from './modalScenes.js';
import { createTextAreas, initCarousels, createInlineCarousel } from './textAreas.js';

const thisSiteCarousel1 = createInlineCarousel([
  '/thisSitePage/threejs.jpg',
  '/thisSitePage/modelShowcase.jpg',
  '/thisSitePage/serverSide.jpg',
]);

document.getElementById('this-site-carousel-slot-1').appendChild(thisSiteCarousel1);

const thisSiteCarousel2 = createInlineCarousel([
  '/thisSitePage/code.mp4',
  '/thisSitePage/constellationPreview.jpg',
  '/thisSitePage/gitPreview.jpg',
]);

document.getElementById('this-site-carousel-slot-2').appendChild(thisSiteCarousel2);

const thisSiteCarousel3 = createInlineCarousel([
  '/thisSitePage/topDown.jpg',
  '/thisSitePage/serverSide.jpg',
]);

document.getElementById('this-site-carousel-slot-3').appendChild(thisSiteCarousel3);




const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');

setTimeout(() => {
  loadingBar.style.width = '100%';
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 500);
}, 1000);

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.FogExp2(0x000000, 0.01);


const sky = new Sky();
sky.scale.setScalar(1000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 0.1;
skyUniforms['rayleigh'].value = 4;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

// Sun position (set low for sunset/sunrise look)
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(85); // near horizon
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sun);

// Remove flat background since sky replaces it
scene.background = null;

//Starfield & Shooting Stars (See stars.js for more info, and the animate() at the bottom of main.js)
addStars(scene);
const updateShootingStars = addShootingStars(scene);


// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);
camera.layers.enable(1);


// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Constellations Text Areas (See textAreas.js for more info)
createTextAreas(scene, camera, renderer);
initModalScenes();
if (window.innerWidth <= 768) {
  initCarousels();
}



// Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: new THREE.TextureLoader().load(
    'https://threejs.org/examples/textures/waternormals.jpg',
    (texture) => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }
  ),
  sunDirection: sun.clone().normalize(),
  sunColor: 0xff3c00,
  waterColor: 0x001e0f,
  distortionScale: 2.5, 
})
water.rotation.x = -Math.PI / 2;
water.position.y = 0;
water.receiveShadow = false;
scene.add(water);




//Wave sounds
const audio = new Audio('/soundEffects/waves.mp3');
audio.loop = true;
audio.volume = 0.1; // adjust to taste


// For thoose who are actually reading my code and 
// want some explanation as to how this first person camera works:
// 1. Mouse events -> update targets 
// 2. animate() loop -> nudge toward targets (yaw & pitch assignments in the loop)
// 3. animate() loop -> assign camera (camera.rotation.y = yaw; camera.rotation.x = pitch;)

//======================================
//---------------STEP 1-----------------
//======================================

// POV Setup
let isDragging = false;
//Used to store the last frame's mouseX & mouseY positions
let prevMouseX = 0;
let prevMouseY = 0;
//Yaw: Horizontal Rotation 
let yaw = 0;
//Yaw: Vertical Rotation 
let pitch = 0;
//Target Yaw & Pitch represent the rotational angle we want to be at.
//If we don't set this to Math.PI, we start facing the credits, rather than the title like we want.
let targetYaw = Math.PI;
let targetPitch = 0;

//FOR DESKTOP DEVICES

//When the user clicks down set draggin to true (this stops when unclicked, see mouseup() below)
//prevX and prevY are the 2D cords where the user first clicked
renderer.domElement.addEventListener('mousedown', (e) => {
  if (audio.paused) audio.play(); // only play if not already playing
  isDragging = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});


window.addEventListener('mousemove', (e) => {
  //If they never clicked down we dont care, so we return
  if (!isDragging) return;


  //Delta (𐤃) represents change.
  //We get the change in X by subtracting the current e.clientX by the previous prevMouseX.
  //We get the change in Y by subtracting the current e.clientY pos by the previous prevMouseY.
  const deltaX = e.clientX - prevMouseX;
  const deltaY = e.clientY - prevMouseY;

  //On its own, we would normally do targetYaw += deltaX; & targetPitch += deltaY;
  //However, the 0.03 dampens the mosue movement and makes it feel smoother.
  targetYaw   += deltaX * 0.003;
  targetPitch += deltaY * 0.003;

  //We dont want the user to look all the way down, so we limit there viewing area with this.
  //This limits there vertical rotation to between -0.5 radians and Math.pi / 2
  targetPitch = Math.max(-0.5, Math.min(Math.PI / 2, targetPitch));

  //Now the previous X & Y are where we stopped
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});

//They are done moving the camera
window.addEventListener('mouseup', () => isDragging = false);

//FOR MOBILE DEVICES

renderer.domElement.addEventListener('touchstart', (e) => {
  if (audio.paused) audio.play(); // only play if not already playing
  isDragging = true;
  prevMouseX = e.touches[0].clientX;
  prevMouseY = e.touches[0].clientY;
});

window.addEventListener('touchmove', (e) => {
  //If they never clicked down we dont care, so we return
  if (!isDragging) return;

  //Delta (𐤃) represents change.
  //We get the change in X by subtracting the current e.clientX by the previous prevMouseX.
  //We get the change in Y by subtracting the current e.clientY pos by the previous prevMouseY.
  const deltaX = e.touches[0].clientX - prevMouseX;
  const deltaY = e.touches[0].clientY - prevMouseY;

  //On its own, we would normally do targetYaw += deltaX; & targetPitch += deltaY;
  //However, the 0.03 dampens the mosue movement and makes it feel smoother.
  targetYaw   += deltaX * 0.003;
  targetPitch += deltaY * 0.003;

  //We dont want the user to look all the way down, so we limit there viewing area with this.
  //This limits there vertical rotation to between -0.5 radians and Math.pi / 2
  targetPitch = Math.max(-0.5, Math.min(Math.PI / 2, targetPitch));

  //Now the previous X & Y are where we stopped
  prevMouseX = e.touches[0].clientX;
  prevMouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => isDragging = false);


// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 100);
});

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  //How many seconds have passed since the last frame
  const delta = clock.getDelta();
  elapsed += delta;

  //The ocean animation needs this to forward the animation by delta time
  water.material.uniforms['time'].value += delta * 0.25; 


  //Slowly moves the camera up and down 
  camera.position.y = 10 + Math.sin(elapsed * 0.8) * 0.125;
  camera.rotation.z = Math.sin(elapsed * 0.8) * 0.0225; 

  //Moves yaw & pitch 8% closer to the targetYaw every frame
  yaw   = THREE.MathUtils.lerp(yaw, targetYaw, 0.08);
  pitch = THREE.MathUtils.lerp(pitch, targetPitch, 0.08);

  camera.rotation.order = 'YXZ';
  //Update the camera with all the values we calculated
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  
  //See stars.js for details
  updateShootingStars();
  //Update the scene
  renderer.render(scene, camera);
}

//Loop
animate();