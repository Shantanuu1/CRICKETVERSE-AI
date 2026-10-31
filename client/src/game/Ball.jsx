/**
 * Ball.jsx
 * Advanced 3D Cricket Ball entity with seam rotation, bounce physics,
 * Hawkeye trajectory tracer ribbon, pitch impact ring, and hit sparks.
 */

import * as THREE from 'three';

export class CricketBallEntity {
  constructor(scene) {
    this.scene = scene;
    this.mesh = this.createMesh();
    this.scene.add(this.mesh);

    // Hawkeye Trajectory Ribbon
    this.trailPoints = [];
    this.maxTrailLength = 22;
    this.trailLine = this.createTrailLine();
    this.scene.add(this.trailLine);

    // Pitch bounce ring marker
    this.bounceMarker = this.createBounceMarker();
    this.scene.add(this.bounceMarker);

    // Hit sparks particle system
    this.sparks = this.createSparksSystem();
    this.scene.add(this.sparks);

    this.reset();
  }

  createMesh() {
    const group = new THREE.Group();

    // Red polished leather ball sphere
    const ballGeo = new THREE.SphereGeometry(0.18, 20, 20);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Bright cricket red
      roughness: 0.3,
      metalness: 0.2
    });
    const sphere = new THREE.Mesh(ballGeo, ballMat);
    sphere.castShadow = true;
    group.add(sphere);

    // White pronounced seam
    const seamGeo = new THREE.TorusGeometry(0.182, 0.016, 8, 32);
    const seamMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8
    });
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.rotation.x = Math.PI / 2;
    group.add(seam);

    return group;
  }

  createTrailLine() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxTrailLength * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x38bdf8, // Electric cyan Hawkeye tracer
      linewidth: 3,
      transparent: true,
      opacity: 0.85
    });

    const line = new THREE.Line(geometry, material);
    line.visible = false;
    return line;
  }

  createBounceMarker() {
    const geo = new THREE.RingGeometry(0.1, 0.35, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa3e635, // Electric lime target ring
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.visible = false;
    return ring;
  }

  createSparksSystem() {
    const sparkCount = 45;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 6
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sparkVelocities = velocities;

    const mat = new THREE.PointsMaterial({
      color: 0xfef08a, // Glowing gold/yellow sparks
      size: 0.14,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    points.visible = false;
    this.sparkLife = 0;
    return points;
  }

  reset() {
    this.mesh.visible = false;
    this.mesh.position.set(0, 2.2, 11);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isBounced = false;
    this.inFlight = false;
    this.trailPoints = [];
    if (this.trailLine) this.trailLine.visible = false;
    if (this.bounceMarker) this.bounceMarker.visible = false;
  }

  deliver(pitchBounceZ = 2.0, targetX = 0.0) {
    this.mesh.visible = true;
    this.mesh.position.set(0.1, 2.2, 11);
    this.pitchBounceZ = pitchBounceZ;
    this.targetX = targetX;
    this.isBounced = false;
    this.inFlight = true;
    this.trailPoints = [this.mesh.position.clone()];

    if (this.trailLine) {
      this.trailLine.visible = true;
      this.trailLine.material.opacity = 0.85;
    }
    if (this.bounceMarker) this.bounceMarker.visible = false;

    // Delivery trajectory with slight curve/swing
    this.velocity.set(targetX * 0.04, -0.065, -0.56);
  }

  triggerSparks(position) {
    if (!this.sparks) return;
    this.sparks.position.copy(position);
    this.sparks.visible = true;
    this.sparks.material.opacity = 1.0;
    this.sparkLife = 1.0;

    const posAttr = this.sparks.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      posAttr.setXYZ(i, 0, 0, 0);
    }
    posAttr.needsUpdate = true;
  }

  update(delta = 0.016) {
    // Update sparks
    if (this.sparkLife > 0) {
      this.sparkLife -= delta * 2.5;
      this.sparks.material.opacity = Math.max(0, this.sparkLife);
      const posAttr = this.sparks.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vel = this.sparkVelocities[i];
        const x = posAttr.getX(i) + vel.x * delta;
        const y = posAttr.getY(i) + vel.y * delta - 9.8 * delta * delta;
        const z = posAttr.getZ(i) + vel.z * delta;
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
      if (this.sparkLife <= 0) this.sparks.visible = false;
    }

    if (!this.inFlight) return;

    this.mesh.position.add(this.velocity);
    this.mesh.rotation.x += 0.35;
    this.mesh.rotation.y += 0.2;

    // Update Hawkeye trail
    this.trailPoints.unshift(this.mesh.position.clone());
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.pop();
    }

    if (this.trailLine && this.trailPoints.length > 1) {
      const positions = this.trailLine.geometry.attributes.position.array;
      for (let i = 0; i < this.trailPoints.length; i++) {
        positions[i * 3] = this.trailPoints[i].x;
        positions[i * 3 + 1] = this.trailPoints[i].y;
        positions[i * 3 + 2] = this.trailPoints[i].z;
      }
      this.trailLine.geometry.attributes.position.needsUpdate = true;
      this.trailLine.geometry.setDrawRange(0, this.trailPoints.length);
    }

    // Pitch bounce detection
    if (!this.isBounced && this.mesh.position.z <= this.pitchBounceZ) {
      this.isBounced = true;
      this.mesh.position.y = 0.18;
      this.velocity.y = 0.092; // Upward bounce

      // Show glowing bounce ring at pitch spot
      if (this.bounceMarker) {
        this.bounceMarker.position.set(this.mesh.position.x, 0.02, this.mesh.position.z);
        this.bounceMarker.visible = true;
        this.bounceMarker.material.opacity = 0.9;
      }
    }

    // Fade bounce marker gradually
    if (this.bounceMarker && this.bounceMarker.visible) {
      this.bounceMarker.material.opacity -= delta * 1.5;
      if (this.bounceMarker.material.opacity <= 0) {
        this.bounceMarker.visible = false;
      }
    }

    // Passed crease
    if (this.mesh.position.z < -11) {
      this.inFlight = false;
    }
  }

  hitOutfield(runs, directionX = 0) {
    this.triggerSparks(this.mesh.position);

    let speed = 0.65;
    let vy = 0.08;
    if (runs === 6) {
      speed = 0.92;
      vy = 0.52; // Massive towering six
    } else if (runs === 4) {
      speed = 0.80;
      vy = 0.035; // Bullet carpet drive
    } else if (runs === 0) {
      speed = 0.04;
      vy = 0.01;
    }

    this.velocity.set(directionX * speed, vy, 0.48);
    this.inFlight = true;
  }

  destroy() {
    this.scene.remove(this.mesh);
    if (this.trailLine) this.scene.remove(this.trailLine);
    if (this.bounceMarker) this.scene.remove(this.bounceMarker);
    if (this.sparks) this.scene.remove(this.sparks);
  }
}
