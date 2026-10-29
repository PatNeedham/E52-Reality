import React, { useState, useMemo, useEffect, useRef, FC } from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import * as THREE from 'three';
import CourseEditor from '../components/CourseEditor';
import SpectatorView from '../components/SpectatorView';
import FirstPersonView from '../components/FirstPersonView';
import {
  computeRideProfile,
  sampleAt,
  advance,
  RideMode,
  MODE_DEFAULTS,
} from '../physics/rideProfile';
import { buildCourseCurve, DEFAULT_POINTS } from '../physics/course';
import { rememberMode } from '../mode/mode';
import { bp, useIsDesktop } from '../hooks/useMediaQuery';

/* ---------- layout ---------- */

const Studio = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh - 60px);
  background: #eef2f7;
  ${bp.lg} {
    display: grid;
    height: calc(100dvh - 60px);
    grid-template-columns: 2fr 1fr;
    grid-template-rows: minmax(0, 1fr) auto auto;
    grid-template-areas:
      'editor views'
      'metrics metrics'
      'controls controls';
  }
`;

const Panel = styled.section`
  background: #fff;
  border: 1px solid #dde3ec;
  border-radius: 12px;
  margin: 0.5rem;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const PanelTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 600;
  color: #3a4556;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid #eef1f5;
`;

const Fill = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;

const EditorArea = styled(Panel)`
  grid-area: editor;
`;

const ViewsArea = styled.div`
  grid-area: views;
  display: grid;
  grid-template-rows: 1fr 1fr;
  min-height: 0;
`;

/* mobile: one view with tabs */
const MobileStage = styled(Panel)`
  height: min(62dvh, 560px);
  ${bp.sm} {
    height: 60dvh;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.35rem;
  border-bottom: 1px solid #eef1f5;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  background: ${p => (p.active ? '#0b1220' : 'transparent')};
  color: ${p => (p.active ? '#fff' : '#3a4556')};
`;

const Metrics = styled.div`
  grid-area: metrics;
  flex: 0 0 auto;
  align-items: flex-start;
  display: flex;
  gap: 0.5rem;
  padding: 0 0.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  ${bp.lg} {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    overflow: visible;
  }
`;

const Metric = styled.div<{ warn?: boolean }>`
  flex: 0 0 auto;
  min-width: 112px;
  scroll-snap-align: start;
  background: #fff;
  border: 1px solid ${p => (p.warn ? '#f0a3a3' : '#dde3ec')};
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  text-align: center;
  strong {
    display: block;
    font-size: 1.35rem;
    color: ${p => (p.warn ? '#c0392b' : '#1565c0')};
    font-variant-numeric: tabular-nums;
  }
  span {
    font-size: 0.78rem;
    color: #5b6678;
  }
`;

const Warnings = styled.ul`
  margin: 0.25rem 0.75rem 0;
  padding-left: 1.1rem;
  color: #a5281b;
  font-size: 0.82rem;
  grid-column: 1 / -1;
`;

const Controls = styled.div`
  grid-area: controls;
  position: sticky;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 0.9rem;
  margin-top: auto;
  padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(6px);
  border-top: 1px solid #dde3ec;
`;

const PlayButton = styled.button`
  min-height: 44px;
  min-width: 96px;
  padding: 0 1.2rem;
  border: 0;
  border-radius: 999px;
  background: #1f9d55;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  &:disabled {
    background: #8a94a6;
  }
`;

const SpeedSelect = styled.select`
  min-height: 44px;
  border-radius: 8px;
  border: 1px solid #c9d2df;
  padding: 0 0.5rem;
  background: #fff;
`;

const Scrubber = styled.input`
  flex: 1 1 160px;
  min-width: 120px;
  height: 44px;
  accent-color: #1565c0;
`;

const ProgressLabel = styled.span`
  font-size: 0.85rem;
  color: #5b6678;
  font-variant-numeric: tabular-nums;
  min-width: 3.5rem;
