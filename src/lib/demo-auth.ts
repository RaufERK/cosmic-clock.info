export type DemoSession = {
  email: string;
};

const STORAGE_KEY = "cosmic-clock.demo-session";

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function writeDemoSession(session: DemoSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearDemoSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
