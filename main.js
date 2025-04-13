import * as THREE from 'three';

// --- Configuration & Constants ---
// Animation
const animFPS = 10;
const animTimePerFrame = 1 / animFPS;
const numFrames = 4;
const numCols = 2;
const numRows = 2;
// World
const groundLevelY = 0;
const pathWidth = 10;
const borderHeight = 0.5;
const borderWidth = 0.5;
const lavaWidth = 500;
const lavaLength = 1000;
const castleZPosition = -400;
// Player
const catSpeed = 10;
const cameraFollowDistance = 5;
const cameraHeightOffset = 2;
const catMoveSpeed = 5;
// Enemies
const numEnemies = 20;
const enemyHorizontalSpeed = 1.0;
const collisionDistance = .7;
const enemyActivationDistanceZ = 10;
const minEnemySpacing = 8;
const maxEnemySpacing = 40;
// Visual Feedback
const skyColor = 0x87CEEB;
const flashColor = 0xff0000; // Red
const flashDuration = 150; // Milliseconds
let isFlashing = false; // Prevent overlapping flashes
let isGameOver = false; // Game state flag
let animationFrameId = null; // To cancel animation loop
let isGameWon = false; // Game won state

// --- Utility Loaders ---
const textureLoader = new THREE.TextureLoader();
const clock = new THREE.Clock();
const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();

// --- Basic Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(skyColor); // Use defined sky color
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.add(listener);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Get DOM Elements --- (Get them early)
const gameOverMessageElement = document.getElementById('gameOverMessage');
const winMessageElement = document.getElementById('winMessage'); // Get WIN message element
const restartButtonElement = document.getElementById('restartButton');
const leftButtonElement = document.getElementById('leftButton'); // Get Left button
const rightButtonElement = document.getElementById('rightButton'); // Get Right button

// --- Load Sounds ---
let collisionSound = null;
let lavaFallSound = null; // Variable for the lava sound
let fanfareSound = null; // Variable for win sound
let backgroundMusic = null; // Variable for background music
let musicPlaying = false; // Flag to prevent multiple plays
const passSounds = []; // Array to hold pass sounds
const numPassSounds = 4;

// Load Collision Sound
audioLoader.load(
    'collision.ogg', // General collision sound
    function (buffer) {
        collisionSound = new THREE.Audio(listener);
        collisionSound.setBuffer(buffer);
        collisionSound.setVolume(0.5);
        console.log("Collision sound loaded.");
    },
    function (xhr) { console.log('Collision sound ' + (xhr.loaded / xhr.total * 100) + '% loaded'); },
    function (err) { console.error('Error loading collision sound:', err); }
);

// Load Lava Fall Sound
audioLoader.load(
    'caida_lava2.ogg', // <<<--- PROVIDE lava fall audio file
    function (buffer) {
        lavaFallSound = new THREE.Audio(listener);
        lavaFallSound.setBuffer(buffer);
        lavaFallSound.setVolume(0.6); // Adjust volume as needed
        console.log("Lava fall sound loaded.");
    },
    function (xhr) { console.log('Lava fall sound ' + (xhr.loaded / xhr.total * 100) + '% loaded'); },
    function (err) { console.error('Error loading lava fall sound:', err); }
);

// Load Fanfare Sound
audioLoader.load(
    'fanfarria.ogg', // <<<--- PROVIDE fanfare audio file
    function (buffer) {
        fanfareSound = new THREE.Audio(listener);
        fanfareSound.setBuffer(buffer);
        fanfareSound.setVolume(0.7); // Adjust volume
        console.log("Fanfare sound loaded.");
    },
    function (xhr) { console.log('Fanfare sound ' + (xhr.loaded / xhr.total * 100) + '% loaded'); },
    function (err) { console.error('Error loading fanfare sound:', err); }
);

// Load Background Music
audioLoader.load(
    'music.mp3', // <<<--- PROVIDE background music file
    function (buffer) {
        backgroundMusic = new THREE.Audio(listener);
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true); // Make it loop
        backgroundMusic.setVolume(0.1); // Adjust volume (usually lower than effects)
        console.log("Background music loaded.");
        // Optionally start playing automatically, but be aware of autoplay restrictions
        // Try to play after first user interaction (e.g., inside startGame or a keypress handler if needed)
    },
    function (xhr) { console.log('Background music ' + (xhr.loaded / xhr.total * 100) + '% loaded'); },
    function (err) { console.error('Error loading background music:', err); }
);

