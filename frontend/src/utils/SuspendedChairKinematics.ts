import * as THREE from 'three';

interface KinematicsOptions {
  polePositions: THREE.Vector3[];
  initialChairPosition: THREE.Vector3;
}

interface KinematicsUpdateResult {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  ropeLengths: number[];
}

/**
 * A class to calculate the kinematics of a suspended chair system.
 */
class SuspendedChairKinematics {
  public polePositions: THREE.Vector3[];
  public chairPosition: THREE.Vector3;
  public chairQuaternion: THREE.Quaternion;
  public ropeLengths: number[];

  constructor({ polePositions, initialChairPosition }: KinematicsOptions) {
    this.polePositions = polePositions;
    this.chairPosition = initialChairPosition.clone();
    this.chairQuaternion = new THREE.Quaternion();
    this.ropeLengths = [1, 1, 1, 1];
  }

  public update(
    currentPoint: THREE.Vector3,
    nextPoint: THREE.Vector3,
    _rideType: string = 'Rollercoaster'
  ): KinematicsUpdateResult {
    const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint).normalize();

    // Only apply rotation if we have a significant direction change
    if (direction.length() > 0.01) {
      const up = new THREE.Vector3(0, 1, 0);

      // Calculate the target rotation more smoothly
      const targetQuaternion = new THREE.Quaternion();
      const matrix = new THREE.Matrix4();

      // Create a smoother rotation that points forward along the track
      const forward = direction.clone();
      const right = new THREE.Vector3().crossVectors(up, forward).normalize();
      const correctedUp = new THREE.Vector3().crossVectors(forward, right).normalize();

      matrix.makeBasis(right, correctedUp, forward);
      targetQuaternion.setFromRotationMatrix(matrix);

      // Apply very gentle banking and pitching
      const velocity = direction.length();
      const bankingAngle = -direction.z * 0.1 * velocity; // Much gentler banking
      const pitchAngle = direction.y * 0.05; // Much gentler pitching

      const euler = new THREE.Euler().setFromQuaternion(targetQuaternion, 'YXZ');
      euler.x += pitchAngle;
      euler.z += bankingAngle;

      const finalQuaternion = new THREE.Quaternion().setFromEuler(euler);

      // Much slower interpolation to prevent spinning
      this.chairQuaternion.slerp(finalQuaternion, 0.02);
    }

    this.chairPosition.copy(currentPoint);
    this.calculateRopeLengths();

    return {
      position: this.chairPosition,
      quaternion: this.chairQuaternion,
      ropeLengths: this.ropeLengths,
    };
  }

  private calculateRopeLengths(): void {
    for (let i = 0; i < 4; i++) {
      const polePos = this.polePositions[i];
      this.ropeLengths[i] = polePos.distanceTo(this.chairPosition);
    }
  }
}

export default SuspendedChairKinematics;
