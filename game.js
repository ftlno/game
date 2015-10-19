var scene, camera, renderer, player, keyboard;
var remotePlayers = [];
var localPlayers = [];
var playerID = -1;
var counter = 0;
var ws;

Physijs.scripts.worker = '/js/physijs_worker.js';
Physijs.scripts.ammo = '/js/ammo.js';

function init() {
    setupWebSocket();
    keyboard = new THREEx.KeyboardState();
    scene = new Physijs.Scene();
    scene.setGravity(new THREE.Vector3(0, -230, 0));
    camera = new THREE.PerspectiveCamera(45, (window.innerWidth / window.innerHeight), 0.1, 10000);
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0xDBDBDB));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
}

function setupWebSocket() {
    ws = new WebSocket('ws://localhost:8000');

    ws.onopen = function(event) {
        console.log("WebSocket connection open");
        updateServerPositions();
    };
    ws.onmessage = function(event) {
        if (event.data !== 'undefined') {
            var msg = JSON.parse(event.data);
            if (msg.type === 'ready') {
                playerID = msg.playerID;
                localPlayers.push(playerID);
            } else if (msg.type === 'position') {
                handlePositionUpdates(msg.position);
            } else if (msg.type === 'remove') {
                deleteRemotePlayer(msg.playerID);
            }
        }
    };
}

function updateServerPositions() {
    setInterval(function() {
        ws.send(JSON.stringify({
            "type": "position",
            "position": {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z
            }
        }));
    }, 30);
}

function handlePositionUpdates(positions) {
    remotePlayers = JSON.parse(positions);
}

function initLight() {
    var light = new THREE.DirectionalLight(0xF5F5F5, 1);
    light.position.set(0, 500, 100);
    light.castShadow = true;
    light.shadowDarkness = 0.5;
    scene.add(light);
    var ambLight = new THREE.AmbientLight(0x0505050);
    scene.add(ambLight);
}

function getMesh(meshColor) {
    var geometry = new THREE.BoxGeometry(5, 5, 5);
    var material = new Physijs.createMaterial(new THREE.MeshLambertMaterial({
        color: meshColor
    }), 0.8, 0.2);

    var mesh = new Physijs.BoxMesh(geometry, material, 100);
    mesh.castShadow = true;
    return mesh;
}

function initPlayer() {
    player = getMesh(0xDF565B);
    player.position.y = 50;
    player.add(camera);
    camera.position.set(100, 30, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    scene.add(player);
}

function initEnvironment() {
    var material = new Physijs.createMaterial(new THREE.MeshLambertMaterial({
        color: 0x919191
    }), 0.5, 0.5);

    var ground = new Physijs.BoxMesh(new THREE.BoxGeometry(10000, 5, 10000), material, 0);
    ground.receiveShadow = true;
    scene.add(ground);
}

function updatePlayers() {
    if (playerID !== -1) {
        for (var i = 0; i < remotePlayers.length; i++) {
            var remotePlayerID = remotePlayers[i].playerID;
            if (remotePlayerID !== playerID) {
                if (!knownPlayer(remotePlayerID)) {
                    createRemotePlayer(remotePlayerID);
                } else if (knownPlayer(remotePlayerID) && remotePlayerID !== playerID) {
                    updateRemotePlayer(remotePlayerID, remotePlayers[i].position);
                }
            }
        }
        localPlayers = remotePlayers.slice(0);
    }
}

function updateRemotePlayer(remotePlayerID, remotePlayerPosition) {
    var remotePlayer = scene.getObjectByName(remotePlayerID + "");
    remotePlayer.position.setX(remotePlayerPosition.x);
    remotePlayer.position.setY(remotePlayerPosition.y);
    remotePlayer.position.setZ(remotePlayerPosition.z);
}

function knownPlayer(remotePlayerID) {
    for (var i = 0; i < localPlayers.length; i++) {
        localPlayers[i].exist = false;
        if (localPlayers[i].playerID === remotePlayerID) {
            localPlayers[i].exist = true;
            return true;
        }
    }
    return false;
}

function setMaximumVelocity() {
    console.log()
    if (player.getLinearVelocity().y < -300) {
        player.setLinearVelocity({
            x: player.getLinearVelocity().x,
            y: -300,
            z: player.getLinearVelocity().z
        });
    }
}

function createRemotePlayer(remotePlayerID) {
    var remotePlayer = getMesh(0x28BCB3);
    remotePlayer.name = "" + remotePlayerID;
    scene.add(remotePlayer);
}

function deleteRemotePlayer(remotePlayerID) {
    var remotePlayer = scene.getObjectByName(remotePlayerID + "");
    scene.remove(remotePlayer);
}

function keyboardEvents() {
    if (keyboard.pressed("left")) {
        player.applyCentralImpulse(new THREE.Vector3(-200, 100, 0));
    }

    if (keyboard.pressed("right")) {
        player.applyCentralImpulse(new THREE.Vector3(200, 100, 0));
    }

    if (keyboard.pressed("up")) {
        player.applyCentralImpulse(new THREE.Vector3(0, 100, -200));
    }

    if (keyboard.pressed("down")) {
        player.applyCentralImpulse(new THREE.Vector3(0, 100, 200));
    }

    if (keyboard.pressed("space")) {
        player.applyCentralImpulse(new THREE.Vector3(0, 600, 0));
    }
}

function loop() {
    keyboardEvents();
    setMaximumVelocity();
    scene.simulate();
    setTimeout(loop, 1000 / 60);
}

function render() {
    updatePlayers();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function startGame() {
    init();
    initEnvironment();
    initLight();
    initPlayer();
    render();
    loop();
}