// Load Pass Sounds
for (let i = 1; i <= numPassSounds; i++) {
    audioLoader.load(
        `pasada${i}.ogg`, // <<<--- PROVIDE pasada1.ogg, pasada2.ogg, etc.
        function (buffer) {
            const sound = new THREE.Audio(listener);
            sound.setBuffer(buffer);
            sound.setVolume(0.4); // Adjust volume
            passSounds.push(sound);
            console.log(`Pass sound ${i} loaded.`);
        },
        function (xhr) { console.log(`Pass sound ${i} ` + (xhr.loaded / xhr.total * 100) + '% loaded'); },
        function (err) { console.error(`Error loading pass sound ${i}:`, err); }
    );
}

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Create Ground Plane ---
const groundTexture = textureLoader.load('camino.png');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
const groundRepeatX = 2;
const groundRepeatZ = 50;
groundTexture.repeat.set(groundRepeatX, groundRepeatZ);

const groundGeometry = new THREE.PlaneGeometry(pathWidth, lavaLength);
const groundMaterial = new THREE.MeshStandardMaterial({
    map: groundTexture,
    side: THREE.DoubleSide
});
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = groundLevelY;
scene.add(groundPlane);

// --- Create Lava Planes ---
const lavaTexture = textureLoader.load('lava.png');
lavaTexture.wrapS = THREE.RepeatWrapping;
lavaTexture.wrapT = THREE.RepeatWrapping;
lavaTexture.repeat.set(lavaWidth / 20, lavaLength / 20);

const lavaGeometry = new THREE.PlaneGeometry(lavaWidth, lavaLength);
const lavaMaterial = new THREE.MeshStandardMaterial({
    map: lavaTexture,
    side: THREE.DoubleSide
});
const lavaRight = new THREE.Mesh(lavaGeometry, lavaMaterial);
lavaRight.rotation.x = -Math.PI / 2;
lavaRight.position.set(pathWidth / 2 + borderWidth + lavaWidth / 2, groundLevelY - 0.05, 0);
scene.add(lavaRight);
const lavaLeft = new THREE.Mesh(lavaGeometry, lavaMaterial);
lavaLeft.rotation.x = -Math.PI / 2;
lavaLeft.position.set(-pathWidth / 2 - borderWidth - lavaWidth / 2, groundLevelY - 0.05, 0);
scene.add(lavaLeft);

// --- Create Path Borders ---
const borderLength = 1000; // Make them very long
const borderGeometry = new THREE.BoxGeometry(borderWidth, borderHeight, borderLength);
const borderMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
const borderRight = new THREE.Mesh(borderGeometry, borderMaterial);
borderRight.position.set(pathWidth / 2 + borderWidth / 2, groundLevelY + borderHeight / 2, 0);
scene.add(borderRight);
const borderLeft = new THREE.Mesh(borderGeometry, borderMaterial);
borderLeft.position.set(-pathWidth / 2 - borderWidth / 2, groundLevelY + borderHeight / 2, 0);
scene.add(borderLeft);

// --- Create Cat Sprite ---
const catTexture = textureLoader.load('cat.png');
catTexture.repeat.set(1 / numCols, 1 / numRows);
let catAnimTimer = 0;
let catCurrentFrame = 0;
const catMaterial = new THREE.SpriteMaterial({ map: catTexture });
const catSprite = new THREE.Sprite(catMaterial);
catSprite.scale.set(1.5, 1.5, 1);

// --- Create Castle Sprite ---
const castleTexture = textureLoader.load('castillo.png');
const castleMaterial = new THREE.SpriteMaterial({ map: castleTexture });
const castleSprite = new THREE.Sprite(castleMaterial);
castleSprite.scale.set(10, 10, 1);

// --- Enemy Setup ---
const enemies = [];
const enemyTextureBase = textureLoader.load('enemy.png');

function createEnemy(zPosition) {
    const enemyTexture = enemyTextureBase.clone();
    enemyTexture.needsUpdate = true;
    enemyTexture.repeat.set(1 / numCols, 1 / numRows);
    const enemyMaterial = new THREE.SpriteMaterial({ map: enemyTexture });
    const enemySprite = new THREE.Sprite(enemyMaterial);
    enemySprite.scale.set(1.2, 1.2, 1);
    enemySprite.userData.animTimer = Math.random() * animTimePerFrame;
    enemySprite.userData.currentFrame = Math.floor(Math.random() * numFrames);
    enemySprite.userData.hasPassed = false; // Flag to track if passed player
    const initialCol = enemySprite.userData.currentFrame % numCols;
    const initialRow = Math.floor(enemySprite.userData.currentFrame / numCols);
    enemySprite.material.map.offset.set(initialCol / numCols, initialRow / numRows);
    enemySprite.position.z = zPosition;
    enemySprite.position.x = THREE.MathUtils.randFloatSpread(pathWidth * 0.8); // Spawn within path width
    enemySprite.position.y = groundLevelY + enemySprite.scale.y / 2;
    scene.add(enemySprite);
    enemies.push(enemySprite);
}

