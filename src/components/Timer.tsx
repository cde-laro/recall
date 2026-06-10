import { useEffect, useState } from 'react';
import { formatTime } from '../utils/formatTime';

interface Props {
  startTime: number | null;
  endTime: number | null;
}

// Le tick à 30ms vit ici pour ne re-rendre que le chrono, pas la grille.
export function Timer({ startTime, endTime }: Props) {
  // 0 au premier rendu : formatTime clampe les valeurs négatives à 00:00,
  // et le premier tick arrive 30ms plus tard.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (startTime == null || endTime != null) return;
    const id = setInterval(() => setNow(Date.now()), 30);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  const elapsed = endTime != null
    ? endTime - (startTime ?? endTime)
    : startTime != null ? now - startTime : 0;
  const time = formatTime(elapsed);
  const isLive = startTime != null && endTime == null;

  return (
    <div className={`timer-float${isLive ? ' live' : ''}`}>
      <span className="timer-float-num">{time.mmss}</span>
      <span className="timer-float-ms">.{time.cs}</span>
    </div>
  );
}
