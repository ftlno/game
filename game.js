var ws;
var playerID = -1;
var scene, camera, renderer, player, keyboard;
var players = [];
var counter = 0;
var remotePlayers = [];

Physijs.scripts.worker = '/js/physijs_worker.js';
Physijs.scripts.ammo = '/js/ammo.js';

function init() {
	setupWebSocket();
	
	keyboard = new THREEx.KeyboardState();
	scene = new Physijs.Scene;
	scene.setGravity(new THREE.Vector3(0, -230, 0));
	camera = new THREE.PerspectiveCamera(55, (window.innerWidth / window.innerHeight), 0.1, 10000);
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
	ws = new WebSocket('ws://10.0.20.14:8000');
	
	ws.onopen = function(event) {
		console.log("WebSocket connection open");
		startPositionUpdates();
	};
	ws.onmessage = function(event) {
		var msg = JSON.parse(event.data);
		if (msg.type === 'ready') {
			console.log("My id is " + msg.id);
			playerID = msg.id;
		} else if (msg.type === 'pos') {
			handlePositionUpdates(msg.pos);
		}
	}
}

function handlePositionUpdates(positions) {
	remotePlayers = positions;
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

function updatePlayers() {
	for (var i = 0; i < remotePlayers.length; i++) {
		for (var j = 0; j < players.length; j++) {
			if (remotePlayers[i].playerID == players[j]) {
				var newPlayer = scene.getObjectByName("" + players[j]);
				newPlayer.position = new THREE.Vector3();
				newPlayer.position.setX(remotePlayers[i].position.x);
				newPlayer.position.setY(remotePlayers[i].position.y);
				newPlayer.position.setZ(remotePlayers[i].position.z);
			}
		}
	}
}

function newRemotePlayer(playerID) {
	var newPlayer = getMesh(0x00ff00);
	newPlayer.name = "" + playerID;
	players.push(playerID);
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

function mockMovePlayers() {
	for (var i = 0; i < remotePlayers.length; i++) {
		var move = Math.random();
		remotePlayers[i].position.x += Math.random() > 0.5 ? move : -move;
		remotePlayers[i].position.y += Math.random() > 0.5 ? move : -move;
	}
}

function mockPlayers() {
	for (var i = 0; i < 2; i++) {
		var id = Math.round(Math.random() * 100000);
		newRemotePlayer(id);
		var x = Math.floor(Math.random() * 50);
		var y = Math.floor(Math.random() * 50) + 50;
		var z = Math.floor(Math.random() * 50);
		remotePlayers.push({
			playerID: id,
			position: {
				x: Math.random() > 0.5 ? x : -x,
				y: y,
				z: Math.random() > 0.5 ? z : -z
			}
		});
	}
}

function animate() {
	updatePlayers();
	mockMovePlayers();
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
	mockPlayers();
	animate();
}

function startPositionUpdates() {
	setInterval(function() {
		ws.send(JSON.stringify({
			"type": "pos",
			"pos": {
				x: player.position.x,
				y: player.position.y,
				z: player.position.z
			}
		}));
	}, 50);
}