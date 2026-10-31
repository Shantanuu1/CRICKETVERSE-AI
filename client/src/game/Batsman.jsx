/**
 * Batsman.jsx
 * 3D Batsman procedural model and shot animation controller.
 */

import * as THREE from 'three';

export class BatsmanEntity {
  constructor(scene) {
    this.scene = scene;
    this.mesh = this.createMesh();
    this.scene.add(this.mesh);
    this.currentShot = 'STANCE';
    this.animTime = 0;
  }

  createMesh() {
    const group = new THREE.Group();
    group.position.set(0.3, 0, -8); // At batting crease

    // White jersey torso
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.2, 12);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    group.add(torso);

    // Head with navy helmet
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3 });
    const head = new THREE.Mesh(headGeo, helmetMat);
    head.position.y = 2.45;
    group.add(head);

    // Face grille
    const grilleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8);
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.rotation.x = Math.PI / 2;
    grille.position.set(0, 2.38, 0.2);
    group.add(grille);

    // Batting Pads (Legs)
    const padMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const padGeo = new THREE.CylinderGeometry(0.14, 0.12, 1.0, 10);

    const leftLeg = new THREE.Mesh(padGeo, padMat);
    leftLeg.position.set(-0.2, 0.5, 0.05);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(padGeo, padMat);
    rightLeg.position.set(0.2, 0.5, -0.05);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Arms & Bat Pivot Group
    this.batArmGroup = new THREE.Group();
    this.batArmGroup.position.set(-0.35, 1.8, 0);

    // Wooden Cricket Bat
    const bladeGeo = new THREE.BoxGeometry(0.18, 0.85, 0.05);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const blade = new THREE.Mesh(bladeGeo, woodMat);
    blade.position.y = -0.45;
    blade.castShadow = true;

    // Bat handle with grip
    const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x22c55e }); // Electric green grip
    const handle = new THREE.Mesh(handleGeo, gripMat);
    handle.position.y = 0.15;

    this.batArmGroup.add(blade);
    this.batArmGroup.add(handle);
    group.add(this.batArmGroup);

    // Initial stance orientation: side-on facing bowler (+Z)
    group.rotation.y = -Math.PI / 2;
    return group;
  }

  playShot(shotType) {
    this.currentShot = shotType;
    this.animTime = 0;
  }

  resetStance() {
    this.currentShot = 'STANCE';
    this.animTime = 0;
    this.batArmGroup.rotation.set(0, 0, 0);
    this.mesh.rotation.set(0, -Math.PI / 2, 0);
    this.mesh.position.set(0.3, 0, -8);
  }

  update(delta = 0.016) {
    if (this.currentShot === 'STANCE') {
      // Gentle breathing idle bob
      this.mesh.position.y = Math.sin(performance.now() * 0.003) * 0.02;
      this.batArmGroup.rotation.z = 0.2 + Math.sin(performance.now() * 0.003) * 0.05;
      return;
    }

    this.animTime += delta;
    const t = Math.min(1.0, this.animTime / 0.35); // 350ms stroke animation

    switch (this.currentShot) {
      case 'DEFENSIVE_SHOT':
        // Step forward, straight bat prodded down
        this.mesh.position.z = -8 + t * 0.4;
        this.batArmGroup.rotation.x = -Math.PI * 0.25 * t;
        this.batArmGroup.rotation.z = -Math.PI * 0.1 * t;
        break;

      case 'LEG_SIDE_SHOT':
        // Rotate torso and roll wrists towards leg side
        this.mesh.rotation.y = -Math.PI / 2 + (Math.PI * 0.45 * t);
        this.batArmGroup.rotation.x = -Math.PI * 0.3 * t;
        this.batArmGroup.rotation.y = Math.PI * 0.35 * t;
        break;

      case 'OFF_SIDE_SHOT':
        // High elbow cover drive through off-side
        this.mesh.rotation.y = -Math.PI / 2 - (Math.PI * 0.35 * t);
        this.batArmGroup.rotation.x = -Math.PI * 0.4 * t;
        this.batArmGroup.rotation.z = Math.PI * 0.2 * t;
        break;

      case 'LOFTED_SHOT':
        // Big aerial follow-through upward
        this.mesh.position.z = -8 + t * 0.5;
        this.batArmGroup.rotation.x = -Math.PI * 0.7 * t; // High backlift and finish
        this.batArmGroup.rotation.y = -Math.PI * 0.2 * t;
        break;

      case 'LEAVE_BALL':
        // Shoulders arms: lift bat completely out of the way
        this.batArmGroup.rotation.x = Math.PI * 0.4 * t;
        this.batArmGroup.rotation.z = -Math.PI * 0.4 * t;
        break;

      default:
        break;
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
