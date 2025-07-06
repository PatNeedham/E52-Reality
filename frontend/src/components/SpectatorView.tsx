import React, { useRef, useMemo, FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import SuspendedChairKinematics from '../utils/SuspendedChairKinematics';

// Hard-coded pole position constants for precise cable attachment
const POLE_HEIGHT = 20; // 20 units = 6 feet tall poles
const POLE_SPACING = 15;
const CHAIR_HEIGHT = 10; // 10 units = 3 feet off the ground

const FRONT_LEFT_POLE_TOP = new THREE.Vector3(-POLE_SPACING / 2, POLE_HEIGHT, -POLE_SPACING / 2);
const FRONT_LEFT_POLE_BOTTOM = new THREE.Vector3(-POLE_SPACING / 2, 0, -POLE_SPACING / 2);
const FRONT_RIGHT_POLE_TOP = new THREE.Vector3(POLE_SPACING / 2, POLE_HEIGHT, -POLE_SPACING / 2);
const FRONT_RIGHT_POLE_BOTTOM = new THREE.Vector3(POLE_SPACING / 2, 0, -POLE_SPACING / 2);
const BACK_RIGHT_POLE_TOP = new THREE.Vector3(POLE_SPACING / 2, POLE_HEIGHT, POLE_SPACING / 2);
const BACK_RIGHT_POLE_BOTTOM = new THREE.Vector3(POLE_SPACING / 2, 0, POLE_SPACING / 2);
const BACK_LEFT_POLE_TOP = new THREE.Vector3(-POLE_SPACING / 2, POLE_HEIGHT, POLE_SPACING / 2);
const BACK_LEFT_POLE_BOTTOM = new THREE.Vector3(-POLE_SPACING / 2, 0, POLE_SPACING / 2);

const POLE_TOPS = [
  FRONT_LEFT_POLE_TOP,
  FRONT_RIGHT_POLE_TOP,
  BACK_RIGHT_POLE_TOP,
  BACK_LEFT_POLE_TOP,
];

const POLE_BOTTOMS = [
  FRONT_LEFT_POLE_BOTTOM,
  FRONT_RIGHT_POLE_BOTTOM,
  BACK_RIGHT_POLE_BOTTOM,
  BACK_LEFT_POLE_BOTTOM,
];

interface ChairModelProps {
  kinematics: SuspendedChairKinematics;
  progress: number;
  curve: THREE.CatmullRomCurve3;
}

const ChairModel: FC<ChairModelProps> = ({ kinematics, progress, curve }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const chairRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!curve || !groupRef.current) return;

    const currentPoint = curve.getPointAt(progress);
    const nextPoint = curve.getPointAt(Math.min(progress + 0.01, 1));

    const { position, quaternion } = kinematics.update(currentPoint, nextPoint);

    // Ensure chair is always at least 3 feet off the ground
    position.y = Math.max(CHAIR_HEIGHT, position.y);

    groupRef.current.position.copy(position);
    groupRef.current.quaternion.copy(quaternion);
  });

  // Chair corner positions relative to chair center (for cable connections)
  // These positions are in world coordinates relative to the chair's position
  // Updated to match the actual scaled chair size (1.2 * 4.0 = 4.8 units)
  const chairCorners = useMemo(
    () => [
      new THREE.Vector3(-2.4, 0.3, -2.4), // Front left corner of seat (scaled properly)
      new THREE.Vector3(2.4, 0.3, -2.4), // Front right corner of seat (scaled properly)
      new THREE.Vector3(2.4, 0.3, 2.4), // Back right corner of seat (scaled properly)
      new THREE.Vector3(-2.4, 0.3, 2.4), // Back left corner of seat (scaled properly)
    ],
    []
  );

  return (
    <group ref={groupRef}>
      {/* Cables from pole tops to chair corners */}
      {POLE_TOPS.map((poleTop, i) => {
        // Get the chair's current world position and rotation
        const chairWorldPos = groupRef.current
          ? groupRef.current.position
          : new THREE.Vector3(0, 0, 0);
        const chairRotation = groupRef.current
          ? groupRef.current.quaternion
          : new THREE.Quaternion();

        // Calculate chair corner position in world space, accounting for rotation
        const chairCornerLocal = chairCorners[i].clone();
        chairCornerLocal.applyQuaternion(chairRotation);
        const chairCornerWorld = chairCornerLocal.add(chairWorldPos);

        const cablePoints = [
          poleTop, // Start exactly at pole top
          chairCornerWorld, // End at chair corner in world space
        ];
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];

        return <Line key={i} points={cablePoints} color={colors[i]} lineWidth={4} />;
      })}

      {/* Chair Group - Scaled up significantly for proper proportions (chair should be ~50% of pole height) */}
      <group ref={chairRef} scale={[4.0, 4.0, 4.0]}>
        {/* Chair Seat */}
        <Box position={[0, 0, 0]} args={[1.2, 0.15, 1.2]}>
          <meshStandardMaterial color='#8B4513' />
        </Box>

        {/* Chair Back */}
        <Box position={[0, 0.6, -0.5]} args={[1.2, 1.2, 0.15]}>
          <meshStandardMaterial color='#8B4513' />
        </Box>

        {/* Chair Arms */}
        <Box position={[-0.5, 0.3, -0.2]} args={[0.15, 0.6, 0.8]}>
          <meshStandardMaterial color='#8B4513' />
        </Box>
        <Box position={[0.5, 0.3, -0.2]} args={[0.15, 0.6, 0.8]}>
          <meshStandardMaterial color='#8B4513' />
        </Box>

        {/* Stick Figure Person - Scaled up for proper proportions */}
        {/* Head */}
        <mesh position={[0, 1.4, -0.3]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color='#ffdbac' />
        </mesh>

        {/* Torso */}
        <Box position={[0, 0.8, -0.3]} args={[0.4, 0.8, 0.25]}>
          <meshStandardMaterial color='#4a90e2' />
        </Box>

        {/* Arms */}
        <Box position={[-0.3, 0.9, -0.3]} args={[0.12, 0.5, 0.12]}>
          <meshStandardMaterial color='#ffdbac' />
        </Box>
        <Box position={[0.3, 0.9, -0.3]} args={[0.12, 0.5, 0.12]}>
          <meshStandardMaterial color='#ffdbac' />
        </Box>

        {/* Legs */}
        <Box position={[-0.15, 0.2, -0.3]} args={[0.12, 0.6, 0.12]}>
          <meshStandardMaterial color='#2c3e50' />
        </Box>
        <Box position={[0.15, 0.2, -0.3]} args={[0.12, 0.6, 0.12]}>
          <meshStandardMaterial color='#2c3e50' />
        </Box>
      </group>
    </group>
  );
};

