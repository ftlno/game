var scene, camera, renderer, player, keyboard;

Physijs.scripts.worker = '/js/physijs_worker.js';
Physijs.scripts.ammo = '/js/ammo.js';

function init() {
    keyboard = new THREEx.KeyboardState();
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -230, 0));
    camera = new THREE.PerspectiveCamera(45, (window.innerWidth / window.innerHeight), 100, 10000);
    camera.position.z = 1000;
    camera.position.y = 100;
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function getMesh(meshColor) {
    var geometry = new THREE.BoxGeometry(10, 10, 10);
    var material = new Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: meshColor,
        wireframe: true
    }), 0.9, 0.9);

    var mesh = new Physijs.BoxMesh(geometry, material);
    return mesh;
}

function addPlayer() {
    player = getMesh(0xff0000);
    player.position.y = 200;
    scene.add(player);
}

function addEnvironment() {
    var ground_material = new Physijs.createMaterial(new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true
    }), 0.8, 0.3);
    var ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1000, 1, 1000),
        ground_material,
        0
    );
    scene.add(ground);
}

function keyboardEvents() {
    if (keyboard.pressed("left")) {
        player.applyCentralImpulse(new THREE.Vector3(-4000, 2000, 0));
    }
    if (keyboard.pressed("right")) {
        player.applyCentralImpulse(new THREE.Vector3(4000, 2000, 0));
    }
    if (keyboard.pressed("up")) {
        player.applyCentralImpulse(new THREE.Vector3(0, 8000, 0));
    }
}

function animate() {
    keyboardEvents();
    scene.simulate();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function startGame() {
    init();
    addEnvironment();
    addPlayer();
    animate();
}
