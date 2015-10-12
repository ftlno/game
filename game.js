var ws;
var playerID = -1;
var scene, camera, renderer, player, keyboard;
var remotePlayers = [];
var localPlayers = [];
var counter = 0;

Physijs.scripts.worker = '/js/physijs_worker.js';
Physijs.scripts.ammo = '/js/ammo.js';

function init() {
    setupWebSocket();

    keyboard = new THREEx.KeyboardState();
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -230, 0));
    camera = new THREE.PerspectiveCamera(45, (window.innerWidth / window.innerHeight), 0.1, 10000);
    camera.position.set(0, 100, 150);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(new THREE.Color(0xDBDBDB));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    document.body.appendChild(renderer.domElement);
}

function setupWebSocket() {
    ws = new WebSocket('ws://localhost:8000');

    ws.onopen = function(event) {
        console.log("WebSocket connection open");
        startPositionUpdates();
    };
    ws.onmessage = function(event) {
        if (event.data !== 'undefined') {
            var msg = JSON.parse(event.data);
            if (msg.type === 'ready') {
                playerID = msg.playerID;
            } else if (msg.type === 'position') {
                handlePositionUpdates(msg.position);
            } else if (msg.type === 'newPlayer') {
                newRemotePlayer(msg.playerID);
            }
        }
    };
}

function handlePositionUpdates(positions) {
    remotePlayers = JSON.parse(positions);
}

function addLight() {
    var light = new THREE.DirectionalLight(0xF5F5F5, 1);
    light.position.set(200, 300, 100);
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
        color: 0x919191
    }), 0.8, 0.3);

    var NoiseGen = new SimplexNoise;

    var ground_geometry = new THREE.PlaneGeometry(300, 300, 20, 20);
    for (var i = 0; i < ground_geometry.vertices.length; i++) {
        var vertex = ground_geometry.vertices[i];
        vertex.z = NoiseGen.noise(vertex.x / 50, vertex.y / 50) * 10;
    }

    ground_geometry.computeFaceNormals();
    ground_geometry.computeVertexNormals();
    ground = new Physijs.HeightfieldMesh(ground_geometry, ground_material, 0, 20, 20);
    ground.rotation.x = Math.PI / -2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function updatePlayers() {
    if (playerID !== -1) {
        for (var i = 0; i < remotePlayers.length; i++) {
            var remotePlayerID = remotePlayers[i].playerID;
            if (unknown(remotePlayerID)) {
                newRemotePlayer(remotePlayerID);
            } else if (remotePlayerID !== playerID) {
                var newPlayer = scene.getObjectByName(remotePlayerID + "");
                newPlayer.position.setX(remotePlayers[i].position.x);
                newPlayer.position.setY(remotePlayers[i].position.y);
                newPlayer.position.setZ(remotePlayers[i].position.z);
            }
        }
    }
    localPlayers = remotePlayers.slice(0);
}

function unknown(remotePlayerID) {
    if (localPlayers.length > 1) {
        return false;
    }
    for (var i = 0; i < localPlayers.length; i++) {
        if (localPlayers[i].playerID == remotePlayerID) {
            return false;
        }
    }
    return true;
}

function newRemotePlayer(remotePlayerID) {
    var newPlayer = getMesh(0x28BCB3);
    newPlayer.name = "" + remotePlayerID;
    scene.add(newPlayer);
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

function render() {
    updatePlayers();

    camera.lookAt(player.position);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function loop() {
    keyboardEvents();
    scene.simulate();
    setTimeout(loop, 1000 / 60);
}

function startGame() {
    init();
    addLight();
    addEnvironment();
    addPlayer();
    render();
    loop();
}

function startPositionUpdates() {
    setInterval(function() {
        ws.send(JSON.stringify({
            "type": "position",
            "position": {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z
            }
        }));
    }, 20);
}
