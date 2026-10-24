import { usePricesContext } from '../../context/PricesContext';
import styles from './HoursList.module.css';
import HoursSection from './HoursSection';

const WINDOW_DURATIONS = [1, 2, 3, 4, 5, 6];

function HoursList() {
  const { bestPrices } = usePricesContext();

  return (
    <section>
      <ol className={`card ${styles.windows}`}>
        {WINDOW_DURATIONS.map((duration) => {
          const window = bestPrices[duration];

          return (
            <li className={styles.window} key={duration}>
              <div className={styles.info}>{duration} h</div>
              <HoursSection
                startTime={window.startTime}
                endTime={window.endTime}
                duration={duration}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default HoursList;
