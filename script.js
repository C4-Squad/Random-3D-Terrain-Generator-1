import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';

const n = 64, s = 0.6;
let keys = [];
const loader = new THREE.TextureLoader();
const canvas = document.querySelector('#c');
canvas.addEventListener('keydown', (e) => {keys[e.keyCode] = true;});
canvas.addEventListener('keyup', (e) => {keys[e.keyCode] = false;});
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
//scene.fog = new THREE.Fog(0x71bce1, 16, 64);
scene.background = new THREE.Color(0x71bce1);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.y = 50;

const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(n/2, 0, n/2);

const grass = new THREE.MeshLambertMaterial({color : 0x48ad2d, side: THREE.DoubleSide});
const ice = new THREE.MeshPhongMaterial({color : 0xdbf1fd, side: THREE.DoubleSide});
const dirt = new THREE.MeshLambertMaterial({color : 0x9b7653, side: THREE.DoubleSide});
const water = new THREE.MeshLambertMaterial({color : 0x007577});
const rock = new THREE.MeshLambertMaterial({color : 0x5a4d41, side: THREE.DoubleSide});

let geometry = [];
let terrain = [];
function generate(terrain, x, y, s, spacing) {
    if (spacing == 1) return;
    let minConstraint = Math.max(terrain[x][y], terrain[x][y+spacing], terrain[x+spacing][y], terrain[x+spacing][y+spacing]) - s * spacing / (1 + 0.05 * Math.log2(spacing));
    let maxConstraint = Math.min(terrain[x][y], terrain[x][y+spacing], terrain[x+spacing][y], terrain[x+spacing][y+spacing]) + s * spacing / (1 + 0.05 * Math.log2(spacing));
    terrain[x+spacing/2][y+spacing/2] = minConstraint + (maxConstraint - minConstraint) * Math.random();
    if (terrain[x][y+spacing/2] == undefined) {
        minConstraint = Math.max(terrain[x][y], terrain[x][y+spacing], terrain[x+spacing/2][y+spacing/2]) - s * spacing / (2 + 0.1 * Math.log2(spacing));
        maxConstraint = Math.min(terrain[x][y], terrain[x][y+spacing], terrain[x+spacing/2][y+spacing/2]) + s * spacing / (2 + 0.1 * Math.log2(spacing));
        terrain[x][y+spacing/2] = minConstraint + (maxConstraint - minConstraint) * Math.random();
    }
    if (terrain[x+spacing/2][y+spacing] == undefined) {
        minConstraint = Math.max(terrain[x][y+spacing], terrain[x+spacing][y+spacing], terrain[x+spacing/2][y+spacing/2]) - s * spacing / (2 + 0.1 * Math.log2(spacing));
        maxConstraint = Math.min(terrain[x][y+spacing], terrain[x+spacing][y+spacing], terrain[x+spacing/2][y+spacing/2]) + s * spacing / (2 + 0.1 * Math.log2(spacing));
        terrain[x+spacing/2][y+spacing] = minConstraint + (maxConstraint - minConstraint) * Math.random();
    }
    if (terrain[x+spacing][y+spacing/2] == undefined) {
        minConstraint = Math.max(terrain[x+spacing][y+spacing], terrain[x+spacing][y], terrain[x+spacing/2][y+spacing/2]) - s * spacing / (2 + 0.1 * Math.log2(spacing));
        maxConstraint = Math.min(terrain[x+spacing][y+spacing], terrain[x+spacing][y], terrain[x+spacing/2][y+spacing/2]) + s * spacing / (2 + 0.1 * Math.log2(spacing));
        terrain[x+spacing][y+spacing/2] = minConstraint + (maxConstraint - minConstraint) * Math.random();
    }
    if (terrain[x+spacing/2][y] == undefined) {
        minConstraint = Math.max(terrain[x+spacing][y], terrain[x][y], terrain[x+spacing/2][y+spacing/2]) - s * spacing / (2 + 0.1 * Math.log2(spacing));
        maxConstraint = Math.min(terrain[x+spacing][y], terrain[x][y], terrain[x+spacing/2][y+spacing/2]) + s * spacing / (2 + 0.1 * Math.log2(spacing));
        terrain[x+spacing/2][y] = minConstraint + (maxConstraint - minConstraint) * Math.random();
    }
    generate(terrain, x, y, s, spacing / 2);
    generate(terrain, x, y+spacing/2, s, spacing / 2);
    generate(terrain, x+spacing/2, y, s, spacing / 2);
    generate(terrain, x+spacing/2, y+spacing/2, s, spacing / 2);
}
let mesh = [];
let line = [];
for (let i = 0; i <= n; ++i) {
    line = [];
    for (let j = 0; j <= n; ++j) {
        line.push(undefined);
    }
    terrain.push(line);
}
terrain[0][0] = ((Math.random()*n*s)-n*s/2)/(1 + 0.05 * Math.log2(2*n));
terrain[0][n] = ((Math.random()*n*s)-n*s/2)/(1 + 0.05 * Math.log2(2*n));
terrain[n][0] = ((Math.random()*n*s)-n*s/2)/(1 + 0.05 * Math.log2(2*n));
terrain[n][n] = ((Math.random()*n*s)-n*s/2)/(1 + 0.05 * Math.log2(2*n));
generate(terrain, 0, 0, s, n);
for (let i = 0; i < n; ++i) {
    for (let j = 0; j < n; ++j) {
        geometry.push(new THREE.BufferGeometry());
        let vertices = new Float32Array([
            i,   terrain[i][j],     j,
            i,   terrain[i][j+1],   j+1,
            i+1, terrain[i+1][j],   j,
        ]);
        geometry[geometry.length-1].setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry[geometry.length-1].computeVertexNormals();
        let maxHeight = Math.max(terrain[i][j], terrain[i][j+1], terrain[i+1][j]);
        if (maxHeight >= 0.26*n*s) {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], ice));
        } else if (maxHeight >= 0.24*n*s) {
            if (Math.random() < 0.5)
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], ice));
            else
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], rock));
        } else if (maxHeight >= 0.14*n*s) {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], rock));
        } else if (maxHeight >= -0.02*n*s) {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], grass));
        } else if (maxHeight >= -0.07*n*s) {
            if (Math.random() < 0.5)
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], grass));
            else
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], dirt));
        } else {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], dirt));
        }
        geometry.push(new THREE.BufferGeometry());
        vertices = new Float32Array([
            i,   terrain[i][j+1],   j+1,
            i+1, terrain[i+1][j],   j,
            i+1, terrain[i+1][j+1], j+1,
        ]);
        geometry[geometry.length-1].setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry[geometry.length-1].computeVertexNormals();
        maxHeight = Math.max(terrain[i][j+1], terrain[i+1][j], terrain[i+1][j+1]);
        if (maxHeight >= 0.26*n*s) {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], ice));
        } else if (maxHeight >= 0.24*n*s) {
            if (Math.random() < 0.5)
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], ice));
            else
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], rock));
        } else if (maxHeight >= 0.14*n*s) {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], rock));
        } else if (maxHeight >= -0.02*n*s) {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], grass));
        } else if (maxHeight >= -0.07*n*s) {
            if (Math.random() < 0.5)
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], grass));
            else
                mesh.push(new THREE.Mesh(geometry[geometry.length - 1], dirt));
        } else {
            mesh.push(new THREE.Mesh(geometry[geometry.length - 1], dirt));
        }
    }
}
for (let i = 0; i < mesh.length; ++i) {
    scene.add(mesh[i]);
}

