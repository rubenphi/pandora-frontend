import { ref } from "vue";

/**
 * Parsea fechas en formatos:
 * - DD/MM/YYYY (ej. 27/01/2027)
 * - YYYY-MM-DD (ej. 2027-01-27)
 */
export function parseDemoDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const s = dateStr.replace(/["']/g, "").trim();
  if (!s) return null;

  // DD/MM/YYYY
  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day, 23, 59, 59, 999);
      }
    }
  }

  // YYYY-MM-DD
  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day, 23, 59, 59, 999);
      }
    }
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function getRawDemoDateString() {
  return (
    process.env.DEMO_DATE ||
    process.env.VUE_APP_DEMO_DATE ||
    ""
  ).replace(/["']/g, "").trim();
}

export function isDemoExpired() {
  if (sessionStorage.getItem("pandora_demo_unlocked") === "true") {
    return false;
  }
  const raw = getRawDemoDateString();
  if (!raw) return false;
  const expiry = parseDemoDate(raw);
  if (!expiry) return false;

  const now = new Date();
  return now.getTime() >= expiry.getTime();
}

export const isDemoLocked = ref(isDemoExpired());

export function unlockDemoTemporarily() {
  sessionStorage.setItem("pandora_demo_unlocked", "true");
  isDemoLocked.value = false;
}

export function resetDemoLock() {
  sessionStorage.removeItem("pandora_demo_unlocked");
  isDemoLocked.value = isDemoExpired();
}