// --- Initial Positions & Scene Additions ---
const catInitialZ = 45;
const catInitialX = 0;
const catInitialY = groundLevelY + catSprite.scale.y / 2;
catSprite.position.set(catInitialX, catInitialY, catInitialZ);
scene.add(catSprite);

castleSprite.position.set(0, groundLevelY + castleSprite.scale.y / 2, castleZPosition);
scene.add(castleSprite);

camera.position.z = catSprite.position.z + cameraFollowDistance;
camera.position.y = catSprite.position.y + cameraHeightOffset;
camera.lookAt(catSprite.position);

// --- Populate World with Enemies ---
let currentEnemyZ = catInitialZ - 15;
for (let i = 0; i < numEnemies; i++) {
    currentEnemyZ -= THREE.MathUtils.randFloat(minEnemySpacing, maxEnemySpacing);
    createEnemy(currentEnemyZ);
}
console.log("Finished creating enemies. Total:", enemies.length);

// --- Player Input State ---
let moveLeft = false;
let moveRight = false;

// --- Event Listeners for Controls ---
// Keyboard
window.addEventListener('keydown', (event) => {
    if (isGameOver || isGameWon) return;
    // Try to start music on first interaction
    if (backgroundMusic && !musicPlaying) {
        backgroundMusic.play();
        musicPlaying = true;
    }
    if (event.key === 'ArrowLeft' || event.key === 'a') moveLeft = true;
    if (event.key === 'ArrowRight' || event.key === 'd') moveRight = true;
});
window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'a') moveLeft = false;
    if (event.key === 'ArrowRight' || event.key === 'd') moveRight = false;
});

// On-Screen Buttons (Touch and Mouse)
function handleLeftPress(event) {
    event.preventDefault();
    if (isGameOver || isGameWon) return;
    // Try to start music on first interaction
    if (backgroundMusic && !musicPlaying) {
        backgroundMusic.play();
        musicPlaying = true;
    }
    moveLeft = true;
}
function handleLeftRelease(event) {
    event.preventDefault();
    moveLeft = false;
}
function handleRightPress(event) {
    event.preventDefault();
    if (isGameOver || isGameWon) return;
    // Try to start music on first interaction
    if (backgroundMusic && !musicPlaying) {
        backgroundMusic.play();
        musicPlaying = true;
    }
    moveRight = true;
}
function handleRightRelease(event) {
    event.preventDefault();
    moveRight = false;
}

// Left Button Listeners
leftButtonElement.addEventListener('touchstart', handleLeftPress, { passive: false });
leftButtonElement.addEventListener('touchend', handleLeftRelease, { passive: false });
leftButtonElement.addEventListener('touchcancel', handleLeftRelease, { passive: false }); // Handle cancels
leftButtonElement.addEventListener('mousedown', handleLeftPress);
leftButtonElement.addEventListener('mouseup', handleLeftRelease);
leftButtonElement.addEventListener('mouseleave', handleLeftRelease); // If mouse leaves while pressed

// Right Button Listeners
rightButtonElement.addEventListener('touchstart', handleRightPress, { passive: false });
rightButtonElement.addEventListener('touchend', handleRightRelease, { passive: false });
rightButtonElement.addEventListener('touchcancel', handleRightRelease, { passive: false });
rightButtonElement.addEventListener('mousedown', handleRightPress);
rightButtonElement.addEventListener('mouseup', handleRightRelease);
rightButtonElement.addEventListener('mouseleave', handleRightRelease);

// --- Confetti Setup ---
const confettiParticles = [];
const confettiCount = 200;
const confettiMaterial = new THREE.SpriteMaterial({
    vertexColors: true,
    sizeAttenuation: true, // Make size decrease with distance (default)
    size: 0.2 // Set size in world units (adjust as needed)
});