function elevation(x, z) {
    x = Math.min(Math.max(0, x), n - 0.00001);
    z = Math.min(Math.max(0, z), n - 0.00001);
    let y = 0;
    if ((x % 1) + (z % 1) < 1) {
        y = (1 - (x % 1) - (z % 1)) * terrain[Math.floor(x)][Math.floor(z)]
            + (z % 1) * terrain[Math.floor(x)][Math.floor(z) + 1]
            + (x % 1) * terrain[Math.floor(x) + 1][Math.floor(z)] + 1.2;
    } else {
        y = ((x % 1) + (z % 1) - 1) * terrain[Math.floor(x) + 1][Math.floor(z) + 1]
            + (1 - (x % 1)) * terrain[Math.floor(x)][Math.floor(z) + 1]
            + (1 - (z % 1)) * terrain[Math.floor(x) + 1][Math.floor(z)] + 1.2;
    }
    return y;
}
/*-------*
 * WATER *
 *-------*/
/*
//Pre-set water properties 
const waterProperties = [Math.random() * 14, Math.random() * 3, Math.random(), Math.random() * Math.PI, Math.random() * 10];

//Generate a sine wave height for water
function waveGeneration(x){
	return waterProperties[1] * Math.sin(waterProperties[4] * x - waterProperties[2] * waterProperties[0] + waterProperties[3]);
}

//******it still doesn't work, i think you should try buffergeometry //ok then
const waterGeometry = new THREE.BufferGeometry();

//for triangle creation
var point_array = [];

waterGeometry.setAttribute( 'position', new THREE.BufferAttribute( point_array, 3 ) );

//x
for(let x = 0; x < n; x++){
	//z
	for(let z = 0; z < n; z++){
		//clear array
		point_array.length = 0;
		//create triangle
		if((x + 1) != 64){
			//vertex A
			point_array.push(x);
			point_array.push(waveGeneration(x) * 10);
			point_array.push(z);
			//vertex B
			point_array.push(x + 1);
			point_array.push(waveGeneration(x + 1) * 10);
			point_array.push(z);
			//vertex C
	 		point_array.push(x);
			point_array.push(waveGeneration(x) * 10);
			point_array.push(z - 1);
		}
		scene.add(new THREE.Mesh( point_array, water ));
		//point_array.push(x);
		//point_array.push(waveGeneration(x) * 10);
		//point_array.push(z);
	}
}

waterGeometry.setAttribute( 'position', new THREE.BufferAttribute( point_array, 3 ) );
const the_water = new THREE.MeshBasicMaterial( { color: 0x007577 } );

const waterMesh = new THREE.Mesh( waterGeometry, the_water );
waterMesh.rotation.x = -Math.PI/2;
waterMesh.position.y = -0.1*n*s;
waterMesh.position.x = n/2;
waterMesh.position.z = n/2;*/



