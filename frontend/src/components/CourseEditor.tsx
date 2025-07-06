import React, { useRef, useState, useEffect, useMemo, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Sphere, Text, Html } from '@react-three/drei';
import styled from '@emotion/styled';
import * as THREE from 'three';

const EditorContainer = styled.div`
  height: 100%;
  position: relative;
`;

const ControlsPanel = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    background: #0056b3;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;

const PlayButton = styled(Button)`
  background: #28a745;
  font-weight: bold;

  &:hover {
    background: #1e7e34;
  }
`;

const RecenterButton = styled(Button)`
  background: #28a745;

  &:hover {
    background: #1e7e34;
  }
`;

const RemoveButton = styled(Button)`
  background: #dc3545;

  &:hover {
    background: #c82333;
  }
`;

const DeleteButton = styled(Button)`
  background: #dc3545;
  width: 100%;
  margin-top: 0.5rem;

  &:hover {
    background: #c82333;
  }
`;

const InfoPanel = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  min-width: 200px;
  font-size: 0.875rem;
`;

const Tooltip = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  pointer-events: none;
  white-space: nowrap;
  max-width: 200px;
  text-align: center;
  z-index: 1000;
`;

// Axis helper component
const AxisHelper: FC = () => {
  return (
    <group>
      {/* X-axis (Red) */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, 0, 0)]}
        color='red'
        lineWidth={3}
      />
      <Text position={[5.5, 0, 0]} fontSize={0.5} color='red'>
        X
      </Text>

      {/* Y-axis (Green) */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5, 0)]}
        color='green'
        lineWidth={3}
      />
      <Text position={[0, 5.5, 0]} fontSize={0.5} color='green'>
        Y
      </Text>

      {/* Z-axis (Blue) */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 5)]}
        color='blue'
        lineWidth={3}
      />
      <Text position={[0, 0, 5.5]} fontSize={0.5} color='blue'>
        Z
      </Text>
    </group>
  );
};

// Animated progress dot component
interface ProgressDotProps {
  curve: THREE.CatmullRomCurve3;
  progress: number;
  isVisible: boolean;
}

const ProgressDot: FC<ProgressDotProps> = ({ curve, progress, isVisible }) => {
  const dotRef = useRef<THREE.Mesh>(null!);
  const arrowRef = useRef<THREE.Group>(null!);

  if (!isVisible || !curve) return null;

  const currentPoint = curve.getPointAt(progress);
  const nextPoint = curve.getPointAt(Math.min(progress + 0.01, 1));

  // Calculate direction for arrow
  const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint).normalize();
  const arrowPosition = currentPoint.clone().add(direction.multiplyScalar(0.5));

  return (
    <group>
      {/* Animated dot */}
      <Sphere ref={dotRef} position={currentPoint} args={[0.3, 16, 16]}>
        <meshBasicMaterial color='orange' />
      </Sphere>

      {/* Direction arrow */}
      <group ref={arrowRef} position={arrowPosition}>
        <mesh rotation={[0, 0, Math.atan2(direction.z, direction.x)]}>
          <coneGeometry args={[0.2, 0.8, 8]} />
          <meshBasicMaterial color='yellow' />
        </mesh>
      </group>
    </group>
  );
};

interface DraggablePointProps {
  position: THREE.Vector3;
  onDrag: (newPosition: THREE.Vector3) => void;
  onSelect: () => void;
  isSelected: boolean;
  index: number;
  totalPoints: number;
  onDragStart: () => void;
  onDragEnd: () => void;
}

// New interface for curve control points
interface CurveControlPointProps {
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
  onControlPointDrag: (offset: THREE.Vector3) => void;
  controlOffset: THREE.Vector3;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const CurveControlPoint: FC<CurveControlPointProps> = ({
  startPoint,
  endPoint,
  onControlPointDrag,
  controlOffset,
  onDragStart,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { camera, gl } = useThree();
  const dragPlane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());

  // Calculate the midpoint between start and end
  const midPoint = useMemo(() => {
    return new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
  }, [startPoint, endPoint]);

  // Calculate the control point position
  const controlPosition = useMemo(() => {
    return midPoint.clone().add(controlOffset);
  }, [midPoint, controlOffset]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    onDragStart();

    // Set up drag plane perpendicular to camera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    dragPlane.current.setFromNormalAndCoplanarPoint(cameraDirection, controlPosition);

    // Calculate offset from intersection point to object position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(
        (e.clientX / gl.domElement.clientWidth) * 2 - 1,
        -(e.clientY / gl.domElement.clientHeight) * 2 + 1
      ),
      camera
    );

