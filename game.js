var scene, camera, renderer, player, keyboard;

Physijs.scripts.worker = '/js/physijs_worker.js';
Physijs.scripts.ammo = '/js/ammo.js';

function init() {
    keyboard = new THREEx.KeyboardState();
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -230, 0));
    camera = new THREE.PerspectiveCamera(70, (window.innerWidth / window.innerHeight), 1, 10000);
    camera.position.set(0, 50, 150);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(new THREE.Color(0xDBDBDB));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    document.body.appendChild(renderer.domElement);
}

function addLight() {
    var light = new THREE.DirectionalLight(0xF5F5F5, 1);
    light.position.set(200, 200, 100);
    light.castShadow = true;
    scene.add(light);

    var ambLight = new THREE.AmbientLight(0x0505050);
    scene.add(ambLight);
}

function getMesh(meshColor) {
    var geometry = new THREE.BoxGeometry(5, 5, 5);
    var material = new Physijs.createMaterial(new THREE.MeshPhongMaterial({
        color: meshColor
    }), 0.9, 0.9);

    var mesh = new Physijs.BoxMesh(geometry, material);
    mesh.castShadow = true;

    return mesh;
}

function addPlayer() {
    player = getMesh(0xDF565B);
    player.position.y = 50;
    scene.add(player);
}

function addEnvironment() {
    var ground_material = new Physijs.createMaterial(new THREE.MeshPhongMaterial({
        color: 0xEDEDED
    }), 0.8, 0.3);

    var NoiseGen = new SimplexNoise;

    var ground_geometry = new THREE.PlaneGeometry(300, 300, 200, 200);
    for (var i = 0; i < ground_geometry.vertices.length; i++) {
        var vertex = ground_geometry.vertices[i];
        vertex.z = NoiseGen.noise(vertex.x / 15, vertex.y / 20) * 2;
    }

    ground_geometry.computeFaceNormals();
    ground_geometry.computeVertexNormals();
    ground = new Physijs.HeightfieldMesh(ground_geometry, ground_material, 0, 200, 200);
    ground.rotation.x = Math.PI / -2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function keyboardEvents() {
    if (keyboard.pressed("left")) {
        player.applyCentralImpulse(new THREE.Vector3(-200, 200, 0));
    }
    if (keyboard.pressed("right")) {
        player.applyCentralImpulse(new THREE.Vector3(200, 200, 0));
    }

    if (keyboard.pressed("up")) {
        player.applyCentralImpulse(new THREE.Vector3(0, 200, -200));
    }

    if (keyboard.pressed("down")) {
        player.applyCentralImpulse(new THREE.Vector3(0, 200, 200));
    }

    if (keyboard.pressed("space")) {
        player.applyCentralImpulse(new THREE.Vector3(0, 750, 0));
    }
}

function animate() {
    keyboardEvents();
    scene.simulate();
    camera.lookAt(player.position);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function startGame() {
    init();
    addLight();
    addEnvironment();
    addPlayer();
    animate();
}
