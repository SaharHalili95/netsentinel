const STORAGE_KEY = "ns-prefs";

export interface Prefs {
  reduceMotion: boolean;
}

export function loadPrefs(): Prefs {
  try {
    return { reduceMotion: false, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return { reduceMotion: false };
  }
}

export function savePrefs(prefs: Prefs) {
  applyPrefs(prefs);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage can be blocked; the preference still applies for this visit.
  }
}

export function applyPrefs(prefs: Prefs) {
  document.documentElement.classList.toggle("reduce-motion", prefs.reduceMotion);
}