function createConfetti() {
    for (let i = 0; i < confettiCount; i++) {
        const particle = new THREE.Sprite(confettiMaterial.clone()); // Use cloned material?
        particle.material.color.setHSL(Math.random(), 0.8, 0.6);
        particle.position.set(
            THREE.MathUtils.randFloatSpread(pathWidth * 1.5), // Spread wider than path
            THREE.MathUtils.randFloat(camera.position.y + 5, camera.position.y + 15), // Start above camera
            camera.position.z - THREE.MathUtils.randFloat(5, 15) // Start in front of camera
        );
        particle.userData.velocity = new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(0.5),
            THREE.MathUtils.randFloat(-2, -4), // Fall downwards
            THREE.MathUtils.randFloatSpread(0.5)
        );
        particle.visible = false; // Start hidden
        scene.add(particle);
        confettiParticles.push(particle);
    }
}

function resetConfetti() {
    confettiParticles.forEach(p => {
        scene.remove(p);
        // Properly dispose of geometry/material if needed later
    });
    confettiParticles.length = 0; // Clear the array
}

// --- Game Over Function ---
function handleGameOver(reason) {
    if (isGameOver) return; // Prevent running multiple times
    console.log("GAME OVER! Reason:", reason);
    isGameOver = true;
    cancelAnimationFrame(animationFrameId); // Stop the animation loop

    // Play specific sound based on reason
    if (reason === 'offPath' && lavaFallSound) {
        lavaFallSound.stop().play();
    } else if (reason === 'enemyCollision' && collisionSound) {
        collisionSound.stop().play();
    } // You could add an else here for a default sound if needed

    // Flash background red
    if (!isFlashing) {
        isFlashing = true;
        scene.background = new THREE.Color(flashColor);
        setTimeout(() => {
            scene.background = new THREE.Color(skyColor);
            isFlashing = false;
        }, flashDuration);
    }

    // Show GAME OVER message
    gameOverMessageElement.style.display = 'block';

    // Keep player/camera where they ended
    if (backgroundMusic && musicPlaying) {
        backgroundMusic.pause();
        musicPlaying = false; // Set flag to false when paused
    }
}

// --- Game Win Function ---
function handleWin() {
    if (isGameOver || isGameWon) return; // Don't trigger if already over/won
    console.log("YOU WIN!");
    isGameWon = true;
    cancelAnimationFrame(animationFrameId); // Stop main game loop (but we'll restart for confetti)

    if (fanfareSound) fanfareSound.play();

    // Show WIN message
    winMessageElement.style.display = 'block';

    // Start confetti
    createConfetti();
    confettiParticles.forEach(p => p.visible = true);

    // Restart a limited animation loop just for confetti
    animateConfetti();

    // Pause background music
    if (backgroundMusic && musicPlaying) {
        backgroundMusic.pause();
        musicPlaying = false; // Set flag to false when paused
    }
}

// --- Confetti Animation Loop ---
function animateConfetti() {
    animationFrameId = requestAnimationFrame(animateConfetti); // Keep looping
    const deltaTime = clock.getDelta(); // Need delta time

    let activeConfetti = 0;
    confettiParticles.forEach(particle => {
        if (particle.visible) {
            particle.position.addScaledVector(particle.userData.velocity, deltaTime);
            particle.userData.velocity.y -= 2 * deltaTime; // Gravity effect

            // Hide confetti that falls too low
            if (particle.position.y < groundLevelY - 5) {
                particle.visible = false;
            } else {
                activeConfetti++;
            }
        }
    });

    renderer.render(scene, camera); // Re-render needed

    // Optional: Stop confetti loop if all particles are hidden? (or let it run)
    // if (activeConfetti === 0 && confettiParticles.length > 0) { 
    //     cancelAnimationFrame(animationFrameId);
    // }
}

// --- Start Game Function ---
function startGame() {
    console.log("Starting game...");
    // Hide messages
    gameOverMessageElement.style.display = 'none';
    winMessageElement.style.display = 'none';
    // Reset confetti
    resetConfetti();

    // Reset game state
    isGameOver = false;
    isGameWon = false; // Reset win state

    // Reset cat position
    catSprite.position.set(catInitialX, catInitialY, catInitialZ);

    // Reset camera position
    camera.position.z = catSprite.position.z + cameraFollowDistance;
    camera.position.y = catSprite.position.y + cameraHeightOffset;
    camera.lookAt(catSprite.position);

    // Optional: Reset enemy positions or state here if needed
    // (e.g., remove existing enemies and re-populate)

    // Consume the large delta time from the pause before restarting loop
    clock.getDelta();

    // Start or resume background music if loaded and not already playing
    if (backgroundMusic && !musicPlaying) {
        // Stop previous playback first to ensure it starts from beginning
        backgroundMusic.stop();
        backgroundMusic.play();
        musicPlaying = true;
    }

    // Restart the MAIN animation loop
    animate();
}

