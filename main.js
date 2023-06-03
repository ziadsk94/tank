let video, canvas, context, faceCascade;
let tankRotation = 0;
let scene, camera, renderer;

// Load OpenCV and start face tracking
function start() {
  video = document.getElementById('video');
  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setInterval(detectFaces, 100); // Face detection every 100 milliseconds
      };
    })
    .catch(error => console.error('Error accessing the webcam:', error));

  // Load face detection cascade classifier
  faceCascade = new cv.CascadeClassifier();
  faceCascade.load('haarcascade_frontalface_default.xml');
}

// Perform face detection
function detectFaces() {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  const faces = new cv.RectVector();

  // Detect faces
  faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0);

  // Process detected faces
  for (let i = 0; i < faces.size(); i++) {
    const face = faces.get(i);
    const faceCenterX = face.x + face.width / 2;
    const faceCenterY = face.y + face.height / 2;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    // Calculate head movement
    const movementX = faceCenterX - canvasCenterX;
    const movementY = faceCenterY - canvasCenterY;

    // Map head movement to tank rotation
    const maxMovement = Math.max(Math.abs(movementX), Math.abs(movementY));
    const movementFactor = 0.005;
    tankRotation += movementX * movementFactor;

    // Update tank rotation
    const tank = scene.getObjectByName('Tank');
    tank.rotation.y = tankRotation;

    // Draw rectangle around the face
    const point1 = new cv.Point(face.x, face.y);
    const point2 = new cv.Point(face.x + face.width, face.y + face.height);
    const color = new cv.Scalar(255, 0, 0, 255); // BGR color
    const thickness = 2;
    cv.rectangle(src, point1, point2, color, thickness);
  }

  cv.imshow(canvas, src);
  src.delete();
  gray.delete();
  faces.delete();
}

// Setup Three.js scene, tank model, and tower
function setupScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create tank model
  const tankGeometry = new THREE.BoxGeometry(2, 1, 1);
  const tankMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
  tankMesh.name = 'Tank';
  scene.add(tankMesh);

  // Create tower
  const towerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
  const towerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
  towerMesh.position.set(0, 1.5, -10); // Adjust position
  scene.add(towerMesh);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
}

// Load OpenCV cascade classifier
function loadCascadeClassifier() {
  const faceCascadeFile = 'haarcascade_frontalface_default.xml';
  const xhr = new XMLHttpRequest();
  xhr.open('GET', faceCascadeFile, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function (e) {
    const data = new Uint8Array(xhr.response);
    cv.FS_createDataFile('/', faceCascadeFile, data, true, false, false);
    start();
  };
  xhr.send();
}

// Entry point
function initialize() {
  cv.onRuntimeInitialized = function () {
    setupScene();
    loadCascadeClassifier();
  };
}

initialize();
