/**
 * JASWANTH SAI - PERSONAL PORTFOLIO WEBSITE JS
 * Liquid Glass & Space Theme
 * Fully responsive, optimized interactive features.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. PRELOADER & PAGE ENTRY
  // ==========================================
  const preloader = document.getElementById('preloader');
  
  // Ensure the preloader stays visible for exactly 3 seconds
  setTimeout(() => {
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
      document.body.style.overflow = 'visible';
    }
  }, 3000);


  // ==========================================
  // 2. DUAL CUSTOM CURSOR (lerp-smoothed)
  // ==========================================
  const cursorRing = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');
  
  let mouse = { x: -100, y: -100 };
  let ring = { x: -100, y: -100 };
  let cursorRotation = 0;
  let targetRotationSpeed = 1.5;
  let currentRotationSpeed = 1.5;

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Custom Cursor Render Loop (Lerping outer ring for organic tail effect)
  function renderCursor() {
    // Lerping ring coordinates
    const ease = 0.2; // Speed factor (snappier)
    ring.x += (mouse.x - ring.x) * ease;
    ring.y += (mouse.y - ring.y) * ease;

    // Smoothly lerp the rotation speed and apply rotation
    currentRotationSpeed += (targetRotationSpeed - currentRotationSpeed) * 0.1;
    cursorRotation += currentRotationSpeed;

    // Apply styles directly (using translate3d for GPU acceleration + translate(-50%, -50%) for perfect centering)
    cursorRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) rotate(${cursorRotation}deg)`;
    cursorDot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
    
    const cursorTextContainer = document.getElementById('cursor-text-container');
    if (cursorTextContainer) {
      cursorTextContainer.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
    }

    requestAnimationFrame(renderCursor);
  }
  
  // Check if touch device - do not activate cursor loop if so
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) {
    requestAnimationFrame(renderCursor);
    
    // Add hover states to interactive elements (excluding the floating call button)
    const hoverables = document.querySelectorAll('a:not(.floating-call-btn), button, input, textarea, select, .theme-toggle, .project-card, .skill-card, .social-icon');
    
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        targetRotationSpeed = 6.0; // Spin extremely fast on hover
        
        let text = el.getAttribute('data-cursor') || '';
        if (!text) {
           if (el.tagName.toLowerCase() === 'a' && !el.classList.contains('social-icon')) text = 'Open';
           else if (el.tagName.toLowerCase() === 'button') text = 'Click';
           else if (el.classList.contains('project-card')) text = 'View';
           else if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') text = 'Type';
        }
        
        const textSpan = document.getElementById('cursor-text');
        const textContainer = document.getElementById('cursor-text-container');
        
        if (text && textSpan && textContainer) {
           textSpan.innerText = text;
           textContainer.classList.add('show-text');
           cursorRing.classList.add('has-text');
           cursorDot.style.opacity = '0';
        }
        
        cursorRing.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        targetRotationSpeed = 1.5; // Normal slow spin
        cursorRing.classList.remove('cursor-hover');
        
        const textContainer = document.getElementById('cursor-text-container');
        if (textContainer) {
           textContainer.classList.remove('show-text');
           cursorRing.classList.remove('has-text');
        }
        cursorDot.style.opacity = '1';
      });
    });

    // Add click active states
    window.addEventListener('mousedown', () => {
      cursorRing.classList.add('cursor-click');
    });
    window.addEventListener('mouseup', () => {
      cursorRing.classList.remove('cursor-click');
    });
  } else {
    // Safe fallback: remove cursor divs from DOM on touch devices to save resources
    if (cursorRing) cursorRing.remove();
    if (cursorDot) cursorDot.remove();
  }


  // ==========================================
  // 3. IMMERSIVE 3D SPACE BACKGROUND (THREE.JS)
  // ==========================================
  const canvas = document.getElementById('starfield');
  
  // Set up Three.js scene
  const scene = new THREE.Scene();
  // Add a subtle fog to fade out distant stars into the dark void
  scene.fog = new THREE.FogExp2(0x050816, 0.0012);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 600;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize for high-res
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ==========================================
  // 3D KEYBOARD MODEL GENERATION
  // ==========================================
  const keyboardLayout = [
    ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Fn', 'Ctrl', 'Left', 'Down', 'Right', '0', '.']
  ];

  const keyMapDark = new Map();
  const keyMapLight = new Map();
  // Generate a texture for a string
  function createKeycapTexture(text, isLight = false) {
    const map = isLight ? keyMapLight : keyMapDark;
    if(map.has(text)) return map.get(text);
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Ultra-high resolution for razor sharp text
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    if (isLight) {
      // Light Mode: Black background, White text
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.fillStyle = '#ffffff';
    } else {
      // Dark Mode: White background, Black text
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.fillStyle = '#000000';
    }
    
    // NO shadow, NO blur, NO stroke - just pure razor-sharp edges
    ctx.shadowBlur = 0;
    
    // Massive font size scaled for 1024px canvas
    const fs = text.length > 4 ? 220 : (text.length > 1 ? 320 : 500);
    ctx.font = `900 ${fs}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText(text, 512, 532);
    
    const tex = new THREE.CanvasTexture(canvas);
    // Anisotropic filtering ensures text remains razor sharp when tilted in 3D
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    map.set(text, tex);
    return tex;
  }

  // Premium glass/plastic materials for the body of the keys
  const blackKeyMat = new THREE.MeshPhysicalMaterial({
    color: 0x050505, // Black
    metalness: 0.6,
    roughness: 0.2,
    transmission: 0.1, // Less glassy, more solid black
    thickness: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });

  const keyboardGroup = new THREE.Group();
  
  const baseSize = 34; // Much bigger keys
  const gap = 4;

  function getKeyWidth(char, rowIndex, colIndex) {
    let u = 1.0; // Base Unit
    
    if (rowIndex === 0 && char === 'Backspace') u = 2.0;
    else if (rowIndex === 1 && (char === 'Tab' || char === '\\')) u = 1.5;
    else if (rowIndex === 2 && char === 'Caps') u = 1.75;
    else if (rowIndex === 2 && char === 'Enter') u = 2.25;
    else if (rowIndex === 3 && char === 'Shift') u = (colIndex === 0) ? 2.25 : 2.75;
    else if (rowIndex === 4) {
      if (char === 'Space') u = 4.0;
      else u = 1.0; // Modifiers and arrows are tightly packed at 1U
    }

    // Mathematical formula to convert Units to physical pixels, properly accounting for gaps
    return u * baseSize + (u - 1) * gap;
  }

  function createRoundedKeyGeo(width, height, depth, radius) {
    const shape = new THREE.Shape();
    const x = -width/2, y = -depth/2;
    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + depth - radius);
    shape.quadraticCurveTo(x, y + depth, x + radius, y + depth);
    shape.lineTo(x + width - radius, y + depth);
    shape.quadraticCurveTo(x + width, y + depth, x + width, y + depth - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    const extrudeSettings = {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 1.5,
      bevelThickness: 2.0
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Fix UV mapping for the Lids (ExtrudeGeometry maps raw world coordinates by default)
    const uv = geometry.attributes.uv;
    if (uv) {
      for (let i = 0; i < uv.count; i++) {
        let u = uv.getX(i);
        let v = uv.getY(i);
        // Normalize based on key bounds to map perfectly from 0 to 1
        uv.setXY(i, u / width + 0.5, v / depth + 0.5);
      }
      uv.needsUpdate = true;
    }

    geometry.rotateX(-Math.PI / 2); // Faces lid upwards
    geometry.translate(0, -height/2, 0); // Centers geometry vertically
    return geometry;
  }

  let startZ = -((keyboardLayout.length * (baseSize + gap)) / 2);
  const keysList = [];

  keyboardLayout.forEach((row, rowIndex) => {
    // Calculate total width of row to perfectly center it
    let rowWidth = 0;
    row.forEach((char, colIndex) => { 
      rowWidth += getKeyWidth(char, rowIndex, colIndex) + gap; 
    });
    rowWidth -= gap; // remove last gap

    let currentX = -(rowWidth / 2);
    const currentZ = startZ + rowIndex * (baseSize + gap);

    row.forEach((char, colIndex) => {
      const w = getKeyWidth(char, rowIndex, colIndex);
      const geo = createRoundedKeyGeo(w, 20, baseSize, 5); // Taller, highly 3D rounded keys
      
      // Apply texture to the TOP face (index 0 in ExtrudeGeometry)
      const topMat = new THREE.MeshPhysicalMaterial({
        color: 0x050505, // Black top face
        map: createKeycapTexture(char),
        emissive: 0xffffff, // Pure white text glow
        emissiveMap: createKeycapTexture(char),
        emissiveIntensity: 3.5, // Extreme text brightness
        roughness: 0.2, // Smoother base surface
        metalness: 0.5, // Slight metallic sheen
        clearcoat: 1.0, // High-gloss clearcoat
        clearcoatRoughness: 0.1 // Polished finish
      });

      // ExtrudeGeometry uses index 0 for Lids (Top/Bottom) and index 1 for Sides
      const materials = [topMat, blackKeyMat];

      const mesh = new THREE.Mesh(geo, materials);
      
      // Target position in the assembled keyboard
      const targetPos = new THREE.Vector3(currentX + w/2, 0, currentZ);
      
      // Scattered position for the flying state (spread massively all over the screen)
      const rX = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const rY = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const scatterPos = new THREE.Vector3(
        rX * 3500,
        rY * 1800,
        (Math.random() - 0.5) * 3000 - 400
      );
      
      // Velocity for flying
      const scatterVelocity = new THREE.Vector3(
        0, 
        0, 
        Math.random() * 4 + 1 // fly forward
      );

      mesh.position.copy(scatterPos);
      
      // Store animation states
      mesh.userData = {
        char: char,
        targetPos: targetPos,
        scatterPos: scatterPos,
        scatterVelocity: scatterVelocity,
        targetRot: new THREE.Euler(0, 0, 0),
        scatterRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rotSpeed: new THREE.Vector3(Math.random()*0.02, Math.random()*0.02, Math.random()*0.02)
      };

      currentX += w + gap;
      keyboardGroup.add(mesh);
      keysList.push(mesh);
    });
  });

  // Add an Ultra-Premium Neon Baseplate (Keyboard Chassis)
  // Perfectly sized to exactly wrap the 15U keyboard length with a 12px margin
  const chassisGeo = createRoundedKeyGeo(590, 15, 210, 10);
  const chassisMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    metalness: 0.2, // Subtle metallic sheen
    roughness: 0.35, // Frosted glass finish
    transmission: 0.95, // High glass transmission
    thickness: 25, // Thick premium acrylic/glass
    ior: 1.5, // Real glass index of refraction
    transparent: true,
    opacity: 1.0,
    clearcoat: 1.0, // High-gloss polished exterior
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.5 // Enhance reflections
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  
  // Add intense glowing neon edges
  const chassisEdgesGeo = new THREE.EdgesGeometry(chassisGeo);
  const chassisEdgesMat = new THREE.LineBasicMaterial({ 
    color: 0x00d8ff, 
    transparent: true, 
    opacity: 0.9 
  });
  const chassisEdges = new THREE.LineSegments(chassisEdgesGeo, chassisEdgesMat);
  chassis.add(chassisEdges);

  // Cast actual neon light from the chassis onto the flying keys
  const chassisLight = new THREE.PointLight(0x00d8ff, 250, 600);
  chassisLight.position.set(0, 50, 0); // Floats just above the chassis to light the keys
  chassis.add(chassisLight);
  
  const chassisTargetPos = new THREE.Vector3(0, -15, -19); // Directly under the centered keys
  const chassisScatterPos = new THREE.Vector3(0, -1500, -3000); // Flies deep down and away
  
  chassis.position.copy(chassisScatterPos);
  chassis.userData = {
    targetPos: chassisTargetPos,
    scatterPos: chassisScatterPos,
    scatterVelocity: new THREE.Vector3(0, -4, -15),
    targetRot: new THREE.Euler(0, 0, 0),
    scatterRot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
    rotSpeed: new THREE.Vector3(0.01, 0.01, 0.01)
  };
  keyboardGroup.add(chassis);
  keysList.push(chassis);

  // Generate 1200 extra dummy keys that fly forever in the background
  const allChars = keyboardLayout.flat();
  for(let i = 0; i < 1200; i++) {
    const char = allChars[Math.floor(Math.random() * allChars.length)];
    const w = getKeyWidth(char);
    const geo = createRoundedKeyGeo(w, 20, baseSize, 5);
    
    const topMat = new THREE.MeshPhysicalMaterial({
      color: 0x050505, // Black top face
      map: createKeycapTexture(char),
      emissive: 0xffffff, // Pure white text glow
      emissiveMap: createKeycapTexture(char),
      emissiveIntensity: 3.5, // Extreme text brightness
      roughness: 0.2, // Smoother base surface
      metalness: 0.5, // Slight metallic sheen
      clearcoat: 1.0, // High-gloss clearcoat
      clearcoatRoughness: 0.1 // Polished finish
    });

    // ExtrudeGeometry uses index 0 for Lids (Top/Bottom) and index 1 for Sides
    const materials = [topMat, blackKeyMat];
    const mesh = new THREE.Mesh(geo, materials);
    
    // Center-weighted distribution (approx normal) to force a dense swarm in the center
    const rX = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const rY = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    
    const scatterPos = new THREE.Vector3(
      rX * 3500, // Densly packed around x=0
      rY * 1800, // Densly packed around y=0
      (Math.random() - 0.5) * 4000 - 500
    );
    
    mesh.position.copy(scatterPos);
    
    // Pick a random real key's target position to merge into when assembling!
    const randomRealKey = keysList[Math.floor(Math.random() * (keysList.length - 1))];
    const mergePos = randomRealKey ? randomRealKey.userData.targetPos.clone() : scatterPos;
    mergePos.y -= 2; // Sink slightly inside the real keycap to prevent heavy Z-fighting

    mesh.userData = {
      char: char,
      targetPos: mergePos, 
      scatterPos: scatterPos,
      scatterVelocity: new THREE.Vector3(0, 0, Math.random() * 6 + 2), // Fly faster
      targetRot: new THREE.Euler(0, 0, 0),
      scatterRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      rotSpeed: new THREE.Vector3(Math.random()*0.02, Math.random()*0.02, Math.random()*0.02)
    };
    
    keyboardGroup.add(mesh);
    keysList.push(mesh);
  }

  // Position and tilt the keyboard
  keyboardGroup.scale.set(1.5, 1.5, 1.5); // MASSIVE 3D PRESENCE
  keyboardGroup.rotation.x = Math.PI / 5.5; // Natural 3D desk tilt
  keyboardGroup.rotation.y = 0;
  keyboardGroup.rotation.z = 0;
  keyboardGroup.position.z = -150; 
  keyboardGroup.position.y = -100; // Fixed clearly at the bottom
  scene.add(keyboardGroup);

  // Add Premium Luxury Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Deeper contrast for luxury feel
  scene.add(ambientLight);

  // Key Light: Warm, elegant studio highlight
  const mainLight = new THREE.DirectionalLight(0xfffae6, 4.5); 
  mainLight.position.set(150, 400, 250);
  scene.add(mainLight);

  // Fill Light: Soft, cinematic cool blue
  const dirLight = new THREE.DirectionalLight(0x60a5fa, 2.5); 
  dirLight.position.set(-250, 150, 150);
  scene.add(dirLight);

  // Rim Light: Powerful backlight to carve out the glass edges and clearcoat
  const dirLight2 = new THREE.DirectionalLight(0xe0e7ff, 6.0); 
  dirLight2.position.set(0, 100, -350);
  scene.add(dirLight2);

  // Immersive interactive light: Elegant cyan/white aura that gracefully follows mouse
  const mouseLight = new THREE.PointLight(0x00e5ff, 5.0, 600); 
  scene.add(mouseLight);

  // ==========================================
  // IMMERSIVE 3D BACKGROUND (STARDUST)
  // ==========================================
  const starCount = 5000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starVel = [];

  for(let i=0; i<starCount; i++) {
    starPos[i*3] = (Math.random() - 0.5) * 4000;     // x
    starPos[i*3+1] = (Math.random() - 0.5) * 4000;   // y
    starPos[i*3+2] = (Math.random() - 0.5) * 4000;   // z
    starVel.push((Math.random() - 0.5) * 2); 
  }
  
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  
  // Custom glowing star material
  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = 32;
  particleCanvas.height = 32;
  const pCtx = particleCanvas.getContext('2d');
  const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(0, 216, 255, 0.8)'); // Cyan core
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  pCtx.fillStyle = gradient;
  pCtx.fillRect(0, 0, 32, 32);
  const particleTexture = new THREE.CanvasTexture(particleCanvas);

  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 10,
    map: particleTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const starSystem = new THREE.Points(starGeo, starMat);
  scene.add(starSystem);

  // Mouse Parallax Tracking
  let starMouse = { targetX: 0, targetY: 0 };
  let currentCameraX = 0;
  let currentCameraY = 0;

  window.addEventListener('mousemove', (e) => {
    starMouse.targetX = (e.clientX - window.innerWidth / 2) * 0.3;
    starMouse.targetY = (e.clientY - window.innerHeight / 2) * 0.3;
  });

  window.addEventListener('mouseleave', () => {
    starMouse.targetX = 0;
    starMouse.targetY = 0;
  });

  // Intro Animation Tracking
  let assembleProgress = 1.0;
  let targetAssembleProgress = 1.0;
  let hasIntroExploded = false;

  // 5 seconds after visiting the website, explode the keyboard into flying keys!
  setTimeout(() => {
    if (window.scrollY < 100) {
      targetAssembleProgress = 0.0;
    }
    hasIntroExploded = true;
  }, 5000);

  // Scroll logic: re-assemble the keyboard when scrolling down!
  window.addEventListener('scroll', () => {
    if (!hasIntroExploded) return; // Let intro happen first!

    const scrollY = window.scrollY;
    // Keys magnetically snap back to the keyboard layout VERY fast as you scroll down
    const scrollProgress = Math.min(scrollY / 200, 1.0); 
    targetAssembleProgress = scrollProgress;
  });

  function resizeCanvas() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  window.addEventListener('resize', resizeCanvas);

  // Animation Loop
  let time = 0;
  function animateStars() {
    time += 0.02;
    
    // Animate individual keys
    keysList.forEach(mesh => {
       const ud = mesh.userData;
       
       // 1. Update scattered position (flying)
       ud.scatterPos.add(ud.scatterVelocity);
       if (ud.scatterPos.z > 600) {
           ud.scatterPos.z -= 1800; // Wrap around to deep space
       }
       
       // Update scattered rotation
       ud.scatterRot.x += ud.rotSpeed.x;
       ud.scatterRot.y += ud.rotSpeed.y;
       ud.scatterRot.z += ud.rotSpeed.z;

       // 2. Blend between scattered and target based on assembleProgress
       mesh.position.lerpVectors(ud.scatterPos, ud.targetPos, assembleProgress);
       
       // Blend rotation using Quaternion slerp
       const qScatter = new THREE.Quaternion().setFromEuler(ud.scatterRot);
       const qTarget = new THREE.Quaternion().setFromEuler(ud.targetRot);
       mesh.quaternion.slerpQuaternions(qScatter, qTarget, assembleProgress);
    });

    // Different speeds for assembling (fast snap) vs disassembling (cinematic spread)
    if (targetAssembleProgress > assembleProgress) {
      assembleProgress += (targetAssembleProgress - assembleProgress) * 0.12; // Fast Assembly
    } else {
      assembleProgress += (targetAssembleProgress - assembleProgress) * 0.008; // Very Slow, Dreamy Disassembly
    }

    // Smooth floating for the whole keyboard group (only bob when scattered, fixed when assembled)
    const bobbing = Math.sin(time * 0.8) * 8 * (1 - assembleProgress);
    keyboardGroup.position.y = -100 + bobbing;
    
    // Smooth camera/group parallax based on mouse
    currentCameraX += (starMouse.targetX - currentCameraX) * 0.05;
    currentCameraY += (starMouse.targetY - currentCameraY) * 0.05;

    // Rotate the group slightly based on mouse parallax, keeping original desk tilt (Math.PI / 5.5)
    keyboardGroup.rotation.y = Math.sin(time * 0.4) * 0.05 + (assembleProgress * 0.1) + (currentCameraX * 0.002);
    keyboardGroup.rotation.x = (Math.PI / 5.5) + (currentCameraY * 0.002);
    keyboardGroup.rotation.z = 0;
    
    // Animate Stardust
    const positions = starGeo.attributes.position.array;
    for(let i=0; i<starCount; i++) {
      positions[i*3+2] += starVel[i] + (1 - assembleProgress) * 8; // Hyperspace effect when exploded
      if (positions[i*3+2] > 1000) {
        positions[i*3+2] = -3000;
      }
    }
    starGeo.attributes.position.needsUpdate = true;
    
    // Slowly rotate the entire star system for organic feel
    starSystem.rotation.y += 0.0005;
    starSystem.rotation.x += 0.0002;
    
    // Move PointLight to follow mouse
    mouseLight.position.x = currentCameraX;
    mouseLight.position.y = -currentCameraY + 40;
    mouseLight.position.z = -20;

    camera.position.x = currentCameraX * 0.4;
    camera.position.y = -currentCameraY * 0.4; 
    camera.lookAt(new THREE.Vector3(0, -20, -100)); // Look slightly down towards keyboard

    renderer.render(scene, camera);
    requestAnimationFrame(animateStars);
  }

  // Start Loop
  animateStars();


  // ==========================================
  // 4. HERO TEXT TYPING EFFECT
  // ==========================================
  const typedTextSpan = document.getElementById('typed-text');
  const textArray = ["Full-Stack Applications.", "Immersive UI Animations.", "Liquid Glass Designs.", "Next-Gen User Experiences."];
  const typingSpeed = 100;
  const erasingSpeed = 50;
  const newTextDelay = 2000; // Delay between texts
  let textArrayIndex = 0;
  let charIndex = 0;

  function type() {
    if (charIndex < textArray[textArrayIndex].length) {
      typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
      charIndex++;
      setTimeout(type, typingSpeed);
    } else {
      setTimeout(erase, newTextDelay);
    }
  }

  function erase() {
    if (charIndex > 0) {
      typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
      charIndex--;
      setTimeout(erase, erasingSpeed);
    } else {
      textArrayIndex++;
      if (textArrayIndex >= textArray.length) textArrayIndex = 0;
      setTimeout(type, typingSpeed + 500);
    }
  }

  // Run typing animation after loader finishes
  setTimeout(type, 1500);


  // ==========================================
  // 5. STICKY NAVBAR & MOBILE MENU
  // ==========================================
  const navbar = document.getElementById('navbar');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Scroll Listener
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });

  // Mobile navigation trigger
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close nav when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });


  // ==========================================
  // 6. SCROLL-SPY IMPLEMENTATION
  // ==========================================
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 120; // Offset navbar size
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });


  // ==========================================
  // 7. INTERSECTION OBSERVER ANIMATIONS (Slide & fade)
  // ==========================================
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const genericObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve after showing to avoid repeat layouts
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.fade-in-element');
  animatedElements.forEach(el => genericObserver.observe(el));


  // ==========================================
  // 8. SKILLS ANIMATION TRIGGER (circular & linear)
  // ==========================================
  const skillsSection = document.getElementById('skills');
  let skillsAnimated = false;

  const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !skillsAnimated) {
        animateSkills();
        skillsAnimated = true;
      }
    });
  }, { threshold: 0.2 });

  if (skillsSection) {
    skillsObserver.observe(skillsSection);
  }

  function animateSkills() {
    // 1. Linear progress bars fill
    const linearFills = document.querySelectorAll('.skill-bar-fill');
    const linearPercents = document.querySelectorAll('.skill-bar-percent');

    linearFills.forEach((fill, index) => {
      const targetPercent = fill.getAttribute('data-percent');
      fill.style.width = `${targetPercent}%`;

      // Increment numeric text indicator
      let count = 0;
      const duration = 1500; // Matches CSS transition time
      const interval = 20;
      const step = targetPercent / (duration / interval);
      const timer = setInterval(() => {
        count += step;
        if (count >= targetPercent) {
          linearPercents[index].textContent = `${targetPercent}%`;
          clearInterval(timer);
        } else {
          linearPercents[index].textContent = `${Math.floor(count)}%`;
        }
      }, interval);
    });

    // 2. Circular skill SVG meters
    const circularFills = document.querySelectorAll('.radial-progress');
    const circularPercents = document.querySelectorAll('.radial-percent');

    circularFills.forEach((circle, index) => {
      const targetPercent = parseInt(circle.getAttribute('data-percent'), 10);
      const radius = 40;
      const circumference = 2 * Math.PI * radius; // Approx 251.2
      const offset = circumference - (targetPercent / 100) * circumference;

      // Animate stroke offset
      circle.style.strokeDashoffset = offset;

      // Increment text inside circle
      let count = 0;
      const duration = 1500;
      const interval = 20;
      const step = targetPercent / (duration / interval);
      const timer = setInterval(() => {
        count += step;
        if (count >= targetPercent) {
          circularPercents[index].textContent = `${targetPercent}%`;
          clearInterval(timer);
        } else {
          circularPercents[index].textContent = `${Math.floor(count)}%`;
        }
      }, interval);
    });
  }


  // ==========================================
  // 9. 3D HOVER TILT EFFECT (Performance-guided)
  // ==========================================
  const tiltElements = document.querySelectorAll('[data-tilt]');
  
  if (!isTouchDevice) {
    tiltElements.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        
        // Relative mouse coordinates in element
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Midpoints
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Rotate calculation (max tilt degrees: 10)
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        // Apply transform via hardware acceleration
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.borderColor = 'rgba(6, 182, 212, 0.4)';
        card.style.boxShadow = '0 25px 45px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.2)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.borderColor = ''; // Reverts to CSS variable border
        card.style.boxShadow = ''; // Reverts to CSS variable shadow
      });
    });
  }


  // ==========================================
  // 10. TIMELINE SCROLL PROGRESS LINE & GLOW
  // ==========================================
  const timelineProgress = document.getElementById('timeline-progress');
  const timelineNodes = document.querySelectorAll('.timeline-node');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const experienceSection = document.getElementById('experience');

  window.addEventListener('scroll', () => {
    if (!experienceSection) return;

    const timelineTop = experienceSection.offsetTop;
    const timelineHeight = experienceSection.clientHeight;
    const scrollPosition = window.scrollY + window.innerHeight * 0.6; // Light up as it hits 60% viewport
    
    // Calculate progress line percentage
    let relativeProgress = scrollPosition - timelineTop;
    let progressPercent = (relativeProgress / (timelineHeight * 0.75)) * 100;
    progressPercent = Math.max(0, Math.min(100, progressPercent));

    timelineProgress.style.height = `${progressPercent}%`;

    // Highlight timeline nodes sequentially
    timelineItems.forEach((item, index) => {
      const node = item.querySelector('.timeline-node');
      const itemTop = item.offsetTop + timelineTop;
      
      if (scrollPosition > itemTop) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  });


  // ==========================================
  // 11. MAGNETIC SOCIAL ICON HOVER
  // ==========================================
  const magneticElements = document.querySelectorAll('[data-magnetic]');

  if (!isTouchDevice) {
    magneticElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        
        // Element center positions
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Mouse distance from center
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        
        // Shift amount (30% magnetic pull force)
        el.style.transform = `translate3d(${distanceX * 0.35}px, ${distanceY * 0.35}px, 0) scale3d(1.1, 1.1, 1.1)`;
        el.style.boxShadow = '0 8px 16px rgba(6, 182, 212, 0.2)';
      });
      
      el.addEventListener('mouseleave', () => {
        // Bounce back smoothly
        el.style.transform = 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1)';
        el.style.boxShadow = '';
      });
    });
  }


  // ==========================================
  // 12. DYNAMIC THEME TOGGLE (Persisted state)
  // ==========================================
  
  function updateThreeJSTheme(isLight) {
    if (typeof scene === 'undefined') return;
    
    if (isLight) {
      scene.fog.color.setHex(0xfafcff);
      
      // Light Mode: Smoked Glass Keyboard
      chassisMat.color.setHex(0x050505); 
      chassisMat.emissive.setHex(0x000000); 
      chassisEdgesMat.color.setHex(0x222222); 
      chassisEdgesMat.opacity = 0.2; // Very subtle edges for premium look
      chassisLight.color.setHex(0x050505); 
      
      blackKeyMat.color.setHex(0x050505); // Black key sides
      keysList.forEach(mesh => {
        if (mesh === chassis) return;
        mesh.material[0].color.setHex(0x050505); // Black key top
        mesh.material[0].emissive.setHex(0xffffff); // White text glow
        mesh.material[0].map = createKeycapTexture(mesh.userData.char, true);
        mesh.material[0].emissiveMap = createKeycapTexture(mesh.userData.char, true);
        mesh.material[0].needsUpdate = true;
      });
    } else {
      scene.fog.color.setHex(0x050816);
      
      // Dark Mode: Milky Frosted Glass Keyboard
      chassisMat.color.setHex(0xffffff); 
      chassisMat.emissive.setHex(0x111111); // extremely subtle glow
      chassisEdgesMat.color.setHex(0xffffff);
      chassisEdgesMat.opacity = 0.2; // Premium subtle highlight edges
      chassisLight.color.setHex(0xffffff);
      
      blackKeyMat.color.setHex(0xf0f0f0);
      keysList.forEach(mesh => {
        if (mesh === chassis) return;
        mesh.material[0].color.setHex(0xffffff);
        mesh.material[0].emissive.setHex(0x000000);
        mesh.material[0].map = createKeycapTexture(mesh.userData.char, false);
        mesh.material[0].emissiveMap = createKeycapTexture(mesh.userData.char, false);
        mesh.material[0].needsUpdate = true;
      });
    }
  }

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const currentTheme = localStorage.getItem('theme');

  // Check storage on page load
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThreeJSTheme(true);
  } else {
    updateThreeJSTheme(false);
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThreeJSTheme(isLight);
  });


  // ==========================================
  // 13. CONTACT FORM SUBMISSION MORPH
  // ==========================================
  const contactForm = document.getElementById('contact-form-element');
  const submitBtn = document.getElementById('contact-submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Prevent double submits
      if (submitBtn.classList.contains('loading') || submitBtn.classList.contains('success')) return;

      // 1. Enter Loading morph state
      submitBtn.classList.add('loading');
      
      // Simulate API call/processing delay (2 seconds)
      setTimeout(() => {
        // 2. Enter Success morph state
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        
        // Reset inputs
        contactForm.reset();
        
        // Reset label state
        document.querySelectorAll('.form-control').forEach(input => {
          input.blur();
        });

        // 3. Revert button to normal state after 3 seconds
        setTimeout(() => {
          submitBtn.classList.remove('success');
        }, 3000);
        
      }, 2000);
    });
  }

  // ==========================================
  // 14. INITIALIZE 3D VANILLA TILT
  // ==========================================
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll(".glass-panel, .about-img-frame, .project-card"), {
      max: 12,
      speed: 400,
      glare: true,
      "max-glare": 0.15,
      perspective: 1000
    });
  }
});
