import dayjs from 'dayjs';
import { useState } from 'react';

import styles from './HoursSection.module.css';

function HoursSection({
  startTime,
  endTime,
  duration,
  isBestPrice,
}: {
  startTime: string;
  endTime: string;
  duration: number;
  showStartTime?: boolean;
  isBestPrice?: boolean;
}) {
  const now = dayjs().minute(0).second(0);
  const [isShowingStartTime, setIsShowingStartTime] = useState(true);
  const startDayJs = dayjs(new Date(startTime));
  const diffStartDayWithNow = parseInt(startDayJs.diff(now, 'hour').toString(), 10);
  const minutesDiffStartDayWithNow = parseInt(startDayJs.diff(now, 'minutes').toString(), 10);
  const remainingHours =
    diffStartDayWithNow === 0 && minutesDiffStartDayWithNow !== 59
      ? diffStartDayWithNow
      : diffStartDayWithNow + 1;
  const startHour = startDayJs.format('HH:mm');
  const isValidDate = startDayJs.isValid();
  const endHour = dayjs(endTime).format('HH:mm');

  const start = isValidDate ? startHour : '';
  const end = isValidDate ? endHour : '';

  const renderRemainingHours = (hours: number) =>
    remainingHours <= 24 ? hours : `1 dia i ${hours - 24}`;

  const timeUntil = !remainingHours ? (
    <span>Ara</span>
  ) : (
    <>
      <span>{`${isShowingStartTime ? 'Falten' : 'Acaba en'} `}</span>
      <span className="highlight">{` ${isShowingStartTime
        ? renderRemainingHours(remainingHours)
        : renderRemainingHours(remainingHours + duration)
        }h`}</span>
    </>
  );

  return isValidDate ? (
    <button
      type="button"
      className={`${styles.wrapper} ${isBestPrice ? styles.best : ''}`.trim()}
      onClick={() => setIsShowingStartTime((current) => !current)}
      aria-pressed={isShowingStartTime}
    >
      <div className={styles.hours}>
        <time dateTime={startTime}>{start}</time>
        <span className={styles.separator}>{' - '}</span>
        <time dateTime={endTime}>{end}</time>
      </div>
      <p className={`${styles.remaining}`}>{timeUntil}</p>
    </button>
  ) : (
    <div className={styles.loader}>&nbsp;</div>
  );
}

export default HoursSection;