const waterGeometry = new THREE.PlaneGeometry(n, n);
const waterLevel = new THREE.Mesh(waterGeometry, water);
scene.add(waterLevel);
waterLevel.rotation.x = -Math.PI/2;
waterLevel.position.y = -0.1*n*s;
waterLevel.position.x = n/2;
waterLevel.position.z = n/2;

/*-------*
 * LIGHT *
 *-------*/

const light = new THREE.DirectionalLight(0xFFFFFF, 1);
light.position.set(-1, 4, 2);
scene.add(light);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
let sunGeometry = new THREE.SphereGeometry(24);
let sunMesh = new THREE.Mesh(sunGeometry, new THREE.MeshBasicMaterial({color : 0xfce570}));
sunMesh.position.x = -100;
sunMesh.position.y = 400;
sunMesh.position.z = 200;
scene.add(sunMesh);

/*-----*
 * YOU *
 *-----*/

const playerCamera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
playerCamera.position.x = n/2;
playerCamera.position.y = 0;
playerCamera.position.z = n/2;
/*-------------*
 * RENDER LOOP *
 *-------------*/

let playerView = true;
let rotation = 0;
let height = 0;
let wait = 0;
function render(time) {
    requestAnimationFrame(render);
    //convert time to seconds
    time *= 0.001;
    const canva = renderer.domElement;
    camera.aspect = canva.clientWidth/canva.clientHeight; 
    camera.updateProjectionMatrix();
    controls.update();
    if (keys[32] && wait == 0) {
        playerView = !playerView;
        wait = 15;
    }
    if (wait > 0) --wait;//hack to make switching work
    if (keys[37] || keys[65]) {//left arrow
        rotation += Math.PI/80;
    }
    if (keys[87]) {//up arrow
        playerCamera.position.x -= Math.sin(rotation) * 0.08;
        playerCamera.position.z -= Math.cos(rotation) * 0.08;
    }
    if (keys[38]) {
        height += Math.PI/80;
    }
    if (keys[40]) {
        height -= Math.PI/80;
    }
    if (height >= Math.PI/3) {
        height = Math.PI/3;
    }
    if (height <= -Math.PI/3) {
        height = -Math.PI/3;
    }
    if (keys[39] || keys[68]) {//right arrow
        rotation -= Math.PI/80;
    }
    //abcdefghijklmnopqrstuvwxyz
    //56789012345678901234567890
    //66666777777777788888888889
    if (keys[83]) {//down arrow
        playerCamera.position.x += Math.sin(rotation) * 0.06;
        playerCamera.position.z += Math.cos(rotation) * 0.06;
    }
    if (playerCamera.position.x < 0) {
        playerCamera.position.x = 0;
    }
    if (playerCamera.position.x > n - 0.00001) {
        playerCamera.position.x = n - 0.00001;
    }
    if (playerCamera.position.z < 0) {
        playerCamera.position.z = 0;
    }
    if (playerCamera.position.z > n - 0.00001) {
        playerCamera.position.z = n - 0.00001;
    }
    playerCamera.position.y = elevation(playerCamera.position.x, playerCamera.position.z) + 1.2;
    playerCamera.lookAt(playerCamera.position.x -Math.sin(rotation) * 6, elevation(playerCamera.position.x - Math.sin(rotation) * 6, playerCamera.position.z - Math.cos(rotation) * 6) + 1 + Math.tan(height) * 6, playerCamera.position.z - Math.cos(rotation) * 6);
    if (playerView)
        renderer.render(scene, playerCamera);
    else
        renderer.render(scene, camera);
}

render(0);