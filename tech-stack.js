// Using global THREE and CANNON from CDN scripts
// Check if section exists
const container = document.getElementById('tech-stack-3d');
const canvas = document.getElementById('tech-stack-canvas');

if (container && canvas) {
  initTechStack();
}

function initTechStack() {
  // ==========================================
  // 1. THREE.JS SETUP
  // ==========================================
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ==========================================
  // 2. LIGHTING (HDR cinematic feel)
  // ==========================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.5); // Cyan accent
  dirLight2.position.set(-15, -10, 15);
  scene.add(dirLight2);

  const dirLight3 = new THREE.DirectionalLight(0xec4899, 1.5); // Pink accent
  dirLight3.position.set(15, -10, -15);
  scene.add(dirLight3);

  // ==========================================
  // 3. CANNON-ES PHYSICS SETUP
  // ==========================================
  const world = new CANNON.World();
  world.gravity.set(0, 0, 0); // Zero gravity
  world.broadphase = new CANNON.SAPBroadphase(world);

  // Custom contact material for soft collisions
  const defaultMaterial = new CANNON.Material('default');
  const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.1,
    restitution: 0.8, // Bouncy
  });
  world.addContactMaterial(defaultContactMaterial);

  // ==========================================
  // 4. SPHERES CREATION
  // ==========================================
  const spheres = [];
  const sphereCount = 35;
  
  // Tech stack logos from Devicon
  const techStack = [
    'javascript/javascript-original.svg',
    'typescript/typescript-original.svg',
    'react/react-original.svg',
    'nextjs/nextjs-original.svg',
    'nodejs/nodejs-original.svg',
    'express/express-original.svg',
    'mongodb/mongodb-original.svg',
    'postgresql/postgresql-original.svg',
    'tailwindcss/tailwindcss-original.svg',
    'python/python-original.svg',
    'docker/docker-original.svg',
    'git/git-original.svg',
    'amazonwebservices/amazonwebservices-original-wordmark.svg',
    'firebase/firebase-plain.svg',
    'graphql/graphql-plain.svg',
    'prisma/prisma-original.svg'
  ];

  // Helper to create logo texture
  function createLogoTexture(iconPath) {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 512;
    texCanvas.height = 512;
    const ctx = texCanvas.getContext('2d');
    
    // Background fill (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    if (iconPath) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw centered with smaller padding for huge logos wrapping the sphere
        const padding = 20;
        const size = 512 - padding * 2;
        ctx.drawImage(img, padding, padding, size, size);
        texture.needsUpdate = true;
      };
      // Handle missing icons gracefully
      img.onerror = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        texture.needsUpdate = true;
      };
      img.src = `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${iconPath}`;
    }
    
    return texture;
  }

  // Common glossy premium material
  const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
  
  for (let i = 0; i < sphereCount; i++) {
    const hasLogo = i < techStack.length;
    const texture = createLogoTexture(hasLogo ? techStack[i] : null);
    
    const material = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
      envMapIntensity: 1.0
    });

    // Randomize size slightly
    const radius = hasLogo ? 1.4 : Math.random() * 0.8 + 0.4;
    
    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.scale.set(radius, radius, radius);
    
    // Start them already somewhat clustered
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
    mesh.position.copy(pos);
    
    // Random rotation
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(mesh);

    // Physics Body
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
      mass: hasLogo ? 2 : 1, // Logos are heavier
      position: new CANNON.Vec3(pos.x, pos.y, pos.z),
      shape: shape,
      material: defaultMaterial,
      linearDamping: 0.5,
      angularDamping: 0.5
    });
    
    // Random initial rotation in physics
    body.quaternion.setFromEuler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    world.addBody(body);
    
    spheres.push({ mesh, body, radius, hasLogo });
  }

  // ==========================================
  // 5. INTERACTIVITY & RAYCASTING
  // ==========================================
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const targetObj = new THREE.Vector3();
  
  let isMouseMoving = false;
  let mouseWorldPos = new THREE.Vector3(0, 0, 1000); // Far away initially

  container.addEventListener('mousemove', (e) => {
    isMouseMoving = true;
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Get 3D position of mouse on the z=0 plane
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, targetObj);
    mouseWorldPos.copy(targetObj);
  });

  container.addEventListener('mouseleave', () => {
    isMouseMoving = false;
    mouseWorldPos.set(0, 0, 1000);
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ==========================================
  // 6. ANIMATION LOOP
  // ==========================================
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    world.step(1 / 60, dt, 3);

    // Apply forces
    spheres.forEach((item, i) => {
      const { body, mesh } = item;

      // Strong restoring force to center (Clustering them together)
      const forceStrength = 2.5;
      const distToCenter = Math.sqrt(body.position.x**2 + body.position.y**2 + body.position.z**2);
      if (distToCenter > 0.5) {
        body.applyForce(
          new CANNON.Vec3(
            -body.position.x * forceStrength,
            -body.position.y * forceStrength,
            -body.position.z * forceStrength * 2 // Keep them flatter
          ),
          body.position
        );
      }

      // Add a very subtle wiggle
      body.applyForce(
        new CANNON.Vec3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        body.position
      );

      // Mouse repulsion force (stirring the cluster)
      if (isMouseMoving) {
        const dx = body.position.x - mouseWorldPos.x;
        const dy = body.position.y - mouseWorldPos.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        const repelRadius = 10;
        if (distance < repelRadius) {
          const repelForce = (repelRadius - distance) * 35; // Strong push
          body.applyForce(
            new CANNON.Vec3(
              (dx / distance) * repelForce,
              (dy / distance) * repelForce,
              (Math.random() - 0.5) * repelForce // Push outward in Z
            ),
            body.position
          );
        }
      }

      // Keep rotation dynamic
      body.angularVelocity.x += (Math.random() - 0.5) * 0.1;
      body.angularVelocity.y += (Math.random() - 0.5) * 0.1;

      // Sync physics to graphics
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    });

    // Slight camera sway
    const time = clock.getElapsedTime();
    camera.position.x = Math.sin(time * 0.2) * 2;
    camera.position.y = Math.cos(time * 0.2) * 2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();
}
