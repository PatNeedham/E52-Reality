import React, { useRef, useMemo, useState, FC } from 'react';
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

// Facial expression component
interface FaceProps {
  gForce: number;
  speed: number;
}

const Face: FC<FaceProps> = ({ gForce, speed }) => {
  // Determine expression based on G-force and speed
  const getExpression = () => {
    const intensity = gForce + speed;
    if (intensity > 2.5) return 'scared'; // High G-forces or speed
    if (intensity > 1.0) return 'happy'; // Moderate values
    return 'neutral'; // Low values
  };

  const expression = getExpression();

  return (
    <group>
      {/* Eyes */}
      <mesh position={[-0.08, 0, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color='black' />
      </mesh>
      <mesh position={[0.08, 0, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color='black' />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.05, 0.19]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color='#ffdbac' />
      </mesh>

      {/* Mouth - changes based on expression */}
      {expression === 'neutral' && (
        <mesh position={[0, -0.12, 0.18]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.06, 8]} />
          <meshStandardMaterial color='#8B4513' />
        </mesh>
      )}

      {expression === 'happy' && (
        <mesh position={[0, -0.12, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.04, 0.01, 4, 12, Math.PI]} />
          <meshStandardMaterial color='#8B4513' />
        </mesh>
      )}

      {expression === 'scared' && (
        <mesh position={[0, -0.12, 0.18]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color='black' />
        </mesh>
      )}
    </group>
  );
};

// Separate component for cables to avoid transformation issues
interface CablesProps {
  chairPosition: THREE.Vector3;
  chairQuaternion: THREE.Quaternion;
}

const Cables: FC<CablesProps> = ({ chairPosition, chairQuaternion }) => {
  const chairCorners = useMemo(
    () => [
      new THREE.Vector3(-2.4, 0.3, -2.4), // Front left corner of seat (scaled properly)
      new THREE.Vector3(2.4, 0.3, -2.4), // Front right corner of seat (scaled properly)
      new THREE.Vector3(2.4, 0.3, 2.4), // Back right corner of seat (scaled properly)
      new THREE.Vector3(-2.4, 0.3, 2.4), // Back left corner of seat (scaled properly)
    ],
    []
  );

  const cablePoints = useMemo(() => {
    return POLE_TOPS.map((poleTop, i) => {
      // Calculate chair corner position in world space
      const chairCornerLocal = chairCorners[i].clone();
      chairCornerLocal.applyQuaternion(chairQuaternion);
      const chairCornerWorld = chairCornerLocal.add(chairPosition);

      return [poleTop.clone(), chairCornerWorld];
    });
  }, [chairPosition, chairQuaternion, chairCorners]);

  return (
    <>
      {cablePoints.map((points, i) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];
        return <Line key={i} points={points} color={colors[i]} lineWidth={4} />;
      })}
    </>
  );
};

const ChairModel: FC<ChairModelProps> = ({ kinematics: _kinematics, progress, curve: _curve }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const chairRef = useRef<THREE.Group>(null!);
  const [chairPosition, setChairPosition] = useState(new THREE.Vector3(0, CHAIR_HEIGHT, 0));
  const [chairQuaternion, setChairQuaternion] = useState(new THREE.Quaternion());
  const [centerOfGravityOffset, setCenterOfGravityOffset] = useState(new THREE.Vector3(0, 0, 0));
  const [gForce, setGForce] = useState(0);
  const [speed, setSpeed] = useState(0);

  useFrame(() => {
    if (!groupRef.current) return;

    // Center position between poles - chair stays centered
    const centerPosition = new THREE.Vector3(0, CHAIR_HEIGHT, 0);

    // Calculate swing forces based on progress (simulate external forces)
    const time = progress * Math.PI * 4; // Multiple cycles for demo
    const swingForceX = Math.sin(time) * 0.3; // Left/right swing
    const swingForceZ = Math.cos(time * 0.7) * 0.2; // Forward/back swing

    // Apply swing physics - center of gravity causes upper body to move opposite to force
    const seatTilt = new THREE.Vector3(swingForceX, 0, swingForceZ);

    // The seat position moves slightly with the applied force
    const seatPosition = centerPosition.clone().add(seatTilt);

    // Create rotation based on swing forces (like a real swing)
    const tiltAngleX = -swingForceZ * 0.3; // Pitch (forward/back tilt)
    const tiltAngleZ = swingForceX * 0.3; // Roll (left/right tilt)

    // Apply rotation to the chair
    const swingQuaternion = new THREE.Quaternion();
    swingQuaternion.setFromEuler(new THREE.Euler(tiltAngleX, 0, tiltAngleZ));

    // Center of gravity effect: upper body moves opposite to swing force
    const gravityOffset = new THREE.Vector3(-swingForceX * 0.5, 0, -swingForceZ * 0.5);

    // Calculate G-forces and speed for facial expressions
    const currentGForce = Math.sqrt(swingForceX * swingForceX + swingForceZ * swingForceZ) * 5; // Scale for effect
    const currentSpeed = Math.abs(Math.sin(time * 0.5)) * 2; // Simulate varying speed

    // Ensure chair is always at least 3 feet off the ground
    seatPosition.y = Math.max(CHAIR_HEIGHT, seatPosition.y);

    groupRef.current.position.copy(seatPosition);
    groupRef.current.quaternion.copy(swingQuaternion);

    // Update chair position and rotation for cables
    setChairPosition(seatPosition.clone());
    setChairQuaternion(swingQuaternion.clone());
    setCenterOfGravityOffset(gravityOffset);
    setGForce(currentGForce);
    setSpeed(currentSpeed);
  });

  return (
    <>
      {/* Cables rendered outside chair group */}
      <Cables chairPosition={chairPosition} chairQuaternion={chairQuaternion} />

      {/* Chair Group - Scaled up significantly for proper proportions (chair should be ~50% of pole height) */}
      <group ref={groupRef}>
        <group ref={chairRef} scale={[4.0, 4.0, 4.0]} rotation={[0, 0, 0]}>
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
          {/* Center of gravity effect: upper body moves opposite to swing force */}
          <group position={[centerOfGravityOffset.x, 0, centerOfGravityOffset.z]}>
            {/* Head - positioned higher since person is sitting */}
            <group position={[0, 0.9, 0]}>
              <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color='#ffdbac' />
              </mesh>
              {/* Face with expressions */}
              <Face gForce={gForce} speed={speed} />
            </group>

            {/* Torso - positioned directly on seat */}
            <Box position={[0, 0.3, 0]} args={[0.4, 0.6, 0.25]}>
              <meshStandardMaterial color='#4a90e2' />
            </Box>

            {/* Arms - positioned at torso level */}
            <Box position={[-0.3, 0.4, 0]} args={[0.12, 0.4, 0.12]}>
              <meshStandardMaterial color='#ffdbac' />
            </Box>
            <Box position={[0.3, 0.4, 0]} args={[0.12, 0.4, 0.12]}>
              <meshStandardMaterial color='#ffdbac' />
            </Box>
          </group>

          {/* Seatbelt - keeps person in place during tilting */}
          <group>
            {/* Seatbelt strap across chest */}
            <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 6]}>
              <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
              <meshStandardMaterial color='#2c2c2c' />
            </mesh>

            {/* Seatbelt buckle */}
            <mesh position={[0.15, 0.15, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.03]} />
              <meshStandardMaterial color='#666666' />
            </mesh>

            {/* Lap belt */}
            <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color='#2c2c2c' />
            </mesh>
          </group>

          {/* Legs extending forward at 90-degree angle from torso */}
          <Box position={[-0.15, 0.05, 0.4]} args={[0.12, 0.12, 0.6]}>
            <meshStandardMaterial color='#2c3e50' />
          </Box>
          <Box position={[0.15, 0.05, 0.4]} args={[0.12, 0.12, 0.6]}>
            <meshStandardMaterial color='#2c3e50' />
          </Box>

          {/* Feet */}
          <Box position={[-0.15, 0.05, 0.75]} args={[0.12, 0.12, 0.2]}>
            <meshStandardMaterial color='#654321' />
          </Box>
          <Box position={[0.15, 0.05, 0.75]} args={[0.12, 0.12, 0.2]}>
            <meshStandardMaterial color='#654321' />
          </Box>
        </group>
      </group>
    </>
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
    <Canvas camera={{ position: [15, 10, -15], fov: 60 }}>
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
