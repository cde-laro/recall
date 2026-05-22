export function formatTime(ms: number): { mmss: string; cs: string } {
  const clamped = Math.max(0, ms);
  const totalSec = Math.floor(clamped / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  const cs = String(Math.floor((clamped % 1000) / 10)).padStart(2, '0');
  return { mmss: `${m}:${s}`, cs };
}
