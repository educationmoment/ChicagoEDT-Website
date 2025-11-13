// Drone 3D Viewer Component
let scene, camera, renderer, drone, controls, animationId;

// Initialize viewer using ES modules approach
async function init3DViewer() {
  const container = document.querySelector('#drone-3d-container');
  if (!container) {
    console.error('Drone 3D container not found');
    return;
  }

  console.log('Initializing 3D viewer...');

  try {
    // Use esm.sh CDN which properly handles ES modules and dependencies
    const THREE = await import('https://esm.sh/three@0.160.0');
    const { GLTFLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
    const { OrbitControls } = await import('https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js');
    const { DRACOLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js');

    console.log('Three.js modules loaded successfully');

    setupScene(container, THREE, GLTFLoader, OrbitControls, DRACOLoader);
  } catch (error) {
    console.error('Failed to load Three.js:', error);
    container.innerHTML = '<div style="color: #fff; text-align: center; padding: 50px;">Failed to load 3D viewer. Please refresh the page.</div>';
  }
}

function setupScene(container, THREE, GLTFLoader, OrbitControls, DRACOLoader) {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xD4D3D3);

  // Camera
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(3, 2, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  console.log('Scene, camera, and renderer created');

  // Lights - increased intensity to ensure model is visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight1.position.set(5, 10, 5);
  directionalLight1.castShadow = true;
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight2.position.set(-5, 5, -5);
  scene.add(directionalLight2);

  // Add a subtle spotlight from below
  const spotLight = new THREE.SpotLight(0x6699ff, 0.5);
  spotLight.position.set(0, -5, 0);
  spotLight.target.position.set(0, 0, 0);
  scene.add(spotLight);
  scene.add(spotLight.target);

  console.log('Lights added');

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 15;
  controls.maxPolarAngle = Math.PI / 2 + 0.5;

  console.log('Controls initialized');

  // Load GLTF Model
  loadDroneModel(THREE, GLTFLoader, DRACOLoader);

  // Handle window resize
  window.addEventListener('resize', () => onWindowResize(container));

  // Start animation
  animate();
}

function loadDroneModel(THREE, GLTFLoader, DRACOLoader) {
  const loader = new GLTFLoader();

  // Set up DRACO loader for compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);

  console.log('Starting to load drone model...');

  loader.load(
    'assets/3D/quad_big_drone.glb',
    (gltf) => {
      drone = gltf.scene;

      console.log('Model loaded, processing...', drone);

      // Get bounding box before any transformations
      const box = new THREE.Box3().setFromObject(drone);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model at origin - this ensures rotation happens around the center
      drone.position.set(-center.x, -center.y, -center.z);

      // Create a parent group to hold the drone
      const droneGroup = new THREE.Group();
      droneGroup.add(drone);

      // Scale the group to make it bigger
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.5 / maxDim; // Increased from 2 to 3.5 for bigger model
      droneGroup.scale.multiplyScalar(scale);

      // Replace the drone reference with the group for rotation
      drone = droneGroup;

      console.log('Model size:', size, 'Scale:', scale);

      // Enable shadows and ensure materials are visible
      droneGroup.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;

          // Ensure material is visible even if textures fail
          if (node.material) {
            // If it's an array of materials
            const materials = Array.isArray(node.material) ? node.material : [node.material];

            materials.forEach(material => {
              // Preserve the original color if it exists
              if (!material.color) {
                material.color = new THREE.Color(0x808080);
              }

              // Make sure the material is visible even without textures
              material.needsUpdate = true;

              // If texture loading failed, ensure material still renders
              if (material.map && !material.map.image) {
                console.log('Texture failed to load, using base color');
                material.map = null;
              }
            });
          }
        }
      });

      scene.add(droneGroup);

      console.log('Drone model loaded and added to scene successfully');
    },
    (progress) => {
      if (progress.total > 0) {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading model: ${percent.toFixed(2)}%`);
      }
    },
    (error) => {
      console.error('Error loading drone model:', error);
      console.error('Make sure the file exists at: assets/3D/quad_big_drone.glb');
    }
  );
}

function animate() {
  animationId = requestAnimationFrame(animate);

  // Rotate the drone slowly
  if (drone) {
    drone.rotation.y += 0.005;
  }

  if (controls) {
    controls.update();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function onWindowResize(container) {
  if (!camera || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

// Initialize when component is loaded
init3DViewer();
