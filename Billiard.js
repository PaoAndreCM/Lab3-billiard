"use strict";

import * as THREE from "three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";


// * Initialize webGL
const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({canvas,
                                          antialias: true});
renderer.setClearColor('#ffffff');    // set background color
renderer.setSize(window.innerWidth, window.innerHeight);
// Create a new Three.js scene with camera and light
const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper());
const camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height,
                                            0.1, 1000 );

window.addEventListener("resize", function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

camera.position.set(.8, 4.7, -2);
camera.lookAt(scene.position);

// Add light sources
const light = new THREE.DirectionalLight();
light.position.set(0, 8, 2);
scene.add(light);

// remove this in the final version1
scene.add(new THREE.AxesHelper());
const wireframeMaterial = new THREE.MeshBasicMaterial({wireframe:true,
  color:0x000000,
  side:THREE.DoubleSide});
const material = new THREE.MeshBasicMaterial({wireframe:false,
  color:0x505050,
  side:THREE.DoubleSide})
  material.transparent = true;
  material.opacity = 0.5;

window.camera = camera;

// * Add your billiard simulation here

const feltMaterial = new THREE.MeshStandardMaterial({
  color: 0x159D75,
  metalness: 0.2,
  roughness: 0.8,
  flatShading: true,
  side:THREE.DoubleSide
});

const woodTexture = new THREE.TextureLoader().load('PoolBallSkins/wood-skin.jpg');
const woodNormalMap = new THREE.TextureLoader().load('PoolBallSkins/wood-skin-map.jpg');
const woodMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture,
  normalMap: woodNormalMap,
  roughness: 0.8,
  metalness: 0.2,
  side:THREE.DoubleSide
});

const baizeTexture = new THREE.TextureLoader().load('PoolBallSkins/baize-texture.jpg');
const baizeNormalMap = new THREE.TextureLoader().load('PoolBallSkins/baize-map.jpg');
const baizeMaterial = new THREE.MeshStandardMaterial({
  map: baizeTexture,
  normalMap: baizeNormalMap,
  roughness: 0.8,
  metalness: 0.2
});

// Add table
const tableWidth = 1.37 // assuming each world unit = 1m
const tableLength = 2.36
const playingSurfaceWidth = .99 // assuming each world unit = 1m
const playingSurfaceLength = 1.98

// Table frame
const outerFrame = new THREE.Shape();
outerFrame.moveTo(-tableLength/2, -tableWidth/2);
outerFrame.lineTo(-tableLength/2, tableWidth/2);
outerFrame.lineTo(tableLength/2, tableWidth/2);
outerFrame.lineTo(tableLength/2, -tableWidth/2);
outerFrame.lineTo(-tableLength/2, -tableWidth/2);

const innerFrame = new THREE.Shape();
innerFrame.moveTo(-playingSurfaceLength/2, -playingSurfaceWidth/2);
innerFrame.lineTo(-playingSurfaceLength/2, playingSurfaceWidth/2);
innerFrame.lineTo(playingSurfaceLength/2, playingSurfaceWidth/2);
innerFrame.lineTo(playingSurfaceLength/2, -playingSurfaceWidth/2);
innerFrame.lineTo(-playingSurfaceLength/2, -playingSurfaceWidth/2);

outerFrame.holes.push(innerFrame);

const frameExtrudeSettings = {
	depth: 0.1,
	bevelEnabled: false,
};
const frameGeometry = new THREE.ExtrudeGeometry(outerFrame, frameExtrudeSettings);
const frameMesh = new THREE.Mesh(frameGeometry, feltMaterial);
// const frameMesh = new THREE.Mesh(frameGeometry, material);
scene.add(frameMesh);

// Tabletop 
const tableGeo = new THREE.BoxGeometry( tableLength, tableWidth, 0.1 ); 
const tableMesh = new THREE.Mesh( tableGeo, feltMaterial ); 
// const tableMesh = new THREE.Mesh( tableGeo, material ); 
tableMesh.position.set(0,0,0.1501)
frameMesh.add( tableMesh );

// Table legs
const legWidth = (tableLength - playingSurfaceLength)/2;
const legHight = .81; // assuming 1 world unit is equal to 1m

const xCoorLeg = tableLength/2 - legWidth;
const yCoorLeg = tableWidth/2 - legWidth;
const zCoorLeg = 0.2+ legHight/2;

const legPositions = [new THREE.Vector3(xCoorLeg, yCoorLeg, zCoorLeg),
  new THREE.Vector3(xCoorLeg, -yCoorLeg, zCoorLeg),
  new THREE.Vector3(-xCoorLeg, -yCoorLeg, zCoorLeg), 
  new THREE.Vector3(-xCoorLeg, yCoorLeg, zCoorLeg)]

for(let i = 0; i<4; i++){
  const legGeo = new THREE.BoxGeometry(legWidth, legWidth, legHight);
  const legMesh = new THREE.Mesh(legGeo, woodMaterial);
  // const legMesh = new THREE.Mesh(legGeo, material);
  legMesh.position.copy(legPositions[i]);
  frameMesh.add(legMesh);

}
frameMesh.rotation.x = Math.PI / 2;

// Add balls
function getRandomPosition() {
  const MAX_X = playingSurfaceLength / 2 - minDistance;
  const MIN_X = -playingSurfaceLength / 2 + minDistance;
  const MAX_Z = playingSurfaceWidth / 2 - minDistance;
  const MIN_Z = -playingSurfaceWidth / 2 + minDistance;
  const x = Math.random() * (MAX_X - MIN_X) + MIN_X;
  const y = -0.043;
  const z = Math.random() * (MAX_Z - MIN_Z) + MIN_Z;
  return new THREE.Vector3(x, y, z);
}

const ballRadius = 0.05715; // 57.15 mm
const minDistance = 2 * ballRadius; // Minimum distance to avoid overlap

let ballPositions = [];
window.ballPositions = ballPositions;

function isOverlapping(newPosition) {
  for (const position of ballPositions) {
    const distance = newPosition.distanceTo(position);
    if (distance < minDistance) {
      return true; // Overlapping
    }
  }
  return false; // Not overlapping
}

let balls = []
window.balls = balls;

for (let i = 0; i < 8; i++) {
  const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 16);
  const ballNum = 8 + i;
  const strBallNum = ballNum.toString();
  const path = 'PoolBallSkins/' + 'Ball' + strBallNum + '.jpg'
  const ballTexture = new THREE.TextureLoader().load(path);
  const ballMaterial = new THREE.MeshStandardMaterial({
    map: ballTexture,
    roughness: 0.1,
    metalness: 0.3,
  });
  const ballMesh = new THREE.Mesh(ballGeo, ballMaterial);
  do {
    ballMesh.position.copy(getRandomPosition());
  } while 
    ( isOverlapping(ballMesh.position) );
  ballPositions.push(ballMesh.position);
  balls.push(ballMesh);
  scene.add(ballMesh);
  ballMesh.updateMatrix();
  ballMesh.matrixAutoUpdate = false;
}





// * Render loop
const controls = new TrackballControls( camera, renderer.domElement );

function render() {
  requestAnimationFrame(render);


  light.position.copy(camera.position.clone());
  controls.update();
  renderer.render(scene, camera);
}
render();
