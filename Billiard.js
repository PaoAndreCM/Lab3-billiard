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
window.frameMesh = frameMesh;

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
  const x = Math.random() * (MAX_X - MIN_X) + MIN_X;
  const y = -0.043;
  const z = Math.random() * (MAX_Z - MIN_Z) + MIN_Z;
  return new THREE.Vector3(x, y, z);
}

const ballRadius = 0.05715; // 57.15 mm
const minDistance = 2 * ballRadius; // Minimum distance to avoid overlap
const MAX_X = playingSurfaceLength / 2 - minDistance;
const MIN_X = -playingSurfaceLength / 2 + minDistance;
const MAX_Z = playingSurfaceWidth / 2 - minDistance;
const MIN_Z = -playingSurfaceWidth / 2 + minDistance;

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

function generateBall(i){
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

let ballSpeeds = [];
window.ballSpeeds = ballSpeeds;
const multiplier = 1;
function generateBallSpeed(){
  let ballSpeed = new THREE.Vector3(multiplier*Math.random(), 0, multiplier*Math.random());
  ballSpeeds.push(ballSpeed);
}

for (let i = 0; i < 8; i++) {
  generateBall(i);
  generateBallSpeed();
}

const planeNormal = new THREE.Vector3(0,1,0);

// * Render loop
const computerClock = new THREE.Clock();
const controls = new TrackballControls( camera, renderer.domElement );

let elapsedTime = 0;
function aSecondHasPassed(h){
  elapsedTime = elapsedTime+h;
  if (elapsedTime >= 1){
    elapsedTime = 0;
    return true;
  }
  return false;
}

function render() {
  requestAnimationFrame(render);

  const h = computerClock.getDelta();
  const t = computerClock.getElapsedTime();

  const decayFactor20percent = 0.8;
  const decayFactor30percent = 0.7;

balls.forEach((ball, index) => {  

    // Reflection at the walls
    if(ball.position.x > MAX_X + ballRadius) {
        ballSpeeds[index].x = -decayFactor20percent*Math.abs(ballSpeeds[index].x);
    }
    if(ball.position.z > MAX_Z + ballRadius) {
        ballSpeeds[index].z = -decayFactor20percent*Math.abs(ballSpeeds[index].z);
    }
    if(ball.position.x < MIN_X - ballRadius) {
        ballSpeeds[index].x = decayFactor20percent*Math.abs(ballSpeeds[index].x);
    }
    if(ball.position.z < MIN_Z - ballRadius) {
        ballSpeeds[index].z = decayFactor20percent*Math.abs(ballSpeeds[index].z);
    }

    // Motion
    if (aSecondHasPassed(h)) {
      ballSpeeds[index].multiplyScalar(decayFactor20percent);
     }
    ball.position.add(ballSpeeds[index].clone().multiplyScalar(h));
    const om = ballSpeeds[index].length() / ballRadius;
    const axis = planeNormal.clone().cross(ballSpeeds[index]).normalize();

    const dR = new THREE.Matrix4().makeRotationAxis(axis, om * h);
    ball.matrix.premultiply(dR);
    ball.matrix.setPosition(ball.position);

    // Elastic collision between balls
    for (let j = index + 1; j < balls.length; j++) {
        const ball2 = balls[j];

        const dist = ball.position.clone().sub(ball2.position);
        const minDistance = 2 * ballRadius;

        if (dist.lengthSq() < 4 * ballRadius * ballRadius) {
            // Collision detected, calculate new velocities

            const u1 = ballSpeeds[index].clone();
            const u2 = ballSpeeds[j].clone();

            const diffU = u1.clone().sub(u2);
            const factor = dist.dot(diffU) / dist.lengthSq();

            // Update velocities after collision
            ballSpeeds[index].sub(dist.clone().multiplyScalar(factor)).multiplyScalar(decayFactor30percent);
            ballSpeeds[j].add(dist.clone().multiplyScalar(factor)).multiplyScalar(decayFactor30percent);

            // Adjust positions to avoid overlap (optional depending on your simulation requirements)
            const pushDistance = (minDistance - dist.length()) / 2;
            const pushDirection = dist.clone().normalize().multiplyScalar(pushDistance);

            // Move balls apart to avoid overlap
            ball.position.add(pushDirection);
            ball2.position.sub(pushDirection);
        }
    }
});


  light.position.copy(camera.position.clone());
  controls.update();
  renderer.render(scene, camera);
}
render();
