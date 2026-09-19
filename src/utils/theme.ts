import type { ThemePreference } from '../types';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

let mediaQuery: MediaQueryList | null = null;
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

function setDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

function stopFollowingSystem() {
  if (mediaQuery && mediaQueryListener) {
    mediaQuery.removeEventListener('change', mediaQueryListener);
  }
  mediaQuery = null;
  mediaQueryListener = null;
}

export function applyTheme(theme: ThemePreference) {
  stopFollowingSystem();

  if (theme === 'dark') {
    setDarkClass(true);
    return;
  }

  if (theme === 'light') {
    setDarkClass(false);
    return;
  }

  mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
  setDarkClass(mediaQuery.matches);
  mediaQueryListener = (e) => setDarkClass(e.matches);
  mediaQuery.addEventListener('change', mediaQueryListener);
}