    if (raycaster.ray.intersectPlane(dragPlane.current, intersection.current)) {
      offset.current.subVectors(controlPosition, intersection.current);
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
    onDragEnd();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      e.stopPropagation();

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(
        new THREE.Vector2(
          (e.clientX / gl.domElement.clientWidth) * 2 - 1,
          -(e.clientY / gl.domElement.clientHeight) * 2 + 1
        ),
        camera
      );

      if (raycaster.ray.intersectPlane(dragPlane.current, intersection.current)) {
        const newPosition = intersection.current.clone().add(offset.current);
        const newOffset = newPosition.clone().sub(midPoint);
        onControlPointDrag(newOffset);
      }
    }
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    document.body.style.cursor = 'default';
  };

  return (
    <group>
      {/* Line from start to control point */}
      <Line
        points={[startPoint, controlPosition]}
        color='yellow'
        lineWidth={1}
        opacity={isHovered ? 0.8 : 0.4}
        transparent
      />

      {/* Line from control point to end */}
      <Line
        points={[controlPosition, endPoint]}
        color='yellow'
        lineWidth={1}
        opacity={isHovered ? 0.8 : 0.4}
        transparent
      />

      {/* Control point sphere */}
      <Sphere
        position={controlPosition}
        args={[0.15, 12, 12]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <meshStandardMaterial
          color={isHovered ? 'gold' : 'yellow'}
          transparent
          opacity={isHovered ? 0.9 : 0.6}
        />
      </Sphere>

      {/* Tooltip */}
      {isHovered && (
        <Html position={[controlPosition.x, controlPosition.y + 0.8, controlPosition.z]} center>
          <Tooltip>
            Curve Control
            <br />
            <small>Drag to adjust curve</small>
          </Tooltip>
        </Html>
      )}
    </group>
  );
};

const DraggablePoint: FC<DraggablePointProps> = ({
  position,
  onDrag,
  onSelect,
  isSelected,
  index,
  totalPoints,
  onDragStart,
  onDragEnd,
}) => {
  const ref = useRef<THREE.Mesh>(null!);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { camera, gl } = useThree();
  const dragPlane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    onSelect();
    onDragStart();

    // Set up drag plane perpendicular to camera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    dragPlane.current.setFromNormalAndCoplanarPoint(cameraDirection, position);

    // Calculate offset from intersection point to object position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(
        (e.clientX / gl.domElement.clientWidth) * 2 - 1,
        -(e.clientY / gl.domElement.clientHeight) * 2 + 1
      ),
      camera
    );

    if (raycaster.ray.intersectPlane(dragPlane.current, intersection.current)) {
      offset.current.subVectors(position, intersection.current);
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
    onDragEnd();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      e.stopPropagation();

      // Calculate new position based on mouse position and drag plane
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(
        new THREE.Vector2(
          (e.clientX / gl.domElement.clientWidth) * 2 - 1,
          -(e.clientY / gl.domElement.clientHeight) * 2 + 1
        ),
        camera
      );

      if (raycaster.ray.intersectPlane(dragPlane.current, intersection.current)) {
        const newPosition = intersection.current.clone().add(offset.current);
        // Prevent points from going below ground
        newPosition.z = Math.max(0, newPosition.z);
        onDrag(newPosition);
      }
    }
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
  };

  // Determine point color based on type
  const getPointColor = () => {
    if (isSelected) return 'hotpink';
    if (index === 0) return 'green'; // Start point
    if (index === totalPoints - 1) return 'red'; // End point
    return 'royalblue';
  };

  const getTooltipText = () => {
    if (index === 0) return 'Starting Point';
    if (index === totalPoints - 1) return 'Ending Point';
    return `Point ${index + 1}`;
  };

  // Calculate tooltip position to avoid overlap with dot
  const tooltipPosition = useMemo(() => {
    const offset = 1.2; // Distance from point
    return new THREE.Vector3(position.x, position.y + offset, position.z);
  }, [position]);

  return (
    <group>
      <Sphere
        ref={ref}
        position={position}
        args={[0.2, 16, 16]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <meshStandardMaterial color={getPointColor()} />
      </Sphere>

      {/* Tooltip */}
      {isHovered && (
        <Html position={tooltipPosition} center>
          <Tooltip>
            {getTooltipText()}
            <br />
            <small>Click to edit</small>
            <br />
            <small>
              X: {position.x.toFixed(2)}, Y: {position.y.toFixed(2)}, Z: {position.z.toFixed(2)}
            </small>
          </Tooltip>
        </Html>
      )}
    </group>
  );
};

