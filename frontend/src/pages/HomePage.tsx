import React, { useState, useMemo, useEffect, FC } from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import CourseEditor from '../components/CourseEditor';
import SpectatorView from '../components/SpectatorView';
import FirstPersonView from '../components/FirstPersonView';
import * as THREE from 'three';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 120px); /* Account for header and footer */
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  min-height: 0; /* Important for flex children to shrink */
`;

const EditorPanel = styled.div`
  flex: 3;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin: 0.5rem;
  padding: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ViewsPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem;
`;

const ViewContainer = styled.div`
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const MetricsPanel = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const MetricCard = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const ControlsContainer = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Slider = styled.input`
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const PlayButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s ease;

  &:hover {
    background: #1e7e34;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
  }
`;

const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SpeedButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    background: #0056b3;
  }

  &.active {
    background: #dc3545;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
`;

const SubTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #555;
  font-size: 1rem;
  font-weight: 500;
`;

const ProgressLabel = styled.span`
  font-size: 0.875rem;
  color: #666;
  min-width: 100px;
`;

interface SimulationMetrics {
  speed: number;
  gForce: number;
  verticalG: number;
  lateralG: number;
  altitude: number;
}

const HomePage: FC = () => {
  const { t } = useTranslation();
  const [points, setPoints] = useState<THREE.Vector3[]>([
    new THREE.Vector3(-6, 2, 0), // Start point (above ground)
    new THREE.Vector3(-2, 4, 3), // High point with curve
    new THREE.Vector3(0, 2, 5), // Mid height
    new THREE.Vector3(3, 6, 2), // Peak point
    new THREE.Vector3(8, 1, 0), // End point (different from start, above ground)
  ]);

  // State for curve control offsets - one for each segment between consecutive points
  const [curveControlOffsets, setCurveControlOffsets] = useState<THREE.Vector3[]>(() => {
    return Array(Math.max(0, points.length - 1))
      .fill(null)
      .map(() => new THREE.Vector3(0, 0, 0));
  });
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    speed: 0,
    gForce: 0,
    verticalG: 0,
    lateralG: 0,
    altitude: 0,
  });

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
      const segmentPoints = segmentCurve.getPoints(Math.ceil(divisions / (points.length - 1)));

      // Add points (avoid duplicating the end point except for the last segment)
      if (i === 0) {
        curvePoints.push(...segmentPoints);
      } else {
        curvePoints.push(...segmentPoints.slice(1));
      }
    }

    return curvePoints;
  };

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, true), [points]);

  // Create custom curve with control offsets
  const customCurvePoints = useMemo(() => {
    return generateCurvePointsWithControls(points, curveControlOffsets, 100);
  }, [points, curveControlOffsets]);

  const customCurve = useMemo(() => {
    if (customCurvePoints.length > 0) {
      return new THREE.CatmullRomCurve3(customCurvePoints, false);
    }
    return curve;
  }, [customCurvePoints, curve]);

  // Calculate physics metrics based on current position
  useEffect(() => {
    if (!customCurve || points.length < 2) return;

    const currentPoint = customCurve.getPointAt(progress);
    const prevPoint = customCurve.getPointAt(Math.max(progress - 0.01, 0));
    const nextPoint = customCurve.getPointAt(Math.min(progress + 0.01, 1));

    // Calculate velocity and acceleration
    const velocity = new THREE.Vector3().subVectors(nextPoint, prevPoint);
    const speed = velocity.length() * 50; // Scale for realistic speed (m/s)

    // Calculate acceleration (change in velocity)
    const prevVelocity = new THREE.Vector3().subVectors(currentPoint, prevPoint);
    const acceleration = new THREE.Vector3().subVectors(velocity, prevVelocity);

    // Calculate G-forces
    const totalG = acceleration.length() * 10; // Scale for G-force
    const verticalG = Math.abs(acceleration.y) * 10;
    const lateralG =
      Math.sqrt(acceleration.x * acceleration.x + acceleration.z * acceleration.z) * 10;

    setMetrics({
      speed: speed,
      gForce: totalG,
      verticalG: verticalG,
      lateralG: lateralG,
      altitude: currentPoint.y,
    });
  }, [progress, customCurve, points]);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 0.002 * playbackSpeed;
          if (newProgress >= 1) {
            setIsPlaying(false);
            return 1;
          }
          return newProgress;
        });
      }, 16); // ~60fps
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

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

  const handlePlayPause = () => {
    if (progress >= 1) {
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (isPlaying && newProgress >= 1) {
      setIsPlaying(false);
    }
  };

  return (
    <PageContainer>
      <MainContent>
        <EditorPanel>
          <SectionTitle>{t('course_editor')}</SectionTitle>
          <CourseEditor
            points={points}
            setPoints={setPoints}
            curve={customCurve}
            onPlay={handlePlayPause}
            isPlaying={isPlaying}
            progress={progress}
            curveControlOffsets={curveControlOffsets}
            setCurveControlOffsets={setCurveControlOffsets}
          />
        </EditorPanel>
        <ViewsPanel>
          <ViewContainer>
            <SubTitle>{t('spectator_view')}</SubTitle>
            <SpectatorView curve={customCurve} progress={progress} />
          </ViewContainer>
          <ViewContainer>
            <SubTitle>{t('fpv')}</SubTitle>
            <FirstPersonView curve={customCurve} progress={progress} />
          </ViewContainer>
        </ViewsPanel>
      </MainContent>

      <MetricsPanel>
        <MetricCard>
          <MetricValue>{metrics.speed.toFixed(1)}</MetricValue>
          <MetricLabel>Speed (m/s)</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.gForce.toFixed(2)}</MetricValue>
          <MetricLabel>Total G-Force</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.verticalG.toFixed(2)}</MetricValue>
          <MetricLabel>Vertical G</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.lateralG.toFixed(2)}</MetricValue>
          <MetricLabel>Lateral G</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{metrics.altitude.toFixed(1)}</MetricValue>
          <MetricLabel>Altitude (m)</MetricLabel>
        </MetricCard>
      </MetricsPanel>

      <ControlsContainer>
        <PlayButton onClick={handlePlayPause} disabled={points.length < 2}>
          {isPlaying ? t('pause') : t('play')}
        </PlayButton>

        <SpeedControl>
          <span>Speed:</span>
          {[0.5, 1, 2, 4].map(speed => (
            <SpeedButton
              key={speed}
              className={playbackSpeed === speed ? 'active' : ''}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}x
            </SpeedButton>
          ))}
        </SpeedControl>

        <ProgressLabel>Progress: {Math.round(progress * 100)}%</ProgressLabel>

        <Slider
          type='range'
          min='0'
          max='1'
          step='0.001'
          value={progress}
          onChange={handleProgressChange}
        />
      </ControlsContainer>
    </PageContainer>
  );
};

export default HomePage;
