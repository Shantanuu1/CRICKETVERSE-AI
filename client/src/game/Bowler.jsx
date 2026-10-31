/**
 * Bowler.jsx
 * 3D Bowler procedural model with run-up and delivery swing animation.
 */

import * as THREE from 'three';

export class BowlerEntity {
  constructor(scene) {
    this.scene = scene;
    this.mesh = this.createMesh();
    this.scene.add(this.mesh);
    this.reset();
  }

  createMesh() {
    const group = new THREE.Group();

    // Torso (Dark green / charcoal jersey)
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 1.25, 12);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.4;
    group.add(head);

    // Legs / Pants
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 1.0, 8);

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.16, 0.5, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.16, 0.5, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Bowling Arm
    this.armPivot = new THREE.Group();
    this.armPivot.position.set(0.35, 2.0, 0);

    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.9, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x166534 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.y = -0.4;
    this.armPivot.add(arm);

    group.add(this.armPivot);

    // Face the batsman (-Z)
    group.rotation.y = Math.PI;
    return group;
  }

  reset() {
    this.isBowling = false;
    this.hasReleased = false;
    this.animTime = 0;
    this.mesh.position.set(0, 0, 16); // Run-up start position
    this.armPivot.rotation.set(0, 0, 0);
  }

  startDelivery(onReleaseCallback) {
    this.reset();
    this.isBowling = true;
    this.onRelease = onReleaseCallback;
  }

  update(delta = 0.016) {
    if (!this.isBowling) return;

    this.animTime += delta;

    // Phase 1: Run-up (0.0 to 1.2s)
    if (this.animTime < 1.2) {
      const progress = this.animTime / 1.2;
      this.mesh.position.z = 16 - progress * 5; // runs from 16 to 11
      this.mesh.position.y = Math.abs(Math.sin(this.animTime * 12)) * 0.15; // Running stride bob
      this.armPivot.rotation.x = Math.sin(this.animTime * 10) * 0.5;
    }
    // Phase 2: Delivery stride and arm windmill (1.2 to 1.5s)
    else if (this.animTime < 1.5) {
      const deliveryProgress = (this.animTime - 1.2) / 0.3;
      // Arm rotates full 360 over the top
      this.armPivot.rotation.x = deliveryProgress * Math.PI * 2;

      // Ball release at apex of windmill
      if (!this.hasReleased && deliveryProgress > 0.6) {
        this.hasReleased = true;
        if (this.onRelease) this.onRelease();
      }
    }
    // Phase 3: Follow-through (1.5 to 2.2s)
    else if (this.animTime < 2.2) {
      const followProgress = (this.animTime - 1.5) / 0.7;
      this.mesh.position.z = 11 - followProgress * 1.5;
      this.armPivot.rotation.x = Math.PI * 0.4;
    } else {
      this.isBowling = false;
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
