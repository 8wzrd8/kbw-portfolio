import * as THREE from 'three';

export function addStars(scene) {
  // Geometry to store positions, colors, etc.
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 8000;

  
  // Normal JS Array: [[x0,y0,z0], [x1,y1,z1] ... , [x7999, y7999, z7999]]
  // Float32Array: [x0, y0, z0, x1, y1, z1, x2, y2, z2, ... x7999, y7999, z7999]
  // No objects, just raw memory that goes to the GPU
  const positions = new Float32Array(starCount * 3);

  // Bubble around the camerato prevent star spawns
  const minDistance = 20;

  let i = 0;
  //Each star takes up three spots in the Float32Array
  while (i < starCount * 3) {
    //We are making a 300x300x300 cube
    //We give each star a random x, y, z within that area
    const x = (Math.random() - 0.5) * 300;
    const y = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;

    // Pythagorean theorem in 3D distance from the origin
    const distance = Math.sqrt(x * x + y * y + z * z);

    // Only accept this star if it's far enough away from the center
    if (distance > minDistance) {
      positions[i]     = x;
      positions[i + 1] = y;
      positions[i + 2] = z;
      i += 3;
    }
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Renders each vertex as a dot
  // Stars farther away appear smaller
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, sizeAttenuation: true });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

export function addShootingStars(scene) {
  //All active shooting stars
  //Seek the definition below for more info
  const shootingStars = [];

  function spawnShootingStar() {

    // Geometry to store positions, colors, etc.
    const geometry = new THREE.BufferGeometry();

    // Random X, Y, Z positions
    const startX = (Math.random() - 0.5) * 200;
    const startY = 20 + Math.random() * 50;
    const startZ = (Math.random() - 0.5) * 200;

    // Trail made of points
    // When we spawn a star, all points are stacked
    // They only get spread out once, updateShootingStars() is called
    const trailLength = 20;
    const positions = new Float32Array(trailLength * 3);
    for (let i = 0; i < trailLength; i++) {
      positions[i * 3]     = startX;
      positions[i * 3 + 1] = startY;
      positions[i * 3 + 2] = startZ;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      sizeAttenuation: true,
      fog: false
    });

    const star = new THREE.Points(geometry, material);
    scene.add(star);

    //===================================================
    //  This is the structure needed for a star:
    //  Mesh - The new THREE.Points(geometry, material);
    //  X, Y, Z - Where it is in the sky
    //  VX, VZ - The diagonal the star travels to
    //  VY - The negative distance it must go down
    //  Life - Opacity, as life goes on opacity fades
    //===================================================

    shootingStars.push({
      mesh: star,
      x: startX,
      y: startY,
      z: startZ,
      // Random diagonal direction
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(0.3 + Math.random() * 0.4),
      vz: (Math.random() - 0.5) * 0.5,
      life: 1.0,  
      trailLength
    });
  }

  // This is the function called in the animate() loop
  // Every frame we attempt to spawn a shooting star
  function updateShootingStars() {

    // 0.5% chance for a new star every frame
    if (Math.random() < 0.005) spawnShootingStar();


    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];

      //Changes its x postion on the diagonal (left and right)
      s.x += s.vx;
      //Changes its z postion on the diagonal (back and forth)
      s.z += s.vz;
      //Changes its y postion on the diagonal (down, alaways negative
      s.y += s.vy;

      //Every frame we dim the opacity by 0.02
      s.life -= 0.02;

      // This is actually quite similiar to the approach I took for the snake in my snake game!
      // Think of it like this:
      // Before the shift we have: [5,10,3,  4,10,3,  3,10,3,  2,10,3 ...]
      // We then want to move froward so we shift everything the array by 1
      // After the shift we have: [5,10,3,  5,10,3,  4,10,3,  3,10,3, ...]
      // We then add the new point: [6,10,3,  5,10,3,  4,10,3,  3,10,3, ...]
      //The only difference is we are dealing with three values for each segmant rather than one.

      const positions = s.mesh.geometry.attributes.position.array;
      for (let j = (s.trailLength - 1) * 3; j >= 3; j -= 3) {
        positions[j]     = positions[j - 3];
        positions[j + 1] = positions[j - 2];
        positions[j + 2] = positions[j - 1];
      }
      positions[0] = s.x;
      positions[1] = s.y;
      positions[2] = s.z;
      s.mesh.geometry.attributes.position.needsUpdate = true;

      //Opacity
      s.mesh.material.opacity = s.life;
      s.mesh.material.transparent = true;

      // When the star's opacity is 0, it is nor longer visiable (dead)
      // We remove it from the array
      if (s.life <= 0 || s.y < -20) {
        scene.remove(s.mesh);
        shootingStars.splice(i, 1);
      }
    }
  }

  return updateShootingStars;
}


