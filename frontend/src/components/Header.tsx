import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { MODE_PATH, rememberMode, useMode } from '../mode/mode';
import type { RideMode } from '../physics/rideProfile';
import { bp } from '../hooks/useMediaQuery';

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  padding-top: calc(0.5rem + env(safe-area-inset-top));
  background: #0b1220;
  color: #fff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
`;

const Wordmark = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  span {
    color: #7cc4ff;
    font-weight: 500;
    display: none;
    ${bp.sm} {
      display: inline;
    }
  }
`;

const Segmented = styled.div`
  display: inline-flex;
  margin-left: auto;
  padding: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  ${bp.lg} {
    margin-left: 1.5rem;
  }
`;

const SegButton = styled.button<{ active: boolean }>`
  min-height: 36px;
  padding: 0 0.85rem;
  border: 0;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  color: ${p => (p.active ? '#0b1220' : '#d6e2f5')};
  background: ${p => (p.active ? '#fff' : 'transparent')};
  transition: background 0.2s ease;
`;

const DesktopNav = styled.nav`
  display: none;
  ${bp.lg} {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: auto;
  }
`;

const NavItem = styled(RouterNavLink)`
  color: #d6e2f5;
  text-decoration: none;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  &:hover,
  &.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const LangSelect = styled.select`
  min-height: 36px;
  padding: 0 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: #fff;
  option {
    color: #000;
  }
`;

const MenuButton = styled.button`
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  ${bp.lg} {
    display: none;
  }
`;

const Drawer = styled.div<{ open: boolean }>`
  display: ${p => (p.open ? 'flex' : 'none')};
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem 1rem;
  background: #0b1220;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  a {
    padding: 0.85rem 0.5rem;
  }
  ${bp.lg} {
    display: none;
  }
`;

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mode = useMode();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const switchMode = (m: RideMode) => {
    rememberMode(m);
    // On a studio page swap studios; on other pages stay put but remember the choice.
    if (pathname === '/' || pathname.startsWith('/fly') || pathname.startsWith('/coaster')) {
      navigate(MODE_PATH[m]);
    }
  };

  const lang = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2);
  const langSelect = (
    <LangSelect
      aria-label={t('language')}
      value={lang}
      onChange={e => i18n.changeLanguage(e.target.value)}
    >
      <option value='en'>EN</option>
      <option value='es'>ES</option>
    </LangSelect>
  );

  return (
    <HeaderContainer>
      <Wordmark to='/' aria-label='E52 Reality home'>
        E52 <span>Reality</span>
      </Wordmark>

      <Segmented role='tablist' aria-label={t('mode')}>
        <SegButton
          role='tab'
          aria-selected={mode === 'flight'}
          active={mode === 'flight'}
          onClick={() => switchMode('flight')}
        >
          ✈ {t('mode_flight')}
        </SegButton>
        <SegButton
          role='tab'
          aria-selected={mode === 'coaster'}
          active={mode === 'coaster'}
          onClick={() => switchMode('coaster')}
        >
          🎢 {t('mode_coaster')}
        </SegButton>
      </Segmented>

      <DesktopNav>
        <NavItem to={MODE_PATH[mode]}>{t('studio')}</NavItem>
        <NavItem to='/library'>{t('my_library')}</NavItem>
        <NavItem to='/discover'>{t('discover')}</NavItem>
        {langSelect}
      </DesktopNav>

      <MenuButton aria-label={t('menu')} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {open ? '✕' : '☰'}
      </MenuButton>
      <Drawer open={open}>
        <NavItem to={MODE_PATH[mode]}>{t('studio')}</NavItem>
        <NavItem to='/library'>{t('my_library')}</NavItem>
        <NavItem to='/discover'>{t('discover')}</NavItem>
        <div>{langSelect}</div>
      </Drawer>
    </HeaderContainer>
  );
};

export default Header;
