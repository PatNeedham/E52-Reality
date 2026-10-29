import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { MODE_PATH, rememberMode, useMode } from '../mode/mode';
import { bp } from '../hooks/useMediaQuery';

const THEME = {
  flight: { from: '#0b2a4a', to: '#3b82c4', accent: '#7cc4ff' },
  coaster: { from: '#3a0d2e', to: '#d9573b', accent: '#ffc27a' },
};

const Hero = styled.section<{ from: string; to: string }>`
  color: #fff;
  background: linear-gradient(160deg, ${p => p.from} 0%, ${p => p.to} 100%);
  padding: 2.5rem 1.25rem 3rem;
  display: grid;
  gap: 2rem;
  ${bp.lg} {
    grid-template-columns: 1.1fr 1fr;
    align-items: center;
    padding: 5rem 4rem;
    min-height: 70vh;
  }
`;

const Kicker = styled.p<{ accent: string }>`
  color: ${p => p.accent};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 7vw, 3.75rem);
  line-height: 1.05;
  font-weight: 800;
  margin-bottom: 1rem;
`;

const Sub = styled.p`
  font-size: 1.05rem;
  line-height: 1.55;
  max-width: 34rem;
  opacity: 0.9;
  margin-bottom: 1.75rem;
`;

const Ctas = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Primary = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 0 1.5rem;
  border-radius: 999px;
  background: #fff;
  color: #0b1220;
  font-weight: 700;
  text-decoration: none;
`;

const Secondary = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 0 1.25rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  text-decoration: none;
  font-weight: 600;
`;

const SwitchRow = styled.p`
  margin-top: 1.25rem;
  font-size: 0.9rem;
  opacity: 0.85;
  button {
    background: none;
    border: 0;
    color: inherit;
    text-decoration: underline;
    font: inherit;
    cursor: pointer;
    padding: 0.5rem 0.25rem;
  }
`;

const Section = styled.section`
  padding: 2.5rem 1.25rem;
  max-width: 1100px;
  margin: 0 auto;
  ${bp.lg} {
    padding: 4rem 2rem;
  }
  h2 {
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    margin-bottom: 1.5rem;
  }
`;

const Cards = styled.div`
  display: grid;
  gap: 1rem;
  ${bp.sm} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  border: 1px solid #e3e8ef;
  border-radius: 14px;
  padding: 1.25rem;
  background: #fff;
  h3 {
    font-size: 1.1rem;
    margin-bottom: 0.4rem;
  }
  p {
    color: #4a5566;
    line-height: 1.5;
  }
`;

const Steps = styled.ol`
  display: grid;
  gap: 0.75rem;
  list-style: none;
  counter-reset: step;
  ${bp.sm} {
    grid-template-columns: repeat(4, 1fr);
  }
  li {
    counter-increment: step;
    background: #f5f7fb;
    border-radius: 12px;
    padding: 1rem;
    line-height: 1.45;
  }
  li::before {
    content: counter(step);
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0b1220;
    color: #fff;
    font-weight: 700;
    margin-right: 0.5rem;
  }
`;

/** Isometric SVG of the 12-beam cube with the chair hanging from 8 cables. */
const CubeArt: FC<{ accent: string }> = ({ accent }) => {
  // simple orthographic view: yaw 32°, tilt 22°, so the cube reads as 3D
  const s = 150;
  const yaw = (32 * Math.PI) / 180;
  const tilt = (22 * Math.PI) / 180;
  const iso = (x: number, y: number, z: number): [number, number] => {
    const X = x - 0.5;
    const Y = y - 0.5;
    const Z = z - 0.5;
    const x1 = X * Math.cos(yaw) - Z * Math.sin(yaw);
    const z1 = X * Math.sin(yaw) + Z * Math.cos(yaw);
    const y2 = Y * Math.cos(tilt) - z1 * Math.sin(tilt);
    return [160 + x1 * s, 150 - y2 * s];
  };
  const C = [0, 1].flatMap(x => [0, 1].flatMap(y => [0, 1].map(z => [x, y, z] as const)));
  const edges = C.flatMap((a, i) =>
    C.slice(i + 1)
      .filter(b => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) === 1)
      .map(b => [a, b] as const)
  );
  const chair = iso(0.5, 0.45, 0.5);
  return (
    <svg viewBox='0 0 320 300' role='img' aria-label='12-beam cube with a cable-suspended chair'>
      {C.map((c, i) => {
        const [x, y] = iso(...c);
        return (
          <line
            key={`c${i}`}
            x1={x}
            y1={y}
            x2={chair[0]}
            y2={chair[1]}
            stroke={accent}
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
        );
      })}
      {edges.map(([a, b], i) => {
        const [x1, y1] = iso(...a);
        const [x2, y2] = iso(...b);
        return (
          <line
            key={`e${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke='#fff'
            strokeWidth={5}
            strokeLinecap='round'
          />
        );
      })}
      <g transform={`translate(${chair[0]} ${chair[1]})`}>
        <rect x={-18} y={-10} width={36} height={22} rx={5} fill='#fff' />
        <rect x={-18} y={-30} width={10} height={24} rx={4} fill='#fff' />
        <circle cx={4} cy={-22} r={8} fill={accent} />
      </g>
    </svg>
  );
};

const Landing: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mode = useMode();
  const theme = THEME[mode];
  const other = mode === 'flight' ? 'coaster' : 'flight';

  const switchTo = () => {
    rememberMode(other);
    navigate(MODE_PATH[other]);
  };

  return (
    <>
      <Hero from={theme.from} to={theme.to}>
        <div>
          <Kicker accent={theme.accent}>{t(`hero_kicker_${mode}`)}</Kicker>
          <Title>{t('hero_title')}</Title>
          <Sub>{t(`hero_sub_${mode}`)}</Sub>
          <Ctas>
            <Primary to={MODE_PATH[mode]}>
              {mode === 'flight' ? t('cta_fly') : t('cta_ride')}
            </Primary>
            <Secondary href='#build'>{t('cta_build')}</Secondary>
          </Ctas>
          <SwitchRow>
            {t(`switch_hint_${mode}`)} <button onClick={switchTo}>{t(`switch_to_${other}`)}</button>
          </SwitchRow>
        </div>
        <CubeArt accent={theme.accent} />
      </Hero>

      <Section>
        <Cards>
          <Card>
            <h3>{t('card1_t')}</h3>
            <p>{t('card1_b')}</p>
          </Card>
          <Card>
            <h3>{t('card2_t')}</h3>
            <p>{t('card2_b')}</p>
          </Card>
          <Card>
            <h3>{t('card3_t')}</h3>
            <p>{t('card3_b')}</p>
          </Card>
        </Cards>
      </Section>

      <Section id='build'>
        <h2>{t('build_title')}</h2>
        <Steps>
          <li>{t('build_1')}</li>
          <li>{t('build_2')}</li>
          <li>{t('build_3')}</li>
          <li>{t('build_4')}</li>
        </Steps>
      </Section>
    </>
  );
};

export default Landing;
