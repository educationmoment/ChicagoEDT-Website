let scene;
let camera;
let renderer;
let robot;
let controls;
let resizeObserver;
let targetCameraDistance;
let minCameraDistance = 1.5;
let maxCameraDistance = 12;

async function initLunabot3DViewer() {
  const container = document.querySelector('#lunabot-3d-container');
  if (!container) {
    console.error('Lunabot 3D container not found');
    return;
  }

  try {
    const THREE = await import('https://esm.sh/three@0.160.0');
    const { GLTFLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
    const { OrbitControls } = await import('https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js');
    const { DRACOLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js');

    await new Promise(requestAnimationFrame);
    setupScene(container, THREE, GLTFLoader, OrbitControls, DRACOLoader);
  } catch (error) {
    console.error('Failed to load Lunabot 3D viewer:', error);
    showFallback(container);
  }
}

function setupScene(container, THREE, GLTFLoader, OrbitControls, DRACOLoader) {
  scene = new THREE.Scene();

  const { width, height } = getContainerSize(container);
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(4, 2.2, 4);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  addLights(THREE);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI / 2 + 0.45;
  controls.zoomSpeed = 0.35;

  renderer.domElement.addEventListener('wheel', handleWheelZoom, {
    capture: true,
    passive: false
  });

  loadRobotModel(container, THREE, GLTFLoader, DRACOLoader);

  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => resizeViewer(container));
    resizeObserver.observe(container);
  }

  window.addEventListener('resize', () => resizeViewer(container));
  animate();
}

function addLights(THREE) {
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
  keyLight.position.set(5, 8, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.75);
  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  const rimLight = new THREE.SpotLight(0xf6c445, 0.45);
  rimLight.position.set(0, 5, -5);
  rimLight.target.position.set(0, 0, 0);
  scene.add(rimLight);
  scene.add(rimLight.target);
}

function loadRobotModel(container, THREE, GLTFLoader, DRACOLoader) {
  const modelSrc = container.dataset.modelSrc || 'assets/3D/lunabot.glb';
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();

  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    modelSrc,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.set(-center.x, -center.y, -center.z);

      const modelGroup = new THREE.Group();
      modelGroup.add(model);

      const maxDim = Math.max(size.x, size.y, size.z);
      if (Number.isFinite(maxDim) && maxDim > 0) {
        modelGroup.scale.multiplyScalar(3.5 / maxDim);
      }

      modelGroup.traverse((node) => {
        if (!node.isMesh) return;

        node.castShadow = true;
        node.receiveShadow = true;

        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.filter(Boolean).forEach((material) => {
          material.needsUpdate = true;
        });
      });

      robot = modelGroup;
      scene.add(robot);
      fitCameraToModel(THREE, robot);
      hideState(container);
    },
    undefined,
    (error) => {
      console.error(`Error loading Lunabot model from ${modelSrc}:`, error);
      showFallback(container);
    }
  );
}

function animate() {
  requestAnimationFrame(animate);

  if (robot) {
    robot.rotation.y += 0.005;
  }

  if (controls) {
    controls.update();
  }

  applySmoothZoom();

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function resizeViewer(container) {
  if (!camera || !renderer) return;

  const { width, height } = getContainerSize(container);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function handleWheelZoom(event) {
  if (!camera || !controls) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const currentDistance = camera.position.distanceTo(controls.target);
  const delta = normalizeWheelDelta(event);
  const zoomScale = Math.exp(delta * 0.0012);

  if (!targetCameraDistance) {
    targetCameraDistance = currentDistance;
  }

  targetCameraDistance = clamp(
    targetCameraDistance * zoomScale,
    minCameraDistance,
    maxCameraDistance
  );
}

function applySmoothZoom() {
  if (!camera || !controls || !targetCameraDistance) return;

  const offset = camera.position.clone().sub(controls.target);
  const currentDistance = offset.length();
  const nextDistance = currentDistance + (targetCameraDistance - currentDistance) * 0.16;

  offset.setLength(nextDistance);
  camera.position.copy(controls.target).add(offset);

  if (Math.abs(targetCameraDistance - nextDistance) < 0.01) {
    targetCameraDistance = undefined;
  }
}

function fitCameraToModel(THREE, model) {
  if (!camera || !controls) return;

  const box = new THREE.Box3().setFromObject(model);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = camera.fov * (Math.PI / 180);
  const distance = Math.max(2.8, sphere.radius / Math.sin(fov / 2)) * 1.2;

  camera.position.set(distance, distance * 0.5, distance);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  const fittedDistance = camera.position.distanceTo(controls.target);
  minCameraDistance = fittedDistance * 0.35;
  maxCameraDistance = fittedDistance * 4;
  targetCameraDistance = undefined;
  controls.minDistance = minCameraDistance;
  controls.maxDistance = maxCameraDistance;
}

function getContainerSize(container) {
  const rect = container.getBoundingClientRect();

  return {
    width: Math.max(320, Math.floor(rect.width)),
    height: Math.max(260, Math.floor(rect.height))
  };
}

function showFallback(container) {
  const fallbackSrc = container.dataset.fallbackSrc;
  const canvas = container.querySelector('canvas');

  if (canvas) {
    canvas.style.display = 'none';
  }

  hideState(container);

  if (!fallbackSrc || container.querySelector('.lunabot-viewer-fallback')) {
    return;
  }

  const fallback = new Image();
  fallback.className = 'lunabot-viewer-fallback';
  fallback.src = fallbackSrc;
  fallback.alt = 'Lunabotics robot';
  container.appendChild(fallback);
}

function hideState(container) {
  const state = container.querySelector('.lunabot-viewer-state');
  if (state) {
    state.hidden = true;
  }
}

function normalizeWheelDelta(event) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight;
  }

  return event.deltaY;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

initLunabot3DViewer();