interface SpectatorViewProps {
  curve: THREE.CatmullRomCurve3;
  progress: number;
}

const SpectatorView: FC<SpectatorViewProps> = ({ curve, progress }) => {
  const kinematics = useMemo(
    () =>
      new SuspendedChairKinematics({
        polePositions: POLE_TOPS,
        initialChairPosition: new THREE.Vector3(0, POLE_HEIGHT * 0.7, 0), // Chair starts at 70% of pole height
      }),
    []
  );

  return (
    <Canvas camera={{ position: [12, 8, 12], fov: 60 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[12, 15, 12]} />
      <directionalLight position={[6, 12, 6]} intensity={0.5} />

      {/* Hardwood floor */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color='#8B4513' />
      </mesh>

      {/* Wood grain texture effect */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color='#D2691E' transparent opacity={0.3} />
      </mesh>

      {/* Poles using bottom positions for placement */}
      {POLE_BOTTOMS.map((pos, i) => (
        <Cylinder
          key={i}
          args={[0.5, 0.5, POLE_HEIGHT, 8]}
          position={new THREE.Vector3(pos.x, POLE_HEIGHT / 2, pos.z)}
        >
          <meshStandardMaterial color='#666666' />
        </Cylinder>
      ))}

      {/* Pole bases for stability */}
      {POLE_BOTTOMS.map((pos, i) => (
        <Cylinder
          key={`base-${i}`}
          args={[1.5, 1.5, 1, 8]}
          position={new THREE.Vector3(pos.x, 0.5, pos.z)}
        >
          <meshStandardMaterial color='#444444' />
        </Cylinder>
      ))}

      <ChairModel kinematics={kinematics} progress={progress} curve={curve} />

      <OrbitControls
        enableDamping={true}
        dampingFactor={0.05}
        target={[0, POLE_HEIGHT * 0.5, 0]}
        maxPolarAngle={Math.PI * 0.8}
        minDistance={5}
        maxDistance={25}
      />
    </Canvas>
  );
};

export default SpectatorView;