`;

/** round to integer without printing "-0" */
const fmt0 = (x: number) => (Math.round(x) === 0 ? '0' : x.toFixed(0));

type TabKey = 'editor' | 'chase' | 'cockpit';

const HomePage: FC<{ mode: RideMode }> = ({ mode }) => {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<TabKey>('editor');

  const [points, setPoints] = useState<THREE.Vector3[]>(() => DEFAULT_POINTS[mode]());
  const [curveControlOffsets, setCurveControlOffsets] = useState<THREE.Vector3[]>(() =>
    Array(points.length - 1)
      .fill(null)
      .map(() => new THREE.Vector3())
  );
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // reset course when switching mode
  useEffect(() => {
    rememberMode(mode);
    const p = DEFAULT_POINTS[mode]();
    setPoints(p);
    setCurveControlOffsets(p.slice(1).map(() => new THREE.Vector3()));
    setProgress(0);
    setIsPlaying(false);
  }, [mode]);

  useEffect(() => {
    setCurveControlOffsets(prev =>
      Array(Math.max(0, points.length - 1))
        .fill(null)
        .map((_, i) => (prev[i] ? prev[i].clone() : new THREE.Vector3()))
    );
  }, [points.length]);

  const customCurve = useMemo(
    () => buildCourseCurve(points, curveControlOffsets),
    [points, curveControlOffsets]
  );

  const profile = useMemo(() => computeRideProfile(customCurve, { mode }), [customCurve, mode]);
  const m = sampleAt(profile, progress);

  // time-based playback: advance by v·dt along the real arc length
  const profileRef = useRef(profile);
  profileRef.current = profile;
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1) * playbackSpeed;
      last = now;
      setProgress(u => {
        const next = advance(profileRef.current, u, dt);
        if (next >= 1) setIsPlaying(false);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, playbackSpeed]);

  const togglePlay = () => {
    if (progress >= 1) setProgress(0);
    setIsPlaying(p => !p);
  };

  const scale = MODE_DEFAULTS[mode].scale;
  const metricCards =
    mode === 'flight'
      ? [
          { v: (m.speed * 1.944).toFixed(0), l: `${t('airspeed')} (kt)` },
          { v: m.normalG.toFixed(2), l: `${t('load_factor')} (G)`, warn: m.normalG > 4 },
          { v: `${fmt0(m.bankDeg)}°`, l: t('bank') },
          { v: `${fmt0(m.pitchDeg)}°`, l: t('pitch') },
          { v: (m.altitude * 3.281).toFixed(0), l: `${t('altitude')} (ft)` },
        ]
      : [
          { v: m.speed.toFixed(1), l: `${t('speed')} (m/s)` },
          { v: m.seatG.toFixed(2), l: t('vertical_g'), warn: m.seatG > 5 || m.seatG < -1.5 },
          {
            v: (Math.abs(m.sideG) < 0.005 ? 0 : m.sideG).toFixed(2),
            l: t('lateral_g'),
            warn: Math.abs(m.sideG) > 1.8,
          },
          { v: `${fmt0(m.bankDeg)}°`, l: t('bank') },
          { v: m.altitude.toFixed(1), l: `${t('altitude')} (m)` },
        ];

  const editor = (
    <CourseEditor
      mode={mode}
      points={points}
      setPoints={setPoints}
      curve={customCurve}
      progress={progress}
      curveControlOffsets={curveControlOffsets}
      setCurveControlOffsets={setCurveControlOffsets}
      scaleLabel={`1 unit = ${scale} m`}
      compact={!isDesktop}
    />
  );
  const chase = <SpectatorView curve={customCurve} progress={progress} />;
  const cockpit = <FirstPersonView curve={customCurve} progress={progress} />;

  return (
    <Studio data-mode={mode}>
      {isDesktop ? (
        <>
          <EditorArea>
            <PanelTitle>{t('course_editor')}</PanelTitle>
            <Fill>{editor}</Fill>
          </EditorArea>
          <ViewsArea>
            <Panel>
              <PanelTitle>{t('spectator_view')}</PanelTitle>
              <Fill>{chase}</Fill>
            </Panel>
            <Panel>
              <PanelTitle>{t('fpv')}</PanelTitle>
              <Fill>{cockpit}</Fill>
            </Panel>
          </ViewsArea>
        </>
      ) : (
        <MobileStage>
          <Tabs role='tablist'>
            {(['editor', 'chase', 'cockpit'] as TabKey[]).map(k => (
              <Tab
                key={k}
                role='tab'
                aria-selected={tab === k}
                active={tab === k}
                onClick={() => setTab(k)}
              >
                {t(k === 'cockpit' && mode === 'coaster' ? 'tab_ride' : `tab_${k}`)}
              </Tab>
            ))}
          </Tabs>
          {/* only the active view is mounted: one WebGL context on phones instead of four */}
          <Fill>{tab === 'editor' ? editor : tab === 'chase' ? chase : cockpit}</Fill>
        </MobileStage>
      )}

      <Metrics>
        {metricCards.map(c => (
          <Metric key={c.l} warn={c.warn}>
            <strong>{c.v}</strong>
            <span>{c.l}</span>
          </Metric>
        ))}
        {profile.warnings.length > 0 && (
          <Warnings>
            {profile.warnings.map(w => (
              <li key={w}>{w}</li>
            ))}
          </Warnings>
        )}
      </Metrics>

      <Controls>
        <PlayButton onClick={togglePlay} disabled={points.length < 2}>
          {isPlaying ? t('pause') : mode === 'flight' ? t('cta_fly') : t('cta_ride')}
        </PlayButton>
        <SpeedSelect
          aria-label={t('speed')}
          value={playbackSpeed}
          onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}
        >
          {[0.5, 1, 2, 4].map(s => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </SpeedSelect>
        <ProgressLabel>
          {m.t.toFixed(0)}s / {profile.duration.toFixed(0)}s
        </ProgressLabel>
        <Scrubber
          type='range'
          aria-label={t('progress')}
          min='0'
          max='1'
          step='0.001'
          value={progress}
          onChange={e => setProgress(parseFloat(e.target.value))}
        />
      </Controls>
    </Studio>
  );
};

export default HomePage;
