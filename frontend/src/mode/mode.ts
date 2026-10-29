import { useLocation } from 'react-router-dom';
import type { RideMode } from '../physics/rideProfile';

export const MODE_PATH: Record<RideMode, string> = { flight: '/fly', coaster: '/coaster' };
const STORAGE_KEY = 'e52.mode';

/** Flight is the default for first-time visitors; returning visitors get their last choice. */
export function getPreferredMode(): RideMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'coaster' ? 'coaster' : 'flight';
  } catch {
    return 'flight';
  }
}

export function rememberMode(mode: RideMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode / storage disabled */
  }
}

/** Mode comes from the URL when on a studio route, otherwise from the saved preference. */
export function useMode(): RideMode {
  const { pathname } = useLocation();
  if (pathname.startsWith('/coaster')) return 'coaster';
  if (pathname.startsWith('/fly')) return 'flight';
  return getPreferredMode();
}
