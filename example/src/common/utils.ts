export function getPWADisplayMode() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (document.referrer.startsWith('android-app://')) {
    return 'twa';
  } else if ((navigator as any).standalone || isStandalone) {
    return 'standalone';
  }
  return 'browser';
}
export function iOS() : boolean {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

export const isPWA = () => getPWADisplayMode() === 'standalone';

export function lerp (v0: number, v1: number, p: number) {
  return v0 * (1-p) + v1 * p;
}

export const getInset = (top: number, right: number, bottom: number, left: number) => {
  return `inset(calc(${top}px + var(--navbar-safe-area)) ${right}px ${bottom}px ${left}px)`;
}