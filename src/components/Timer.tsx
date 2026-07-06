import { useEffect, useRef, useState } from 'react';
import { formatTime } from '../utils/formatTime';

interface Props {
  startTime: number | null;
  endTime: number | null;
  countdownMs?: number;
  onExpire?: () => void;
}

// Le tick à 30ms vit ici pour ne re-rendre que le chrono, pas la grille.
export function Timer({ startTime, endTime, countdownMs, onExpire }: Props) {
  // 0 au premier rendu : le premier tick arrive 30ms plus tard.
  const [now, setNow] = useState(0);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (startTime == null || endTime != null) return;
    const id = setInterval(() => setNow(Date.now()), 30);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  // Réarme le verrou one-shot quand la run repart (startTime remis à null).
  useEffect(() => { if (startTime == null) expiredRef.current = false; }, [startTime]);

  const rawElapsed = endTime != null
    ? endTime - (startTime ?? endTime)
    : startTime != null ? now - startTime : 0;
  // Clampé à >= 0 : avant le premier tick, `now` vaut 0 et rawElapsed est
  // négatif — sans ce clamp le compte à rebours afficherait plus que le budget.
  const elapsed = Math.max(0, rawElapsed);

  const isCountdown = countdownMs != null;
  const remaining = isCountdown ? Math.max(0, countdownMs - elapsed) : 0;

  // Déclenche onExpire une seule fois quand le compte à rebours atteint 0.
  // Dans un effet (jamais pendant le rendu) pour garder le rendu pur.
  useEffect(() => {
    if (!isCountdown || startTime == null || endTime != null) return;
    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [isCountdown, remaining, startTime, endTime, onExpire]);

  const displayMs = isCountdown ? remaining : elapsed;
  const time = formatTime(displayMs);
  const isLive = startTime != null && endTime == null;
  const urgent = isCountdown && isLive && remaining <= 30_000;

  return (
    <span className={`stat-big timer-val${isLive ? ' live' : ''}${urgent ? ' urgent' : ''}`}>
      {time.mmss}<span className="stat-cs">.{time.cs}</span>
    </span>
  );
}