interface CourseEditorProps {
  points: THREE.Vector3[];
  setPoints: React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;
  curve: THREE.CatmullRomCurve3;
  onPlay?: () => void;
  isPlaying?: boolean;
  progress?: number;
  curveControlOffsets?: THREE.Vector3[];
  setCurveControlOffsets?: React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;
}

// Component to handle camera controls and re-centering
const CameraController: FC<{
  points: THREE.Vector3[];
  shouldRecenter: boolean;
  onRecenterComplete: () => void;
  isDragging: boolean;
}> = ({ points, shouldRecenter, onRecenterComplete, isDragging }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  React.useEffect(() => {
    if (shouldRecenter && controlsRef.current && points.length > 0) {
      // Calculate bounding box of all points
      const box = new THREE.Box3();
      points.forEach(point => box.expandByPoint(point));

      // Get the center and size of the bounding box
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Calculate the maximum dimension
      const maxDim = Math.max(size.x, size.y, size.z);

      // Set camera position to frame all points with some padding
      const distance = maxDim * 2.5; // Add padding
      camera.position.set(center.x + distance, center.y + distance, center.z + distance);

      // Set the controls target to the center of the points
      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      onRecenterComplete();
    }
  }, [shouldRecenter, points, camera, onRecenterComplete]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isDragging}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
};

// Function to generate curve points with control offsets
const generateCurvePointsWithControls = (
  points: THREE.Vector3[],
  controlOffsets: THREE.Vector3[],
  divisions: number = 50
): THREE.Vector3[] => {
  if (points.length < 2) return [];

  const curvePoints: THREE.Vector3[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const startPoint = points[i];
    const endPoint = points[i + 1];
    const controlOffset = controlOffsets[i] || new THREE.Vector3(0, 0, 0);

    // Calculate the midpoint and control point
    const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
    const controlPoint = midPoint.clone().add(controlOffset);

    // Create a quadratic bezier curve for this segment
    const segmentCurve = new THREE.QuadraticBezierCurve3(startPoint, controlPoint, endPoint);
    const segmentPoints = segmentCurve.getPoints(divisions / (points.length - 1));

    // Add points (avoid duplicating the end point except for the last segment)
    if (i === 0) {
      curvePoints.push(...segmentPoints);
    } else {
      curvePoints.push(...segmentPoints.slice(1));
    }
  }

  return curvePoints;
};

