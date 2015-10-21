var scene, camera, renderer, player, keyboard, steering, gassPedal;
var remotePlayers = [];
var localPlayers = [];
var playerID = -1;
var moveForce = 250;
var ws;
var server_url = 'ws://localhost:8000';

Physijs.scripts.worker = '/js/physijs_worker.js';
Physijs.scripts.ammo = '/js/ammo.js';

function initWebSocket() {
    ws = new WebSocket(server_url);

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

function initSceneCameraRenderer() {
    scene = new Physijs.Scene();
    scene.setGravity(new THREE.Vector3(0, -230, 0));
    camera = new THREE.PerspectiveCamera(45, (window.innerWidth / window.innerHeight), 0.1, 10000);
    camera.position.set(0, 70, 200);
    scene.add(camera);
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0xDBDBDB));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);
}

function initLight() {
    var light = new THREE.DirectionalLight(0xF5F5F5, 1);
    light.position.set(0, 500, 100);
    light.castShadow = true;
    light.shadowDarkness = 0.5;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x0505050));
}

function initKeyboardAndJoysticks() {
    keyboard = new THREEx.KeyboardState();
    steering = new VirtualJoystick({
        container: document.getElementById('container'),
        strokeStyle: '#333333',
        limitStickTravel: true,
        stickRadius: 50,
        mouseSupport: true
    });

    steering.addEventListener('touchStartValidation', function(event) {
        return (event.changedTouches[0].pageX < window.innerWidth / 2);
    });

    gassPedal = new VirtualJoystick({
        container: document.getElementById('container'),
        strokeStyle: '#333333',
        limitStickTravel: true,
        stickRadius: 50,
        mouseSupport: true
    });

    gassPedal.addEventListener('touchStartValidation', function(event) {
        return (event.changedTouches[0].pageX > window.innerWidth / 2);
    });
}

function initPlayer() {
    player = getMesh(0xDF565B);
    player.position.y = 50;
    scene.add(player);
}

function initEnvironment() {
    var material = getMaterial(0x919191);
    var ground = new Physijs.BoxMesh(new THREE.BoxGeometry(500, 5, 500), material, 0);
    ground.receiveShadow = true;
    scene.add(ground);
}

function getMesh(meshColor) {
    var geometry = new THREE.BoxGeometry(5, 5, 5);
    var material = getMaterial(meshColor);
    var mesh = new Physijs.BoxMesh(geometry, material, 100);
    mesh.castShadow = true;
    return mesh;
}

function getMaterial(color) {
    return new Physijs.createMaterial(new THREE.MeshLambertMaterial({
        color: color
    }), 0.8, 0.3);
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
    remotePlayer.position.set(remotePlayerPosition.x, remotePlayerPosition.y, remotePlayerPosition.z);
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

function handleJoystickAndKeyboardEvents() {
    var force;
    if (keyboard.pressed("left") || steering.left()) {
        force = new THREE.Vector3(-moveForce, 100, 0);
    }
    if (keyboard.pressed("right") || steering.right()) {
        force = new THREE.Vector3(moveForce, 100, 0);
    }
    if (keyboard.pressed("up") || steering.up()) {
        force = new THREE.Vector3(0, 100, -moveForce);
    }
    if (keyboard.pressed("down") || steering.down()) {
        force = new THREE.Vector3(0, 100, moveForce);
    }

    if (keyboard.pressed("space") || gassPedal.up()) {
        player.applyCentralImpulse(new THREE.Vector3(0, 600, 0));
    }
    if (force !== undefined) {
        player.applyCentralImpulse(force.applyQuaternion(camera.quaternion));
    }
}

function loop() {
    camera.lookAt(player.position);
    handleJoystickAndKeyboardEvents();
    setMaximumVelocity();
    scene.simulate();
    setTimeout(loop, 1000 / 60);
}

function render() {
    updatePlayers();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function initGame() {
    initWebSocket();
    initSceneCameraRenderer();
    initEnvironment();
    initLight();
    initPlayer();
    initKeyboardAndJoysticks();
    startGame();
}

function startGame() {
    loop();
    render();
}