// --- Button Event Listener ---
restartButtonElement.addEventListener('click', startGame); // Call startGame on click

// --- Handle Window Resize ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

// --- Animation Loop ---
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (isGameOver || isGameWon) return; // Stop updates if game over OR won
    const deltaTime = clock.getDelta();

    // --- Animation Update ---
    // Cat
    catAnimTimer += deltaTime;
    if (catAnimTimer >= animTimePerFrame) {
        catAnimTimer -= animTimePerFrame;
        catCurrentFrame = (catCurrentFrame + 1) % numFrames;
        const col = catCurrentFrame % numCols;
        const row = Math.floor(catCurrentFrame / numCols);
        catMaterial.map.offset.set(col / numCols, row / numRows);
    }
    // Enemies
    enemies.forEach(enemy => {
        enemy.userData.animTimer += deltaTime;
        if (enemy.userData.animTimer >= animTimePerFrame) {
            enemy.userData.animTimer -= animTimePerFrame;
            enemy.userData.currentFrame = (enemy.userData.currentFrame + 1) % numFrames;
            const col = enemy.userData.currentFrame % numCols;
            const row = Math.floor(enemy.userData.currentFrame / numCols);
            enemy.material.map.offset.set(col / numCols, row / numRows);
        }
    });

    // --- Cat Movement ---
    catSprite.position.z -= catSpeed * deltaTime;
    let targetX = catSprite.position.x;
    if (moveLeft) targetX -= catMoveSpeed * deltaTime;
    if (moveRight) targetX += catMoveSpeed * deltaTime;
    catSprite.position.x = targetX;
    catSprite.position.y = catInitialY;

    // --- Check for Win Condition ---
    if (catSprite.position.z <= castleSprite.position.z + 5) { // Check if cat reached castle (adjust buffer)
        handleWin();
        return; // Stop further updates this frame
    }

    // --- Check if Off Path ---
    if (Math.abs(catSprite.position.x) > pathWidth / 2) {
        handleGameOver('offPath'); // Pass 'offPath' reason
    }

    // --- Animate Ground Texture Offset ---
    const textureScrollSpeed = (catSpeed / (lavaLength / groundRepeatZ) / 50);
    groundMaterial.map.offset.y += textureScrollSpeed * deltaTime;

    // --- Animate Lava Texture Offset ---
    const lavaScrollSpeed = 0.05;
    lavaMaterial.map.offset.x += lavaScrollSpeed * deltaTime;
    lavaMaterial.map.offset.y += lavaScrollSpeed * 0.7 * deltaTime;

    // --- Enemy Movement & Pass Check ---
    enemies.forEach((enemy, index) => {
        // --- Enemy Movement Logic ---
        const distanceZ = catSprite.position.z - enemy.position.z;
        if (distanceZ > 0 && distanceZ < enemyActivationDistanceZ) {
            const directionX = Math.sign(catSprite.position.x - enemy.position.x);
            const moveAmount = enemyHorizontalSpeed * deltaTime;
            const currentDiffX = Math.abs(catSprite.position.x - enemy.position.x);
            if (currentDiffX > 0.1) {
                enemy.position.x += directionX * Math.min(moveAmount, currentDiffX);
            }
        }

        // --- Check if Enemy Passed Player ---
        if (!enemy.userData.hasPassed && enemy.position.z > catSprite.position.z) {
            enemy.userData.hasPassed = true;
            console.log(`Enemy ${index} passed player.`);
            // Play a random pass sound if available
            if (passSounds.length > 0) {
                const randomIndex = Math.floor(Math.random() * passSounds.length);
                if (passSounds[randomIndex]) {
                    passSounds[randomIndex].stop().play();
                }
            }
        }
    });

    // --- Collision Detection ---
    const catPosition = catSprite.position;
    for (const enemy of enemies) {
        const distance = catPosition.distanceTo(enemy.position);
        if (distance < collisionDistance) {
            handleGameOver('enemyCollision'); // Pass 'enemyCollision' reason
            break;
        }
    }

    // --- Camera Movement ---
    camera.position.z = catSprite.position.z + cameraFollowDistance;
    camera.position.y = catSprite.position.y + cameraHeightOffset;
    camera.lookAt(catSprite.position);

    renderer.render(scene, camera);
}

// --- Start Game Initially ---
startGame();
// animate(); // Don't call animate directly anymore 