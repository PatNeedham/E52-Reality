import React, { useRef, useMemo, FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import SuspendedChairKinematics from '../utils/SuspendedChairKinematics';

interface FPVCameraProps {
  kinematics: SuspendedChairKinematics;
  progress: number;
  curve: THREE.CatmullRomCurve3;
}

const FPVCamera: FC<FPVCameraProps> = ({ kinematics, progress, curve }) => {
  const leftCameraRef = useRef<THREE.PerspectiveCamera>(null!);
  const rightCameraRef = useRef<THREE.PerspectiveCamera>(null!);

  useFrame(_state => {
    if (!curve || !leftCameraRef.current || !rightCameraRef.current) return;

    const currentPoint = curve.getPointAt(progress);
    const nextPoint = curve.getPointAt(Math.min(progress + 0.01, 1));

    const { position, quaternion } = kinematics.update(currentPoint, nextPoint);

    // Position both cameras at the same location (person's head)
    const eyePosition = position.clone();
    eyePosition.y += 0.5; // Eye level above chair

    leftCameraRef.current.position.copy(eyePosition);
    leftCameraRef.current.quaternion.copy(quaternion);

    rightCameraRef.current.position.copy(eyePosition);
    rightCameraRef.current.quaternion.copy(quaternion);
  });

  return (
    <>
      <PerspectiveCamera ref={leftCameraRef} makeDefault fov={90} />
      <PerspectiveCamera ref={rightCameraRef} fov={90} />
    </>
  );
};

interface FirstPersonViewProps {
  curve: THREE.CatmullRomCurve3;
  progress: number;
}

const FirstPersonView: FC<FirstPersonViewProps> = ({ curve, progress }) => {
  const polePositions = useMemo(
    () => [
      new THREE.Vector3(-5, 10, -5),
      new THREE.Vector3(5, 10, -5),
      new THREE.Vector3(5, 10, 5),
      new THREE.Vector3(-5, 10, 5),
    ],
    []
  );

  const kinematics = useMemo(
    () =>
      new SuspendedChairKinematics({
        polePositions,
        initialChairPosition: new THREE.Vector3(0, 2, 0),
      }),
    [polePositions]
  );

  const curvePoints = curve ? curve.getPoints(50) : [];

  const vrContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#000',
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
  };

  const vrDisplayStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#000',
    display: 'flex',
    borderRadius: '12px',
    position: 'relative',
  };

  const eyeViewStyle: React.CSSProperties = {
    flex: 1,
    background: '#000',
    borderRadius: '12px',
    position: 'relative',
    margin: '4px',
    overflow: 'hidden',
  };

  const vrOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 10,
  };

  const eyeCircleBaseStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    width: '90%',
    height: '90%',
    transform: 'translate(-50%, -50%)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    background: 'radial-gradient(circle, transparent 60%, rgba(0, 0, 0, 0.7) 100%)',
  };

  const vrLabelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    fontWeight: 'bold',
    textAlign: 'center',
  };

  return (
    <div style={vrContainerStyle}>
      <div style={vrDisplayStyle}>
        <div style={eyeViewStyle}>
          <Canvas>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} />

            {/* Sky gradient */}
            <mesh>
              <sphereGeometry args={[100, 32, 32]} />
              <meshBasicMaterial color='#87CEEB' side={THREE.BackSide} transparent opacity={0.8} />
            </mesh>

            <FPVCamera kinematics={kinematics} progress={progress} curve={curve} />

            {/* Track visualization */}
            {curve && <Line points={curvePoints} color='#ff6b6b' lineWidth={3} />}

            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
              <planeGeometry args={[200, 200]} />
              <meshBasicMaterial color='#2d8659' />
            </mesh>

            {/* Poles */}
            {polePositions.map((pos, i) => (
              <mesh key={i} position={new THREE.Vector3(pos.x, pos.y / 2, pos.z)}>
                <cylinderGeometry args={[0.2, 0.2, 10, 8]} />
                <meshStandardMaterial color='gray' />
              </mesh>
            ))}
          </Canvas>
        </div>

        <div style={eyeViewStyle}>
          <Canvas>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} />

            {/* Sky gradient */}
            <mesh>
              <sphereGeometry args={[100, 32, 32]} />
              <meshBasicMaterial color='#87CEEB' side={THREE.BackSide} transparent opacity={0.8} />
            </mesh>

            <FPVCamera kinematics={kinematics} progress={progress} curve={curve} />

            {/* Track visualization */}
            {curve && <Line points={curvePoints} color='#ff6b6b' lineWidth={3} />}

            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
              <planeGeometry args={[200, 200]} />
              <meshBasicMaterial color='#2d8659' />
            </mesh>

            {/* Poles */}
            {polePositions.map((pos, i) => (
              <mesh key={i} position={new THREE.Vector3(pos.x, pos.y / 2, pos.z)}>
                <cylinderGeometry args={[0.2, 0.2, 10, 8]} />
                <meshStandardMaterial color='gray' />
              </mesh>
            ))}
          </Canvas>
        </div>
      </div>

      <div style={vrOverlayStyle}>
        <div style={{ ...eyeCircleBaseStyle, left: '25%' }} />
        <div style={{ ...eyeCircleBaseStyle, left: '75%' }} />
        <div style={vrLabelStyle}>VR First-Person View</div>
      </div>
    </div>
  );
};

export default FirstPersonView;