const CourseEditor: FC<CourseEditorProps> = ({
  points,
  setPoints,
  curve,
  onPlay,
  isPlaying = false,
  progress = 0,
  curveControlOffsets: propCurveControlOffsets,
  setCurveControlOffsets: setPropCurveControlOffsets,
}) => {
  const { t } = useTranslation();
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // State for curve control offsets - one for each segment between consecutive points
  const [localCurveControlOffsets, setLocalCurveControlOffsets] = useState<THREE.Vector3[]>(() => {
    return Array(Math.max(0, points.length - 1))
      .fill(null)
      .map(() => new THREE.Vector3(0, 0, 0));
  });

  // Use prop offsets if available, otherwise use local state
  const curveControlOffsets = propCurveControlOffsets || localCurveControlOffsets;
  const setCurveControlOffsets = setPropCurveControlOffsets || setLocalCurveControlOffsets;

  // Update curve control offsets when points change
  useEffect(() => {
    setCurveControlOffsets(prev => {
      const newOffsets = Array(Math.max(0, points.length - 1))
        .fill(null)
        .map(() => new THREE.Vector3(0, 0, 0));
      // Copy existing offsets if they exist
      for (let i = 0; i < Math.min(prev.length, newOffsets.length); i++) {
        newOffsets[i] = prev[i].clone();
      }
      return newOffsets;
    });
  }, [points.length]);

  const handleCurveControlDrag = (segmentIndex: number, newOffset: THREE.Vector3) => {
    const newOffsets = [...curveControlOffsets];
    newOffsets[segmentIndex] = newOffset;
    setCurveControlOffsets(newOffsets);
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedPointIndex !== null && points.length > 2) {
          event.preventDefault();
          handleRemovePoint();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPointIndex, points.length]);

  const handlePointDrag = (newPosition: THREE.Vector3, index: number) => {
    const newPoints = [...points];
    // Prevent points from going below ground (negative Z)
    newPosition.z = Math.max(0, newPosition.z);
    newPoints[index] = newPosition;
    setPoints(newPoints);
  };

  const handleAddPoint = () => {
    const lastPoint = points[points.length - 1] || new THREE.Vector3(0, 0, 0);
    // Ensure new points are at least at ground level
    const newZ = Math.max(0, lastPoint.z);
    setPoints([...points, new THREE.Vector3(lastPoint.x + 2, lastPoint.y, newZ)]);
  };

  const handleRemovePoint = () => {
    if (selectedPointIndex !== null && points.length > 2) {
      const newPoints = points.filter((_, i) => i !== selectedPointIndex);
      setPoints(newPoints);
      setSelectedPointIndex(null);
    }
  };

  const handleRecenterView = () => {
    setShouldRecenter(true);
  };

  const handleRecenterComplete = () => {
    setShouldRecenter(false);
  };

  // Generate curve points with control offsets
  const curvePoints = useMemo(() => {
    return generateCurvePointsWithControls(points, curveControlOffsets, 50);
  }, [points, curveControlOffsets]);

  // Calculate course statistics
  const courseLength = curve.getLength();
  const selectedPoint = selectedPointIndex !== null ? points[selectedPointIndex] : null;

  return (
    <EditorContainer>
      <ControlsPanel>
        <Button onClick={handleAddPoint}>{t('add_point')}</Button>
        <RemoveButton onClick={handleRemovePoint} disabled={selectedPointIndex === null}>
          {t('remove_selected')}
        </RemoveButton>
        <RecenterButton onClick={handleRecenterView}>{t('re_center_view')}</RecenterButton>
        {onPlay && (
          <PlayButton onClick={onPlay} disabled={isPlaying}>
            {isPlaying ? t('pause') : t('play')}
          </PlayButton>
        )}
      </ControlsPanel>

      <InfoPanel>
        <div>
          <strong>Course Info:</strong>
        </div>
        <div>Points: {points.length}</div>
        <div>Length: {courseLength.toFixed(2)}m</div>
        <div>Grid Scale: 1 unit = 1m</div>
        {selectedPoint && (
          <div>
            <br />
            <strong>Selected Point:</strong>
            <div>X: {selectedPoint.x.toFixed(2)}m</div>
            <div>Y: {selectedPoint.y.toFixed(2)}m (height)</div>
            <div>Z: {selectedPoint.z.toFixed(2)}m</div>
            <DeleteButton onClick={handleRemovePoint}>{t('delete')}</DeleteButton>
          </div>
        )}
      </InfoPanel>

      <Canvas camera={{ position: [10, 10, 10], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* Grass ground plane */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color='#4a7c3c' />
        </mesh>

        <gridHelper args={[50, 50]} />

        {/* Axis helper */}
        <AxisHelper />

        {points.map((pos, i) => (
          <DraggablePoint
            key={i}
            position={pos}
            onDrag={newPos => handlePointDrag(newPos, i)}
            onSelect={() => setSelectedPointIndex(i)}
            isSelected={selectedPointIndex === i}
            index={i}
            totalPoints={points.length}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />
        ))}

        {/* Curve control points between consecutive points */}
        {points.slice(0, -1).map((startPoint, i) => (
          <CurveControlPoint
            key={`curve-${i}`}
            startPoint={startPoint}
            endPoint={points[i + 1]}
            controlOffset={curveControlOffsets[i] || new THREE.Vector3(0, 0, 0)}
            onControlPointDrag={newOffset => handleCurveControlDrag(i, newOffset)}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />
        ))}

        <Line points={curvePoints} color='red' lineWidth={2} />

        {/* Animated progress dot */}
        <ProgressDot curve={curve} progress={progress} isVisible={isPlaying} />

        <CameraController
          points={points}
          shouldRecenter={shouldRecenter}
          onRecenterComplete={handleRecenterComplete}
          isDragging={isDragging}
        />
      </Canvas>
    </EditorContainer>
  );
};

export default CourseEditor;
